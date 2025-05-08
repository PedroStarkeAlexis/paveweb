import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { createAnalysisPrompt, createQuestionReRankingPrompt } from "./prompt";
import {
  parseAiGeneratedQuestion,
  removeAccents,
  createTextPreview,
} from "./filter";

const VECTORIZE_TOP_K = 15;
const MIN_SCORE_THRESHOLD = 0.75;
const MAX_CANDIDATES_FOR_RERANKING = 5;

async function callGeminiAPI(
  promptText,
  genAIInstance,
  modelName,
  safetySettings,
  callType = "genérica"
) {
  console.log(
    `[LOG] Enviando prompt ${callType.toUpperCase()} para Gemini (${createTextPreview(
      promptText,
      100
    )}...).`
  );
  const model = genAIInstance.getGenerativeModel({ model: modelName });
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: promptText }] }],
    safetySettings,
  });
  const response = result.response;
  if (!response) {
    throw new Error(`Resposta da API Gemini (${callType}) inválida.`);
  }
  if (response.promptFeedback?.blockReason) {
    throw new Error(
      `Bloqueado pela IA (${callType}): ${response.promptFeedback.blockReason}`
    );
  }
  const responseText = response.text
    ? response.text()
    : response.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (!responseText) {
    throw new Error(`A IA (${callType}) retornou texto vazio.`);
  }
  console.log(
    `[LOG] Resposta IA (${callType}): ${createTextPreview(responseText, 150)}`
  );
  return responseText;
}

export async function onRequestPost(context) {
  const functionName = "/api/ask (v11 - Múltiplas Questões, Sem Intro)";
  console.log(`[LOG] ${functionName}: Iniciando POST request`);
  let allQuestionsR2Data = null;

  try {
    const { request, env } = context;
    const geminiApiKey = env.GEMINI_API_KEY;
    const r2Bucket = env.QUESTOES_PAVE_BUCKET;
    const vectorIndex = env.QUESTIONS_INDEX;
    const aiBinding = env.AI;
    const modelName = env.MODEL_NAME || "gemini-1.5-flash-latest";

    if (!r2Bucket || !geminiApiKey || !vectorIndex || !aiBinding) {
      throw new Error(
        "Bindings R2, GEMINI_API_KEY, QUESTIONS_INDEX ou AI não configurados."
      );
    }
    console.log(`[LOG] ${functionName}: Configs OK. Modelo: ${modelName}`);

    let requestData;
    try {
      requestData = await request.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Requisição JSON inválida." }),
        {
          status: 400,
        }
      );
    }

    const history = requestData?.history;
    if (!Array.isArray(history) || history.length === 0) {
      return new Response(
        JSON.stringify({ error: "Histórico inválido ou vazio." }),
        {
          status: 400,
        }
      );
    }
    const lastUserMessage = history.findLast((m) => m.role === "user");
    const userQuery =
      typeof lastUserMessage?.parts?.[0]?.text === "string"
        ? lastUserMessage.parts[0].text.trim()
        : null;
    if (!userQuery) {
      return new Response(
        JSON.stringify({ error: "Query do usuário inválida no histórico." }),
        {
          status: 400,
        }
      );
    }
    console.log(`[LOG] ${functionName}: Query: "${userQuery}"`);

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const safetySettings = [
      /* ... suas configurações ... */
    ];

    const analysisPromptText = createAnalysisPrompt(history, userQuery);
    let aiAnalysis;
    try {
      const aiAnalysisResponseText = await callGeminiAPI(
        analysisPromptText,
        genAI,
        modelName,
        safetySettings,
        "análise"
      );
      const cleanedJsonString = aiAnalysisResponseText
        .replace(/^```json\s*|```$/g, "")
        .trim();
      aiAnalysis = JSON.parse(cleanedJsonString);
    } catch (error) {
      console.error(
        `[ERRO] ${functionName}: Falha na AN��LISE da API Gemini:`,
        error
      );
      const commentary = `Desculpe, tive um problema ao processar seu pedido inicial: ${error.message}. Poderia tentar de novo?`;
      return new Response(
        JSON.stringify({ commentary: commentary, questions: [] }),
        {
          status: 503,
        }
      );
    }

    let intent = aiAnalysis?.intent || "DESCONHECIDO";
    let entities = aiAnalysis?.entities || null;
    let generated_question = aiAnalysis?.generated_question || null;
    let responseTextForUser = aiAnalysis?.responseText || null;
    let commentary = ""; // Inicia vazio
    let questionsToReturn = [];

    console.log(
      `[LOG] ${functionName}: IA Parsed (análise) - Intent: ${intent}, Entities: ${JSON.stringify(
        entities
      )}`
    );

    // Validações pós-análise
    if (
      intent === "CRIAR_QUESTAO" &&
      !generated_question &&
      !responseTextForUser
    ) {
      intent = "DESCONHECIDO";
      commentary =
        "Pedi para gerar uma questão, mas não consegui obter o conteúdo.";
    }
    if (intent === "CONVERSAR" && !responseTextForUser) {
      intent = "DESCONHECIDO";
      commentary = "Não consegui formular uma resposta para isso.";
    }

    // --- Lógica Baseada na Intenção ---
    switch (intent) {
      case "BUSCAR_QUESTAO":
        try {
          // ... (Verifica query vaga - inalterado) ...
          const isQueryTooVague =
            userQuery.toLowerCase().split(" ").length < 2 &&
            !userQuery.toLowerCase().includes("pave");
          const hasUsefulEntities =
            entities && (entities.materia || entities.topico);
          if (isQueryTooVague && !hasUsefulEntities) {
            commentary =
              "Para te ajudar a encontrar questões, poderia me dar mais detalhes? Como a matéria ou o tópico. 😊";
            break;
          }

          // ... (Carrega R2 - inalterado) ...
          const r2Object = await r2Bucket.get("questoes.json");
          if (!r2Object)
            throw new Error("Falha ao acessar R2 (questoes.json).");
          allQuestionsR2Data = await r2Object.json();
          if (
            !Array.isArray(allQuestionsR2Data) ||
            allQuestionsR2Data.length === 0
          ) {
            commentary =
              "Meu banco de questões parece estar vazio ou indisponível.";
            break;
          }

          // ... (Busca Vetorial e Filtro de Score - inalterado) ...
          let highConfidenceMatches = [];
          try {
            console.log(
              `[LOG] ${functionName}: Iniciando busca vetorial para "${userQuery}"`
            );
            const embeddingResponse = await aiBinding.run(
              "@cf/baai/bge-base-en-v1.5",
              { text: [userQuery] }
            );
            if (!embeddingResponse?.data?.[0])
              throw new Error("Falha ao gerar embedding da query.");
            const queryVector = embeddingResponse.data[0];
            const vectorQueryResult = await vectorIndex.query(queryVector, {
              topK: VECTORIZE_TOP_K,
            });
            console.log(
              `[LOG] ${functionName}: Vectorize retornou ${vectorQueryResult.matches.length} correspond��ncias.`
            );
            if (vectorQueryResult.matches?.length > 0) {
              highConfidenceMatches = vectorQueryResult.matches.filter(
                (match) => match.score >= MIN_SCORE_THRESHOLD
              );
              console.log(
                `[LOG] ${functionName}: ${highConfidenceMatches.length} matches com score >= ${MIN_SCORE_THRESHOLD}.`
              );
            }
          } catch (vectorError) {
            console.error(
              `[ERRO] ${functionName}: Falha na busca vetorial:`,
              vectorError
            );
            commentary =
              "Tive um problema com a busca semântica. Tentando filtrar por outros meios...";
          }

          // ... (Obter Dados Completos e Filtrar Manualmente - inalterado) ...
          let filteredCandidates = [];
          if (highConfidenceMatches.length > 0) {
            const candidateIds = highConfidenceMatches.map((match) => match.id);
            filteredCandidates = allQuestionsR2Data.filter((q) =>
              candidateIds.includes(q.id.toString())
            );
          } else if (hasUsefulEntities) {
            console.log(
              `[LOG] ${functionName}: Busca vetorial sem resultados relevantes. Tentando filtro manual por entidades.`
            );
            filteredCandidates = filterQuestionsByEntitiesR2(
              entities,
              allQuestionsR2Data
            );
          }
          if (hasUsefulEntities && filteredCandidates.length > 0) {
            console.log(
              `[LOG] ${functionName}: Aplicando filtro manual de entidades em ${filteredCandidates.length} candidatas.`
            );
            const materiaNorm = entities.materia
              ? removeAccents(entities.materia.toLowerCase())
              : null;
            const anoNum = entities.ano ? parseInt(entities.ano, 10) : null;
            const topicoNorm = entities.topico
              ? removeAccents(entities.topico.toLowerCase())
              : null;
            const palavrasTopico = topicoNorm
              ? topicoNorm.split(/\s+/).filter((p) => p && p.length > 2)
              : [];
            filteredCandidates = filteredCandidates.filter((q) => {
              let match = true;
              if (
                materiaNorm &&
                (!q.materia ||
                  removeAccents(q.materia.toLowerCase()) !== materiaNorm)
              )
                match = false;
              if (match && anoNum && q.ano !== anoNum) match = false;
              if (match && palavrasTopico.length > 0) {
                const qTopico = removeAccents((q.topico || "").toLowerCase());
                const qTexto = removeAccents(
                  (q.texto_questao || "").toLowerCase()
                );
                if (
                  !palavrasTopico.some(
                    (p) => qTopico.includes(p) || qTexto.includes(p)
                  )
                )
                  match = false;
              }
              return match;
            });
            console.log(
              `[LOG] ${functionName}: ${filteredCandidates.length} candidatas após filtro manual.`
            );
          }

          // --- Re-ranking e Processamento (MODIFICADO) ---
          if (filteredCandidates.length > 0) {
            const reRankingPromptText = createQuestionReRankingPrompt(
              userQuery,
              filteredCandidates,
              entities
            );
            if (!reRankingPromptText) {
              commentary = "Não consegui preparar as opções para escolher.";
              break;
            }
            try {
              const aiSelectionResponseText = await callGeminiAPI(
                reRankingPromptText,
                genAI,
                modelName,
                safetySettings,
                "re-ranking"
              );
              const cleanedSelectionJson = aiSelectionResponseText
                .replace(/^```json\s*|```$/g, "")
                .trim();
              const aiSelection = JSON.parse(cleanedSelectionJson);

              // Verifica se selected_question_ids é um array e tem IDs
              if (
                aiSelection &&
                Array.isArray(aiSelection.selected_question_ids) &&
                aiSelection.selected_question_ids.length > 0
              ) {
                const questionIdsToFind = aiSelection.selected_question_ids.map(
                  (id) => id.toString()
                );
                questionsToReturn = allQuestionsR2Data.filter((q) =>
                  questionIdsToFind.includes(q.id.toString())
                );

                if (questionsToReturn.length > 0) {
                  // NENHUM commentary aqui, apenas retorna as questões
                  console.log(
                    `[LOG] ${functionName}: IA selecionou ${questionsToReturn.length} questão(ões).`
                  );
                } else {
                  commentary = `Selecionei referências (${questionIdsToFind.join(
                    ", "
                  )}), mas não achei as questões completas. Estranho...`;
                  console.warn(
                    `[WARN] ${functionName}: IA (re-ranking) retornou IDs não encontrados: ${questionIdsToFind.join(
                      ", "
                    )}.`
                  );
                }
              } else {
                // Nenhuma questão selecionada pela IA
                commentary = `Analisei as opções mais relevantes, mas nenhuma pareceu perfeita para "${createTextPreview(
                  userQuery,
                  30
                )}". Gostaria de criar uma nova?`;
              }
            } catch (selectionError) {
              console.error(
                `[ERRO] ${functionName}: Falha no RE-RANKING:`,
                selectionError
              );
              commentary = `Tive um problema ao selecionar a melhor questão. Poderia tentar de novo?`;
            }
          } else {
            // Nenhuma candidata após todos os filtros
            commentary = `Não encontrei nenhuma questão que combine bem com seus critérios (${createTextPreview(
              userQuery,
              30
            )} ${
              hasUsefulEntities ? `e filtros aplicados` : ""
            }). Quer que eu crie uma?`;
          }
        } catch (error) {
          console.error(
            `[ERRO] ${functionName}: Falha no fluxo BUSCAR_QUESTAO:`,
            error
          );
          commentary = `Ocorreu um problema ao buscar as questões (${error.message}). Tente novamente.`;
        }
        break; // Fim do case 'BUSCAR_QUESTAO'

      // --- Casos CRIAR_QUESTAO, CONVERSAR, DESCONHECIDO ---
      case "CRIAR_QUESTAO":
        if (generated_question) {
          // REMOVIDO commentary introdutório
          const qData = generated_question; // Usar nome diferente para clareza
          qData.id = qData.id || `gen-${Date.now()}`;
          qData.referencia = qData.referencia || "Texto gerado por IA.";
          questionsToReturn = [qData];
        } else if (responseTextForUser) {
          const parsedFallback = parseAiGeneratedQuestion(responseTextForUser);
          if (parsedFallback) {
            commentary = "Criei esta questão (formato alternativo):"; // Mantém intro se for fallback
            questionsToReturn = [parsedFallback];
          } else {
            commentary = `Tentei criar, mas o formato não veio como esperado: "${responseTextForUser}"`;
          }
        } else {
          if (!commentary)
            commentary =
              "Deveria criar uma questão, mas não recebi os dados. 😥";
        }
        break;
      case "CONVERSAR":
        commentary = responseTextForUser;
        break;
      case "DESCONHECIDO":
      default:
        if (!commentary) {
          commentary =
            "Não entendi bem seu pedido. Posso buscar ou criar questões do PAVE, ou conversar sobre o processo seletivo.";
        }
        break;
    }

    // --- Retorno Final ---
    // Se questionsToReturn tiver itens, commentary geralmente será vazio (exceto em erros ou fallbacks)
    console.log(
      `[LOG] ${functionName}: Retornando final. Comentário: "${createTextPreview(
        commentary,
        50
      )}", Questões: ${questionsToReturn.length}`
    );
    return new Response(
      JSON.stringify({
        commentary: commentary || null,
        questions: questionsToReturn,
      }),
      {
        // Envia null se vazio
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    // Catch Geral Final
    console.error(
      `[ERRO] ${functionName}: Erro GERAL INESPERADO:`,
      error,
      error.stack
    );
    const commentary = `Ocorreu um erro inesperado aqui do meu lado: ${error.message}.`;
    return new Response(
      JSON.stringify({
        commentary: commentary,
        error: `Erro interno do servidor: ${error.message}`,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function onRequest(context) {
  if (context.request.method === "POST") {
    return await onRequestPost(context);
  }
  return new Response(`Método ${context.request.method} não permitido.`, {
    status: 405,
    headers: { Allow: "POST" },
  });
}

function filterQuestionsByEntitiesR2(entities, allQuestionsData) {
  if (!Array.isArray(allQuestionsData) || allQuestionsData.length === 0)
    return [];
  if (!entities || typeof entities !== "object") return [...allQuestionsData];

  const { materia, ano, topico } = entities;
  let filtered = allQuestionsData;

  if (materia) {
    const materiaNorm = removeAccents(materia.toLowerCase());
    filtered = filtered.filter(
      (q) => q.materia && removeAccents(q.materia.toLowerCase()) === materiaNorm
    );
  }
  if (ano) {
    const anoNum = parseInt(ano, 10);
    if (!isNaN(anoNum)) {
      filtered = filtered.filter((q) => q.ano === anoNum);
    }
  }
  if (topico) {
    const palavrasTopicoFiltro = removeAccents(topico.toLowerCase())
      .split(/\s+/)
      .filter((p) => p && p.length > 2);
    if (palavrasTopicoFiltro.length > 0) {
      filtered = filtered.filter((q) => {
        const topicoQuestaoNorm = removeAccents((q.topico || "").toLowerCase());
        const enunciadoQuestaoNorm = removeAccents(
          (q.texto_questao || "").toLowerCase()
        );
        return palavrasTopicoFiltro.some(
          (pFiltro) =>
            topicoQuestaoNorm.includes(pFiltro) ||
            enunciadoQuestaoNorm.includes(pFiltro)
        );
      });
    }
  }
  return filtered;
}

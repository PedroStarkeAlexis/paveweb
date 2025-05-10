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
const MIN_SCORE_THRESHOLD = 0.65;
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
  const functionName = "/api/ask (v12 - Híbrido Vetor+IA Sem Filtro Manual)"; // Nova versão
  console.log(`[LOG] ${functionName}: Iniciando POST request`);
  let allQuestionsR2Data = null;

  try {
    // ... (Configuração inicial, validação, chamada de análise da IA - inalterado) ...
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
        { status: 400 }
      );
    }

    const history = requestData?.history;
    if (!Array.isArray(history) || history.length === 0) {
      return new Response(
        JSON.stringify({ error: "Histórico inválido ou vazio." }),
        { status: 400 }
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
        { status: 400 }
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
        `[ERRO] ${functionName}: Falha na ANÁLISE da API Gemini:`,
        error
      );
      const commentary = `Desculpe, tive um problema ao processar seu pedido inicial: ${error.message}.`;
      return new Response(
        JSON.stringify({ commentary: commentary, questions: [] }),
        { status: 503 }
      );
    }

    let intent = aiAnalysis?.intent || "DESCONHECIDO";
    let entities = aiAnalysis?.entities || null; // Mantemos as entidades para passar à IA de re-ranking
    let generated_question = aiAnalysis?.generated_question || null;
    let responseTextForUser = aiAnalysis?.responseText || null;
    let commentary = "";
    let questionsToReturn = [];

    console.log(
      `[LOG] ${functionName}: IA Parsed (análise) - Intent: ${intent}, Entities: ${JSON.stringify(
        entities
      )}`
    );

    // Validações pós-análise (inalteradas)
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
          // Verifica query vaga (mantido)
          const isQueryTooVague =
            userQuery.toLowerCase().split(" ").length < 2 &&
            !userQuery.toLowerCase().includes("pave");
          // const hasUsefulEntities = entities && (entities.materia || entities.topico); // Não precisamos mais checar isso para pedir detalhes
          if (isQueryTooVague /* && !hasUsefulEntities */) {
            // Podemos manter a condição ou simplificar
            commentary =
              "Para te ajudar a encontrar questões, poderia me dar mais detalhes? Como a matéria ou o tópico. 😊";
            break;
          }

          // Carrega R2 (mantido)
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

          // Busca Vetorial e Filtro de Score (mantido)
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
              `[LOG] ${functionName}: Vectorize retornou ${vectorQueryResult.matches.length} correspondências.`
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
            // Se a busca vetorial falhar completamente, não há candidatas para a IA
            commentary =
              "Tive um problema com a busca semântica. Não consigo encontrar questões agora.";
            break; // Sai do switch
          }

          // Obter Dados Completos (MODIFICADO: direto dos highConfidenceMatches)
          let candidatesForReRanking = [];
          if (highConfidenceMatches.length > 0) {
            const candidateIds = highConfidenceMatches.map((match) => match.id);
            candidatesForReRanking = allQuestionsR2Data.filter((q) =>
              candidateIds.includes(q.id.toString())
            );
            console.log(
              `[LOG] ${functionName}: ${candidatesForReRanking.length} candidatas de alta confiança prontas para re-ranking.`
            );
          } else {
            console.log(
              `[LOG] ${functionName}: Nenhuma candidata de alta confiança encontrada após busca vetorial e filtro de score.`
            );
            // Não há mais fallback para filtro manual aqui
          }

          // --- FILTRO MANUAL REMOVIDO ---

          // Re-ranking com IA (se houver candidatas)
          if (candidatesForReRanking.length > 0) {
            const reRankingPromptText = createQuestionReRankingPrompt(
              userQuery,
              candidatesForReRanking,
              entities
            ); // Passa as entidades como contexto para a IA
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
                  console.log(
                    `[LOG] ${functionName}: IA selecionou ${questionsToReturn.length} questão(ões).`
                  );
                  // Nenhum commentary
                } else {
                  commentary = `Selecionei referências (${questionIdsToFind.join(
                    ", "
                  )}), mas não achei as questões completas.`;
                  console.warn(
                    `[WARN] ${functionName}: IA (re-ranking) retornou IDs não encontrados: ${questionIdsToFind.join(
                      ", "
                    )}.`
                  );
                }
              } else {
                commentary = `Analisei as opções mais relevantes, mas nenhuma pareceu perfeita para "${createTextPreview(
                  userQuery,
                  30
                )}".`;
              }
            } catch (selectionError) {
              console.error(
                `[ERRO] ${functionName}: Falha no RE-RANKING:`,
                selectionError
              );
              commentary = `Tive um problema ao selecionar a melhor questão.`;
            }
          } else {
            // Nenhuma candidata após Vectorize + Score
            commentary = `Não encontrei questões relevantes para "${createTextPreview(
              userQuery,
              30
            )}". Gostaria que eu criasse uma?`;
          }
        } catch (error) {
          console.error(
            `[ERRO] ${functionName}: Falha no fluxo BUSCAR_QUESTAO:`,
            error
          );
          commentary = `Ocorreu um problema ao buscar as questões (${error.message}).`;
        }
        break; // Fim do case 'BUSCAR_QUESTAO'

      // ... (outros cases inalterados) ...
      case "CRIAR_QUESTAO":
        if (generated_question) {
          const qData = generated_question;
          qData.id = qData.id || `gen-${Date.now()}`;
          qData.referencia = qData.referencia || "Texto gerado por IA.";
          questionsToReturn = [qData];
        } else if (responseTextForUser) {
          const parsedFallback = parseAiGeneratedQuestion(responseTextForUser);
          if (parsedFallback) {
            commentary = "Criei esta questão (formato alternativo):";
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
    } // Fim do switch

    // --- Retorno Final ---
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

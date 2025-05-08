import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { createAnalysisPrompt } from "./prompt";
import { parseAiGeneratedQuestion } from "./filter";

// --- Função Simples para Filtrar Questões (pode ser movida para filter.js depois) ---
function findQuestionsByEntitiesFromR2(entities, allQuestionsData) {
  if (
    !entities ||
    typeof entities !== "object" ||
    !Array.isArray(allQuestionsData)
  ) {
    return [];
  }
  const { materia, ano, topico } = entities;

  function removeAccents(str) {
    if (typeof str !== "string") return "";
    try {
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    } catch (e) {
      return str || "";
    }
  }

  let filtered = allQuestionsData.filter((q) => {
    if (!q || typeof q !== "object") return false;
    let match = true;
    if (
      materia &&
      q.materia &&
      removeAccents(q.materia.toLowerCase()) !==
        removeAccents(materia.toLowerCase())
    ) {
      match = false;
    }
    if (ano && q.ano && q.ano !== parseInt(ano, 10)) {
      match = false;
    }
    if (match && topico) {
      const topicoQuestaoNorm = removeAccents((q.topico || "").toLowerCase());
      const enunciadoQuestaoNorm = removeAccents(
        (q.texto_questao || "").toLowerCase()
      );
      const palavrasTopicoFiltro = removeAccents(topico.toLowerCase())
        .split(/\s+/)
        .filter((p) => p && p.length > 2);
      if (palavrasTopicoFiltro.length > 0) {
        const topicoMatchFound = palavrasTopicoFiltro.some(
          (pFiltro) =>
            topicoQuestaoNorm.includes(pFiltro) ||
            enunciadoQuestaoNorm.includes(pFiltro)
        );
        if (!topicoMatchFound) {
          match = false;
        }
      }
    }
    return match;
  });
  if (filtered.length > 1) {
    filtered.sort(() => 0.5 - Math.random());
  }
  return filtered;
}

// --- Prompt Específico para a IA Selecionar uma Questão ---
function createQuestionSelectionPrompt(userQuery, candidateQuestions) {
  const MAX_CANDIDATES_FOR_PROMPT = 7;
  let questionsForPrompt = candidateQuestions.slice(
    0,
    MAX_CANDIDATES_FOR_PROMPT
  );

  if (
    candidateQuestions.length > MAX_CANDIDATES_FOR_PROMPT * 2 &&
    candidateQuestions.length > 10
  ) {
    questionsForPrompt = [...candidateQuestions]
      .sort(() => 0.5 - Math.random())
      .slice(0, MAX_CANDIDATES_FOR_PROMPT);
    console.log(
      `[LOG] createQuestionSelectionPrompt: Amostra aleatória de ${questionsForPrompt.length} questões selecionada de ${candidateQuestions.length} totais.`
    );
  }

  const simplifiedQuestions = questionsForPrompt.map((q) => ({
    id: q.id,
    materia: q.materia,
    topico: q.topico,
    texto_questao:
      q.texto_questao.substring(0, 250) +
      (q.texto_questao.length > 250 ? "..." : ""),
  }));

  if (simplifiedQuestions.length === 0) {
    return null;
  }

  return `
Você é um assistente de estudos PAVE.
A última mensagem do usuário foi: "${userQuery}"
Ele está buscando uma questão. Analise as seguintes questões candidatas:

${JSON.stringify(simplifiedQuestions, null, 2)}

Sua Tarefa:
1.  Com base na mensagem do usuário ("${userQuery}") e nas questões candidatas fornecidas, escolha a questão ÚNICA que melhor corresponde ao que o usuário pediu.
2.  Se você encontrar uma questão adequada, responda ESTRITAMENTE com um objeto JSON contendo APENAS o ID da questão escolhida, assim:
    { "selected_question_id": "ID_DA_QUESTAO_AQUI" }
3.  Se NENHUMA das questões candidatas parecer adequada, responda ESTRITAMENTE com um objeto JSON assim:
    { "selected_question_id": null }
4.  Não adicione NENHUMA outra palavra, explicação ou formatação fora do objeto JSON.
`;
}

export async function onRequestPost(context) {
  const functionName = "/api/ask (v6 - IA busca JSON com fallback)";
  console.log(`[LOG] ${functionName}: Iniciando POST request`);
  try {
    const { request, env } = context;
    const geminiApiKey = env.GEMINI_API_KEY;
    const r2Bucket = env.QUESTOES_PAVE_BUCKET;
    const modelName = env.MODEL_NAME || "gemini-1.5-flash-latest";

    if (!r2Bucket) {
      throw new Error("Binding R2 [QUESTOES_PAVE_BUCKET] não configurado.");
    }
    if (!geminiApiKey) {
      throw new Error("Variável de ambiente [GEMINI_API_KEY] não configurada.");
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

    const analysisPrompt = createAnalysisPrompt(history, userQuery);

    console.log(
      `[LOG] ${functionName}: Enviando prompt de ANÁLISE para Gemini.`
    );
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    let aiAnalysisResponseText = "";
    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: analysisPrompt }] }],
        safetySettings,
      });
      const response = result.response;
      if (!response) {
        throw new Error("Resposta da API Gemini (análise) inválida ou vazia.");
      }
      if (response.promptFeedback?.blockReason) {
        throw new Error(
          `Conte��do bloqueado pela IA (análise). Razão: ${response.promptFeedback.blockReason}`
        );
      }
      aiAnalysisResponseText = response.text() || "";
      if (!aiAnalysisResponseText) {
        throw new Error("A IA (análise) retornou uma string vazia.");
      }
    } catch (error) {
      console.error(
        `[ERRO] ${functionName}: Falha na chamada de ANÁLISE da API Gemini:`,
        error
      );
      return new Response(
        JSON.stringify({
          error: `Erro ao comunicar com a IA (análise): ${error.message}`,
        }),
        { status: 503 }
      );
    }

    let intent = "DESCONHECIDO";
    let entities = null;
    let generated_question = null;
    let responseText = null;
    let commentary = "";
    let questionsToReturn = [];
    let allQuestionsR2Data = null;

    try {
      console.log(
        `[LOG] ${functionName}: Parseando resposta IA (análise): ${aiAnalysisResponseText.substring(
          0,
          100
        )}...`
      );
      const cleanedJsonString = aiAnalysisResponseText
        .replace(/^```json\s*|```$/g, "")
        .trim();
      const aiAnalysis = JSON.parse(cleanedJsonString);

      intent = aiAnalysis?.intent || "DESCONHECIDO";
      entities = aiAnalysis?.entities || null;
      generated_question = aiAnalysis?.generated_question || null;
      responseText = aiAnalysis?.responseText || null;

      console.log(
        `[LOG] ${functionName}: IA Parsed (análise) - Intent: ${intent}, Entities: ${JSON.stringify(
          entities
        )}`
      );

      if (intent === "CRIAR_QUESTAO" && !generated_question && !responseText) {
        intent = "DESCONHECIDO";
        commentary = "Pedi para a IA criar uma questão, mas não recebi o conteúdo.";
      }
      if (intent === "CONVERSAR" && !responseText) {
        intent = "DESCONHECIDO";
        commentary = "Não consegui gerar uma resposta para isso.";
      }
    } catch (e) {
      console.error(
        `[ERRO] ${functionName}: Falha ao parsear JSON da IA (análise). Resposta:`,
        aiAnalysisResponseText,
        "Erro:",
        e
      );
      intent = "DESCONHECIDO";
      commentary = "Desculpe, tive um problema ao processar a resposta da IA.";
    }

    // --- Lógica do Backend Baseada na Intenção ---
    if (intent === "BUSCAR_QUESTAO") {
      try {
        console.log(
          `[LOG] ${functionName}: Intenção BUSCAR_QUESTAO. Entidades: ${JSON.stringify(
            entities
          )}`
        );
        const r2Object = await r2Bucket.get("questoes.json");
        if (!r2Object) {
          commentary = "Erro ao acessar banco de questões para busca.";
        } else {
          allQuestionsR2Data = await r2Object.json();
          if (!Array.isArray(allQuestionsR2Data) || allQuestionsR2Data.length === 0) {
            commentary = "Banco de questões inválido ou vazio para busca.";
            allQuestionsR2Data = null;
          } else {
            let candidateQuestions = findQuestionsByEntitiesFromR2(
              entities,
              allQuestionsR2Data
            );
            console.log(
              `[LOG] ${functionName}: Encontradas ${candidateQuestions.length} questões candidatas no R2 com base nas entidades.`
            );

            if (candidateQuestions.length === 0) {
              console.log(
                `[LOG] ${functionName}: Pré-filtragem não retornou candidatas. Usando uma amostra de todas as ${allQuestionsR2Data.length} questões como candidatas para a IA.`
              );
              candidateQuestions = [...allQuestionsR2Data];
            }

            if (candidateQuestions.length > 0) {
              const selectionPrompt = createQuestionSelectionPrompt(
                userQuery,
                candidateQuestions
              );

              if (selectionPrompt) {
                console.log(
                  `[LOG] ${functionName}: Enviando prompt de SELEÇÃO DE QUESTÃO para Gemini.`
                );
                let aiSelectionResponseText = "";
                try {
                  const result = await model.generateContent({
                    contents: [
                      { role: "user", parts: [{ text: selectionPrompt }] },
                    ],
                    safetySettings,
                  });
                  const response = result.response;
                  if (!response) {
                    throw new Error(
                      "Resposta da API Gemini (seleção) inválida ou vazia."
                    );
                  }
                  if (response.promptFeedback?.blockReason) {
                    throw new Error(
                      `Conteúdo bloqueado pela IA (seleção). Razão: ${response.promptFeedback.blockReason}`
                    );
                  }
                  aiSelectionResponseText = response.text() || "";
                  if (!aiSelectionResponseText) {
                    throw new Error(
                      "A IA (seleção) retornou uma string vazia."
                    );
                  }

                  console.log(
                    `[LOG] ${functionName}: Parseando resposta IA (seleção): ${aiSelectionResponseText.substring(
                      0,
                      100
                    )}...`
                  );
                  const cleanedSelectionJson = aiSelectionResponseText
                    .replace(/^```json\s*|```$/g, "")
                    .trim();
                  const aiSelection = JSON.parse(cleanedSelectionJson);

                  if (aiSelection && aiSelection.selected_question_id) {
                    const foundQuestion = allQuestionsR2Data.find(
                      (q) =>
                        q.id.toString() ===
                        aiSelection.selected_question_id.toString()
                    );
                    if (foundQuestion) {
                      commentary = `A IA selecionou esta questão sobre "${userQuery}":`;
                      questionsToReturn = [foundQuestion];
                    } else {
                      commentary = `A IA sugeriu uma questão (ID: ${aiSelection.selected_question_id}) que não encontrei. Tente ser mais específico ou peça para criar uma.`;
                    }
                  } else {
                    commentary = `A IA analisou as opções, mas não selecionou uma questão para "${userQuery}". Você gostaria que eu tentasse criar uma?`;
                  }
                } catch (selectionError) {
                  console.error(
                    `[ERRO] ${functionName}: Falha na chamada/parse de SELEÇÃO da API Gemini:`,
                    selectionError
                  );
                  commentary = `Tive um problema ao tentar selecionar a melhor questão para "${userQuery}". Por favor, tente novamente ou peça para criar uma.`;
                }
              } else {
                commentary = `Não há questões disponíveis no banco para a IA escolher. Peça para eu criar uma!`;
              }
            } else {
              commentary = `O banco de questões está vazio. Peça para eu criar uma!`;
            }
          }
        }
      } catch (r2Error) {
        console.error(`[ERRO] ${functionName}: Falha R2 (busca):`, r2Error);
        commentary = "Erro ao acessar o banco de questões para busca.";
      }
    } else if (intent === "CRIAR_QUESTAO") {
      if (generated_question) {
        commentary = "Certo, elaborei esta questão:";
        generated_question.id = generated_question.id || `gen-${Date.now()}`;
        generated_question.referencia =
          generated_question.referencia || "Texto gerado por IA.";
        questionsToReturn = [generated_question];
      } else if (responseText) {
        const parsedFallback = parseAiGeneratedQuestion(responseText);
        if (parsedFallback) {
          commentary = "Criei esta questão para você (parse fallback):";
          questionsToReturn = [parsedFallback];
        } else {
          commentary = `Tentei criar a questão, mas houve um problema no formato final. Aqui está o que recebi:\n\n${responseText}`;
          questionsToReturn = [];
        }
      }
    } else if (intent === "CONVERSAR") {
      commentary = responseText;
      questionsToReturn = [];
    } else {
      if (!commentary) {
        commentary =
          "Não entendi bem. Você pode pedir que eu busque ou crie questões do PAVE.";
      }
      questionsToReturn = [];
    }

    console.log(
      `[LOG] ${functionName}: Retornando final. Comentário: ${
        commentary ? "Sim" : "Não"
      }, Questões: ${questionsToReturn.length}`
    );
    return new Response(
      JSON.stringify({ commentary: commentary, questions: questionsToReturn }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error(`[ERRO] ${functionName}: Erro GERAL:`, error);
    return new Response(
      JSON.stringify({ error: `Erro interno: ${error.message}` }),
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
```file
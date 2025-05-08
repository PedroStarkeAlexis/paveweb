import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { createAnalysisPrompt } from "./prompt";
import { parseAiGeneratedQuestion } from "./filter"; // Para fallback de CRIAR_QUESTAO

// --- FUNÇÕES AUXILIARES ---

/**
 * Remove acentos de uma string (para filtragem).
 * @param {string} str
 * @returns {string}
 */
function removeAccents(str) {
  if (typeof str !== "string") return "";
  try {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch (e) {
    console.warn("Erro em removeAccents:", e, "Input:", str);
    return str || "";
  }
}

/**
 * Filtra questões do R2 com base nas entidades fornecidas.
 * @param {object | null} entities - { materia, ano, topico }
 * @param {Array} allQuestionsData - Array de todas as questões do R2.
 * @returns {Array} Questões filtradas.
 */
function filterQuestionsByEntitiesR2(entities, allQuestionsData) {
  if (!Array.isArray(allQuestionsData) || allQuestionsData.length === 0)
    return [];
  if (!entities || typeof entities !== "object") return [...allQuestionsData]; // Retorna todas se não há entidades

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
  // if (filtered.length > 1) { // Embaralhar pode não ser ideal se a IA for pegar o primeiro
  //     filtered.sort(() => 0.5 - Math.random());
  // }
  return filtered;
}

/**
 * Cria um preview curto do texto da questão.
 * @param {string} text - O texto completo da questão.
 * @param {number} maxLength - Comprimento máximo do preview.
 * @returns {string}
 */
function createTextPreview(text, maxLength = 100) {
  if (!text || typeof text !== "string") return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

/**
 * Cria o prompt para a IA selecionar uma questão de uma lista de candidatas.
 * @param {string} userQuery - A query original do usuário.
 * @param {Array} candidateQuestions - Questões pré-filtradas ou uma amostra.
 * @param {object|null} entities - Entidades extraídas (materia, topico, ano)
 * @returns {string | null} O prompt ou null se não houver candidatas.
 */
function createQuestionSelectionPrompt(
  userQuery,
  candidateQuestions,
  entities
) {
  const MAX_CANDIDATES_FOR_PROMPT = 5; // Ajustável
  let questionsForPrompt = [];

  if (candidateQuestions.length > MAX_CANDIDATES_FOR_PROMPT) {
    // Se muitas candidatas, prioriza as que batem com entidades, depois pega uma amostra aleatória
    // Esta é uma simplificação; poderia ser mais sofisticado.
    questionsForPrompt = [...candidateQuestions]
      .sort(() => 0.5 - Math.random())
      .slice(0, MAX_CANDIDATES_FOR_PROMPT);
    console.log(
      `[LOG] createQuestionSelectionPrompt: Amostra aleatória de ${questionsForPrompt.length} questões selecionada de ${candidateQuestions.length}.`
    );
  } else {
    questionsForPrompt = candidateQuestions;
  }

  if (questionsForPrompt.length === 0) return null;

  const simplifiedQuestions = questionsForPrompt.map((q) => ({
    id: q.id.toString(),
    materia: q.materia || "Não especificada",
    topico: q.topico || "Não especificado",
    texto_preview: createTextPreview(q.texto_questao, 150), // Preview do enunciado
  }));

  let contextMessage = `O usuário perguntou: "${userQuery}".`;
  if (entities) {
    const entityParts = [];
    if (entities.materia) entityParts.push(`matéria '${entities.materia}'`);
    if (entities.topico) entityParts.push(`tópico '${entities.topico}'`);
    if (entities.ano) entityParts.push(`ano '${entities.ano}'`);
    if (entityParts.length > 0) {
      contextMessage += ` Parece que ele está interessado em ${entityParts.join(
        " e "
      )}.`;
    }
  }

  return `
Você é um assistente especialista em selecionar a questão mais relevante do PAVE UFPel.
${contextMessage}

Analise as seguintes questões candidatas:
${JSON.stringify(simplifiedQuestions, null, 2)}

Sua Tarefa:
1.  Com base na pergunta do usuário e nas informações das entidades (se disponíveis), escolha a ÚNICA questão da lista que MELHOR corresponde ao pedido. Considere o tópico e o conteúdo do preview do texto.
2.  Se encontrar uma questão PERFEITAMENTE adequada, retorne ESTRITAMENTE um objeto JSON com o ID da questão:
    { "selected_question_id": "ID_DA_QUESTAO_AQUI" }
3.  Se NENHUMA questão for um bom match ou se a pergunta do usuário for muito vaga em relação às opções, retorne:
    { "selected_question_id": null }
4.  NÃO adicione NENHUMA outra palavra, explicação ou formatação fora do objeto JSON. Sua resposta deve ser APENAS o JSON.
`;
}

/**
 * Wrapper para chamadas à API Gemini.
 * @param {string} promptText - O prompt a ser enviado.
 * @param {GoogleGenerativeAI} genAIInstance - Instância do GoogleGenerativeAI.
 * @param {string} modelName - Nome do modelo Gemini.
 * @param {Array} safetySettings - Configurações de segurança.
 * @param {string} callType - Descrição da chamada (ex: "análise", "seleção") para logging.
 * @returns {Promise<string>} O texto da resposta da IA.
 * @throws {Error} Se a chamada falhar ou a resposta for inválida.
 */
async function callGeminiAPI(
  promptText,
  genAIInstance,
  modelName,
  safetySettings,
  callType = "genérica"
) {
  console.log(
    `[LOG] Enviando prompt de ${callType.toUpperCase()} para Gemini.`
  );
  const model = genAIInstance.getGenerativeModel({ model: modelName });
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: promptText }] }],
    safetySettings,
  });
  const response = result.response;

  if (!response) {
    throw new Error(`Resposta da API Gemini (${callType}) inválida ou vazia.`);
  }
  if (response.promptFeedback?.blockReason) {
    throw new Error(
      `Conteúdo bloqueado pela IA (${callType}). Razão: ${
        response.promptFeedback.blockReason
      }, Detalhes: ${response.promptFeedback.blockReasonMessage || "N/A"}`
    );
  }
  const responseText = response.text
    ? response.text()
    : response.candidates?.[0]?.content?.parts?.[0]?.text || ""; // Adicionado fallback para Gemini 1.5
  if (!responseText) {
    throw new Error(`A IA (${callType}) retornou uma string vazia.`);
  }
  return responseText;
}

// --- HANDLER PRINCIPAL ---
export async function onRequestPost(context) {
  const functionName = "/api/ask (v8 - IA busca JSON refatorado)";
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

    const genAI = new GoogleGenerativeAI(geminiApiKey);
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

    // 1. Primeira chamada à IA: Análise de Intenção e Entidades
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
      console.log(
        `[LOG] ${functionName}: Parseando resposta IA (análise): ${createTextPreview(
          aiAnalysisResponseText,
          100
        )}`
      );
      const cleanedJsonString = aiAnalysisResponseText
        .replace(/^```json\s*|```$/g, "")
        .trim();
      aiAnalysis = JSON.parse(cleanedJsonString);
    } catch (error) {
      console.error(
        `[ERRO] ${functionName}: Falha na chamada/parse de ANÁLISE da API Gemini:`,
        error
      );
      return new Response(
        JSON.stringify({
          error: `Erro ao comunicar com a IA (análise): ${error.message}`,
        }),
        { status: 503 }
      );
    }

    let intent = aiAnalysis?.intent || "DESCONHECIDO";
    let entities = aiAnalysis?.entities || null;
    let generated_question = aiAnalysis?.generated_question || null;
    let responseTextForUser = aiAnalysis?.responseText || null; // Renomeado para evitar conflito com response.text()
    let commentary = "";
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
      console.warn(
        `[WARN] ${functionName}: Intent CRIAR, mas sem generated_question ou responseTextForUser.`
      );
      intent = "DESCONHECIDO";
      commentary =
        "A IA deveria criar uma questão, mas não forneceu o conteúdo.";
    }
    if (intent === "CONVERSAR" && !responseTextForUser) {
      console.warn(
        `[WARN] ${functionName}: Intent CONVERSAR, mas sem responseTextForUser.`
      );
      intent = "DESCONHECIDO";
      commentary = "Não consegui gerar uma resposta para isso.";
    }

    // 2. Lógica Baseada na Intenção
    switch (intent) {
      case "BUSCAR_QUESTAO":
        try {
          const r2Object = await r2Bucket.get("questoes.json");
          if (!r2Object) {
            commentary =
              "Ops! Não consegui acessar o banco de questões no momento.";
            break;
          }
          const allQuestionsR2Data = await r2Object.json();
          if (
            !Array.isArray(allQuestionsR2Data) ||
            allQuestionsR2Data.length === 0
          ) {
            commentary =
              "O banco de questões parece estar vazio ou indisponível.";
            break;
          }

          // Verifica se a query é muito vaga e não há entidades úteis
          const isQueryTooVague =
            userQuery.toLowerCase().split(" ").length < 2 &&
            !userQuery.toLowerCase().includes("pave"); // Exemplo de heurística
          const hasUsefulEntities =
            entities && (entities.materia || entities.topico);

          if (isQueryTooVague && !hasUsefulEntities) {
            commentary =
              "Para te ajudar a encontrar uma questão, poderia me dar mais detalhes? Por exemplo, a matéria ou o tópico que você procura. 😊";
            break;
          }

          let candidateQuestions = filterQuestionsByEntitiesR2(
            entities,
            allQuestionsR2Data
          );
          console.log(
            `[LOG] ${functionName}: Pré-filtro por entidades resultou em ${candidateQuestions.length} candidatas.`
          );

          if (candidateQuestions.length === 0) {
            console.log(
              `[LOG] ${functionName}: Pré-filtro não encontrou candidatas. Usando amostra de todas as questões.`
            );
            candidateQuestions = [...allQuestionsR2Data]; // Fallback para todas as questões
          }

          if (candidateQuestions.length > 0) {
            const selectionPromptText = createQuestionSelectionPrompt(
              userQuery,
              candidateQuestions,
              entities
            );
            if (!selectionPromptText) {
              // Caso raro, se createQuestionSelectionPrompt retornar null
              commentary =
                "Não consegui preparar as opções para a IA escolher. Tente de novo ou peça para criar uma.";
              break;
            }
            try {
              const aiSelectionResponseText = await callGeminiAPI(
                selectionPromptText,
                genAI,
                modelName,
                safetySettings,
                "seleção de questão"
              );
              console.log(
                `[LOG] ${functionName}: Parseando resposta IA (seleção): ${createTextPreview(
                  aiSelectionResponseText,
                  100
                )}`
              );
              const cleanedSelectionJson = aiSelectionResponseText
                .replace(/^```json\s*|```$/g, "")
                .trim();
              const aiSelection = JSON.parse(cleanedSelectionJson);

              if (aiSelection && aiSelection.selected_question_id) {
                const questionIdToFind =
                  aiSelection.selected_question_id.toString();
                const foundQuestion = allQuestionsR2Data.find(
                  (q) => q.id.toString() === questionIdToFind
                );
                if (foundQuestion) {
                  commentary = `A IA selecionou esta questão sobre "${createTextPreview(
                    userQuery,
                    30
                  )}":`;
                  questionsToReturn = [foundQuestion];
                } else {
                  commentary = `A IA sugeriu uma questão (ID: ${questionIdToFind}) que não encontrei no banco. Que estranho! Que tal tentar criar uma sobre "${createTextPreview(
                    userQuery,
                    30
                  )}"?`;
                }
              } else {
                commentary = `A IA analisou as opções, mas não encontrou uma questão que combine perfeitamente com "${createTextPreview(
                  userQuery,
                  30
                )}". Gostaria de criar uma nova?`;
              }
            } catch (selectionError) {
              console.error(
                `[ERRO] ${functionName}: Falha na chamada/parse de SELEÇÃO:`,
                selectionError
              );
              commentary = `Tive um contratempo ao pedir para a IA escolher a questão. Poderia tentar de novo ou pedir para eu criar uma sobre "${createTextPreview(
                userQuery,
                30
              )}"?`;
            }
          } else {
            // Nenhuma questão no banco R2
            commentary =
              "Não encontrei nenhuma questão no nosso banco. Que tal me pedir para criar uma?";
          }
        } catch (r2Error) {
          console.error(
            `[ERRO] ${functionName}: Falha R2 (BUSCAR_QUESTAO):`,
            r2Error
          );
          commentary =
            "Tive um problema para acessar nosso banco de questões. Por favor, tente mais tarde.";
        }
        break;

      case "CRIAR_QUESTAO":
        if (generated_question) {
          commentary = "Certo, elaborei esta questão para você:";
          generated_question.id = generated_question.id || `gen-${Date.now()}`;
          generated_question.referencia =
            generated_question.referencia || "Texto gerado por IA.";
          questionsToReturn = [generated_question];
        } else if (responseTextForUser) {
          // Fallback se a IA deu texto em vez de JSON de questão
          const parsedFallback = parseAiGeneratedQuestion(responseTextForUser);
          if (parsedFallback) {
            commentary = "Criei esta questão (usando um formato alternativo):";
            questionsToReturn = [parsedFallback];
          } else {
            commentary = `Tentei criar a questão, mas o formato não veio como esperado. Aqui está o que a IA disse: "${responseTextForUser}"`;
          }
        } else {
          // Se commentary já não foi preenchido por validação pós-análise
          if (!commentary)
            commentary =
              "A IA deveria criar uma questão, mas não recebi os dados. 😥";
        }
        break;

      case "CONVERSAR":
        commentary = responseTextForUser; // responseTextForUser já foi validado que existe se intent é CONVERSAR
        break;

      case "DESCONHECIDO":
      default:
        if (!commentary) {
          // Se não houve erro específico antes
          commentary =
            "Não tenho certeza de como te ajudar com isso. Você pode me pedir para buscar questões do PAVE, criar uma nova ou tirar dúvidas sobre o processo seletivo. 😊";
        }
        break;
    }

    console.log(
      `[LOG] ${functionName}: Retornando final. Comentário: "${createTextPreview(
        commentary,
        50
      )}", Questões: ${questionsToReturn.length}`
    );
    return new Response(
      JSON.stringify({ commentary: commentary, questions: questionsToReturn }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      `[ERRO] ${functionName}: Erro GERAL INESPERADO:`,
      error,
      error.stack
    );
    return new Response(
      JSON.stringify({ error: `Erro interno do servidor: ${error.message}` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Handler genérico
export async function onRequest(context) {
  if (context.request.method === "POST") {
    return await onRequestPost(context);
  }
  return new Response(`Método ${context.request.method} não permitido.`, {
    status: 405,
    headers: { Allow: "POST" },
  });
}

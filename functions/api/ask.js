import { GoogleGenAI } from "@google/genai";
import {
  HarmCategory,
  HarmBlockThreshold,
} from "@google/genai";
import {
  createIntentRouterPrompt,
  INTENT_ROUTER_SCHEMA,
  createQuestionGenerationPromptV2,
  QUESTION_GENERATION_SCHEMA,
  createFlashcardGenerationPrompt,
  FLASHCARD_GENERATION_SCHEMA,
  createQuestionReRankingPromptV2,
  QUESTION_RERANKING_SCHEMA,
} from "./prompt";
import { createTextPreview } from "./filter";
import { fetchAllQuestions } from "./utils/uploader";
import { callGeminiAPI, extractTextFromResponse } from "./utils/ai";

// Constantes
const VECTORIZE_TOP_K = 15;
const MIN_SCORE_THRESHOLD = 0.45; // Reduzido de 0.65 para 0.45 para ser mais permissivo
const MAX_CANDIDATES_FOR_RERANKING = 8;

// Modelos otimizados
const FAST_MODEL = "gemini-2.5-flash-lite"; // Para tarefas rápidas (router, re-ranking)
const CREATIVE_MODEL = "gemini-2.5-flash"; // Para criação de conteúdo

/**
 * Handler principal do endpoint /api/ask
 */
export async function onRequestPost(context) {
  const functionName = "/api/ask (v2.0 - Router-Executor Pattern)";
  console.log(`[LOG] ${functionName}: Iniciando POST request`);

  let requestData;
  try {
    const { request, env } = context;
    const geminiApiKey = env.GEMINI_API_KEY;

    // Validar request
    try {
      requestData = await request.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Requisição JSON inválida." }),
        { status: 400 }
      );
    }

    // Validar bindings
    if (!env.GEMINI_API_KEY || !env.QUESTIONS_INDEX || !env.AI) {
      throw new Error(
        "Bindings GEMINI_API_KEY, QUESTIONS_INDEX ou AI não configurados."
      );
    }

    // Extrair histórico e query
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

    // Inicializar cliente GenAI
    const genAI = new GoogleGenAI({ apiKey: geminiApiKey });

    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ];

    // ============================================
    // FASE 1: ROUTER DE INTENÇÕES
    // ============================================
    console.log(`[LOG] ${functionName}: FASE 1 - Chamando Router de Intenções`);

    const routerPrompt = createIntentRouterPrompt(history, userQuery);
    let routerResponse;

    try {
      routerResponse = await callGeminiAPI({
        promptText: routerPrompt,
        genAIInstance: genAI,
        modelName: FAST_MODEL,
        safetySettings,
        callType: "intent-router",
        responseSchema: INTENT_ROUTER_SCHEMA,
        responseMimeType: "application/json",
      });
      
      console.log(`[LOG] ${functionName}: Router Response recebida:`, JSON.stringify(routerResponse, null, 2));
    } catch (error) {
      console.error(
        `[ERRO] ${functionName}: Falha no Router de Intenções:`,
        error
      );
      return new Response(
        JSON.stringify({
          commentary: `Desculpe, tive um problema ao processar seu pedido: ${error.message}`,
          questions: [],
        }),
        { status: 503 }
      );
    }

    // Parsear resposta do router
    let routerData;
    try {
      const routerText = extractTextFromResponse(routerResponse, "router");
      console.log(`[LOG] ${functionName}: Router Text extraído:`, routerText);
      
      routerData = JSON.parse(routerText);
      console.log(
        `[LOG] ${functionName}: Router detectou - Intent: ${routerData.intent}, Entities:`,
        routerData.entities,
        `QuestionCount: ${routerData.questionCount}`
      );
    } catch (error) {
      console.error(
        `[ERRO] ${functionName}: Falha ao parsear resposta do Router:`,
        error,
        `Response object:`, JSON.stringify(routerResponse, null, 2)
      );
      return new Response(
        JSON.stringify({
          commentary: "Não consegui entender a resposta interna. Tente reformular.",
          questions: [],
        }),
        { status: 500 }
      );
    }

    const { intent, entities, questionCount, reasoning } = routerData;

    // ============================================
    // FASE 2: EXECUTOR - Executar ação baseada no intent
    // ============================================
    console.log(
      `[LOG] ${functionName}: FASE 2 - Executando ação para intent: ${intent}, Reasoning: ${reasoning}`
    );

    let commentary = "";
    let questionsToReturn = [];
    let flashcardsToReturn = [];
    let displayCard = null;

    switch (intent) {
      case "BUSCAR_QUESTAO":
        const searchResult = await handleSearchQuestion(
          env,
          genAI,
          safetySettings,
          userQuery,
          entities
        );
        commentary = searchResult.commentary;
        questionsToReturn = searchResult.questions;
        break;

      case "CRIAR_QUESTAO":
        const createResult = await handleCreateQuestion(
          genAI,
          safetySettings,
          entities,
          questionCount || 1
        );
        commentary = createResult.commentary;
        questionsToReturn = createResult.questions;
        break;

      case "CRIAR_FLASHCARDS":
        const flashcardResult = await handleCreateFlashcards(
          genAI,
          safetySettings,
          entities,
          questionCount || 5
        );
        commentary = flashcardResult.commentary;
        flashcardsToReturn = flashcardResult.flashcards;
        break;

      case "INFO_PAVE":
        commentary =
          "Para informações detalhadas sobre o PAVE, consulte a **página de informações** ou o edital mais recente. Posso ajudar com questões específicas! 📚";
        displayCard = "pave_info_recommendation";
        break;

      case "CONVERSAR":
        commentary =
          "Olá! 👋 Estou aqui para ajudar com questões do PAVE. Posso **buscar** questões existentes, **criar** novas questões, ou gerar **flashcards** de estudo. Como posso ajudar?";
        break;

      default:
        commentary =
          "Não entendi bem seu pedido. Posso **buscar** questões existentes, **criar** novas questões, ou gerar **flashcards** de estudo. O que você gostaria?";
    }

    // Retornar resposta final
    console.log(
      `[LOG] ${functionName}: Retornando - Commentary: "${createTextPreview(
        commentary,
        50
      )}", Questões: ${questionsToReturn.length}, Flashcards: ${
        flashcardsToReturn.length
      }`
    );

    return new Response(
      JSON.stringify({
        commentary: commentary || null,
        questions: questionsToReturn,
        flashcards: flashcardsToReturn,
        displayCard,
      }),
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
      JSON.stringify({
        commentary: `Ocorreu um erro inesperado: ${error.message}`,
        error: `Erro interno do servidor: ${error.message}`,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// ============================================
// HANDLERS PARA CADA TIPO DE INTENT
// ============================================

/**
 * Extrai termos de busca relevantes da query do usuário.
 * Remove palavras de comando e mantém apenas os conceitos importantes.
 */
function extractSearchTerms(userQuery, entities) {
  // Se temos entidades extraídas, use-as
  if (entities) {
    const terms = [];
    if (entities.materia) terms.push(entities.materia);
    if (entities.topico) terms.push(entities.topico);
    if (terms.length > 0) {
      return terms.join(" ");
    }
  }
  
  // Caso contrário, limpe a query removendo palavras de comando comuns
  const stopWords = [
    "mostra", "mostre", "me", "uma", "questao", "questão", "questoes", "questões",
    "sobre", "do", "da", "de", "que", "fale", "fala", "falam", "falando",
    "busca", "busque", "buscar", "procura", "procure", "procurar",
    "encontra", "encontre", "encontrar", "acha", "ache", "achar",
    "pega", "pegue", "pegar", "traz", "traga", "trazer", "ve", "vê",
  ];
  
  const words = userQuery.toLowerCase()
    .split(/\s+/)
    .filter(word => !stopWords.includes(word) && word.length > 2);
  
  return words.join(" ") || userQuery; // Fallback para query original se ficar vazio
}

/**
 * Handler para busca de questões
 */
async function handleSearchQuestion(env, genAI, safetySettings, userQuery, entities) {
  const functionName = "handleSearchQuestion";
  
  try {
    // Validação básica
    const isQueryTooVague =
      userQuery.toLowerCase().split(" ").length < 2 &&
      !userQuery.toLowerCase().includes("pave");

    if (isQueryTooVague) {
      return {
        commentary:
          "Para te ajudar a encontrar questões, poderia me dar mais detalhes? Como a matéria ou o tópico. 😊",
        questions: [],
      };
    }

    // Buscar questões
    const allQuestionsData = await fetchAllQuestions(env);
    if (!Array.isArray(allQuestionsData) || allQuestionsData.length === 0) {
      return {
        commentary:
          "Meu banco de questões parece estar vazio ou indisponível no momento.",
        questions: [],
      };
    }

    // Busca vetorial
    let highConfidenceMatches = [];
    try {
      // Extrair termos de busca relevantes
      const searchTerms = extractSearchTerms(userQuery, entities);
      
      console.log(
        `[LOG] ${functionName}: Query original: "${userQuery}"`
      );
      console.log(
        `[LOG] ${functionName}: Termos de busca extraídos: "${searchTerms}"`
      );
      console.log(
        `[LOG] ${functionName}: Iniciando busca vetorial com termos: "${searchTerms}"`
      );
      
      const embeddingResponse = await env.AI.run("@cf/baai/bge-m3", {
        text: [searchTerms], // Usar termos limpos em vez da query completa
      });
      
      if (!embeddingResponse?.data?.[0]) {
        throw new Error("Falha ao gerar embedding da query.");
      }

      const queryVector = embeddingResponse.data[0];
      const vectorQueryResult = await env.QUESTIONS_INDEX.query(queryVector, {
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
      return {
        commentary:
          "Tive um problema com a busca semântica. Não consigo encontrar questões agora.",
        questions: [],
      };
    }

    // Preparar candidatas para re-ranking
    if (highConfidenceMatches.length === 0) {
      return {
        commentary: `Não encontrei questões relevantes para "${createTextPreview(
          userQuery,
          30
        )}". Gostaria que eu criasse uma?`,
        questions: [],
      };
    }

    const candidateIds = highConfidenceMatches.map((match) => match.id);
    const candidatesForReRanking = allQuestionsData.filter((q) =>
      candidateIds.includes(q.id.toString())
    );

    console.log(
      `[LOG] ${functionName}: ${candidatesForReRanking.length} candidatas prontas para re-ranking.`
    );

    // Re-ranking com IA
    const reRankingPrompt = createQuestionReRankingPromptV2(
      userQuery,
      candidatesForReRanking,
      entities
    );

    if (!reRankingPrompt) {
      return {
        commentary: "Não consegui preparar as opções para escolher.",
        questions: [],
      };
    }

    try {
      const reRankingResponse = await callGeminiAPI({
        promptText: reRankingPrompt,
        genAIInstance: genAI,
        modelName: FAST_MODEL,
        safetySettings,
        callType: "re-ranking",
        responseSchema: QUESTION_RERANKING_SCHEMA,
        responseMimeType: "application/json",
      });

      const reRankingText = extractTextFromResponse(
        reRankingResponse,
        "re-ranking"
      );
      const reRankingData = JSON.parse(reRankingText);

      if (reRankingData?.selected_question_ids?.length > 0) {
        const selectedIds = reRankingData.selected_question_ids.map((id) =>
          id.toString()
        );
        const selectedQuestions = allQuestionsData.filter((q) =>
          selectedIds.includes(q.id.toString())
        );

        if (selectedQuestions.length > 0) {
          console.log(
            `[LOG] ${functionName}: IA selecionou ${selectedQuestions.length} questão(ões).`
          );
          return {
            commentary:
              selectedQuestions.length > 1
                ? `Encontrei ${selectedQuestions.length} questões relevantes:`
                : "Encontrei esta questão:",
            questions: selectedQuestions,
          };
        } else {
          return {
            commentary: `Selecionei referências, mas não achei as questões completas.`,
            questions: [],
          };
        }
      } else {
        return {
          commentary: `Analisei as opções mais relevantes, mas nenhuma pareceu perfeita para "${createTextPreview(
            userQuery,
            30
          )}". Gostaria que eu criasse uma?`,
          questions: [],
        };
      }
    } catch (reRankingError) {
      console.error(
        `[ERRO] ${functionName}: Falha no re-ranking:`,
        reRankingError
      );
      return {
        commentary: "Tive um problema ao selecionar a melhor questão.",
        questions: [],
      };
    }
  } catch (error) {
    console.error(`[ERRO] ${functionName}: Erro geral:`, error);
    return {
      commentary: `Ocorreu um problema ao buscar questões: ${error.message}`,
      questions: [],
    };
  }
}

/**
 * Handler para criação de questões
 */
async function handleCreateQuestion(genAI, safetySettings, entities, count) {
  const functionName = "handleCreateQuestion";
  
  console.log(`[LOG] ${functionName}: INICIANDO - entities:`, JSON.stringify(entities), `count: ${count}`);

  try {
    const materia = entities?.materia || "Geral";
    const topico = entities?.topico || "Conhecimentos Gerais";
    const questionCount = Math.min(Math.max(count || 1, 1), 5); // Limitar entre 1 e 5

    console.log(
      `[LOG] ${functionName}: Gerando ${questionCount} questão(ões) sobre ${materia} - ${topico}`
    );

    const prompt = createQuestionGenerationPromptV2(
      materia,
      topico,
      questionCount
    );

    const response = await callGeminiAPI({
      promptText: prompt,
      genAIInstance: genAI,
      modelName: CREATIVE_MODEL,
      safetySettings,
      callType: "create-question",
      responseSchema: QUESTION_GENERATION_SCHEMA,
      responseMimeType: "application/json",
      temperature: 0.9, // Mais criativo
      maxOutputTokens: 2048,
    });

    const responseText = extractTextFromResponse(response, "create-question");
    const data = JSON.parse(responseText);

    if (data?.questions && Array.isArray(data.questions) && data.questions.length > 0) {
      // Validar e processar questões
      const validQuestions = data.questions
        .map((q, index) => {
          if (
            !q?.texto_questao ||
            !q.alternativas ||
            !q.resposta_letra
          ) {
            console.warn(
              `[WARN] ${functionName}: Questão inválida no índice ${index}:`,
              q
            );
            return null;
          }

          return {
            ...q,
            id: `gen-${Date.now()}-${index}`,
            materia: q.materia || materia,
            topico: q.topico || topico,
            referencia: "Gerado por IA",
          };
        })
        .filter(Boolean);

      if (validQuestions.length > 0) {
        return {
          commentary:
            validQuestions.length > 1
              ? `Certo! Elaborei ${validQuestions.length} questões para você:`
              : "Certo! Elaborei esta questão para você:",
          questions: validQuestions,
        };
      }
    }

    return {
      commentary:
        "Tentei criar as questões, mas os dados não vieram no formato esperado. 😥",
      questions: [],
    };
  } catch (error) {
    console.error(`[ERRO] ${functionName}: Erro ao criar questão:`, error);
    return {
      commentary: `Não consegui criar a questão: ${error.message}`,
      questions: [],
    };
  }
}

/**
 * Handler para criação de flashcards
 */
async function handleCreateFlashcards(genAI, safetySettings, entities, count) {
  const functionName = "handleCreateFlashcards";

  try {
    const topico = entities?.topico || "Conhecimentos Gerais do PAVE";
    const flashcardCount = Math.min(Math.max(count || 5, 3), 10); // Limitar entre 3 e 10

    console.log(
      `[LOG] ${functionName}: Gerando ${flashcardCount} flashcards sobre ${topico}`
    );

    const prompt = createFlashcardGenerationPrompt(topico, flashcardCount);

    const response = await callGeminiAPI({
      promptText: prompt,
      genAIInstance: genAI,
      modelName: CREATIVE_MODEL,
      safetySettings,
      callType: "create-flashcards",
      responseSchema: FLASHCARD_GENERATION_SCHEMA,
      responseMimeType: "application/json",
      temperature: 0.8,
      maxOutputTokens: 1024,
    });

    const responseText = extractTextFromResponse(response, "create-flashcards");
    const data = JSON.parse(responseText);

    if (data?.flashcards && Array.isArray(data.flashcards) && data.flashcards.length > 0) {
      // Validar e processar flashcards
      const validFlashcards = data.flashcards
        .map((fc, index) => {
          if (!fc?.term || !fc.definition) {
            console.warn(
              `[WARN] ${functionName}: Flashcard inválido no índice ${index}:`,
              fc
            );
            return null;
          }

          return {
            ...fc,
            id: `fc-${Date.now()}-${index}`,
          };
        })
        .filter(Boolean);

      if (validFlashcards.length > 0) {
        return {
          commentary: `Certo! Preparei ${validFlashcards.length} flashcards sobre **${topico}**:`,
          flashcards: validFlashcards,
        };
      }
    }

    return {
      commentary:
        "Tentei criar os flashcards, mas os dados não vieram no formato esperado. 😥",
      flashcards: [],
    };
  } catch (error) {
    console.error(`[ERRO] ${functionName}: Erro ao criar flashcards:`, error);
    return {
      commentary: `Não consegui criar os flashcards: ${error.message}`,
      flashcards: [],
    };
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
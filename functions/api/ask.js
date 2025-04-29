// functions/api/ask.js
import { GoogleGenerativeAI } from "@google/generative-ai";
// Importa as configurações do arquivo separado
import { config } from './config.js';

// --- Funções Auxiliares (Mantidas) ---
function removeAccents(str) { /* ... código robusto ... */ }
const stopWords = new Set([ /* ... lista ... */ ]); // Pode mover para config.js se preferir
function filtrarQuestoes(questoes, query) { /* ... código robusto anterior ... */ }

// --- Handler Principal Usando Config ---
export async function onRequestPost(context) {
  const functionName = "/api/ask";
  console.log(`[LOG] ${functionName}: Iniciando POST request`);
  try {
    const { request, env } = context;
    const geminiApiKey = env.GEMINI_API_KEY;
    const r2Bucket = env.QUESTOES_PAVE_BUCKET;

    // Validações
    if (!r2Bucket || !geminiApiKey) { throw new Error('Configuração interna incompleta.'); }
    console.log(`[LOG] ${functionName}: Bindings e API Key OK.`);

    // Obter corpo e histórico
    let requestData;
    try { requestData = await request.json(); }
    catch (e) { return new Response(JSON.stringify({ error: 'Requisição inválida.' }), { status: 400 }); }
    const history = requestData?.history;
    if (!Array.isArray(history) || history.length === 0) { return new Response(JSON.stringify({ error: 'Histórico inválido.' }), { status: 400 }); }
    const lastUserMessage = history.findLast(m => m.role === 'user');
    const userQuery = lastUserMessage?.parts?.[0]?.text?.trim();
    if (!userQuery) { return new Response(JSON.stringify({ error: 'Query inválida.' }), { status: 400 }); }
    console.log(`[LOG] ${functionName}: Última query: "${userQuery}"`);

    // Carregar e Filtrar Questões
    let allQuestionsData = [];
    let questoesRelevantes = [];
    let contextForAI = "Nenhum contexto específico carregado.";
    try {
        const r2Object = await r2Bucket.get(config.r2FileName); // <<< Usa config
        if (r2Object !== null) {
            allQuestionsData = await r2Object.json();
            if (!Array.isArray(allQuestionsData)) { allQuestionsData = []; }
            else {
                 questoesRelevantes = filtrarQuestoes(allQuestionsData, userQuery);
                 if (questoesRelevantes.length > 0) {
                    const topicosEncontrados = [...new Set(questoesRelevantes.map(q => q?.topico || q?.materia))].filter(Boolean).join(', ');
                    contextForAI = `Foram encontradas ${questoesRelevantes.length} questão(ões) relevante(s) sobre "${topicosEncontrados || 'tópicos relacionados'}".`;
                 } else { contextForAI = "Nenhuma questão relevante encontrada na base para esta pergunta."; }
            }
        }
    } catch (e) { console.error(`[ERRO] ${functionName}: Falha ao ler/processar R2:`, e); }
    console.log(`[LOG] ${functionName}: Contexto para IA: ${contextForAI}`);
    console.log(`[LOG] ${functionName}: ${questoesRelevantes.length} questões relevantes encontradas.`);

    // --- LÓGICA DE DECISÃO ---
    let shouldShowQuestions = false;
    let aiResponseText = "";
    let questionsToReturn = [];

    // Usa as keywords do config
    const isAskingForQuestions = config.requestKeywords.some(keyword => userQuery.toLowerCase().includes(keyword));

    if (isAskingForQuestions && questoesRelevantes.length > 0) {
        console.log(`[LOG] ${functionName}: Detectado pedido por questões e ${questoesRelevantes.length} encontradas.`);
        shouldShowQuestions = true;
        const topics = [...new Set(questoesRelevantes.slice(0, config.maxQuestionsToShow).map(q => q?.topico || q?.materia))].filter(Boolean).join(', ');
        // Usa a função de prompt do config
        aiResponseText = config.prompts.fallbackCommentQuestionsFound(questoesRelevantes.length, topics);
        questionsToReturn = questoesRelevantes
            .slice(0, config.maxQuestionsToShow) // <<< Usa config
            .map(q => ({ /* ... mapeamento ... */
                 ano: q?.ano, etapa: q?.etapa, materia: q?.materia, topico: q?.topico,
                 texto_questao: q?.texto_questao, referencia: q?.referencia,
                 alternativas: q?.alternativas, resposta_letra: q?.resposta_letra
             }));

    } else {
        console.log(`[LOG] ${functionName}: Chamando IA para resposta textual.`);
        shouldShowQuestions = false;
        questionsToReturn = [];

        // Configuração da API Gemini (usa config)
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({
            model: config.gemini.modelName, // <<< Usa config
            // safetySettings: config.gemini.safetySettings // Passado abaixo
        });

        // Adiciona instrução final ao histórico
        // Usa a função de template do config
        const systemInstruction = config.prompts.decisionInstructionTemplate(contextForAI);
        const historyWithInstruction = [...history];
        if (historyWithInstruction.length > 0 && historyWithInstruction[history.length - 1].parts?.length > 0) {
            historyWithInstruction[history.length - 1].parts.push({ text: systemInstruction }); // Adiciona como parte separada
        } else { console.error(`[ERRO] ${functionName}: Formato inesperado do histórico.`); }

        console.log(`[LOG] ${functionName}: Enviando histórico para Gemini.`);

        try {
            const result = await model.generateContent({
                contents: historyWithInstruction,
                safetySettings: config.gemini.safetySettings, // <<< Usa config
                // generationConfig: config.gemini.generationConfig // Opcional
            });
            const response = result.response;
            aiResponseText = response.text() || "";

            if (!aiResponseText && response.promptFeedback?.blockReason) {
                console.warn(`[WARN] ${functionName}: Resposta bloqueada. Razão: ${response.promptFeedback.blockReason}`);
                aiResponseText = config.prompts.fallbackBlocked; // <<< Usa config
            }

            // Verifica e remove a tag [MOSTRAR_QUESTOES] se ainda existir (embora não deva mais)
            if (aiResponseText.includes("[MOSTRAR_QUESTOES]")) {
                console.warn(`[WARN] ${functionName}: IA incluiu tag [MOSTRAR_QUESTOES] inesperadamente.`);
                aiResponseText = aiResponseText.replace("[MOSTRAR_QUESTOES]", "").trim();
                // Poderia forçar shouldShowQuestions = true aqui se desejado
            }

            if (!aiResponseText && !shouldShowQuestions) { // Se ainda vazio
                 aiResponseText = config.prompts.fallbackGenericError; // <<< Usa config
            }

        } catch (error) {
            console.error(`[ERRO] ${functionName}: Erro ao chamar Gemini SDK:`, error);
            aiResponseText = config.prompts.fallbackApiError(error.message); // <<< Usa config
        }
    }

    // Define resposta padrão se TUDO falhou
    if (!aiResponseText && questionsToReturn.length === 0) {
        aiResponseText = config.prompts.fallbackNoContextFound; // <<< Usa config
    }

    // Retornar Resposta Estruturada
    console.log(`[LOG] ${functionName}: Retornando resposta final. Questões: ${questionsToReturn.length}`);
    return new Response(JSON.stringify({ commentary: aiResponseText, questions: questionsToReturn }), {
      headers: { 'Content-Type': 'application/json' }, status: 200
    });

  } catch (error) {
    console.error(`[ERRO] ${functionName}: Erro GERAL CAPTURADO:`, error);
    return new Response(JSON.stringify({ error: `Erro interno: ${error.message}` }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Handler genérico para outros métodos
export async function onRequest(context) { /* ... como antes ... */ }
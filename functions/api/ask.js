// functions/api/ask.js
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// --- Funções Auxiliares ---
function removeAccents(str) { /* ... código ... */ }
const stopWords = new Set([ /* ... lista ... */ ]);
function filtrarQuestoes(questoes, query) { /* ... código robusto anterior ... */ }
function parseAiGeneratedQuestion(aiText) { /* ... código robusto anterior ... */ }

// --- Handler Principal (Focado em Mostrar/Gerar) ---
export async function onRequestPost(context) {
  const functionName = "/api/ask";
  console.log(`[LOG] ${functionName}: Iniciando POST request`);
  try {
    const { request, env } = context;
    const geminiApiKey = env.GEMINI_API_KEY;
    const r2Bucket = env.QUESTOES_PAVE_BUCKET;
    const modelName = env.MODEL_NAME || "gemini-1.5-flash-latest";

    // Validações
    if (!r2Bucket || !geminiApiKey) { throw new Error('Configuração interna incompleta.'); }
    console.log(`[LOG] ${functionName}: Configs OK. Modelo: ${modelName}`);

    // Obter corpo e histórico (histórico pode não ser mais tão relevante, mas pegamos a última query)
    let requestData;
    try { requestData = await request.json(); } catch (e) { return new Response(JSON.stringify({ error: 'Requisição inválida.' }), { status: 400 }); }
    const history = requestData?.history; // Mantém para contexto futuro se necessário
    if (!Array.isArray(history) || history.length === 0) { return new Response(JSON.stringify({ error: 'Histórico inválido.' }), { status: 400 }); }
    const lastUserMessage = history.findLast(m => m.role === 'user');
    const userQuery = typeof lastUserMessage?.parts?.[0]?.text === 'string' ? lastUserMessage.parts[0].text.trim() : null;
    if (!userQuery) { return new Response(JSON.stringify({ error: 'Query inválida no histórico.' }), { status: 400 }); }
    console.log(`[LOG] ${functionName}: Última query: "${userQuery}"`);

    // Carregar Questões do R2 SEMPRE
    let allQuestionsData = [];
    let questoesRelevantes = [];
    try {
        const r2Object = await r2Bucket.get('questoes.json');
        if (r2Object !== null) {
            allQuestionsData = await r2Object.json();
            if (Array.isArray(allQuestionsData)) {
                // Filtra baseado na query atual
                questoesRelevantes = filtrarQuestoes(allQuestionsData, userQuery);
            } else { allQuestionsData = []; }
        }
    } catch (e) { console.error(`[ERRO] ${functionName}: Falha R2:`, e); }
    console.log(`[LOG] ${functionName}: ${questoesRelevantes.length} questões relevantes filtradas do R2.`);

    // --- Detecção de Intenção ---
    const queryLower = userQuery.toLowerCase();
    // Palavras para MOSTRAR questão existente
    const requestKeywords = ['questão', 'questões', 'exercício', 'exercícios', 'exemplo', 'mostre', 'mande', 'liste', 'quero ver', 'sim', 'pode mandar', 'mostra', 'envia uma questao'];
    // Palavras para CRIAR questão nova
    const createKeywords = ['crie', 'invente', 'elabore', 'gere uma questão', 'faça uma questão'];
    const isAskingForExisting = requestKeywords.some(keyword => queryLower.includes(keyword));
    const isAskingToCreate = createKeywords.some(keyword => queryLower.includes(keyword));

    let commentary = "";
    let questionsToReturn = [];
    const MAX_QUESTIONS_TO_SHOW = 1;

    // --- LÓGICA DE DECISÃO SIMPLIFICADA ---

    if (isAskingToCreate) {
        // CASO 1: Pediu para CRIAR (Prioridade sobre mostrar existente se ambas keywords estiverem)
        console.log(`[LOG] ${functionName}: Decisão: Criar questão com IA.`);
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: modelName });
        const safetySettings = [ /* ... seus safety settings ... */ ];
        const creationPrompt = `Crie uma questão de múltipla escolha (A, B, C, D, E) INÉDITA no estilo do PAVE UFPEL sobre o seguinte tópico ou instrução: "${userQuery}". Formate sua resposta EXATAMENTE com as seções: Matéria: [Nome Matéria]\nTópico: [Nome Tópico]\nEnunciado: [Texto Enunciado]\nA) [Alt A]\nB) [Alt B]\nC) [Alt C]\nD) [Alt D]\nE) [Alt E]\nResposta Correta: [Letra]`;

        try {
            const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: creationPrompt }] }], safetySettings });
            const aiGeneratedText = result.response.text() || "";
            if (!aiGeneratedText && result.response.promptFeedback?.blockReason) { commentary = `(Não posso criar: ${result.response.promptFeedback.blockReason})`; }
            else if (aiGeneratedText) {
                const parsedQuestion = parseAiGeneratedQuestion(aiGeneratedText);
                if (parsedQuestion) {
                    commentary = "Certo, elaborei esta questão para você:";
                    questionsToReturn = [parsedQuestion];
                } else { commentary = `Tentei criar, mas falhei no parse. IA gerou:\n\n${aiGeneratedText}`; questionsToReturn = []; }
            } else { commentary = "(A IA não gerou a questão.)"; }
        } catch (error) { console.error(`[ERRO] ${functionName}: Erro Gemini CRIAÇÃO:`, error); commentary = `(Erro ao criar: ${error.message})`; }

    } else if (isAskingForExisting) {
        // CASO 2: Pediu questão existente (e não pediu para criar)
        if (questoesRelevantes.length > 0) {
            // Encontramos no R2
            console.log(`[LOG] ${functionName}: Decisão: Mostrar questão existente do R2.`);
            const qToShow = questoesRelevantes[0];
            const topico = qToShow?.topico || qToShow?.materia || 'relacionado';
            commentary = `Ok! Encontrei uma questão sobre ${topico} para você praticar:`; // Comentário padrão
            questionsToReturn = [{ // Mapeamento seguro
                 ano: qToShow?.ano, etapa: qToShow?.etapa, materia: qToShow?.materia, topico: qToShow?.topico,
                 texto_questao: qToShow?.texto_questao, referencia: qToShow?.referencia,
                 alternativas: qToShow?.alternativas, resposta_letra: qToShow?.resposta_letra
             }];
        } else {
            // Pediu existente, mas não achamos
            console.log(`[LOG] ${functionName}: Decisão: Questão pedida não encontrada no R2.`);
            commentary = `Puxa, procurei por questões sobre "${userQuery}" nos meus dados do PAVE, mas não encontrei nenhuma correspondente no momento. Quer tentar outros termos ou pedir para eu criar uma?`;
            questionsToReturn = [];
        }
    } else {
        // CASO 3: Não pediu para mostrar nem para criar -> Resposta Padrão/Ajuda
        console.log(`[LOG] ${functionName}: Decisão: Entrada não reconhecida como pedido de questão.`);
        commentary = `Olá! Posso te ajudar a praticar com questões do PAVE ou tentar gerar uma nova questão para você. O que gostaria de fazer? (Ex: "questão de história etapa 1", "crie um exercício sobre física moderna")`;
        questionsToReturn = [];
    }

    // Retornar Resposta Estruturada Final
    console.log(`[LOG] ${functionName}: Retornando final. Comentário: ${commentary ? 'Sim' : 'Não'}, Questões: ${questionsToReturn.length}`);
    return new Response(JSON.stringify({ commentary: commentary, questions: questionsToReturn }), {
      headers: { 'Content-Type': 'application/json' }, status: 200
    });

  } catch (error) {
      console.error(`[ERRO] ${functionName}: Erro GERAL CAPTURADO:`, error);
      // Retorna a mensagem de erro específica capturada
      return new Response(JSON.stringify({ error: `Erro interno: ${error.message}` }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
  }
}

// Handler genérico para outros métodos
export async function onRequest(context) {
    console.log(`[LOG] /api/ask: Recebido request ${context.request.method}`);
    if (context.request.method === 'POST') {
        return await onRequestPost(context);
    }
    return new Response(`Método ${context.request.method} não permitido. Use POST.`, { status: 405 });
}
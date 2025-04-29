// functions/api/ask.js
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// --- Funções Auxiliares (Robustas) ---
function removeAccents(str) { /* ... */ }
const stopWords = new Set([ /* ... */ ]);
function filtrarQuestoes(questoes, query) { /* ... código robusto anterior ... */ }

// --- Handler Principal Refatorado com Correção ---
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
    console.log(`[LOG] ${functionName}: Bindings e API Key OK. Usando modelo: ${modelName}`);

    // Obter corpo e histórico
    let requestData;
    try { requestData = await request.json(); }
    catch (e) { return new Response(JSON.stringify({ error: 'Requisição inválida.' }), { status: 400 }); }
    const history = requestData?.history;
    if (!Array.isArray(history) || history.length === 0) { return new Response(JSON.stringify({ error: 'Histórico inválido.' }), { status: 400 }); }
    const lastUserMessage = history.findLast(m => m.role === 'user');
    const userQuery = lastUserMessage?.parts?.[0]?.text?.trim();
    if (!userQuery) { return new Response(JSON.stringify({ error: 'Query inválida.' }), { status: 400 }); }

    // Carregar e Filtrar Questões
    let allQuestionsData = [];
    let questoesRelevantes = [];
    try { /* ... Bloco try/catch para ler R2 e filtrar ... */
        const r2Object = await r2Bucket.get('questoes.json');
        if (r2Object !== null) {
            allQuestionsData = await r2Object.json();
            if (Array.isArray(allQuestionsData)) {
                questoesRelevantes = filtrarQuestoes(allQuestionsData, userQuery);
            } else { allQuestionsData = []; }
        }
    } catch (e) { console.error(`[ERRO] ${functionName}: Falha ao ler/processar R2:`, e); }
    console.log(`[LOG] ${functionName}: ${questoesRelevantes.length} questões relevantes encontradas pela filtragem.`);

    // --- LÓGICA DE DECISÃO ---
    let aiResponseText = "";
    let questionsToReturn = [];
    const MAX_QUESTIONS_TO_SHOW = 3;
    const createKeywords = ['crie', 'gere', 'invente', 'elabore uma questão', 'faça uma questão'];
    const requestKeywords = ['questão', 'questões', 'exercício', 'exercícios', 'exemplo', 'mostre', 'mande', 'liste', 'quero ver'];
    const isAskingToCreate = createKeywords.some(keyword => userQuery.toLowerCase().includes(keyword));
    const isAskingForExisting = requestKeywords.some(keyword => userQuery.toLowerCase().includes(keyword));

    if (isAskingToCreate) {
        // --- TENTAR GERAR QUESTÃO PELA IA ---
        console.log(`[LOG] ${functionName}: Decisão: Criar questão.`);
        try {
            const generatedQuestion = await generateQuestionWithAI(userQuery, geminiApiKey, modelName); // Chama a função auxiliar
            if (generatedQuestion) {
                 aiResponseText = "Ok! Criei esta questão especialmente para você:";
                 questionsToReturn = [ { /* ... mapeamento da generatedQuestion ... */ } ];
            } else { aiResponseText = "Tentei criar, mas não consegui gerar um formato válido."; }
        } catch (generationError) { aiResponseText = `Desculpe, problema ao criar questão: ${generationError.message}`; }

    } else if (isAskingForExisting && questoesRelevantes.length > 0) {
        // --- BUSCAR QUESTÃO EXISTENTE E ENCONTRADA ---
        console.log(`[LOG] ${functionName}: Decisão: Mostrar questões encontradas.`);
        questionsToReturn = questoesRelevantes.slice(0, MAX_QUESTIONS_TO_SHOW).map(q => ({ /* ... mapeamento ... */ }));
        const questaoSelecionada = questoesRelevantes[0];
        const introPrompt = `O usuário pediu questões sobre "${userQuery}"... Gere APENAS uma frase curta...`;
        try { /* Bloco try/catch para gerar intro */
             const genAI = new GoogleGenerativeAI(geminiApiKey);
             const model = genAI.getGenerativeModel({ model: modelName });
             const safetySettings = [ /* ... */ ];
             const result = await model.generateContent(introPrompt, { safetySettings });
             aiResponseText = result.response.text()?.trim() || "Aqui está a questão que encontrei:";
        } catch(introError) { aiResponseText = "Encontrei esta questão para você:"; }

    } else {
        // --- CONVERSA NORMAL OU PEDIU QUESTÕES MAS NÃO ACHOU ---
        console.log(`[LOG] ${functionName}: Decisão: Conversa/QA ou Busca sem resultados.`);
        questionsToReturn = []; // Garante que não vai retornar questões

        let contextInfo = "";
        if (isAskingForExisting && questoesRelevantes.length === 0) {
            contextInfo = "Contexto Importante: O usuário pediu por questões, mas a busca na base de dados não retornou resultados relevantes.";
        } else { contextInfo = "Contexto Interno: Nenhuma questão relevante encontrada..."; } // Ou outro contexto

        const conversaPrompt = `Você é um assistente PAVE UFPEL... ${contextInfo}... Responda à ÚLTIMA pergunta ("${userQuery}")... Sua Resposta Textual:`;
        console.log(`[LOG] ${functionName}: Enviando prompt conversacional para Gemini.`);
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: modelName });
        const safetySettings = [ /* ... */ ];

        try { // Chamada Gemini para Conversa
             const result = await model.generateContent({ contents: history, safetySettings });
             aiResponseText = result.response.text()?.trim() || "(Não consegui gerar uma resposta.)";
             console.log(`[LOG] ${functionName}: Resposta textual recebida da Gemini.`);
        } catch (conversaError) {
             console.error(`[ERRO] ${functionName} (Conversa): Erro ao chamar Gemini:`, conversaError);
             aiResponseText = `(Desculpe, erro ao processar: ${conversaError.message})`;
        }
        // <<< CORREÇÃO: O 'return' ESTAVA FALTANDO AQUI >>>
    }

    // --- Retornar Resposta Estruturada (AGORA SEMPRE ALCANÇADO) ---
    console.log(`[LOG] ${functionName}: Retornando resposta final. Comentário: ${aiResponseText ? 'Sim' : 'Não'}, Questões: ${questionsToReturn.length}`);
    return new Response(JSON.stringify({ commentary: aiResponseText, questions: questionsToReturn }), {
      headers: { 'Content-Type': 'application/json' }, status: 200
    });

  } catch (error) {
    // Catch geral para erros lançados ANTES da lógica principal ou erros inesperados
    console.error(`[ERRO] ${functionName}: Erro GERAL CAPTURADO:`, error);
    return new Response(JSON.stringify({ error: `Erro interno: ${error.message}` }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}


// --- Função generateQuestionWithAI (COMO ANTES, MAS GARANTIR QUE ESTÁ AQUI) ---
async function generateQuestionWithAI(userQuery, apiKey, modelName) {
    const functionName = "/api/ask (generateQuestionWithAI)";
    console.log(`[LOG] ${functionName}: Iniciando geração para: "${userQuery}"`);
    const topicMatch = userQuery.match(/sobre ([\w\sà-úÀ-Ú]+)/i);
    const topic = topicMatch ? topicMatch[1].trim() : "um tópico variado do PAVE";
    const jsonExample = `{ /* ... seu exemplo JSON ... */ }`;
    const prompt = `Você é... Gere APENAS E SOMENTE o código JSON válido... Formato JSON Requerido:\n${jsonExample}\nGere agora:`;

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName });
        const safetySettings = [ /* ... */ ];
        console.log(`[LOG] ${functionName}: Enviando prompt de geração JSON.`);
        const result = await model.generateContent(prompt, { safetySettings });
        const aiResponseText = result.response.text()?.trim() || "";
        if (!aiResponseText) { throw new Error("IA não retornou conteúdo."); }
        console.log(`[LOG] ${functionName}: Resposta bruta recebida.`);

        let generatedQuestion = null;
        try {
            generatedQuestion = JSON.parse(aiResponseText);
            // Validação da estrutura (como antes)
            if (typeof generatedQuestion.texto_questao === 'string') {
                console.log(`[LOG] ${functionName}: JSON gerado parece válido.`);
                generatedQuestion.ano = new Date().getFullYear(); generatedQuestion.etapa = null;
                generatedQuestion.materia = "Gerada por IA"; generatedQuestion.topico = topic;
                generatedQuestion.referencia = "Questão gerada por IA.";
                return generatedQuestion; // <<< RETORNA A QUESTÃO GERADA
            } else { throw new Error("Estrutura JSON inválida."); }
        } catch (parseError) {
            console.error(`[ERRO] ${functionName}: Falha ao parsear/validar JSON:`, parseError, "\nResposta Bruta:\n", aiResponseText);
            throw new Error("A IA não retornou um JSON válido.");
        }
    } catch (error) {
        console.error(`[ERRO] ${functionName}: Erro durante a geração:`, error);
        throw error; // Re-lança para o catch principal do handler
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
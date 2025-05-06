// /functions/api/ask.js
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// --- IMPORTAR FUNÇÕES DOS OUTROS ARQUIVOS ---
import { createAnalysisPrompt } from './prompt'; // Importa do arquivo prompt.js
import { findQuestionsByEntities, parseAiGeneratedQuestion } from './filter'; // Importa do arquivo filter.js

// --- Handler Principal ---
export async function onRequestPost(context) {
  const functionName = "/api/ask (v4 - IA gera JSON)";
  console.log(`[LOG] ${functionName}: Iniciando POST request`);
  try {
    const { request, env } = context;
    const geminiApiKey = env.GEMINI_API_KEY;
    const r2Bucket = env.QUESTOES_PAVE_BUCKET; // Binding para as questões existentes
    const modelName = env.MODEL_NAME || "gemini-2.0-flash";

    // Validações essenciais
    if (!r2Bucket) { throw new Error('Binding R2 [QUESTOES_PAVE_BUCKET] não configurado.'); }
    if (!geminiApiKey) { throw new Error('Variável de ambiente [GEMINI_API_KEY] não configurada.'); }
    console.log(`[LOG] ${functionName}: Configs OK. Modelo: ${modelName}`);

    // Obter corpo e histórico
    let requestData;
    try { requestData = await request.json(); }
    catch (e) { return new Response(JSON.stringify({ error: 'Requisição JSON inválida.' }), { status: 400 }); }
    const history = requestData?.history;
    if (!Array.isArray(history) || history.length === 0) { return new Response(JSON.stringify({ error: 'Histórico inválido ou vazio.' }), { status: 400 }); }
    const lastUserMessage = history.findLast(m => m.role === 'user');
    const userQuery = typeof lastUserMessage?.parts?.[0]?.text === 'string' ? lastUserMessage.parts[0].text.trim() : null;
    if (!userQuery) { return new Response(JSON.stringify({ error: 'Query do usuário inválida no histórico.' }), { status: 400 }); }
    console.log(`[LOG] ${functionName}: Query: "${userQuery}"`);

    // --- Criar o Prompt usando a função importada ---
    const analysisPrompt = createAnalysisPrompt(history, userQuery);

    // --- Chamada Única à IA ---
    console.log(`[LOG] ${functionName}: Enviando prompt de ANÁLISE para Gemini.`);
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const safetySettings = [ // Configurações de segurança
         { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
         { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
         { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
         { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];

    let aiResponseText = "";
    try {
        const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: analysisPrompt }] }], safetySettings });
        const response = result.response;
        if (!response) { throw new Error("Resposta da API Gemini inválida ou vazia."); }
        if (response.promptFeedback?.blockReason) { throw new Error(`Conteúdo bloqueado pela IA. Razão: ${response.promptFeedback.blockReason}`); }
        aiResponseText = response.text() || "";
        if (!aiResponseText) { throw new Error("A IA retornou uma string vazia."); }
    } catch(error) {
         console.error(`[ERRO] ${functionName}: Falha na chamada da API Gemini:`, error);
         return new Response(JSON.stringify({ error: `Erro ao comunicar com a IA: ${error.message}` }), { status: 503 });
    }

    // --- Processar Resposta JSON da IA ---
    let intent = 'DESCONHECIDO';
    let entities = null;
    let generated_question = null;
    let responseText = null;
    let commentary = "";
    let questionsToReturn = [];

    try {
        console.log(`[LOG] ${functionName}: Parseando resposta IA: ${aiResponseText.substring(0,100)}...`);
        const cleanedJsonString = aiResponseText.replace(/^```json\s*|```$/g, '').trim();
        const aiAnalysis = JSON.parse(cleanedJsonString);

        intent = aiAnalysis?.intent || 'DESCONHECIDO';
        entities = aiAnalysis?.entities || null;
        generated_question = aiAnalysis?.generated_question || null;
        responseText = aiAnalysis?.responseText || null;

        console.log(`[LOG] ${functionName}: IA Parsed - Intent: ${intent}, Entities: ${JSON.stringify(entities)}, Question: ${generated_question ? 'Sim' : 'Não'}, RespText: ${responseText ? 'Sim' : 'Não'}`);

        // Validações extras
        if (intent === 'CRIAR_QUESTAO' && !generated_question && !responseText) {
             console.warn(`[WARN] ${functionName}: Intent CRIAR, mas sem generated_question ou responseText.`);
             intent = 'DESCONHECIDO';
             commentary = "Pedi para a IA criar uma questão, mas não recebi o conteúdo.";
        }
         if (intent === 'CONVERSAR' && !responseText) {
              console.warn(`[WARN] ${functionName}: Intent CONVERSAR, mas sem responseText.`);
              intent = 'DESCONHECIDO';
              commentary = "Não consegui gerar uma resposta para isso.";
         }

    } catch (e) {
        console.error(`[ERRO] ${functionName}: Falha ao parsear JSON da IA. Resposta:`, aiResponseText, "Erro:", e);
        intent = 'DESCONHECIDO';
        commentary = "Desculpe, tive um problema ao processar a resposta da IA.";
    }

    // --- Lógica do Backend Baseada na Intenção ---
    switch (intent) {
        case 'BUSCAR_QUESTAO':
            try {
                const r2Object = await r2Bucket.get('questoes.json');
                if (!r2Object) { commentary = "Erro ao acessar banco de questões."; break; }
                const allQuestionsData = await r2Object.json();
                if (!Array.isArray(allQuestionsData)) { commentary = "Banco de questões inválido."; break; }

                const foundQuestions = findQuestionsByEntities(entities, allQuestionsData);
                if (foundQuestions.length > 0) {
                    commentary = `Encontrei esta questão sobre ${entities?.topico || entities?.materia || 'o que pediu'}:`;
                    questionsToReturn = [foundQuestions[0]];
                } else {
                    commentary = `Não encontrei questões existentes sobre ${entities?.topico || entities?.materia || 'sua busca'}. Peça para eu criar uma!`;
                }
            } catch (r2Error) {
                console.error(`[ERRO] ${functionName}: Falha R2:`, r2Error);
                commentary = "Erro ao acessar o banco de questões.";
            }
            break;

        case 'CRIAR_QUESTAO':
            if (generated_question) {
                commentary = "Certo, elaborei esta questão:";
                generated_question.id = generated_question.id || `gen-${Date.now()}`;
                generated_question.referencia = generated_question.referencia || "Texto gerado por IA.";
                questionsToReturn = [generated_question];
                console.log("[LOG] Usando questão JSON gerada pela IA.");
            } else if (responseText) { // Tenta o fallback
                console.warn("[WARN] IA não gerou JSON, tentando parse de fallback no responseText...");
                const parsedFallback = parseAiGeneratedQuestion(responseText);
                if (parsedFallback) {
                     commentary = "Criei esta questão para você (parse fallback):";
                     questionsToReturn = [parsedFallback];
                } else {
                     commentary = `Tentei criar a questão, mas houve um problema no formato final:\n\n${responseText}`;
                     questionsToReturn = [];
                }
            }
            // Se ambos nulos, o erro já foi tratado
            break;

        case 'CONVERSAR':
            commentary = responseText; // Já validado que existe
            questionsToReturn = [];
            break;

        case 'DESCONHECIDO':
        default:
             if (!commentary) { // Usa fallback se não houver msg de erro anterior
                  commentary = "Não entendi bem. Voce pode pedir que eu busque ou crie questões do PAVE.";
             }
            questionsToReturn = [];
            break;
    }

    // --- Retornar Resposta Final ---
    console.log(`[LOG] ${functionName}: Retornando final. Comentário: ${commentary ? 'Sim' : 'Não'}, Questões: ${questionsToReturn.length}`);
    return new Response(JSON.stringify({ commentary: commentary, questions: questionsToReturn }), {
      headers: { 'Content-Type': 'application/json' }, status: 200
    });

  } catch (error) {
      console.error(`[ERRO] ${functionName}: Erro GERAL:`, error);
      return new Response(JSON.stringify({ error: `Erro interno: ${error.message}` }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
  }
}

// Handler genérico
export async function onRequest(context) {
    if (context.request.method === 'POST') {
        return await onRequestPost(context);
    }
    return new Response(`Método ${context.request.method} não permitido.`, { status: 405, headers: { 'Allow': 'POST' } });
}
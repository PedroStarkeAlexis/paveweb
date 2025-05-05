// /functions/api/ask.js
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// --- IMPORTAR FUNÇÕES DOS OUTROS ARQUIVOS ---
import { createAnalysisPrompt } from './prompt'; // Importa do arquivo prompt.js
import { findQuestionsByEntities, parseAiGeneratedQuestion } from './filter'; // Importa do arquivo filter.js

// --- Handler Principal ---
export async function onRequestPost(context) {
  const functionName = "/api/ask (v3 - modular)";
  console.log(`[LOG] ${functionName}: Iniciando POST request`);
  try {
    const { request, env } = context;
    const geminiApiKey = env.GEMINI_API_KEY;
    const r2Bucket = env.QUESTOES_PAVE_BUCKET;
    const modelName = env.MODEL_NAME || "gemini-1.5-flash-latest";

    // Validações
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
    console.log(`[LOG] ${functionName}: Última query: "${userQuery}"`);

    // --- Criar o Prompt usando a função importada ---
    const analysisPrompt = createAnalysisPrompt(history, userQuery);

    // --- Chamada Única à IA ---
    console.log(`[LOG] ${functionName}: Enviando prompt de ANÁLISE para Gemini.`);
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const safetySettings = [
         { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
         { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
         { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
         { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];

    let aiResponseText = "";
    try {
        const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: analysisPrompt }] }], safetySettings });
        const response = result.response;
        if (!response) { throw new Error("Resposta da API Gemini inválida."); }
        if (response.promptFeedback?.blockReason) { throw new Error(`Conteúdo bloqueado: ${response.promptFeedback.blockReason}`); }
        aiResponseText = response.text() || "";
        if (!aiResponseText) { throw new Error("A IA retornou uma string vazia."); }
    } catch(error) {
         console.error(`[ERRO] ${functionName}: Falha na chamada da API Gemini:`, error);
         return new Response(JSON.stringify({ error: `Erro ao comunicar com a IA: ${error.message}` }), { status: 503 });
    }

    // --- Processar Resposta JSON da IA ---
    let intent = 'DESCONHECIDO';
    let entities = null;
    let responseText = null;
    let commentary = "";
    let questionsToReturn = [];

    try {
        console.log(`[LOG] ${functionName}: Tentando parsear resposta da IA: ${aiResponseText.substring(0,100)}...`);
        const cleanedJsonString = aiResponseText.replace(/^```json\s*|```$/g, '').trim();
        const aiAnalysis = JSON.parse(cleanedJsonString);
        intent = aiAnalysis?.intent || 'DESCONHECIDO';
        entities = aiAnalysis?.entities || null;
        responseText = aiAnalysis?.responseText || null;
        console.log(`[LOG] ${functionName}: IA retornou - Intent: ${intent}, Entities: ${JSON.stringify(entities)}, ResponseText: ${responseText ? 'Sim' : 'Não'}`);
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
                if (r2Object === null) {
                    commentary = "Desculpe, não consegui acessar o banco de questões.";
                } else {
                    const allQuestionsData = await r2Object.json();
                    if (Array.isArray(allQuestionsData)) {
                        // Chama a função importada para filtrar
                        const foundQuestions = findQuestionsByEntities(entities, allQuestionsData);
                        if (foundQuestions.length > 0) {
                            commentary = `Encontrei ${foundQuestions.length > 1 ? 'esta questão' : 'esta questão'} sobre o que você pediu:`; // Ajusta comentário
                            questionsToReturn = [foundQuestions[0]]; // Limita a 1
                        } else {
                            const searchDesc = entities ? `matéria ${entities.materia || '?'} e tópico ${entities.topico || '?'}` : 'sua busca';
                            commentary = `Procurei por questões sobre ${searchDesc}, mas não encontrei. Tente de novo ou peça para criar uma!`;
                        }
                    } else { commentary = "O banco de questões parece estar em formato incorreto."; }
                }
            } catch (r2Error) {
                console.error(`[ERRO] ${functionName}: Falha R2:`, r2Error);
                commentary = "Erro ao acessar o banco de questões.";
            }
            break;

        case 'CRIAR_QUESTAO':
            if (responseText) {
                 // Chama a função importada para parsear
                const parsedQuestion = parseAiGeneratedQuestion(responseText);
                if (parsedQuestion) {
                    const matchIntro = responseText.match(/^([\s\S]*?)(?=\n\s*Matéria:|\n\s*Tópico:|\n\s*Enunciado:)/im);
                    commentary = matchIntro?.[1]?.trim() || "Certo, elaborei esta questão:";
                    questionsToReturn = [parsedQuestion];
                } else {
                    console.warn(`[WARN] ${functionName}: Falha ao parsear questão criada.`);
                    commentary = `Tentei criar a questão, mas o formato não ficou perfeito. Veja:\n\n${responseText}`;
                    questionsToReturn = [];
                }
            } else {
                commentary = "Pedi para a IA criar uma questão, mas não recebi o texto.";
                questionsToReturn = [];
            }
            break;

        case 'CONVERSAR':
            commentary = responseText || "Entendido.";
            questionsToReturn = [];
            break;

        case 'DESCONHECIDO':
        default:
             if (!commentary) { // Usa comentário do erro de parse se houver
                  commentary = "Desculpe, não entendi. Peça para buscar ou criar questões do PAVE.";
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
      console.error(`[ERRO] ${functionName}: Erro GERAL CAPTURADO:`, error);
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
    return new Response(`Método ${context.request.method} não permitido. Use POST.`, { status: 405, headers: { 'Allow': 'POST' } });
}
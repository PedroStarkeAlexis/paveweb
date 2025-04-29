// functions/api/ask.js
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// --- Funções Auxiliares ---
// ... (removeAccents, stopWords, filtrarQuestoes como antes) ...

// --- Handler Principal Refatorado ---
export async function onRequestPost(context) {
  const functionName = "/api/ask";
  console.log(`[LOG] ${functionName}: Iniciando POST request`);
  try {
    const { request, env } = context;
    const geminiApiKey = env.GEMINI_API_KEY;
    const r2Bucket = env.QUESTOES_PAVE_BUCKET;
    // --- MODIFICAÇÃO: Ler nome do modelo do ambiente ---
    const modelName = env.MODEL_NAME || "gemini-2.0-flash"; // Usa variável ou fallback
    // --- FIM DA MODIFICAÇÃO ---

    // Validações
    if (!r2Bucket) { throw new Error('Configuração interna incompleta (R2).'); }
    if (!geminiApiKey) { throw new Error('Configuração interna incompleta (API Key).'); }
    console.log(`[LOG] ${functionName}: Bindings e API Key OK. Usando modelo: ${modelName}`); // Loga o modelo usado

    // Obter corpo e histórico
    // ... (código para obter history e userQuery como antes) ...
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
    // ... (código para ler R2 e chamar filtrarQuestoes como antes) ...
     let allQuestionsData = [];
     let questoesRelevantes = [];
     let contextForAI = "Nenhum contexto específico sobre questões do PAVE foi carregado.";
     try {
         const r2Object = await r2Bucket.get('questoes.json');
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
     console.log(`[LOG] ${functionName}: ${questoesRelevantes.length} questões relevantes encontradas pela filtragem.`);


    // Configuração da API Gemini (SDK)
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    // --- MODIFICAÇÃO: Usar a variável modelName ---
    const model = genAI.getGenerativeModel({
        model: modelName // Usa o nome lido do ambiente ou o fallback
    });
    // --- FIM DA MODIFICAÇÃO ---

    // Definir safetySettings
    const safetySettings = [ /* ... seus safety settings ... */ ];

    // Adicionar instrução final ao histórico
    // ... (código para adicionar systemInstruction como antes) ...
     const systemInstruction = `\n\n[Instrução INTERNA...]`; // Instrução completa aqui
     const historyForGemini = [...history];
     if (historyForGemini.length > 0 && historyForGemini[history.length - 1].parts?.length > 0) {
         const lastPartIndex = historyForGemini[history.length - 1].parts.length -1;
         historyForGemini[history.length - 1].parts[lastPartIndex].text += systemInstruction;
     }


    console.log(`[LOG] ${functionName}: Enviando histórico para Gemini.`);
    let aiResponseText = "";
    let shouldShowQuestions = false;

    try { // Chamada Gemini
        // --- MODIFICAÇÃO: Passar safetySettings aqui ---
        const result = await model.generateContent({
            contents: historyForGemini,
            safetySettings // Passa as configurações aqui
        });
        // --- FIM DA MODIFICAÇÃO ---

        const response = result.response;
        aiResponseText = response.text() || "";

        // ... (lógica para verificar [SHOW_QUESTIONS] e tratar resposta bloqueada/vazia como antes) ...
         if (!aiResponseText && response.promptFeedback?.blockReason) { aiResponseText = `(Bloqueado: ${response.promptFeedback.blockReason})`; }
         const signalTag = "[SHOW_QUESTIONS]";
         if (aiResponseText.trim().endsWith(signalTag)) {
             shouldShowQuestions = true;
             aiResponseText = aiResponseText.slice(0, aiResponseText.lastIndexOf(signalTag)).trim();
             console.log(`[LOG] ${functionName}: Tag [SHOW_QUESTIONS] detectada.`);
         } else { console.log(`[LOG] ${functionName}: Tag [SHOW_QUESTIONS] NÃO detectada.`); }
         if (!aiResponseText.trim() && shouldShowQuestions) { aiResponseText = "Ok, aqui estão as questões que encontrei:"; }
         else if (!aiResponseText.trim() && !shouldShowQuestions) { aiResponseText = "(Não consegui gerar uma resposta completa.)"; }


    } catch (error) {
        console.error(`[ERRO] ${functionName}: Erro ao chamar Gemini SDK:`, error);
        aiResponseText = `(Desculpe, erro ao contatar a IA: ${error.message})`;
    }

    // Prepara Dados para Frontend
    // ... (lógica para preparar questionsToReturn como antes) ...
     let questionsToReturn = [];
     if (shouldShowQuestions && Array.isArray(questoesRelevantes) && questoesRelevantes.length > 0) {
         const MAX_QUESTIONS_TO_SHOW = 3;
         questionsToReturn = questoesRelevantes.slice(0, MAX_QUESTIONS_TO_SHOW).map(q => ({ /* ... mapeamento ... */ }));
     } else if (shouldShowQuestions && (!Array.isArray(questoesRelevantes) || questoesRelevantes.length === 0)) {
         aiResponseText = `Puxa, você pediu questões sobre "${userQuery}", mas não encontrei exemplos relevantes nos meus dados atuais.`;
         shouldShowQuestions = false; questionsToReturn = [];
     }


    // Retornar Resposta Estruturada
    console.log(`[LOG] ${functionName}: Retornando resposta final.`);
    return new Response(JSON.stringify({ commentary: aiResponseText, questions: questionsToReturn }), {
      headers: { 'Content-Type': 'application/json' }, status: 200
    });

  } catch (error) { /* ... Catch geral ... */ }
}

// Handler genérico para outros métodos
export async function onRequest(context) { /* ... como antes ... */ }
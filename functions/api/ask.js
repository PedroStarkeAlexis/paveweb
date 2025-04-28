// functions/api/ask.js

// --- Funções Auxiliares (Manter as mesmas: removeAccents, stopWords, filtrarQuestoes) ---
function removeAccents(str) { /* ... código ... */ }
const stopWords = new Set([ /* ... lista ... */ ]);
function filtrarQuestoes(questoes, query) { /* ... código ... */ }

// --- Handler Principal (Modificado) ---
export async function onRequestPost(context) {
  try {
    // -- Variáveis de Ambiente/Segredos e Bindings --
    const { request, env } = context;
    const geminiApiKey = env.GEMINI_API_KEY;
    const r2Bucket = env.QUESTOES_PAVE_BUCKET;

    // Validações essenciais
    if (!r2Bucket) {
      console.error("[ERRO] Binding R2 'QUESTOES_PAVE_BUCKET' não configurado!");
      return new Response(JSON.stringify({ error: 'Configuração interna incompleta (R2).' }), { status: 500, headers: { 'Content-Type': 'application/json' }});
    }

    // -- Obter Corpo da Requisição --
    let requestData;
    try {
      requestData = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Corpo da requisição inválido (não é JSON).' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
    }

    const userQuery = requestData?.query?.trim();
    const wantsAllQuestions = requestData?.getAll === true; // <<< Verifica se quer todas as questões

    // --- LÓGICA PARA DEVOLVER TODAS AS QUESTÕES ---
    if (wantsAllQuestions) {
        console.log("[LOG] Requisição para buscar todas as questões recebida.");
        const r2Object = await r2Bucket.get('questoes.json');
        if (r2Object === null) {
            console.error("[ERRO] getAll: questoes.json não encontrado no R2.");
            return new Response(JSON.stringify({ error: 'Base de dados não encontrada.' }), { status: 404, headers: { 'Content-Type': 'application/json' }});
        }
        console.log("[LOG] getAll: Retornando todas as questões do R2.");
        // Retorna APENAS a lista de questões, sem commentary
        // Precisamos ler e parsear aqui para enviar como um array JSON válido na resposta
        const allQuestions = await r2Object.json();
        return new Response(JSON.stringify({ commentary: null, questions: allQuestions }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
        });
    }
    // --- FIM DA LÓGICA PARA DEVOLVER TODAS ---

    // --- LÓGICA ORIGINAL DO CHAT (se !wantsAllQuestions) ---
    if (!userQuery) {
      return new Response(JSON.stringify({ error: 'Nenhuma pergunta fornecida para o chat.' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
    }
    if (!geminiApiKey) {
        console.error("[ERRO] GEMINI_API_KEY não configurada!");
        return new Response(JSON.stringify({ error: 'Configuração interna incompleta (API Key).' }), { status: 500, headers: { 'Content-Type': 'application/json' }});
    }

    console.log(`[LOG] Chat: Recebida pergunta: "${userQuery}"`);

    // Carrega questões do R2 para filtrar (poderia otimizar com cache se necessário)
    const r2Object = await r2Bucket.get('questoes.json');
     if (r2Object === null) {
         console.error("[ERRO] Chat: questoes.json não encontrado no R2.");
         return new Response(JSON.stringify({ commentary: 'Desculpe, não consegui acessar a base de questões agora.', questions: [] }), { status: 500, headers: { 'Content-Type': 'application/json' }});
     }
    const questoes = await r2Object.json();

    // Filtra questões relevantes para o chat
    const questoesRelevantes = filtrarQuestoes(questoes, userQuery);
    console.log(`[LOG] Chat: Encontradas ${questoesRelevantes.length} questões relevantes.`);

    const MAX_CONTEXT_QUESTOES = 3;
    const questoesParaFrontend = questoesRelevantes
        .slice(0, MAX_CONTEXT_QUESTOES)
        .map(q => ({ /* ... mapeamento correto incluindo referencia ... */
            ano: q.ano, etapa: q.etapa, materia: q.materia, topico: q.topico,
            texto_questao: q.texto_questao, referencia: q.referencia,
            alternativas: q.alternativas, resposta_letra: q.resposta_letra
        }));

    // Chama Gemini API para comentário (lógica original)
    let botCommentary = "";
    let prompt = "";
    const safetySettings = [ /* ... seus safety settings ... */ ];
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`;

    if (questoesParaFrontend.length > 0) {
        const topicosEncontrados = [...new Set(questoesParaFrontend.map(q => q.topico || q.materia))].join(', ');
        prompt = `(Prompt para gerar comentário baseado em questões encontradas...)`; // Seu prompt original
        console.log("[LOG] Chat: Enviando para Gemini (com contexto)");
    } else {
        prompt = `(Prompt para gerar resposta sem contexto...)`; // Seu prompt original
        console.log("[LOG] Chat: Enviando para Gemini (sem contexto)");
    }

    try { // Bloco try/catch para chamada Gemini
        const geminiResponse = await fetch(geminiApiUrl, { /* ... opções fetch ... */ });
        // ... (lógica original para extrair botCommentary do geminiData) ...
         if (!geminiResponse.ok) throw new Error(`Erro API Gemini ${geminiResponse.status}`);
         const geminiData = await geminiResponse.json();
         botCommentary = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
         // ... (tratamento adicional de erros/fallback) ...

    } catch (error) {
        console.error('[ERRO] Chat: Erro ao chamar Gemini API:', error);
        botCommentary = questoesParaFrontend.length > 0 ? "(Erro ao gerar comentário)" : "(Erro ao gerar resposta)";
    }

    // Retorna resposta estruturada para o CHAT
    console.log(`[LOG] Chat: Retornando comentário e ${questoesParaFrontend.length} questões.`);
    return new Response(JSON.stringify({ commentary: botCommentary, questions: questoesParaFrontend }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    // Erro geral não capturado antes
    console.error('[ERRO] Erro GERAL na função /api/ask:', error);
    return new Response(JSON.stringify({ error: `Erro interno: ${error.message}` }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Handler genérico para outros métodos (como GET para /api/ask)
export async function onRequest(context) {
    console.log(`[WARN] Recebido request ${context.request.method} para /api/ask.`);
    if (context.request.method === 'POST') {
        return await onRequestPost(context);
    }
    return new Response(`Método ${context.request.method} não permitido para /api/ask. Use POST.`, { status: 405 });
}
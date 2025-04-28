// functions/api/ask.js

// --- Funções Auxiliares (Manter as mesmas: removeAccents, stopWords, filtrarQuestoes) ---
function removeAccents(str) {
  if (typeof str !== 'string') return '';
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
const stopWords = new Set([ /* ... sua lista de stop words ... */ ]);

function filtrarQuestoes(questoes, query) {
  // ADICIONADO: Garante que questoes seja um array antes de filtrar
  if (!Array.isArray(questoes)) {
      console.warn("[WARN] filtrarQuestoes recebeu 'questoes' que não é um array. Retornando [].", typeof questoes);
      return [];
  }

  const queryNormalized = removeAccents(query.toLowerCase());
  const palavrasChave = queryNormalized
      .replace(/[^\w\s]/gi, '')
      .split(/\s+/)
      .filter(p => p.length > 1 && !stopWords.has(p));

  // console.log("Worker: Palavras-chave extraídas:", palavrasChave);

  if (!palavrasChave.length) {
       return [];
  }

  const resultadosComPontuacao = questoes.map(q => {
      // Combina textos para busca... (lógica anterior)
      const ano = (q?.ano || '').toString(); // Adicionado optional chaining em q
      const etapa = (q?.etapa || '').toString();
      const materia = removeAccents((q?.materia || '').toLowerCase());
      const topico = removeAccents((q?.topico || '').toLowerCase());
      const textoQuestao = removeAccents((q?.texto_questao || '').toLowerCase());
      const textoCompletoQuestao = `pave ${ano} etapa ${etapa} ${materia} ${topico} ${textoQuestao}`;
      let score = 0;
      let match = false;
      palavrasChave.forEach(palavra => {
          if (textoCompletoQuestao.includes(palavra)) {
              score++;
              match = true;
          }
      });
      return { questao: q, score: score, match: match };
  })
  .filter(item => item.match)
  .sort((a, b) => b.score - a.score);

  return resultadosComPontuacao.map(item => item.questao);
}

// --- Handler Principal (Mais Robusto) ---
export async function onRequestPost(context) {
  const functionName = "/api/ask"; // Para logs
  console.log(`[LOG] ${functionName}: Iniciando POST request`);
  try {
    const { request, env } = context;
    const geminiApiKey = env.GEMINI_API_KEY;
    const r2Bucket = env.QUESTOES_PAVE_BUCKET;

    // Validação de Binding R2
    if (!r2Bucket) {
      console.error(`[ERRO] ${functionName}: Binding R2 'QUESTOES_PAVE_BUCKET' não configurado!`);
      throw new Error('Configuração interna incompleta (R2).'); // Lança erro para o catch geral
    }
    console.log(`[LOG] ${functionName}: Binding R2 encontrado.`);

    // Validação do Corpo da Requisição
    let requestData;
    try {
      requestData = await request.json();
    } catch (e) {
      console.warn(`[WARN] ${functionName}: Corpo da requisição inválido (não JSON).`);
      return new Response(JSON.stringify({ error: 'Corpo da requisição inválido.' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
    }

    const userQuery = requestData?.query?.trim();
    const wantsAllQuestions = requestData?.getAll === true;

    // --- Lógica para Devolver Todas as Questões ---
    if (wantsAllQuestions) {
      console.log(`[LOG] ${functionName}: Requisição para buscar todas as questões.`);
      const r2Object = await r2Bucket.get('questoes.json');
      if (r2Object === null) {
        console.error(`[ERRO] ${functionName} (getAll): questoes.json não encontrado no R2.`);
        throw new Error('Base de dados não encontrada.');
      }
      console.log(`[LOG] ${functionName} (getAll): Retornando todas as questões do R2.`);
      const allQuestions = await r2Object.json(); // Assume que o JSON é válido aqui

      // ADICIONADO: Validação se o parse funcionou
      if (!Array.isArray(allQuestions)) {
          console.error(`[ERRO] ${functionName} (getAll): Conteúdo do R2 não é um array JSON válido.`);
          throw new Error('Formato inválido da base de dados.');
      }

      return new Response(JSON.stringify({ commentary: null, questions: allQuestions }), {
        headers: { 'Content-Type': 'application/json' }, status: 200
      });
    }
    // --- FIM DA LÓGICA PARA DEVOLVER TODAS ---

    // --- LÓGICA ORIGINAL DO CHAT (se !wantsAllQuestions) ---
    if (!userQuery) {
      console.warn(`[WARN] ${functionName}: Nenhuma query fornecida para o chat.`);
      return new Response(JSON.stringify({ error: 'Nenhuma pergunta fornecida.' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
    }
    // Validação da API Key apenas se for usar o Gemini
    if (!geminiApiKey) {
        console.error(`[ERRO] ${functionName}: GEMINI_API_KEY não configurada!`);
        throw new Error('Configuração interna incompleta (API Key).');
    }

    console.log(`[LOG] ${functionName} (Chat): Recebida pergunta: "${userQuery}"`);

    // Carrega questões do R2
    const r2ObjectChat = await r2Bucket.get('questoes.json');
    if (r2ObjectChat === null) {
        console.error(`[ERRO] ${functionName} (Chat): questoes.json não encontrado no R2.`);
        throw new Error('Não foi possível acessar a base de questões.');
    }
    let questoes;
    try {
        questoes = await r2ObjectChat.json();
        // ADICIONADO: Validação crucial
        if (!Array.isArray(questoes)) {
            console.error(`[ERRO] ${functionName} (Chat): Conteúdo do R2 não é um array JSON válido.`);
            throw new Error('Formato inválido da base de dados.');
        }
    } catch (e) {
        console.error(`[ERRO] ${functionName} (Chat): Falha ao parsear JSON do R2:`, e);
        throw new Error('Erro ao ler a base de dados.');
    }

    // Filtra questões
    const questoesRelevantes = filtrarQuestoes(questoes, userQuery);
    // ADICIONADO: Verificação (embora filtrarQuestoes já deva retornar array)
    if (!Array.isArray(questoesRelevantes)) {
        console.error(`[ERRO] ${functionName} (Chat): filtrarQuestoes não retornou um array!`);
        throw new Error('Erro interno ao processar questões.');
    }
    console.log(`[LOG] ${functionName} (Chat): Encontradas ${questoesRelevantes.length} questões relevantes.`);

    // Mapeia para frontend
    const MAX_CONTEXT_QUESTOES = 3;
    const questoesParaFrontend = questoesRelevantes
        .slice(0, MAX_CONTEXT_QUESTOES)
        .map(q => ({ /* ... mapeamento correto ... */
            ano: q?.ano, etapa: q?.etapa, materia: q?.materia, topico: q?.topico,
            texto_questao: q?.texto_questao, referencia: q?.referencia,
            alternativas: q?.alternativas, resposta_letra: q?.resposta_letra
        }));

    // Chama Gemini API
    let botCommentary = "";
    let prompt = "";
    const safetySettings = [ /* ... */ ];
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`;

    if (questoesParaFrontend.length > 0) {
        const topicosEncontrados = [...new Set(questoesParaFrontend.map(q => q?.topico || q?.materia))].filter(Boolean).join(', '); // Filtra null/undefined
        prompt = `(Prompt para gerar comentário...)`; // Seu prompt aqui
        console.log(`[LOG] ${functionName} (Chat): Enviando para Gemini (com contexto)`);
    } else {
        prompt = `(Prompt para gerar resposta sem contexto...)`; // Seu prompt aqui
        console.log(`[LOG] ${functionName} (Chat): Enviando para Gemini (sem contexto)`);
    }

    try {
        const geminiResponse = await fetch(geminiApiUrl, { /* ... opções fetch ... */ });
        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error(`[ERRO] ${functionName} (Chat): Erro da API Gemini: ${geminiResponse.status}`, errorText);
            throw new Error(`Erro da API de IA (${geminiResponse.status})`);
        }
        const geminiData = await geminiResponse.json();
        botCommentary = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (!botCommentary && geminiData.candidates?.[0]?.finishReason && geminiData.candidates[0].finishReason !== 'STOP') {
           botCommentary = `(Resposta da IA filtrada: ${geminiData.candidates[0].finishReason})`;
           console.warn(`[WARN] ${functionName} (Chat): Geração Gemini interrompida:`, geminiData.candidates[0].finishReason);
        } else if (!botCommentary) {
           botCommentary = ""; // Deixa vazio se não veio nada útil
           console.warn(`[WARN] ${functionName} (Chat): Resposta Gemini sem texto útil.`);
        }
    } catch (error) {
        console.error(`[ERRO] ${functionName} (Chat): Erro ao chamar Gemini API:`, error);
        // Não joga erro aqui, apenas define comentário como vazio ou de erro
        botCommentary = "(Desculpe, não consegui gerar um comentário no momento.)";
    }

    // Define resposta padrão se não houver comentário E não houver questões
    if (!botCommentary && questoesParaFrontend.length === 0) {
        botCommentary = "Não encontrei informações relevantes para sua busca nos dados atuais.";
    }

    // Retorna resposta estruturada para o CHAT
    console.log(`[LOG] ${functionName} (Chat): Retornando comentário e ${questoesParaFrontend.length} questões.`);
    return new Response(JSON.stringify({ commentary: botCommentary, questions: questoesParaFrontend }), {
      headers: { 'Content-Type': 'application/json' }, status: 200
    });

  } catch (error) {
    // Catch geral para erros lançados dentro do try principal
    console.error(`[ERRO] ${functionName}: Erro GERAL CAPTURADO:`, error);
    // Retorna a mensagem do erro capturado para o frontend
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
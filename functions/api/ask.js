// Funções auxiliares (copiadas do server.js original)
function removeAccents(str) {
    if (typeof str !== 'string') return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  
  const stopWords = new Set([
    'de', 'a', 'o', /* ... resto das stop words ... */ 'prova', 'vestibular'
  ]);
  
  function filtrarQuestoes(questoes, query) {
    const queryNormalized = removeAccents(query.toLowerCase());
    const palavrasChave = queryNormalized
        .replace(/[^\w\s]/gi, '')
        .split(/\s+/)
        .filter(p => p.length > 1 && !stopWords.has(p));
  
    //console.log("Worker: Palavras-chave extraídas:", palavrasChave);
  
    if (!palavrasChave.length) {
         return [];
    }
  
    const resultadosComPontuacao = (questoes || []).map(q => {
        const ano = (q.ano || '').toString();
        const etapa = (q.etapa || '').toString();
        const materia = removeAccents((q.materia || '').toLowerCase());
        const topico = removeAccents((q.topico || '').toLowerCase());
        const textoQuestao = removeAccents((q.texto_questao || '').toLowerCase());
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
  
  // Handler da Pages Function para POST requests em /api/ask
  export async function onRequestPost(context) {
    try {
      // -- Variáveis de Ambiente/Segredos e Bindings --
      // context.env contém bindings (R2) e secrets (API Key)
      const { request, env } = context;
      const geminiApiKey = env.GEMINI_API_KEY; // Obtido do secret
      const r2Bucket = env.QUESTOES_PAVE_BUCKET; // Nome do Binding R2 (definiremos no deploy)
  
      if (!geminiApiKey) {
          throw new Error("GEMINI_API_KEY não configurada nas variáveis de ambiente.");
      }
      if (!r2Bucket) {
           throw new Error("Binding do R2 (QUESTOES_PAVE_BUCKET) não configurado.");
      }
  
      // -- Obter Query do Usuário --
      let userQuery = '';
      try {
          const body = await request.json();
          userQuery = body?.query?.trim();
      } catch (e) {
          return new Response(JSON.stringify({ error: 'Corpo da requisição inválido.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
  
  
      if (!userQuery) {
        return new Response(JSON.stringify({ error: 'Nenhuma pergunta fornecida.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
  
      console.log(`Worker: Recebida pergunta: "${userQuery}"`);
  
      // -- Buscar e Carregar Questões do R2 --
      const r2Object = await r2Bucket.get('questoes.json');
      if (r2Object === null) {
           throw new Error('Arquivo questoes.json não encontrado no bucket R2.');
      }
      const questoes = await r2Object.json();
      //console.log(`Worker: Carregadas ${questoes.length} questões do R2.`);
  
      // -- Filtrar Questões --
      const questoesRelevantes = filtrarQuestoes(questoes, userQuery);
      console.log(`Worker: Encontradas ${questoesRelevantes.length} questões relevantes.`);
  
      const MAX_CONTEXT_QUESTOES = 3;
      const questoesParaFrontend = questoesRelevantes
          .slice(0, MAX_CONTEXT_QUESTOES)
          .map(q => ({ // Mapeia os campos corretos, incluindo referencia
              ano: q.ano,
              etapa: q.etapa,
              materia: q.materia,
              topico: q.topico,
              texto_questao: q.texto_questao,
              referencia: q.referencia,
              alternativas: q.alternativas,
              resposta_letra: q.resposta_letra
          }));
  
      // -- Chamar Gemini API para Comentário --
      let botCommentary = "";
      let prompt = "";
      const safetySettings = [ /* ... seus safety settings ... */ ];
      const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`;
  
       if (questoesParaFrontend.length > 0) {
          const topicosEncontrados = [...new Set(questoesParaFrontend.map(q => q.topico || q.materia))].join(', ');
          prompt = `Você é um assistente amigável para o PAVE. O usuário perguntou: "${userQuery}". Foram encontradas ${questoesParaFrontend.length} questão(ões) sobre "${topicosEncontrados || 'tópicos relacionados'}". Gere um breve comentário introdutório sobre a(s) questão(ões) ou tópico. NÃO liste as questões. Exemplo: "Legal! Encontrei questões sobre ${topicosEncontrados}:"`;
           console.log("Worker: Enviando para Gemini (pedindo só comentário)");
       } else {
          prompt = `Você é um assistente amigável para o PAVE. O usuário perguntou: "${userQuery}", mas a busca não retornou resultados. Responda conversacionalmente. Se for um cumprimento, responda. Se buscou questões, diga que não achou sobre o tema e sugira reformular. NÃO use a frase exata "Não encontrei informações...".`;
           console.log("Worker: Enviando para Gemini (sem contexto relevante)");
       }
  
       try {
           const geminiResponse = await fetch(geminiApiUrl, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                   contents: [{ role: "user", parts: [{ text: prompt }] }],
                   //generationConfig: { temperature: 0.7 }, // Opcional
                   safetySettings,
               }),
           });
  
           if (!geminiResponse.ok) {
               const errorText = await geminiResponse.text();
               console.error("Worker: Erro da API Gemini:", geminiResponse.status, errorText);
               throw new Error(`Erro da API Gemini: ${geminiResponse.status}`);
           }
  
           const geminiData = await geminiResponse.json();
  
           // Extração mais segura da resposta
           botCommentary = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
           if (!botCommentary && geminiData.candidates?.[0]?.finishReason && geminiData.candidates[0].finishReason !== 'STOP') {
              botCommentary = `(Resposta da IA filtrada ou incompleta: ${geminiData.candidates[0].finishReason})`;
              console.warn("Worker: Geração Gemini interrompida:", geminiData.candidates[0].finishReason);
           } else if (!botCommentary) {
               botCommentary = questoesParaFrontend.length > 0 ? "Aqui estão as questões que encontrei:" : "Não consegui gerar um comentário no momento.";
               console.warn("Worker: Resposta Gemini sem texto útil.");
           }
  
       } catch (error) {
           console.error('Worker: Erro ao chamar Gemini API:', error);
           // Define um comentário padrão em caso de erro na API
           botCommentary = questoesParaFrontend.length > 0 ? "Tive um problema ao gerar o comentário, mas aqui estão as questões:" : "Desculpe, não consegui processar sua pergunta agora.";
       }
  
      // -- Retornar Resposta Estruturada --
      const responseData = {
          commentary: botCommentary,
          questions: questoesParaFrontend
      };
  
      return new Response(JSON.stringify(responseData), {
        headers: { 'Content-Type': 'application/json' },
      });
  
    } catch (error) {
      console.error('Worker: Erro GERAL:', error);
      return new Response(JSON.stringify({ commentary: `Erro interno no servidor: ${error.message}`, questions: [] }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
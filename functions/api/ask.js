// functions/api/ask.js
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// --- Funções Auxiliares ---
function removeAccents(str) {
  if (typeof str !== 'string') return '';
  try { return str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
  catch (e) { console.warn("Erro em removeAccents:", e, "Input:", str); return str || ''; }
}
const stopWords = new Set(['de', 'a', 'o', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'à', 'seu', 'sua', 'ou', 'ser', 'quando', 'muito', 'há', 'nos', 'já', 'está', 'eu', 'também', 'só', 'pelo', 'pela', 'até', 'isso', 'ela', 'entre', 'era', 'depois', 'sem', 'mesmo', 'aos', 'ter', 'seus', 'quem', 'nas', 'me', 'esse', 'eles', 'estão', 'você', 'tinha', 'foram', 'essa', 'num', 'nem', 'suas', 'meu', 'às', 'minha', 'têm', 'numa', 'pelos', 'elas', 'havia', 'seja', 'qual', 'será', 'nós', 'tenho', 'lhe', 'deles', 'essas', 'esses', 'pelas', 'este', 'fosse', 'dele', 'tu', 'te', 'vocês', 'vos', 'lhes', 'meus', 'minhas', 'teu', 'tua', 'teus', 'tuas', 'nosso', 'nossa', 'nossos', 'nossas', 'dela', 'delas', 'esta', 'estes', 'estas', 'aquele', 'aquela', 'aqueles', 'aquelas', 'isto', 'aquilo', 'estou', 'está', 'estamos', 'estão', 'estive', 'esteve', 'estivemos', 'estiveram', 'estava', 'estávamos', 'estavam', 'estivera', 'estivéramos', 'esteja', 'estejamos', 'estejam', 'estivesse', 'estivéssemos', 'estivessem', 'estiver', 'estivermos', 'estiverem', 'hei', 'há', 'havemos', 'hão', 'houve', 'houvemos', 'houveram', 'houvera', 'houvéramos', 'haja', 'hajamos', 'hajam', 'houvesse', 'houvéssemos', 'houvessem', 'houver', 'houvermos', 'houverem', 'houverei', 'houverá', 'houveremos', 'houverão', 'houveria', 'houveríamos', 'houveriam', 'sou', 'somos', 'são', 'era', 'éramos', 'eram', 'fui', 'foi', 'fomos', 'foram', 'fora', 'fôramos', 'seja', 'sejamos', 'sejam', 'fosse', 'fôssemos', 'fossem', 'for', 'formos', 'forem', 'serei', 'será', 'seremos', 'serão', 'seria', 'seríamos', 'seriam', 'tenho', 'tem', 'temos', 'tém', 'tinha', 'tínhamos', 'tinham', 'tive', 'teve', 'tivemos', 'tiveram', 'tivera', 'tivéramos', 'tenha', 'tenhamos', 'tenham', 'tivesse', 'tivéssemos', 'tivessem', 'tiver', 'tivermos', 'tiverem', 'terei', 'terá', 'teremos', 'terão', 'teria', 'teríamos', 'teriam', 'me', 'manda', 'envia', 'lista', 'mostre', 'fala', 'diz', 'ai', 'alguma', 'algum', 'coisa', 'sobre', 'dos', 'das', 'então', 'favor', 'poderia', 'gostaria', 'saber', 'se', 'tipo', 'exemplo', 'exercicio', 'exercicios', 'prova', 'vestibular', 'ano', 'materia']);
function filtrarQuestoes(questoes, query) {
    if (!Array.isArray(questoes)) { console.warn("[WARN] filtrarQuestoes: 'questoes' não é array."); return []; }
    if (typeof query !== 'string' || !query) { return []; }
    const queryNormalized = removeAccents(query.toLowerCase());
    if (!queryNormalized) { return []; }
    let palavrasChave = [];
    try { palavrasChave = queryNormalized.replace(/[^\w\s]/gi, '').split(/\s+/).filter(p => p && p.length > 1 && !stopWords.has(p)); }
    catch (e) { console.error("[ERRO] filtrarQuestoes: Erro ao processar palavras-chave:", e); return []; }
    if (palavrasChave.length === 0) { return []; }
    const resultadosComPontuacao = questoes.map(q => {
        if (!q || typeof q !== 'object') { console.warn("[WARN] filtrarQuestoes: Item inválido.", q); return { questao: q, score: 0, match: false }; }
        const ano = (q.ano || '').toString(); const etapa = (q.etapa || '').toString();
        const materia = removeAccents((q.materia || '').toLowerCase()); const topico = removeAccents((q.topico || '').toLowerCase());
        const textoQuestao = removeAccents((q.texto_questao || '').toLowerCase());
        const textoCompletoQuestao = `pave ${ano} etapa ${etapa} ${materia} ${topico} ${textoQuestao}`;
        let score = 0; let match = false;
        palavrasChave.forEach(palavra => {
            try { if (typeof textoCompletoQuestao === 'string' && textoCompletoQuestao.includes(palavra)) { score++; match = true; } }
            catch (e) { console.error("[ERRO] filtrarQuestoes: Erro no 'includes':", e); }
        });
        return { questao: q, score: score, match: match };
    }).filter(item => item.match).sort((a, b) => b.score - a.score);
    return resultadosComPontuacao.map(item => item.questao);
}

// --- NOVA FUNÇÃO: Tenta parsear texto da IA para formato de questão ---
function parseAiGeneratedQuestion(aiText) {
    console.log("[LOG] Tentando parsear texto da IA para questão...");
    if (typeof aiText !== 'string' || !aiText) return null;

    try {
        let enunciado = null;
        const alternativas = [];
        let respostaLetra = null;
        let textoProcessado = aiText; // Trabalha com uma cópia

        // Expressões Regulares (Ajustadas para mais flexibilidade)
        const enunciadoRegex = /^(?:Enunciado|Questão|Pergunta|Leia o texto a seguir)[:\s]*([\s\S]*?)(?=\n\s*[A-Ea-e][.)]\s*|\n\s*Alternativa\s*A)/im;
        const alternativaRegex = /^\s*([A-Ea-e])[.)]\s+([\s\S]*?)(?=\n\s*[A-Ea-e][.)]|\n\s*Resposta Correta|^\s*$)/gm; // Requer letra, ponto/parentesis opcional, ESPAÇO, depois o texto
        const respostaRegex = /(?:Resposta Correta|Gabarito|Correta)[:\s]*([A-Ea-e])(?:[.)\s]|$)/i;

        // Extrai Enunciado
        const enunciadoMatch = textoProcessado.match(enunciadoRegex);
        if (enunciadoMatch && enunciadoMatch[1]) {
            enunciado = enunciadoMatch[1].trim();
            // Remove a parte já processada do texto para facilitar a busca de alternativas
            textoProcessado = textoProcessado.substring(enunciadoMatch[0].length).trim();
        } else {
             // Fallback: Pega tudo até a primeira alternativa BEM FORMADA (Letra seguido de .) ou ))
             const firstAltIndex = textoProcessado.search(/^\s*[A-Ea-e][.)]\s+/m);
             if (firstAltIndex > 0) {
                 enunciado = textoProcessado.substring(0, firstAltIndex).trim();
                 textoProcessado = textoProcessado.substring(firstAltIndex); // Remove enunciado processado
             } else {
                 console.warn("[WARN] Parse: Não foi possível extrair enunciado claro.");
                 return null; // Sem enunciado, não monta
             }
        }
        // Limpeza adicional
        enunciado = enunciado.replace(/^(Enunciado|Questão|Pergunta)[:\s]*/i, '').trim();
        if (!enunciado) { console.warn("[WARN] Parse: Enunciado vazio após limpeza."); return null; }

        // Extrai Alternativas
        let match;
        while ((match = alternativaRegex.exec(textoProcessado)) !== null) {
            if (match.index === alternativaRegex.lastIndex) { alternativaRegex.lastIndex++; } // Evita loop infinito
            const letra = match[1]?.toUpperCase();
            const texto = match[2]?.trim();
            if (letra && texto) {
                alternativas.push({ letra: letra, texto: texto });
            }
        }

        if (alternativas.length < 2) { // Validação Mínima
             console.warn(`[WARN] Parse: Alternativas insuficientes (${alternativas.length}).`);
             return null;
        }

        // Extrai Resposta Correta (busca no texto original completo da IA)
        const respostaMatch = aiText.match(respostaRegex); // Usa aiText original
        if (respostaMatch && respostaMatch[1]) {
            respostaLetra = respostaMatch[1].toUpperCase();
            if (!alternativas.some(alt => alt.letra === respostaLetra)) {
                 console.warn(`[WARN] Parse: Resposta (${respostaLetra}) não encontrada nas alternativas.`);
                 respostaLetra = null; // Invalida
            }
        }

        if (!respostaLetra) {
             console.warn("[WARN] Parse: Resposta correta não encontrada ou inválida.");
             // Tenta um fallback: a última alternativa é a correta? (Pouco confiável)
             // respostaLetra = alternativas[alternativas.length - 1]?.letra;
             // if(!respostaLetra) return null; // Desiste se nem isso funcionar
             return null; // Mais seguro retornar null se não achar a resposta explícita
        }

        // Monta o objeto da questão gerada
        const generatedQuestion = {
            id: `gen-${Date.now()}`,
            ano: new Date().getFullYear(), etapa: null, materia: "Gerada pela IA", topico: "Gerado pela IA",
            texto_questao: enunciado,
            referencia: "Questão gerada por IA.",
            alternativas: alternativas,
            resposta_letra: respostaLetra
        };
        console.log("[LOG] Parse: Questão gerada parseada com sucesso.");
        return generatedQuestion;

    } catch (error) {
        console.error("[ERRO] Parse: Erro ao tentar parsear texto da IA:", error);
        return null;
    }
}


// --- Handler Principal ---
export async function onRequestPost(context) {
  const functionName = "/api/ask";
  console.log(`[LOG] ${functionName}: Iniciando POST request`);
  try {
    const { request, env } = context;
    const geminiApiKey = env.GEMINI_API_KEY;
    const r2Bucket = env.QUESTOES_PAVE_BUCKET;
    const modelName = env.MODEL_NAME || "gemini-1.5-flash-latest"; // Usa variável ou fallback

    // Validações
    if (!r2Bucket || !geminiApiKey) { throw new Error('Configuração interna incompleta.'); }
    console.log(`[LOG] ${functionName}: Configs OK. Modelo: ${modelName}`);

    // Obter corpo e histórico
    let requestData;
    try { 
        requestData = await request.json(); // Corrige a linha incompleta
        // Validação Mínima de Alternativas
        if (alternativas.length < 2) {
            console.warn("[WARN] Parse: Menos de 2 alternativas encontradas.");
            return null;
        }
    } catch (error) {
        console.error("[ERRO] onRequestPost: Erro ao processar requestData:", error);
        return new Response(JSON.stringify({ error: 'Erro ao processar requestData.' }), { status: 400 });
    }

        // Extrai Resposta Correta
        const respostaMatch = aiText.match(respostaRegex);
        if (respostaMatch && respostaMatch[1]) {
            respostaLetra = respostaMatch[1].toUpperCase();
            // Valida se a letra da resposta existe nas alternativas encontradas
            if (!alternativas.some(alt => alt.letra === respostaLetra)) {
                 console.warn(`[WARN] Parse: Resposta (${respostaLetra}) não encontrada nas alternativas extraídas.`);
                 respostaLetra = null; // Invalida
            }
        }

        if (!respostaLetra) {
             console.warn("[WARN] Parse: Resposta correta não encontrada ou inválida.");
             return null; // Precisa de resposta para o card interativo
        }

        // Monta o objeto da questão com dados genéricos/padrão
        const generatedQuestion = {
            id: `gen-${Date.now()}-${Math.random().toString(16).slice(2)}`, // ID único
            ano: new Date().getFullYear(),
            etapa: null, // Ou tentar inferir do prompt de criação?
            materia: "Gerada pela IA",
            topico: "Gerado pela IA",
            texto_questao: enunciado,
            referencia: referencia,
            alternativas: alternativas,
            resposta_letra: respostaLetra
        };
        console.log("[LOG] Parse: Questão gerada pela IA parseada com sucesso.");
        return generatedQuestion;

    } catch (error) {
        console.error("[ERRO] Parse: Erro inesperado ao tentar parsear:", error);
        return null;
    }
}

// --- Handler Principal ---
export async function onRequestPost(context) {
  const functionName = "/api/ask";
  console.log(`[LOG] ${functionName}: Iniciando POST request`);
  try {
    const { request, env } = context;
    const geminiApiKey = env.GEMINI_API_KEY;
    const r2Bucket = env.QUESTOES_PAVE_BUCKET;
    const modelName = env.MODEL_NAME || "gemini-1.5-flash-latest"; // Usar 1.5 flash como fallback

    // Validações
    if (!r2Bucket || !geminiApiKey) { throw new Error('Configuração interna incompleta.'); }
    console.log(`[LOG] ${functionName}: Configs OK. Modelo: ${modelName}`);

    // Obter corpo e histórico
    let requestData;
    try { requestData = await request.json(); } catch (e) { /* ... */ return new Response(JSON.stringify({ error: 'Requisição inválida.' }), { status: 400 });}
    const history = requestData?.history;
    if (!Array.isArray(history) || history.length === 0) { /* ... */ return new Response(JSON.stringify({ error: 'Histórico inválido.' }), { status: 400 });}
    const lastUserMessage = history.findLast(m => m.role === 'user');
    const userQuery = lastUserMessage?.parts?.[0]?.text?.trim();
    if (!userQuery) { /* ... */ return new Response(JSON.stringify({ error: 'Query inválida.' }), { status: 400 });}
    console.log(`[LOG] ${functionName}: Última query: "${userQuery}"`);

    // Carregar e Filtrar Questões do R2 SEMPRE
    let allQuestionsData = [];
    let questoesRelevantes = [];
    try { /* ... bloco try/catch para ler R2 ... */
        const r2Object = await r2Bucket.get('questoes.json');
        if (r2Object !== null) {
            allQuestionsData = await r2Object.json();
            if (!Array.isArray(allQuestionsData)) { allQuestionsData = []; }
            else { questoesRelevantes = filtrarQuestoes(allQuestionsData, userQuery); }
        }
    } catch (e) { console.error(`[ERRO] ${functionName}: Falha R2:`, e); }
    console.log(`[LOG] ${functionName}: ${questoesRelevantes.length} questões relevantes filtradas do R2.`);

    // --- Detecção de Intenção ---
    const requestKeywords = ['questão', 'questões', 'exercício', 'exercícios', 'exemplo', 'mostre', 'mande', 'liste', 'quero ver'];
    const createKeywords = ['crie', 'invente', 'elabore', 'gere uma questão', 'faça uma questão'];
    const isAskingForExisting = requestKeywords.some(keyword => userQuery.toLowerCase().includes(keyword));
    const isAskingToCreate = createKeywords.some(keyword => userQuery.toLowerCase().includes(keyword));

    let commentary = "";
    let questionsToReturn = [];
    const MAX_QUESTIONS_TO_SHOW = 1; // Mostrar só 1 por vez no chat

    // --- Lógica Principal ---

    if (isAskingForExisting && !isAskingToCreate && questoesRelevantes.length > 0) {
        // CASO 1: Pediu questão existente E encontramos no R2
        console.log(`[LOG] ${functionName}: Intenção: Mostrar questão existente do R2.`);
        const topicos = [...new Set(questoesRelevantes.slice(0, MAX_QUESTIONS_TO_SHOW).map(q => q?.topico || q?.materia))].filter(Boolean).join(', ');
        commentary = `Ok! Encontrei ${questoesRelevantes.length > 1 ? 'algumas questões' : 'uma questão'} sobre ${topicos || 'o tema pedido'} nos meus dados. Aqui está uma:`;
        questionsToReturn = questoesRelevantes.slice(0, MAX_QUESTIONS_TO_SHOW).map(q => ({ // Mapeia os dados do R2 para o formato esperado
             ano: q?.ano, etapa: q?.etapa, materia: q?.materia, topico: q?.topico,
             texto_questao: q?.texto_questao, referencia: q?.referencia,
             alternativas: q?.alternativas, resposta_letra: q?.resposta_letra
         }));

    } else if (isAskingToCreate) {
        // CASO 2: Pediu para CRIAR uma questão
        console.log(`[LOG] ${functionName}: Intenção: Criar questão com IA.`);
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: modelName });
        const safetySettings = [ /* ... seus safety settings ... */ ];

        // Prompt específico para criação de questão
        const creationPrompt = `Crie uma questão de múltipla escolha (A, B, C, D, E) no estilo do PAVE UFPEL sobre o seguinte tópico ou instrução: "${userQuery}".
        Formate sua resposta **exatamente** com as seguintes seções, cada uma em uma nova linha:
        Enunciado: [Texto completo do enunciado aqui, pode ter múltiplas linhas]
        A) [Texto da alternativa A]
        B) [Texto da alternativa B]
        C) [Texto da alternativa C]
        D) [Texto da alternativa D]
        E) [Texto da alternativa E]
        Resposta Correta: [Apenas a LETRA maiúscula correta, ex: C]`;

        console.log(`[LOG] ${functionName}: Enviando prompt de CRIAÇÃO para Gemini.`);
        try {
            // Nota: Não enviamos histórico para o prompt de criação para evitar confusão da IA
            const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: creationPrompt }] }], safetySettings });
            const response = result.response;
            const aiGeneratedText = response.text() || "";

            if (!aiGeneratedText && response.promptFeedback?.blockReason) {
                commentary = `(Não posso criar essa questão devido a políticas de segurança: ${response.promptFeedback.blockReason})`;
            } else if (aiGeneratedText) {
                // Tenta parsear a resposta da IA para o formato de questão
                const parsedQuestion = parseAiGeneratedQuestion(aiGeneratedText);
                if (parsedQuestion) {
                    // Sucesso! Prepara para mostrar o card
                    commentary = "Certo, elaborei esta questão para você:";
                    questionsToReturn = [parsedQuestion]; // Envia a questão parseada
                } else {
                    // Falha no parse, envia o texto bruto da IA como comentário
                    console.warn(`[WARN] ${functionName}: Falha ao parsear questão gerada pela IA.`);
                    commentary = `Tentei criar uma questão, mas tive dificuldade em formatá-la corretamente para exibição. Aqui está o texto que a IA gerou:\n\n${aiGeneratedText}`;
                    questionsToReturn = [];
                }
            } else {
                 commentary = "(A IA não conseguiu gerar a questão no momento.)";
            }
        } catch (error) {
            console.error(`[ERRO] ${functionName}: Erro ao chamar Gemini SDK para CRIAÇÃO:`, error);
            commentary = `(Desculpe, erro ao tentar criar a questão: ${error.message})`;
        }

    } else {
        // CASO 3: Conversa Normal ou Pediu questão existente mas NÃO encontramos
        console.log(`[LOG] ${functionName}: Intenção: Conversa normal ou questão não encontrada.`);
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: modelName });
        const safetySettings = [ /* ... seus safety settings ... */ ];

        // Contexto para a IA saber se a busca no R2 falhou
        let conversationContext = contextForAI; // Usa o contexto da busca R2
        if (isAskingForExisting && questoesRelevantes.length === 0) {
            conversationContext += " (Importante: o usuário pediu questões existentes, mas nenhuma foi encontrada na busca inicial.)";
        }

        // Prompt para conversa normal
        const conversationPrompt = `Você é um assistente PAVE UFPEL amigável. Responda à ÚLTIMA pergunta do usuário ("${userQuery}") de forma conversacional, usando o histórico da conversa para contexto. ${conversationContext}. Se o usuário pediu questões e você sabe (pelo contexto acima) que nenhuma foi encontrada, informe isso educadamente. Não invente questões se não foram encontradas ou pedidas para criar. Seja conciso.`;

         console.log(`[LOG] ${functionName}: Enviando prompt CONVERSACIONAL para Gemini.`);
         try {
             // Envia o histórico completo para dar contexto à conversa
             const result = await model.generateContent({ contents: history, /* generationConfig: { prompt: conversationPrompt }, */ safetySettings }); // Enviar prompt como parte de 'contents' é mais padrão
             // Ajuste: Adicionar o prompt como última mensagem do histórico pode ser mais eficaz
             const historyForConversation = [...history];
             historyForConversation[history.length-1].parts.push({text: `\n\n[Instrução para IA]: ${conversationPrompt}`}); // Tenta adicionar como instrução
             const resultWithPrompt = await model.generateContent({ contents: historyForConversation, safetySettings });


             const response = resultWithPrompt.response; // Usa a resposta da chamada com prompt injetado
             commentary = response.text() || "";
             if (!commentary && response.promptFeedback?.blockReason) { commentary = `(Bloqueado: ${response.promptFeedback.blockReason})`; }
             else if (!commentary) { commentary = "(Não consegui gerar uma resposta.)"; }
             console.log(`[LOG] ${functionName}: Resposta conversacional recebida.`);
         } catch (error) {
             console.error(`[ERRO] ${functionName}: Erro ao chamar Gemini SDK para CONVERSA:`, error);
             commentary = `(Desculpe, erro ao contatar a IA: ${error.message})`;
         }
         questionsToReturn = []; // Garante que nenhuma questão seja enviada
    }

    // Retornar Resposta Estruturada Final
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

// Handler genérico para outros métodos
export async function onRequest(context) {
    return await onRequestPost(context); // Fecha corretamente o bloco
}
if (context.request.method === 'POST') {
    return await onRequestPost(context);
}
return new Response(`Método ${context.request.method} não permitido. Use POST.`, { status: 405 });
// functions/api/ask.js
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// --- Funções Auxiliares (Robustas - Manter como estavam) ---
function removeAccents(str) {
    if (typeof str !== 'string') return '';
    try { return str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
    catch (e) { console.warn("Erro em removeAccents:", e, "Input:", str); return str || ''; }
}
const stopWords = new Set(['de', 'a', 'o', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'à', 'seu', 'sua', 'ou', 'ser', 'quando', 'muito', 'há', 'nos', 'já', 'está', 'eu', 'também', 'só', 'pelo', 'pela', 'até', 'isso', 'ela', 'entre', 'era', 'depois', 'sem', 'mesmo', 'aos', 'ter', 'seus', 'quem', 'nas', 'me', 'esse', 'eles', 'estão', 'você', 'tinha', 'foram', 'essa', 'num', 'nem', 'suas', 'meu', 'às', 'minha', 'têm', 'numa', 'pelos', 'elas', 'havia', 'seja', 'qual', 'será', 'nós', 'tenho', 'lhe', 'deles', 'essas', 'esses', 'pelas', 'este', 'fosse', 'dele', 'tu', 'te', 'vocês', 'vos', 'lhes', 'meus', 'minhas', 'teu', 'tua', 'teus', 'tuas', 'nosso', 'nossa', 'nossos', 'nossas', 'dela', 'delas', 'esta', 'estes', 'estas', 'aquele', 'aquela', 'aqueles', 'aquelas', 'isto', 'aquilo', 'estou', 'está', 'estamos', 'estão', 'estive', 'esteve', 'estivemos', 'estiveram', 'estava', 'estávamos', 'estavam', 'estivera', 'estivéramos', 'esteja', 'estejamos', 'estejam', 'estivesse', 'estivéssemos', 'estivessem', 'estiver', 'estivermos', 'estiverem', 'hei', 'há', 'havemos', 'hão', 'houve', 'houvemos', 'houveram', 'houvera', 'houvéramos', 'haja', 'hajamos', 'hajam', 'houvesse', 'houvéssemos', 'houvessem', 'houver', 'houvermos', 'houverem', 'houverei', 'houverá', 'houveremos', 'houverão', 'houveria', 'houveríamos', 'houveriam', 'sou', 'somos', 'são', 'era', 'éramos', 'eram', 'fui', 'foi', 'fomos', 'foram', 'fora', 'fôramos', 'seja', 'sejamos', 'sejam', 'fosse', 'fôssemos', 'fossem', 'for', 'formos', 'forem', 'serei', 'será', 'seremos', 'serão', 'seria', 'seríamos', 'seriam', 'tenho', 'tem', 'temos', 'tém', 'tinha', 'tínhamos', 'tinham', 'tive', 'teve', 'tivemos', 'tiveram', 'tivera', 'tivéramos', 'tenha', 'tenhamos', 'tenham', 'tivesse', 'tivéssemos', 'tivessem', 'tiver', 'tivermos', 'tiverem', 'terei', 'terá', 'teremos', 'terão', 'teria', 'teríamos', 'teriam', 'me', 'manda', 'envia', 'lista', 'mostre', 'fala', 'diz', 'ai', 'alguma', 'algum', 'coisa', 'sobre', 'dos', 'das', 'então', 'favor', 'poderia', 'gostaria', 'saber', 'se', 'tipo', 'exemplo', 'exercicio', 'exercicios', 'prova', 'vestibular', 'ano', 'materia']); // Mantenha sua lista completa
function filtrarQuestoes(questoes, query) {
    if (!Array.isArray(questoes)) { console.warn("[WARN] filtrarQuestoes: 'questoes' não é array."); return []; }
    if (typeof query !== 'string' || query.trim() === '') { console.warn("[WARN] filtrarQuestoes: 'query' inválida ou vazia."); return []; }
    const queryNormalized = removeAccents(query.toLowerCase());
    if (!queryNormalized) { console.warn("[WARN] filtrarQuestoes: 'queryNormalized' vazia."); return []; }
    let palavrasChave = [];
    try {
        if (typeof queryNormalized === 'string') {
            palavrasChave = queryNormalized.replace(/[^\w\s]/gi, '').split(/\s+/).filter(p => p && p.length > 1 && !stopWords.has(p));
        } else { return []; }
    } catch (e) { console.error("[ERRO] filtrarQuestoes: Erro ao processar palavras-chave:", e); return []; }
    if (palavrasChave.length === 0) { console.log("[LOG] filtrarQuestoes: Nenhuma palavra-chave útil."); return []; }
    const resultadosComPontuacao = questoes.map(q => {
        if (!q || typeof q !== 'object') { console.warn("[WARN] filtrarQuestoes: Item inválido.", q); return { questao: q, score: 0, match: false }; }
        const ano = (q.ano ?? '').toString(); const etapa = (q.etapa ?? '').toString();
        const materia = removeAccents((q.materia || '').toLowerCase()); const topico = removeAccents((q.topico || '').toLowerCase());
        const textoQuestao = removeAccents((q.texto_questao || '').toLowerCase());
        const textoCompletoQuestao = `pave ${ano} etapa ${etapa} ${materia} ${topico} ${textoQuestao}`;
        let score = 0; let match = false;
        palavrasChave.forEach(palavra => {
            try { if (typeof palavra === 'string' && typeof textoCompletoQuestao === 'string' && textoCompletoQuestao.includes(palavra)) { score++; match = true; } }
            catch (e) { console.error("[ERRO] filtrarQuestoes: Erro no 'includes':", e); }
        });
        return { questao: q, score: score, match: match };
    }).filter(item => item.match).sort((a, b) => b.score - a.score);
    return resultadosComPontuacao.map(item => item.questao);
}

function parseAiGeneratedQuestion(aiText) {
    // Manter a função de parse robusta como na versão anterior
    console.log("[LOG] Tentando parsear texto da IA para questão...");
    if (typeof aiText !== 'string' || !aiText) return null;
    try {
        let enunciado = null; const alternativas = []; let respostaLetra = null;
        let materia = "Indefinida"; let topico = "Indefinido";
        let textoRestante = aiText; const referencia = "Questão gerada por IA.";
        const materiaRegex = /^\s*Matéria[:\s]+([\s\S]*?)(?=\n|$)/im;
        const topicoRegex = /^\s*Tópico[:\s]+([\s\S]*?)(?=\n|$)/im;
        const enunciadoRegex = /^(?:Enunciado|Questão|Pergunta|Leia o texto a seguir)[:\s]*([\s\S]*?)(?=\n\s*[A-Ea-e][).:]\s*|\n\s*Alternativa\s*A|$)/im;
        const alternativaRegex = /^\s*([A-Ea-e])[).:]\s+([\s\S]*?)(?=\n\s*[A-Ea-e][).:]|\n\s*Resposta Correta|^\s*$)/gm;
        const respostaRegex = /(?:Resposta Correta|Gabarito|Correta)[:\s]*\s*([A-Ea-e])(?:[).:]|\s|$)/i;

        const materiaMatch = textoRestante.match(materiaRegex);
        if (materiaMatch?.[1]) { materia = materiaMatch[1].trim(); textoRestante = textoRestante.substring(materiaMatch[0].length).trim(); console.log("[LOG] Parse: Matéria:", materia); }
        else { console.warn("[WARN] Parse: Matéria não encontrada."); }
        const topicoMatch = textoRestante.match(topicoRegex);
        if (topicoMatch?.[1]) { topico = topicoMatch[1].trim(); textoRestante = textoRestante.substring(topicoMatch[0].length).trim(); console.log("[LOG] Parse: Tópico:", topico); }
        else { console.warn("[WARN] Parse: Tópico não encontrado."); }

        let textoParaEnunciado = textoRestante;
        const enunciadoMatch = textoParaEnunciado.match(enunciadoRegex);
        let textoParaAlternativas = textoParaEnunciado;
        if (enunciadoMatch?.[1]) {
            enunciado = enunciadoMatch[1].trim().replace(/^(Enunciado|Questão|Pergunta)[:\s]*/i, '').trim();
            if(textoParaAlternativas.startsWith(enunciadoMatch[0])){ textoParaAlternativas = textoParaAlternativas.substring(enunciadoMatch[0].length).trim(); }
            else { const idxEnunciado = textoParaAlternativas.indexOf(enunciado); if(idxEnunciado !== -1) { textoParaAlternativas = textoParaAlternativas.substring(idxEnunciado + enunciado.length).trim(); } }
        } else {
            const firstAltIndex = textoParaAlternativas.search(/^\s*[A-Ea-e][).:]\s+/m);
            if (firstAltIndex > 0) { enunciado = textoParaAlternativas.substring(0, firstAltIndex).trim(); textoParaAlternativas = textoParaAlternativas.substring(firstAltIndex); }
            else { console.warn("[WARN] Parse: Enunciado não extraído."); return null; }
        }
        if (!enunciado) { console.warn("[WARN] Parse: Enunciado vazio."); return null; }

        let match;
        while ((match = alternativaRegex.exec(textoParaAlternativas)) !== null) {
            if (match.index === alternativaRegex.lastIndex) { alternativaRegex.lastIndex++; }
            const letra = match[1]?.toUpperCase(); const texto = match[2]?.trim();
            if (letra && texto) { alternativas.push({ letra: letra, texto: texto }); }
        }
        if (alternativas.length < 2) { console.warn(`[WARN] Parse: Alternativas insuficientes (${alternativas.length}).`); return null; }

        const respostaMatch = aiText.match(respostaRegex); // Busca no original
        if (respostaMatch?.[1]) {
            respostaLetra = respostaMatch[1].toUpperCase();
            if (!alternativas.some(alt => alt.letra === respostaLetra)) { console.warn(`[WARN] Parse: Resposta (${respostaLetra}) inválida.`); respostaLetra = null; }
        }
        if (!respostaLetra) { console.warn("[WARN] Parse: Resposta correta não encontrada."); return null; }

        const generatedQuestion = { id: `gen-${Date.now()}`, ano: null, etapa: null, materia: materia, topico: topico, texto_questao: enunciado, referencia: referencia, alternativas: alternativas, resposta_letra: respostaLetra };
        console.log("[LOG] Parse: Questão gerada parseada com sucesso.");
        return generatedQuestion;
    } catch (error) { console.error("[ERRO] Parse: Erro inesperado:", error); return null; }
}


// --- Handler Principal (Foco em Mostrar/Criar) ---
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

    // Obter corpo e histórico
    let requestData;
    try { requestData = await request.json(); } catch (e) { return new Response(JSON.stringify({ error: 'Requisição inválida.' }), { status: 400 }); }
    const history = requestData?.history; // Histórico é importante para contexto se precisar criar
    if (!Array.isArray(history) || history.length === 0) { return new Response(JSON.stringify({ error: 'Histórico inválido.' }), { status: 400 }); }
    const lastUserMessage = history.findLast(m => m.role === 'user');
    const userQuery = typeof lastUserMessage?.parts?.[0]?.text === 'string' ? lastUserMessage.parts[0].text.trim() : null;
    if (!userQuery) { return new Response(JSON.stringify({ error: 'Query inválida no histórico.' }), { status: 400 }); }
    console.log(`[LOG] ${functionName}: Última query: "${userQuery}"`);

    // Carregar e Filtrar Questões SEMPRE
    let allQuestionsData = [];
    let questoesRelevantes = [];
    try {
        const r2Object = await r2Bucket.get('questoes.json');
        if (r2Object !== null) {
            allQuestionsData = await r2Object.json();
            if (Array.isArray(allQuestionsData)) {
                questoesRelevantes = filtrarQuestoes(allQuestionsData, userQuery);
            } else { allQuestionsData = []; }
        }
    } catch (e) { console.error(`[ERRO] ${functionName}: Falha R2:`, e); }
    console.log(`[LOG] ${functionName}: ${questoesRelevantes.length} questões relevantes filtradas do R2.`);

    // --- Detecção de Intenção ---
    const queryLower = userQuery.toLowerCase();
    const requestKeywords = ['questão', 'questões', 'exercício', 'exercícios', 'exemplo', 'mostre', 'mande', 'liste', 'quero ver', 'sim', 'pode mandar', 'mostra', 'envia uma questao'];
    const createKeywords = ['crie', 'invente', 'elabore', 'gere uma questão', 'faça uma questão'];
    let isAskingForExisting = requestKeywords.some(keyword => queryLower.includes(keyword));
    // Verifica confirmação após oferta (lógica mantida para flexibilidade)
    if (!isAskingForExisting && history.length >= 2) {
        const lastBotMessage = history[history.length - 2]?.parts?.[0]?.text?.toLowerCase() || '';
        const confirmationKeywords = ['sim', 'pode', 'quero', 'mostra', 'manda'];
        if (lastBotMessage.includes("quer que eu te mostre") && confirmationKeywords.some(kw => queryLower.includes(kw))) {
            isAskingForExisting = true;
            if (questoesRelevantes.length === 0 && history.length >=3) {
                 const previousUserMessage = history.findLast(m => m.role === 'user' && m !== lastUserMessage);
                 const previousQuery = previousUserMessage?.parts?.[0]?.text?.trim();
                 if (previousQuery) {
                     console.log(`[LOG] ${functionName}: Refiltrando com query anterior: "${previousQuery}"`);
                     questoesRelevantes = filtrarQuestoes(allQuestionsData, previousQuery);
                     console.log(`[LOG] ${functionName}: ${questoesRelevantes.length} questões relevantes na refiltragem.`);
                 }
            }
        }
    }
    const isAskingToCreate = createKeywords.some(keyword => queryLower.includes(keyword));

    let commentary = "";
    let questionsToReturn = [];
    const MAX_QUESTIONS_TO_SHOW = 1;

    // --- LÓGICA DE DECISÃO (SEM CONVERSA GERAL) ---

    if (isAskingForExisting && !isAskingToCreate && questoesRelevantes.length > 0) {
        // CASO 1: Pediu questão existente E encontramos -> MOSTRA DIRETO
        console.log(`[LOG] ${functionName}: Decisão: Mostrar questão existente do R2.`);
        const qToShow = questoesRelevantes[0];
        const topico = qToShow?.topico || qToShow?.materia || 'relacionado';
        commentary = `Ok! Encontrei uma questão sobre ${topico} para você praticar:`;
        questionsToReturn = [{ // Mapeamento seguro
             ano: qToShow?.ano, etapa: qToShow?.etapa, materia: qToShow?.materia, topico: qToShow?.topico,
             texto_questao: qToShow?.texto_questao, referencia: qToShow?.referencia,
             alternativas: qToShow?.alternativas, resposta_letra: qToShow?.resposta_letra
         }];

    } else if (isAskingToCreate) {
        // CASO 2: Pediu para CRIAR questão -> Chama IA para criar e parsear
        console.log(`[LOG] ${functionName}: Decisão: Criar questão com IA.`);
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: modelName });
        const safetySettings = [ /* ... seus safety settings ... */ ];
        const creationPrompt = `Crie uma questão de múltipla escolha (A, B, C, D, E) INÉDITA no estilo do PAVE UFPEL sobre o seguinte tópico ou instrução: "${userQuery}". Formate sua resposta EXATAMENTE com as seguintes seções, cada uma em uma nova linha:\nMatéria: [Nome da Matéria]\nTópico: [Nome do Tópico]\nEnunciado: [Texto do enunciado]\nA) [Alternativa A]\nB) [Alternativa B]\nC) [Alternativa C]\nD) [Alternativa D]\nE) [Alternativa E]\nResposta Correta: [Letra]`;

        console.log(`[LOG] ${functionName}: Enviando prompt de CRIAÇÃO para Gemini.`);
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

    } else {
        // CASO 3: NÃO é pedido de questão existente (ou não encontrada) E NÃO é pedido para criar
        // Anteriormente, chamava a IA para conversar. AGORA, retorna uma mensagem padrão.
        console.log(`[LOG] ${functionName}: Decisão: Nenhuma ação válida (Mostrar/Criar) detectada ou possível.`);
        if (isAskingForExisting && questoesRelevantes.length === 0) {
             commentary = `Puxa, procurei por questões sobre "${userQuery}", mas não encontrei exemplos nos meus dados atuais. Tente outros termos ou peça para eu criar uma!`;
        } else {
             commentary = "Não entendi bem o que você precisa. Você pode pedir para eu mostrar uma questão existente sobre um tópico (ex: 'questão sobre iluminismo') ou para eu criar uma questão (ex: 'crie uma questão de física').";
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
    console.log(`[LOG] /api/ask: Recebido request ${context.request.method}`);
    if (context.request.method === 'POST') {
        return await onRequestPost(context);
    }
    return new Response(`Método ${context.request.method} não permitido. Use POST.`, { status: 405 });
}
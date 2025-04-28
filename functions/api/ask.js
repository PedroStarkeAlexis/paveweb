// functions/api/ask.js
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// --- Funções Auxiliares (Manter: removeAccents, stopWords, filtrarQuestoes) ---
function removeAccents(str) { /* ... código ... */ }
const stopWords = new Set([ /* ... lista ... */ ]);
function filtrarQuestoes(questoes, query) { /* ... código robusto anterior ... */
    if (!Array.isArray(questoes)) { return []; }
    const queryNormalized = removeAccents(query.toLowerCase());
    const palavrasChave = queryNormalized.replace(/[^\w\s]/gi, '').split(/\s+/).filter(p => p.length > 1 && !stopWords.has(p));
    if (!palavrasChave.length) { return []; }
    const resultadosComPontuacao = questoes.map(q => {
        const ano = (q?.ano || '').toString(); const etapa = (q?.etapa || '').toString();
        const materia = removeAccents((q?.materia || '').toLowerCase()); const topico = removeAccents((q?.topico || '').toLowerCase());
        const textoQuestao = removeAccents((q?.texto_questao || '').toLowerCase());
        const textoCompletoQuestao = `pave ${ano} etapa ${etapa} ${materia} ${topico} ${textoQuestao}`;
        let score = 0; let match = false;
        palavrasChave.forEach(palavra => { if (textoCompletoQuestao.includes(palavra)) { score++; match = true; } });
        return { questao: q, score: score, match: match };
    }).filter(item => item.match).sort((a, b) => b.score - a.score);
    return resultadosComPontuacao.map(item => item.questao);
}

// --- Handler Principal Refatorado ---
export async function onRequestPost(context) {
  const functionName = "/api/ask";
  console.log(`[LOG] ${functionName}: Iniciando POST request`);
  try {
    const { request, env } = context;
    const geminiApiKey = env.GEMINI_API_KEY;
    const r2Bucket = env.QUESTOES_PAVE_BUCKET;

    // Validações essenciais (R2, API Key)
    if (!r2Bucket) { throw new Error('Configuração interna incompleta (R2).'); }
    if (!geminiApiKey) { throw new Error('Configuração interna incompleta (API Key).'); }
    console.log(`[LOG] ${functionName}: Bindings R2 e API Key encontrados.`);

    // Obter query do usuário
    let requestData;
    try { requestData = await request.json(); }
    catch (e) { return new Response(JSON.stringify({ error: 'Requisição inválida.' }), { status: 400, headers: { 'Content-Type': 'application/json' }}); }
    const userQuery = requestData?.query?.trim();

    if (!userQuery) { return new Response(JSON.stringify({ error: 'Nenhuma pergunta fornecida.' }), { status: 400, headers: { 'Content-Type': 'application/json' }}); }
    console.log(`[LOG] ${functionName}: Query recebida: "${userQuery}"`);

    // --- Carregar e Filtrar Questões SEMPRE ---
    // Precisamos dos dados relevantes mesmo que a IA decida não mostrá-los diretamente
    let allQuestionsData = [];
    let questoesRelevantes = [];
    let contextForAI = "Nenhum contexto específico sobre questões do PAVE foi carregado."; // Padrão
    try {
        const r2Object = await r2Bucket.get('questoes.json');
        if (r2Object !== null) {
            allQuestionsData = await r2Object.json();
            if (!Array.isArray(allQuestionsData)) {
                console.warn(`[WARN] ${functionName}: Conteúdo de questoes.json não é array.`);
                allQuestionsData = [];
            } else {
                console.log(`[LOG] ${functionName}: ${allQuestionsData.length} questões carregadas do R2.`);
                questoesRelevantes = filtrarQuestoes(allQuestionsData, userQuery);
                console.log(`[LOG] ${functionName}: ${questoesRelevantes.length} questões relevantes encontradas para a query.`);
                // Prepara um CONTEXTO RESUMIDO para a IA saber o que foi encontrado
                if (questoesRelevantes.length > 0) {
                    const topicosEncontrados = [...new Set(questoesRelevantes.map(q => q.topico || q.materia))].filter(Boolean).join(', ');
                    contextForAI = `Foram encontradas ${questoesRelevantes.length} questão(ões) relevante(s) sobre "${topicosEncontrados || 'tópicos relacionados'}".`;
                } else {
                    contextForAI = "Nenhuma questão relevante encontrada na base de dados para esta pergunta específica.";
                }
            }
        } else { console.warn(`[WARN] ${functionName}: Arquivo questoes.json não encontrado no R2.`); }
    } catch (e) { console.error(`[ERRO] ${functionName}: Falha ao ler/processar dados do R2:`, e); }

    // --- Configuração da API Gemini ---
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-latest", // Ou "gemini-pro"
        safetySettings: [ /* ... seus safety settings ... */ ]
    });

    // --- PROMPT INTELIGENTE ---
    const prompt = `Você é um assistente PAVE UFPEL. Responda ao usuário de forma conversacional e útil.

    Contexto da Busca (O que foi encontrado na base de dados para a pergunta do usuário):
    ---
    ${contextForAI}
    ---

    Instruções IMPORTANTES:
    1.  Analise a Pergunta do Usuário: "${userQuery}"
    2.  Decida a Intenção:
        *   É um cumprimento ou conversa geral? Responda naturalmente.
        *   É uma pergunta sobre o PAVE (regras, datas, etc.)? Responda com seu conhecimento geral ou diga que não sabe.
        *   É uma pergunta que pede **explicitamente** por exemplos de questões, lista de exercícios ou algo similar sobre um tópico/ano/matéria?
    3.  Formule a Resposta:
        *   Se a intenção **NÃO** for pedir exemplos de questões: Gere uma resposta textual normal e conversacional. NÃO mencione as questões encontradas a menos que seja muito relevante para responder a uma dúvida específica sobre o *tipo* de questão que cai.
        *   Se a intenção **FOR PEDIR EXEMPLOS DE QUESTÕES**: Gere uma resposta textual curta confirmando que encontrou questões e que elas serão mostradas. **Inclua a frase chave "[MOSTRAR_QUESTOES]" em algum lugar da sua resposta textual.** Exemplo: "Claro! Encontrei algumas questões sobre Física para você. [MOSTRAR_QUESTOES]" ou "Aqui estão exemplos de questões sobre ${userQuery}. [MOSTRAR_QUESTOES]".
    4.  Seja conciso.

    Sua Resposta Textual:`;

    console.log(`[LOG] ${functionName}: Enviando prompt inteligente para Gemini.`);
    let aiResponseText = "";
    let shouldShowQuestions = false; // Flag para controlar se envia os cards

    try { // Chamada Gemini
        const result = await model.generateContent(prompt);
        const response = result.response;
        aiResponseText = response.text() || ""; // Garante que seja string

        // Verifica se a resposta foi bloqueada
        if (!aiResponseText && response.promptFeedback?.blockReason) {
            console.warn(`[WARN] ${functionName}: Resposta bloqueada pela API Gemini. Razão: ${response.promptFeedback.blockReason}`);
            aiResponseText = `(Desculpe, não posso responder a isso devido às políticas de segurança.)`;
        }
        // --- VERIFICA SE A IA PEDIU PARA MOSTRAR QUESTÕES ---
        if (aiResponseText.includes("[MOSTRAR_QUESTOES]")) {
            shouldShowQuestions = true;
            // Remove a frase chave da resposta final para o usuário
            aiResponseText = aiResponseText.replace("[MOSTRAR_QUESTOES]", "").trim();
            console.log(`[LOG] ${functionName}: IA indicou para mostrar questões.`);
        } else {
             console.log(`[LOG] ${functionName}: IA NÃO indicou para mostrar questões.`);
        }
        // Define resposta padrão se a IA não retornar nada útil
        if (!aiResponseText && !shouldShowQuestions) {
            console.warn(`[WARN] ${functionName}: Resposta da Gemini vazia ou sem texto útil.`);
            aiResponseText = "(Não consegui gerar uma resposta completa no momento.)";
        }

    } catch (error) {
        console.error(`[ERRO] ${functionName}: Erro ao chamar Gemini SDK:`, error);
        aiResponseText = `(Desculpe, ocorreu um erro ao contatar a IA: ${error.message})`;
    }

    // --- Prepara Dados para Frontend ---
    let questionsToReturn = [];
    if (shouldShowQuestions && Array.isArray(questoesRelevantes) && questoesRelevantes.length > 0) {
        // Mapeia apenas as questões RELEVANTES se a IA pediu
        const MAX_QUESTIONS_TO_SHOW = 3; // Limite de cards
        questionsToReturn = questoesRelevantes
            .slice(0, MAX_QUESTIONS_TO_SHOW)
            .map(q => ({ /* ... mapeamento correto ... */
                ano: q?.ano, etapa: q?.etapa, materia: q?.materia, topico: q?.topico,
                texto_questao: q?.texto_questao, referencia: q?.referencia,
                alternativas: q?.alternativas, resposta_letra: q?.resposta_letra
            }));
        console.log(`[LOG] ${functionName}: Preparando ${questionsToReturn.length} questões para enviar ao frontend.`);
    }

    // --- Retornar Resposta Estruturada ---
    console.log(`[LOG] ${functionName}: Retornando resposta final.`);
    return new Response(JSON.stringify({ commentary: aiResponseText, questions: questionsToReturn }), {
      headers: { 'Content-Type': 'application/json' }, status: 200
    });

  } catch (error) {
    // Catch geral
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
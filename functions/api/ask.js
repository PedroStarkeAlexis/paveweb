// functions/api/ask.js
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// --- Função Auxiliar (Mais Robusta) ---
function removeAccents(str) {
  // Retorna string vazia se a entrada não for string
  if (typeof str !== 'string') return '';
  try {
      // Tenta normalizar e remover acentos
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch (e) {
      // Retorna a string original (ou vazia) em caso de erro inesperado
      console.warn("Erro em removeAccents:", e, "Input:", str);
      return str || '';
  }
}

const stopWords = new Set([ /* ... sua lista ... */ ]);

function filtrarQuestoes(questoes, query) {
    // Validação inicial robusta
    if (!Array.isArray(questoes)) { console.warn("[WARN] filtrarQuestoes: 'questoes' não é array."); return []; }
    if (typeof query !== 'string' || !query) { console.warn("[WARN] filtrarQuestoes: 'query' inválida."); return []; } // Não filtra sem query

    const queryNormalized = removeAccents(query.toLowerCase());
    // Validação após normalização
    if (!queryNormalized) { console.warn("[WARN] filtrarQuestoes: 'queryNormalized' vazia."); return []; }

    let palavrasChave = [];
    try {
        palavrasChave = queryNormalized
            .replace(/[^\w\s]/gi, '') // Tenta remover pontuação
            .split(/\s+/)
            .filter(p => p && p.length > 1 && !stopWords.has(p)); // Garante que p existe
    } catch (e) {
        console.error("[ERRO] filtrarQuestoes: Erro ao processar palavras-chave:", e, "Query Normalizada:", queryNormalized);
        return []; // Retorna vazio se falhar
    }

    if (palavrasChave.length === 0) { return []; }

    const resultadosComPontuacao = questoes.map(q => {
        // Verifica se q é um objeto válido antes de acessar propriedades
        if (!q || typeof q !== 'object') {
            console.warn("[WARN] filtrarQuestoes: Item inválido no array 'questoes'.", q);
            return { questao: q, score: 0, match: false }; // Retorna score zero
        }

        // Acessa propriedades com segurança, fornecendo fallbacks
        const ano = (q.ano || '').toString();
        const etapa = (q.etapa || '').toString();
        const materia = removeAccents((q.materia || '').toLowerCase());
        const topico = removeAccents((q.topico || '').toLowerCase());
        const textoQuestao = removeAccents((q.texto_questao || '').toLowerCase());

        // Concatena com segurança
        const textoCompletoQuestao = `pave ${ano} etapa ${etapa} ${materia} ${topico} ${textoQuestao}`;
        let score = 0;
        let match = false;

        palavrasChave.forEach(palavra => {
            try {
                // Verifica se textoCompletoQuestao é string antes de includes
                if (typeof textoCompletoQuestao === 'string' && textoCompletoQuestao.includes(palavra)) {
                    score++;
                    match = true;
                }
            } catch (e) {
                 console.error("[ERRO] filtrarQuestoes: Erro no 'includes' da palavra-chave:", e, "Palavra:", palavra, "Texto:", textoCompletoQuestao);
            }
        });
        return { questao: q, score: score, match: match };
    })
    .filter(item => item.match)
    .sort((a, b) => b.score - a.score);

    return resultadosComPontuacao.map(item => item.questao);
}


// --- Handler Principal Refatorado com Histórico ---
export async function onRequestPost(context) {
  const functionName = "/api/ask";
  console.log(`[LOG] ${functionName}: Iniciando POST request`);
  try {
    const { request, env } = context;
    const geminiApiKey = env.GEMINI_API_KEY;
    const r2Bucket = env.QUESTOES_PAVE_BUCKET;

    // Validações (R2, API Key)
    if (!r2Bucket) { throw new Error('Configuração interna incompleta (R2).'); }
    if (!geminiApiKey) { throw new Error('Configuração interna incompleta (API Key).'); }
    console.log(`[LOG] ${functionName}: Bindings R2 e API Key OK.`);

    // Obter corpo da requisição (agora esperando um histórico)
    let requestData;
    try { requestData = await request.json(); }
    catch (e) { return new Response(JSON.stringify({ error: 'Requisição inválida.' }), { status: 400 }); }

    // --- Processa o Histórico Recebido ---
    const history = requestData?.history;
    if (!Array.isArray(history) || history.length === 0) {
        return new Response(JSON.stringify({ error: 'Histórico de conversa inválido ou vazio.' }), { status: 400 });
    }
    // Pega a última mensagem do usuário como a "query" atual para filtragem e contexto
    const lastUserMessage = history.findLast(m => m.role === 'user');
    const userQuery = lastUserMessage?.parts?.[0]?.text?.trim();
    if (!userQuery) {
        return new Response(JSON.stringify({ error: 'Não foi possível extrair a última pergunta do histórico.' }), { status: 400 });
    }
    console.log(`[LOG] ${functionName}: Última query do usuário: "${userQuery}"`);
    // --- Fim do Processamento do Histórico ---

    // Carregar e Filtrar Questões (como antes, mas usando userQuery extraído do histórico)
    let allQuestionsData = [];
    let questoesRelevantes = [];
    let contextForAI = "Nenhum contexto específico sobre questões do PAVE foi carregado.";
    try { /* ... bloco try/catch para ler R2 e chamar filtrarQuestoes(allQuestionsData, userQuery) ... */
        const r2Object = await r2Bucket.get('questoes.json');
        if (r2Object !== null) {
            allQuestionsData = await r2Object.json();
            if (!Array.isArray(allQuestionsData)) { allQuestionsData = []; }
            else {
                 questoesRelevantes = filtrarQuestoes(allQuestionsData, userQuery); // Usa query do histórico
                 if (questoesRelevantes.length > 0) {
                    const topicosEncontrados = [...new Set(questoesRelevantes.map(q => q?.topico || q?.materia))].filter(Boolean).join(', ');
                    contextForAI = `Foram encontradas ${questoesRelevantes.length} questão(ões) relevante(s) sobre "${topicosEncontrados || 'tópicos relacionados'}".`;
                 } else { contextForAI = "Nenhuma questão relevante encontrada na base para esta pergunta."; }
            }
        }
    } catch (e) { console.error(`[ERRO] ${functionName}: Falha ao ler/processar R2:`, e); }

    // Configuração da API Gemini (SDK)
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-latest", // Tenta o modelo flash
        safetySettings: [ /* ... */ ]
    });

    // --- PROMPT INTELIGENTE (adaptado) ---
    // O histórico já vai no 'contents', então o prompt pode ser mais direto
    // ou podemos adicionar uma instrução final ao histórico.
    // Por simplicidade aqui, vamos manter um prompt de sistema implícito
    // e enviar o histórico diretamente.

    console.log(`[LOG] ${functionName}: Enviando histórico para Gemini.`);
    let aiResponseText = "";
    let shouldShowQuestions = false;

    try {
        // Adiciona a instrução final como uma última mensagem do 'user'
        // para guiar a IA sobre como usar o contexto e decidir se mostra questões.
        const systemInstruction = `\n\n[Instrução Interna] Analise a conversa acima. Se a ÚLTIMA mensagem do usuário pedir explicitamente por exemplos de questões do PAVE, inclua a tag [MOSTRAR_QUESTOES] na sua resposta textual. Caso contrário, apenas responda à última pergunta de forma conversacional e útil, usando o contexto (${contextForAI}) se relevante.`;

        // Adiciona a instrução ao final da última parte do histórico
        const historyWithInstruction = [...history];
        const lastPartIndex = historyWithInstruction[history.length - 1].parts.length -1;
        historyWithInstruction[history.length - 1].parts[lastPartIndex].text += systemInstruction;


        // Chama a API usando o histórico formatado
        const result = await model.generateContent({
            contents: historyWithInstruction, // <<< ENVIA O HISTÓRICO COMPLETO
            // generationConfig, // Opcional
            safetySettings
        });

        const response = result.response;
        aiResponseText = response.text() || "";

        if (!aiResponseText && response.promptFeedback?.blockReason) {
            console.warn(`[WARN] ${functionName}: Resposta bloqueada. Razão: ${response.promptFeedback.blockReason}`);
            aiResponseText = `(Não posso responder devido a políticas de segurança.)`;
        }

        // Verifica se a IA incluiu a tag para mostrar questões
        if (aiResponseText.includes("[MOSTRAR_QUESTOES]")) {
            shouldShowQuestions = true;
            aiResponseText = aiResponseText.replace("[MOSTRAR_QUESTOES]", "").trim();
            console.log(`[LOG] ${functionName}: IA indicou para mostrar questões.`);
        } else {
             console.log(`[LOG] ${functionName}: IA NÃO indicou para mostrar questões.`);
        }
        if (!aiResponseText && !shouldShowQuestions) {
             aiResponseText = "(Não consegui gerar uma resposta completa.)";
        }

    } catch (error) {
        console.error(`[ERRO] ${functionName}: Erro ao chamar Gemini SDK:`, error);
        aiResponseText = `(Desculpe, erro ao contatar a IA: ${error.message})`;
    }

    // Prepara Dados para Frontend
    let questionsToReturn = [];
    if (shouldShowQuestions && Array.isArray(questoesRelevantes) && questoesRelevantes.length > 0) {
        const MAX_QUESTIONS_TO_SHOW = 3;
        questionsToReturn = questoesRelevantes
            .slice(0, MAX_QUESTIONS_TO_SHOW)
            .map(q => ({ /* ... mapeamento ... */
                ano: q?.ano, etapa: q?.etapa, materia: q?.materia, topico: q?.topico,
                texto_questao: q?.texto_questao, referencia: q?.referencia,
                alternativas: q?.alternativas, resposta_letra: q?.resposta_letra
             }));
        console.log(`[LOG] ${functionName}: Preparando ${questionsToReturn.length} questões.`);
    }

    // Retornar Resposta Estruturada
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
export async function onRequest(context) { /* ... como antes ... */ }
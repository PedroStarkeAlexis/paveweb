// functions/api/ask.js
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// --- Funções Auxiliares (Robustas) ---
function removeAccents(str) {
  if (typeof str !== 'string') return '';
  try { return str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
  catch (e) { console.warn("Erro em removeAccents:", e, "Input:", str); return str || ''; }
}
const stopWords = new Set([ /* ... sua lista ... */ ]);
function filtrarQuestoes(questoes, query) {
    if (!Array.isArray(questoes)) { console.warn("[WARN] filtrarQuestoes: 'questoes' não é array."); return []; }
    if (typeof query !== 'string' || !query) { return []; } // Não filtra sem query válida
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

// --- Handler Principal Refatorado com Histórico ---
export async function onRequestPost(context) {
  const functionName = "/api/ask";
  console.log(`[LOG] ${functionName}: Iniciando POST request`);
  try {
    const { request, env } = context;
    const geminiApiKey = env.GEMINI_API_KEY;
    const r2Bucket = env.QUESTOES_PAVE_BUCKET;

    // Validações
    if (!r2Bucket) { throw new Error('Configuração interna incompleta (R2).'); }
    if (!geminiApiKey) { throw new Error('Configuração interna incompleta (API Key).'); }
    console.log(`[LOG] ${functionName}: Bindings R2 e API Key OK.`);

    // Obter corpo e histórico
    let requestData;
    try { requestData = await request.json(); }
    catch (e) { return new Response(JSON.stringify({ error: 'Requisição inválida.' }), { status: 400 }); }
    const history = requestData?.history;
    if (!Array.isArray(history) || history.length === 0) { return new Response(JSON.stringify({ error: 'Histórico inválido.' }), { status: 400 }); }
    const lastUserMessage = history.findLast(m => m.role === 'user');
    const userQuery = lastUserMessage?.parts?.[0]?.text?.trim();
    if (!userQuery) { return new Response(JSON.stringify({ error: 'Query do usuário não encontrada no histórico.' }), { status: 400 }); }
    console.log(`[LOG] ${functionName}: Última query: "${userQuery}"`);

    // Carregar e Filtrar Questões para possível contexto/retorno
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

    // Configuração da API Gemini (SDK)
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-latest", // Modelo desejado
        // Não precisa definir safetySettings aqui se for passar em generateContent
    });

    // --- *** CORREÇÃO: Definir safetySettings ANTES de usar *** ---
    const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];
    // --- FIM DA CORREÇÃO ---

    // Adiciona instrução final ao histórico para guiar a IA
    const systemInstruction = `\n\n[Instrução Interna] Analise a conversa acima. Se a ÚLTIMA mensagem do usuário pedir explicitamente por exemplos de questões do PAVE, inclua a tag [MOSTRAR_QUESTOES] na sua resposta textual. Caso contrário, apenas responda à última pergunta de forma conversacional e útil, usando o contexto (${contextForAI}) se relevante.`;
    const historyWithInstruction = [...history];
    // Garante que a última mensagem exista e tenha 'parts' antes de modificar
    if (historyWithInstruction.length > 0 && historyWithInstruction[history.length - 1].parts?.length > 0) {
        const lastPartIndex = historyWithInstruction[history.length - 1].parts.length -1;
        historyWithInstruction[history.length - 1].parts[lastPartIndex].text += systemInstruction;
    } else {
        console.error(`[ERRO] ${functionName}: Formato inesperado do histórico ao adicionar instrução.`);
        // Considerar retornar erro ou prosseguir sem a instrução explícita
    }


    console.log(`[LOG] ${functionName}: Enviando histórico para Gemini.`);
    let aiResponseText = "";
    let shouldShowQuestions = false;

    try {
        // Chama a API usando o histórico e as configurações de segurança
        const result = await model.generateContent({
            contents: historyWithInstruction, // Envia histórico com instrução
            safetySettings // <<< PASSA A VARIÁVEL DEFINIDA
        });

        const response = result.response;
        aiResponseText = response.text() || "";

        if (!aiResponseText && response.promptFeedback?.blockReason) {
            console.warn(`[WARN] ${functionName}: Resposta bloqueada. Razão: ${response.promptFeedback.blockReason}`);
            aiResponseText = `(Não posso responder devido a políticas de segurança.)`;
        }

        // Verifica se a IA incluiu a tag
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
        // Define mensagem de erro específica capturada pelo catch
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
export async function onRequest(context) {
    console.log(`[LOG] /api/ask: Recebido request ${context.request.method}`);
    if (context.request.method === 'POST') {
        return await onRequestPost(context);
    }
    return new Response(`Método ${context.request.method} não permitido. Use POST.`, { status: 405 });
}
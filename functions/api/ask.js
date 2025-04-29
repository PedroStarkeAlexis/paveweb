// functions/api/ask.js
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// --- Funções Auxiliares ---
function removeAccents(str) { /* ... código ... */ }
const stopWords = new Set([ /* ... lista ... */ ]);
function filtrarQuestoes(questoes, query) { /* ... código robusto anterior ... */ }

// --- NOVA FUNÇÃO: Tenta parsear texto da IA para formato de questão ---
function parseAiGeneratedQuestion(aiText) {
    console.log("[LOG] Tentando parsear texto da IA para questão:", aiText);
    try {
        let enunciado = null;
        const alternativas = [];
        let respostaLetra = null;

        // Expressões Regulares (podem precisar de ajuste fino)
        const enunciadoRegex = /(?:Enunciado|Questão|Pergunta)[:\s]*([\s\S]*?)(?=\n\s*[A-Ea-e]\)|Alternativa A|Opção A|$)/i;
        const alternativaRegex = /^\s*([A-Ea-e])\)\s*([\s\S]*?)(?=\n\s*[A-Ea-e]\)|\n\s*Resposta Correta|^\s*$)/gim; // gmi para múltiplas linhas e case-insensitive
        const respostaRegex = /(?:Resposta Correta|Gabarito)[:\s]*([A-Ea-e])(?:[)\s]|$)/i;

        // Extrai Enunciado
        const enunciadoMatch = aiText.match(enunciadoRegex);
        if (enunciadoMatch && enunciadoMatch[1]) {
            enunciado = enunciadoMatch[1].trim();
        } else {
             // Fallback: Assume a primeira parte antes da primeira alternativa como enunciado
             const firstAltMatch = aiText.search(/\n\s*[A-Ea-e]\)/i);
             if (firstAltMatch > 0) {
                 enunciado = aiText.substring(0, firstAltMatch).trim();
             } else {
                // Se não achar nem alternativa, talvez seja só o enunciado? Pouco provável.
                console.warn("[WARN] Parse: Não foi possível extrair enunciado claro.");
                // Poderia retornar null ou tentar usar o texto todo se for curto?
             }
        }
         // Limpeza básica do enunciado (remover marcadores se sobraram)
         if (enunciado) {
             enunciado = enunciado.replace(/^(?:Enunciado|Questão|Pergunta)[:\s]*/i, '').trim();
         } else {
              console.warn("[WARN] Parse: Enunciado final é nulo ou vazio.");
              return null; // Não pode formar questão sem enunciado
         }


        // Extrai Alternativas
        let match;
        while ((match = alternativaRegex.exec(aiText)) !== null) {
            const letra = match[1].toUpperCase();
            const texto = match[2].trim();
            if (letra && texto) {
                alternativas.push({ letra: letra, texto: texto });
            }
        }

        if (alternativas.length < 2) { // Precisa de pelo menos 2 alternativas
             console.warn("[WARN] Parse: Não foram encontradas alternativas suficientes.", alternativas.length);
             return null;
        }

        // Extrai Resposta Correta
        const respostaMatch = aiText.match(respostaRegex);
        if (respostaMatch && respostaMatch[1]) {
            respostaLetra = respostaMatch[1].toUpperCase();
            // Valida se a letra da resposta existe nas alternativas encontradas
            if (!alternativas.some(alt => alt.letra === respostaLetra)) {
                 console.warn("[WARN] Parse: Resposta correta encontrada ("+respostaLetra+") não corresponde a nenhuma alternativa extraída.");
                 respostaLetra = null; // Invalida se não bate
            }
        }

        if (!respostaLetra) {
             console.warn("[WARN] Parse: Não foi possível extrair a resposta correta.");
             return null; // Não pode formar questão interativa sem resposta
        }

        // Se chegou até aqui, monta o objeto da questão
        const generatedQuestion = {
            // IDs e metadados podem ser genéricos ou omitidos
            id: `gen-${Date.now()}`,
            ano: new Date().getFullYear(), // Ano atual
            etapa: null, // Sem etapa definida
            materia: "Gerada pela IA", // Indicar origem
            topico: "Gerado pela IA",
            texto_questao: enunciado,
            referencia: "Questão gerada por IA.", // Indicar origem
            alternativas: alternativas,
            resposta_letra: respostaLetra
        };
        console.log("[LOG] Parse: Questão gerada pela IA parseada com sucesso:", generatedQuestion);
        return generatedQuestion;

    } catch (error) {
        console.error("[ERRO] Parse: Erro ao tentar parsear texto da IA:", error);
        return null; // Retorna null em caso de erro
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
    const modelName = env.MODEL_NAME || "gemini-1.5-flash-latest";

    // Validações
    if (!r2Bucket || !geminiApiKey) { throw new Error('Configuração interna incompleta.'); }
    console.log(`[LOG] ${functionName}: Configs OK. Modelo: ${modelName}`);

    // Obter corpo e histórico
    let requestData;
    try { requestData = await request.json(); } catch (e) { /* ... */ }
    const history = requestData?.history;
    if (!Array.isArray(history) || history.length === 0) { /* ... */ }
    const lastUserMessage = history.findLast(m => m.role === 'user');
    const userQuery = lastUserMessage?.parts?.[0]?.text?.trim();
    if (!userQuery) { /* ... */ }
    console.log(`[LOG] ${functionName}: Última query: "${userQuery}"`);

    // Carregar e Filtrar Questões SEMPRE
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
    console.log(`[LOG] ${functionName}: ${questoesRelevantes.length} questões relevantes filtradas.`);

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
        // CASO 1: Pediu questão existente E encontramos
        console.log(`[LOG] ${functionName}: Usuário pediu questão existente e ${questoesRelevantes.length} foram encontradas.`);
        const topicos = [...new Set(questoesRelevantes.slice(0, MAX_QUESTIONS_TO_SHOW).map(q => q?.topico || q?.materia))].filter(Boolean).join(', ');
        commentary = `Ok! Encontrei ${questoesRelevantes.length > 1 ? 'algumas questões' : 'uma questão'} sobre ${topicos || 'o que você pediu'} nos meus dados. Aqui está uma:`;
        questionsToReturn = questoesRelevantes.slice(0, MAX_QUESTIONS_TO_SHOW).map(q => ({ /* ... mapeamento ... */ }));

    } else if (isAskingToCreate) {
        // CASO 2: Pediu para CRIAR uma questão
        console.log(`[LOG] ${functionName}: Usuário pediu para CRIAR uma questão.`);
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: modelName });
        const safetySettings = [ /* ... */ ];

        const creationPrompt = `Crie uma questão de múltipla escolha (A, B, C, D, E) no estilo do PAVE UFPEL sobre o seguinte tópico ou instrução: "${userQuery}". Formate sua resposta claramente com as seguintes seções:
        Enunciado: [Texto do enunciado aqui]
        A) [Texto da alternativa A]
        B) [Texto da alternativa B]
        C) [Texto da alternativa C]
        D) [Texto da alternativa D]
        E) [Texto da alternativa E]
        Resposta Correta: [Apenas a LETRA correta, ex: C]`;

        console.log(`[LOG] ${functionName}: Enviando prompt de CRIAÇÃO para Gemini.`);
        try {
            const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: creationPrompt }] }], safetySettings });
            const response = result.response;
            const aiGeneratedText = response.text() || "";

            if (!aiGeneratedText && response.promptFeedback?.blockReason) {
                commentary = `(Não posso criar essa questão devido a políticas de segurança: ${response.promptFeedback.blockReason})`;
            } else if (aiGeneratedText) {
                // Tenta parsear a resposta da IA
                const parsedQuestion = parseAiGeneratedQuestion(aiGeneratedText);
                if (parsedQuestion) {
                    // Sucesso! Prepara para mostrar o card
                    commentary = "Certo, elaborei esta questão para você:";
                    questionsToReturn = [parsedQuestion]; // Envia a questão parseada
                } else {
                    // Falha no parse, envia o texto bruto da IA como comentário
                    console.warn(`[WARN] ${functionName}: Falha ao parsear questão gerada pela IA.`);
                    commentary = `Tentei criar uma questão, mas tive dificuldade em formatá-la corretamente. Aqui está o que a IA gerou:\n\n${aiGeneratedText}`;
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
        console.log(`[LOG] ${functionName}: Conversa normal ou questão pedida não encontrada. Chamando IA.`);
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: modelName });
        const safetySettings = [ /* ... */ ];

        // Usa o histórico para contexto, mas o prompt foca na última query
        const conversationPrompt = `Você é um assistente PAVE UFPEL amigável. Responda à ÚLTIMA pergunta do usuário ("${userQuery}") de forma conversacional, usando o histórico para contexto. Contexto adicional sobre busca na base: ${contextForAI}. Se o usuário pediu questões e você sabe que nenhuma foi encontrada, explique isso. Não invente questões. Seja conciso.`;

         console.log(`[LOG] ${functionName}: Enviando prompt CONVERSACIONAL para Gemini.`);
         try { // Chamada Gemini
             const result = await model.generateContent({ contents: history, generationConfig: { prompt: conversationPrompt }, safetySettings }); // Tentar injetar prompt via generationConfig pode funcionar melhor para histórico
             const response = result.response;
             commentary = response.text() || "";
             if (!commentary && response.promptFeedback?.blockReason) { /* ... tratamento bloqueio ... */ }
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

  } catch (error) { /* ... Catch geral ... */ }
}

// Handler genérico para outros métodos
export async function onRequest(context) { /* ... como antes ... */ }
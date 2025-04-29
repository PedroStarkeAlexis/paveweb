// functions/api/ask.js
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// --- Funções Auxiliares (Robustas) ---
function removeAccents(str) {
    if (typeof str !== 'string') return '';
    try { return str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
    catch (e) { console.warn("Erro em removeAccents:", e, "Input:", str); return str || ''; }
}

const stopWords = new Set(['de', 'a', 'o', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'à', 'seu', 'sua', 'ou', 'ser', 'quando', 'muito', 'há', 'nos', 'já', 'está', 'eu', 'também', 'só', 'pelo', 'pela', 'até', 'isso', 'ela', 'entre', 'era', 'depois', 'sem', 'mesmo', 'aos', 'ter', 'seus', 'quem', 'nas', 'me', 'esse', 'eles', 'estão', 'você', 'tinha', 'foram', 'essa', 'num', 'nem', 'suas', 'meu', 'às', 'minha', 'têm', 'numa', 'pelos', 'elas', 'havia', 'seja', 'qual', 'será', 'nós', 'tenho', 'lhe', 'deles', 'essas', 'esses', 'pelas', 'este', 'fosse', 'dele', 'tu', 'te', 'vocês', 'vos', 'lhes', 'meus', 'minhas', 'teu', 'tua', 'teus', 'tuas', 'nosso', 'nossa', 'nossos', 'nossas', 'dela', 'delas', 'esta', 'estes', 'estas', 'aquele', 'aquela', 'aqueles', 'aquelas', 'isto', 'aquilo', 'estou', 'está', 'estamos', 'estão', 'estive', 'esteve', 'estivemos', 'estiveram', 'estava', 'estávamos', 'estavam', 'estivera', 'estivéramos', 'esteja', 'estejamos', 'estejam', 'estivesse', 'estivéssemos', 'estivessem', 'estiver', 'estivermos', 'estiverem', 'hei', 'há', 'havemos', 'hão', 'houve', 'houvemos', 'houveram', 'houvera', 'houvéramos', 'haja', 'hajamos', 'hajam', 'houvesse', 'houvéssemos', 'houvessem', 'houver', 'houvermos', 'houverem', 'houverei', 'houverá', 'houveremos', 'houverão', 'houveria', 'houveríamos', 'houveriam', 'sou', 'somos', 'são', 'era', 'éramos', 'eram', 'fui', 'foi', 'fomos', 'foram', 'fora', 'fôramos', 'seja', 'sejamos', 'sejam', 'fosse', 'fôssemos', 'fossem', 'for', 'formos', 'forem', 'serei', 'será', 'seremos', 'serão', 'seria', 'seríamos', 'seriam', 'tenho', 'tem', 'temos', 'tém', 'tinha', 'tínhamos', 'tinham', 'tive', 'teve', 'tivemos', 'tiveram', 'tivera', 'tivéramos', 'tenha', 'tenhamos', 'tenham', 'tivesse', 'tivéssemos', 'tivessem', 'tiver', 'tivermos', 'tiverem', 'terei', 'terá', 'teremos', 'terão', 'teria', 'teríamos', 'teriam', 'me', 'manda', 'envia', 'lista', 'mostre', 'fala', 'diz', 'ai', 'alguma', 'algum', 'coisa', 'sobre', 'dos', 'das', 'então', 'favor', 'poderia', 'gostaria', 'saber', 'se', 'tipo', 'exemplo', 'exercicio', 'exercicios', 'prova', 'vestibular', 'ano', 'materia']); // Mantenha sua lista

function filtrarQuestoes(questoes, query) {
    if (!Array.isArray(questoes)) { console.warn("[WARN] filtrarQuestoes: 'questoes' não é array."); return []; }
    // Adicionada validação extra para query
    if (typeof query !== 'string' || query.trim() === '') { console.warn("[WARN] filtrarQuestoes: 'query' inválida ou vazia."); return []; }

    const queryNormalized = removeAccents(query.toLowerCase());
    if (!queryNormalized) { console.warn("[WARN] filtrarQuestoes: 'queryNormalized' vazia."); return []; }

    let palavrasChave = [];
    try {
        // Adicionada verificação se queryNormalized é string antes de replace
        if (typeof queryNormalized === 'string') {
            palavrasChave = queryNormalized.replace(/[^\w\s]/gi, '').split(/\s+/).filter(p => p && p.length > 1 && !stopWords.has(p));
        } else {
             console.warn("[WARN] filtrarQuestoes: queryNormalized não é string após removeAccents.");
             return [];
        }
    } catch (e) { console.error("[ERRO] filtrarQuestoes: Erro ao processar palavras-chave:", e); return []; }

    if (palavrasChave.length === 0) { console.log("[LOG] filtrarQuestoes: Nenhuma palavra-chave útil."); return []; }

    const resultadosComPontuacao = questoes.map(q => {
        if (!q || typeof q !== 'object') { console.warn("[WARN] filtrarQuestoes: Item inválido.", q); return { questao: q, score: 0, match: false }; }

        // Garante que todos os campos textuais sejam strings antes de processar
        const ano = (q.ano ?? '').toString(); // Usando ?? para tratar null/undefined
        const etapa = (q.etapa ?? '').toString();
        const materia = removeAccents((q.materia || '').toLowerCase());
        const topico = removeAccents((q.topico || '').toLowerCase());
        const textoQuestao = removeAccents((q.texto_questao || '').toLowerCase());

        const textoCompletoQuestao = `pave ${ano} etapa ${etapa} ${materia} ${topico} ${textoQuestao}`;
        let score = 0; let match = false;

        palavrasChave.forEach(palavra => {
            try {
                // Garante que palavra também seja string
                if (typeof palavra === 'string' && typeof textoCompletoQuestao === 'string' && textoCompletoQuestao.includes(palavra)) {
                    score++; match = true;
                }
            } catch (e) { console.error("[ERRO] filtrarQuestoes: Erro no 'includes':", e); }
        });
        return { questao: q, score: score, match: match };
    }).filter(item => item.match).sort((a, b) => b.score - a.score);

    return resultadosComPontuacao.map(item => item.questao);
}

// --- Função de Parse (Revisada para Matéria/Tópico) ---
function parseAiGeneratedQuestion(aiText) {
    console.log("[LOG] Tentando parsear texto da IA para questão...");
    if (typeof aiText !== 'string' || !aiText) return null;
    try {
        let enunciado = null; const alternativas = []; let respostaLetra = null;
        let materia = "Indefinida"; // Valor padrão
        let topico = "Indefinido";   // Valor padrão
        let textoProcessado = aiText;
        const referencia = "Questão gerada por IA.";

        // Expressões Regulares
        // Adiciona regex para Matéria e Tópico no início
        const materiaRegex = /^\s*Matéria[:\s]+([\s\S]*?)\n/i;
        const topicoRegex = /^\s*Tópico[:\s]+([\s\S]*?)\n/i;
        // Ajusta regex do enunciado para procurar APÓS matéria/tópico
        const enunciadoRegex = /^\s*(?:Enunciado|Questão|Pergunta|Leia o texto a seguir)[:\s]*([\s\S]*?)(?=\n\s*[A-Ea-e][).:]\s*|\n\s*Alternativa\s*A)/im;
        const alternativaRegex = /^\s*([A-Ea-e])[).:]\s+([\s\S]*?)(?=\n\s*[A-Ea-e][).:]|\n\s*Resposta Correta|^\s*$)/gm;
        const respostaRegex = /(?:Resposta Correta|Gabarito|Correta)[:\s]*\s*([A-Ea-e])(?:[).:]|\s|$)/i;

        // Extrai Matéria
        const materiaMatch = textoProcessado.match(materiaRegex);
        if (materiaMatch?.[1]) {
            materia = materiaMatch[1].trim();
            textoProcessado = textoProcessado.substring(materiaMatch[0].length).trim(); // Remove do texto
            console.log("[LOG] Parse: Matéria encontrada:", materia);
        } else { console.warn("[WARN] Parse: Matéria não encontrada no formato esperado."); }

        // Extrai Tópico
        const topicoMatch = textoProcessado.match(topicoRegex);
        if (topicoMatch?.[1]) {
            topico = topicoMatch[1].trim();
            textoProcessado = textoProcessado.substring(topicoMatch[0].length).trim(); // Remove do texto
            console.log("[LOG] Parse: Tópico encontrado:", topico);
        } else { console.warn("[WARN] Parse: Tópico não encontrado no formato esperado."); }

        // Extrai Enunciado (do texto restante)
        const enunciadoMatch = textoProcessado.match(enunciadoRegex);
        if (enunciadoMatch?.[1]) {
            enunciado = enunciadoMatch[1].trim();
            textoProcessado = textoProcessado.substring(enunciadoMatch[0].length).trim();
        } else {
            const firstAltIndex = textoProcessado.search(/^\s*[A-Ea-e][).:]\s+/m);
            if (firstAltIndex > 0) {
                enunciado = textoProcessado.substring(0, firstAltIndex).trim();
                textoProcessado = textoProcessado.substring(firstAltIndex);
            } else { console.warn("[WARN] Parse: Enunciado não extraído."); return null; }
        }
        if (!enunciado) { console.warn("[WARN] Parse: Enunciado vazio."); return null; }

        // Extrai Alternativas (do texto restante)
        let match;
        while ((match = alternativaRegex.exec(textoProcessado)) !== null) {
            if (match.index === alternativaRegex.lastIndex) { alternativaRegex.lastIndex++; }
            const letra = match[1]?.toUpperCase(); const texto = match[2]?.trim();
            if (letra && texto) { alternativas.push({ letra: letra, texto: texto }); }
        }
        if (alternativas.length < 2) { console.warn(`[WARN] Parse: Alternativas insuficientes (${alternativas.length}).`); return null; }

        // Extrai Resposta Correta (do texto original completo da IA)
        const respostaMatch = aiText.match(respostaRegex);
        if (respostaMatch?.[1]) {
            respostaLetra = respostaMatch[1].toUpperCase();
            if (!alternativas.some(alt => alt.letra === respostaLetra)) {
                 console.warn(`[WARN] Parse: Resposta (${respostaLetra}) não encontrada nas alternativas.`);
                 respostaLetra = null;
            }
        }
        if (!respostaLetra) { console.warn("[WARN] Parse: Resposta correta não encontrada."); return null; }

        // Monta o objeto da questão gerada COM os dados extraídos
        const generatedQuestion = {
            id: `gen-${Date.now()}`,
            ano: null, // Não tem ano específico
            etapa: null, // Não tem etapa específica
            materia: materia, // <<< USA A MATÉRIA EXTRAÍDA
            topico: topico,   // <<< USA O TÓPICO EXTRAÍDO
            texto_questao: enunciado,
            referencia: referencia, // Indica origem IA
            alternativas: alternativas,
            resposta_letra: respostaLetra
        };
        console.log("[LOG] Parse: Questão gerada parseada com sucesso.");
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
    const modelName = env.MODEL_NAME || "gemini-2.0-flash"; // Fallback seguro

    // Validações
    if (!r2Bucket || !geminiApiKey) { throw new Error('Configuração interna incompleta.'); }
    console.log(`[LOG] ${functionName}: Configs OK. Modelo: ${modelName}`);

    // Obter corpo e histórico
    let requestData;
    try { requestData = await request.json(); }
    catch (e) { return new Response(JSON.stringify({ error: 'Requisição inválida.' }), { status: 400 }); }
    const history = requestData?.history;
    if (!Array.isArray(history) || history.length === 0) { return new Response(JSON.stringify({ error: 'Histórico inválido.' }), { status: 400 }); }
    const lastUserMessage = history.findLast(m => m.role === 'user');
    // Validação extra para userQuery
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
                // Chama filtrarQuestoes apenas se allQuestionsData for array
                questoesRelevantes = filtrarQuestoes(allQuestionsData, userQuery);
            } else {
                console.warn(`[WARN] ${functionName}: Conteúdo R2 não é array.`);
                allQuestionsData = []; // Garante que seja array vazio
            }
        } else { console.warn(`[WARN] ${functionName}: questoes.json não encontrado no R2.`); }
    } catch (e) { console.error(`[ERRO] ${functionName}: Falha ao ler/processar R2:`, e); }
    console.log(`[LOG] ${functionName}: ${questoesRelevantes.length} questões relevantes filtradas do R2.`);

    // --- Detecção de Intenção ---
    const queryLower = userQuery.toLowerCase();
    const requestKeywords = ['questão', 'questões', 'exercício', 'exercícios', 'exemplo', 'mostre', 'mande', 'liste', 'quero ver'];
    const createKeywords = ['crie', 'invente', 'elabore', 'gere uma questão', 'faça uma questão', 'crie uma questão', 'gere'];
    const isAskingForExisting = requestKeywords.some(keyword => queryLower.includes(keyword));
    const isAskingToCreate = createKeywords.some(keyword => queryLower.includes(keyword));

    let commentary = "";
    let questionsToReturn = [];
    const MAX_QUESTIONS_TO_SHOW = 1;

    // --- Lógica Principal ---
    const genAI = new GoogleGenerativeAI(geminiApiKey); // Define uma vez
    const model = genAI.getGenerativeModel({ model: modelName });
    const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ]; // Define uma vez

    if (isAskingForExisting && !isAskingToCreate && questoesRelevantes.length > 0) {
        // CASO 1: Pediu questão existente E encontramos
        console.log(`[LOG] ${functionName}: Intenção: Mostrar questão existente do R2.`);
        const qToShow = questoesRelevantes[0]; // Pega a primeira mais relevante
        const topico = qToShow?.topico || qToShow?.materia || 'relacionado';
        commentary = `Ok! Encontrei uma questão sobre ${topico} para você praticar:`;
        // Mapeia com segurança
        questionsToReturn = [{
            ano: qToShow?.ano, etapa: qToShow?.etapa, materia: qToShow?.materia, topico: qToShow?.topico,
            texto_questao: qToShow?.texto_questao, referencia: qToShow?.referencia,
            alternativas: qToShow?.alternativas, resposta_letra: qToShow?.resposta_letra
        }];

    } else if (isAskingToCreate) {
        // CASO 2: Pediu para CRIAR uma questão
        console.log(`[LOG] ${functionName}: Intenção: Criar questão com IA.`);
        const creationPrompt = `Crie uma questão de múltipla escolha (A, B, C, D, E) INÉDITA no estilo do PAVE UFPEL sobre o seguinte tópico ou instrução: "${userQuery}".
        Formate sua resposta **exatamente** com as seguintes seções, cada uma em uma nova linha:
        Matéria: [Nome da Matéria Principal, ex: Física, História, Biologia]
        Tópico: [Nome do Tópico Específico dentro da matéria, ex: Cinemática, Iluminismo, Genética]
        Enunciado: [Texto completo do enunciado aqui, pode ter múltiplas linhas]
        A) [Texto da alternativa A]
        B) [Texto da alternativa B]
        C) [Texto da alternativa C]
        D) [Texto da alternativa D]
        E) [Texto da alternativa E]
        Resposta Correta: [Apenas a LETRA maiúscula correta, ex: C]`;

        console.log(`[LOG] ${functionName}: Enviando prompt de CRIAÇÃO para Gemini.`);
        try {
            const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: creationPrompt }] }], safetySettings });
            const response = result.response;
            const aiGeneratedText = response.text() || "";

            if (!aiGeneratedText && response.promptFeedback?.blockReason) {
                commentary = `(Não posso criar essa questão: ${response.promptFeedback.blockReason})`;
            } else if (aiGeneratedText) {
                const parsedQuestion = parseAiGeneratedQuestion(aiGeneratedText);
                if (parsedQuestion) {
                    commentary = "Certo, elaborei esta questão para você:";
                    questionsToReturn = [parsedQuestion];
                } else {
                    console.warn(`[WARN] ${functionName}: Falha ao parsear questão gerada pela IA.`);
                    commentary = `Tentei criar uma questão, mas não consegui formatá-la corretamente. Aqui está o texto gerado:\n\n${aiGeneratedText}`;
                    questionsToReturn = [];
                }
            } else { commentary = "(A IA não gerou a questão.)"; }
        } catch (error) {
            console.error(`[ERRO] ${functionName}: Erro Gemini CRIAÇÃO:`, error);
            commentary = `(Desculpe, erro ao criar a questão: ${error.message})`;
        }

    } else {
        // CASO 3: Conversa Normal ou Pediu questão existente mas NÃO encontramos
        console.log(`[LOG] ${functionName}: Intenção: Conversa ou questão não encontrada.`);
        let conversationContext = "Nenhuma questão relevante encontrada na base para esta pergunta.";
        if (isAskingForExisting && questoesRelevantes.length === 0) {
            conversationContext += " (O usuário pediu questões existentes, mas a busca inicial não retornou resultados.)";
        } else if (questoesRelevantes.length > 0) {
             const topicosEncontrados = [...new Set(questoesRelevantes.map(q => q?.topico || q?.materia))].filter(Boolean).join(', ');
             conversationContext = `Foram encontradas ${questoesRelevantes.length} questões sobre "${topicosEncontrados}", mas o usuário não pediu para vê-las explicitamente.`;
        }

        const conversationPrompt = `Você é um assistente PAVE UFPEL amigável. Responda à ÚLTIMA pergunta do usuário ("${userQuery}") de forma conversacional, usando o histórico para contexto. Contexto adicional: ${conversationContext}. Se souber que o usuário pediu questões mas não foram encontradas, explique isso. Não invente questões. Seja conciso.`;

         console.log(`[LOG] ${functionName}: Enviando prompt CONVERSACIONAL para Gemini.`);
         try {
             const historyForConversation = [...history];
             // Adiciona o prompt como instrução final (pode precisar de ajuste)
             if (historyForConversation.length > 0 && historyForConversation[historyForConversation.length - 1].parts?.length > 0) {
                historyForConversation[historyForConversation.length - 1].parts.push({ text: `\n\n[Instrução para IA]: ${conversationPrompt}` });
             } else {
                 // Se histórico vazio ou malformado, envia só o prompt
                 historyForConversation.push({role: 'user', parts: [{text: conversationPrompt}]})
             }

             const result = await model.generateContent({ contents: historyForConversation, safetySettings });
             const response = result.response;
             commentary = response.text() || "";
             if (!commentary && response.promptFeedback?.blockReason) { commentary = `(Bloqueado: ${response.promptFeedback.blockReason})`; }
             else if (!commentary) { commentary = "(Não consegui gerar uma resposta.)"; }
             console.log(`[LOG] ${functionName}: Resposta conversacional recebida.`);
         } catch (error) {
             console.error(`[ERRO] ${functionName}: Erro Gemini CONVERSA:`, error);
             commentary = `(Desculpe, erro ao contatar a IA: ${error.message})`;
         }
         questionsToReturn = []; // Garante sem questões
    }

    // Retornar Resposta Estruturada Final
    console.log(`[LOG] ${functionName}: Retornando final. Comentário: ${commentary ? 'Sim' : 'Não'}, Questões: ${questionsToReturn.length}`);
    return new Response(JSON.stringify({ commentary: commentary, questions: questionsToReturn }), {
      headers: { 'Content-Type': 'application/json' }, status: 200
    });

  } catch (error) {
      console.error(`[ERRO] ${functionName}: Erro GERAL CAPTURADO:`, error);
      // Retorna a mensagem de erro específica capturada
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
// functions/api/ask.js
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// --- Funções Auxiliares ---
function removeAccents(str) { /* ... */ }
const stopWords = new Set([ /* ... */ ]);
function filtrarQuestoes(questoes, query) { /* ... */ }

// --- Função para pedir à IA para GERAR uma questão em JSON ---
async function generateQuestionWithAI(userQuery, apiKey, modelName) {
    const functionName = "/api/ask (generateQuestionWithAI)";
    console.log(`[LOG] ${functionName}: Iniciando geração de questão para query: "${userQuery}"`);

    // Tenta extrair um tópico da query do usuário (melhorar se necessário)
    const topicMatch = userQuery.match(/sobre ([\w\sà-úÀ-Ú]+)/i);
    const topic = topicMatch ? topicMatch[1].trim() : "um tópico variado do PAVE";

    // Estrutura JSON desejada (exemplo para o prompt)
    const jsonExample = `{
  "texto_questao": "Enunciado completo da questão aqui, com possíveis quebras de linha usando \\n.",
  "alternativas": [
    {"letra": "A", "texto": "Texto da alternativa A."},
    {"letra": "B", "texto": "Texto da alternativa B."},
    {"letra": "C", "texto": "Texto da alternativa C."},
    {"letra": "D", "texto": "Texto da alternativa D."},
    {"letra": "E", "texto": "Texto da alternativa E."}
  ],
  "resposta_letra": "C"
}`;

    // Prompt específico para geração de JSON
    const prompt = `Você é um especialista em criar questões de múltipla escolha no estilo do PAVE UFPEL.
    Sua tarefa é gerar **UMA ÚNICA** questão sobre **"${topic}"**.
    A questão deve ter um enunciado claro, 5 alternativas (A, B, C, D, E) e indicar qual é a letra da resposta correta.

    **IMPORTANTE:** Sua resposta deve ser **APENAS E SOMENTE** o código JSON válido representando a questão gerada, seguindo **ESTRITAMENTE** o formato abaixo. Não inclua nenhuma outra palavra, explicação ou formatação como \`\`\`json ... \`\`\`.

    Formato JSON Requerido:
    ${jsonExample}

    Gere agora a questão em JSON:`;

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName });
        const safetySettings = [ /* ... seus safety settings ... */ ];

        console.log(`[LOG] ${functionName}: Enviando prompt de geração JSON para Gemini.`);
        const result = await model.generateContent(prompt, { safetySettings }); // Passa só o prompt aqui
        const response = result.response;
        const aiResponseText = response.text()?.trim() || "";

        if (!aiResponseText) {
            if (response.promptFeedback?.blockReason) {
                 console.warn(`[WARN] ${functionName}: Geração bloqueada. Razão: ${response.promptFeedback.blockReason}`);
                 throw new Error(`Geração bloqueada por segurança: ${response.promptFeedback.blockReason}`);
            }
            console.warn(`[WARN] ${functionName}: Resposta da Gemini vazia.`);
            throw new Error("IA não retornou conteúdo para a questão.");
        }

        console.log(`[LOG] ${functionName}: Resposta bruta da IA recebida:\n${aiResponseText.substring(0, 200)}...`);

        // --- TENTATIVA DE PARSE E VALIDAÇÃO ---
        let generatedQuestion = null;
        try {
            generatedQuestion = JSON.parse(aiResponseText);
            console.log(`[LOG] ${functionName}: JSON parseado com sucesso.`);

            // Validação básica da estrutura
            if (
                typeof generatedQuestion.texto_questao === 'string' &&
                Array.isArray(generatedQuestion.alternativas) &&
                generatedQuestion.alternativas.length > 0 && // Pelo menos uma alternativa
                generatedQuestion.alternativas.every(alt => typeof alt.letra === 'string' && typeof alt.texto === 'string') &&
                typeof generatedQuestion.resposta_letra === 'string' &&
                generatedQuestion.alternativas.some(alt => alt.letra === generatedQuestion.resposta_letra) // Resposta existe nas alternativas
            ) {
                console.log(`[LOG] ${functionName}: JSON gerado parece válido.`);
                // Adiciona campos que faltam para consistência (opcional)
                generatedQuestion.ano = new Date().getFullYear(); // Ano atual
                generatedQuestion.etapa = null; // Não sabemos a etapa
                generatedQuestion.materia = "Gerada por IA";
                generatedQuestion.topico = topic;
                generatedQuestion.referencia = "Questão gerada por IA.";
                return generatedQuestion; // Retorna o objeto da questão validado
            } else {
                console.error(`[ERRO] ${functionName}: Estrutura do JSON gerado é inválida.`, generatedQuestion);
                throw new Error("A IA retornou um JSON com formato incorreto.");
            }
        } catch (parseError) {
            console.error(`[ERRO] ${functionName}: Falha ao parsear resposta da IA como JSON:`, parseError);
            console.error(`[DEBUG] ${functionName}: Resposta completa da IA que falhou no parse:\n${aiResponseText}`);
            throw new Error("A IA não retornou um JSON válido.");
        }
        // --- FIM PARSE E VALIDAÇÃO ---

    } catch (error) {
        console.error(`[ERRO] ${functionName}: Erro durante a geração ou validação:`, error);
        throw error; // Re-lança o erro para ser pego pelo handler principal
    }
}


// --- Handler Principal (onRequestPost) ---
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

    // Obter corpo e histórico
    let requestData;
    try { requestData = await request.json(); }
    catch (e) { return new Response(JSON.stringify({ error: 'Requisição inválida.' }), { status: 400 }); }
    const history = requestData?.history;
    if (!Array.isArray(history) || history.length === 0) { return new Response(JSON.stringify({ error: 'Histórico inválido.' }), { status: 400 }); }
    const lastUserMessage = history.findLast(m => m.role === 'user');
    const userQuery = lastUserMessage?.parts?.[0]?.text?.trim();
    if (!userQuery) { return new Response(JSON.stringify({ error: 'Query inválida.' }), { status: 400 }); }

    // --- Detecção de Intenção ---
    const createKeywords = ['crie', 'gere', 'invente', 'elabore uma questão', 'faça uma questão'];
    const requestKeywords = ['questão', 'questões', 'exercício', 'exercícios', 'exemplo', 'mostre', 'mande', 'liste', 'quero ver'];
    const isAskingToCreate = createKeywords.some(keyword => userQuery.toLowerCase().includes(keyword));
    const isAskingForExisting = requestKeywords.some(keyword => userQuery.toLowerCase().includes(keyword));

    let aiResponseText = "";
    let questionsToReturn = [];
    const MAX_QUESTIONS_TO_SHOW = 1; // Mostrar só 1 questão por vez (seja encontrada ou criada)

    // --- FLUXO DE DECISÃO ---

    if (isAskingToCreate) {
        // --- TENTAR GERAR QUESTÃO PELA IA ---
        console.log(`[LOG] ${functionName}: Detectado pedido para CRIAR questão.`);
        try {
            const generatedQuestion = await generateQuestionWithAI(userQuery, geminiApiKey, modelName);
            if (generatedQuestion) {
                 aiResponseText = "Ok! Criei esta questão especialmente para você:";
                 // Mapeia para o formato esperado pelo frontend (mesmo sendo só 1)
                 questionsToReturn = [
                     {
                         ano: generatedQuestion.ano, etapa: generatedQuestion.etapa, materia: generatedQuestion.materia, topico: generatedQuestion.topico,
                         texto_questao: generatedQuestion.texto_questao, referencia: generatedQuestion.referencia,
                         alternativas: generatedQuestion.alternativas, resposta_letra: generatedQuestion.resposta_letra
                     }
                 ];
                 console.log(`[LOG] ${functionName}: Questão gerada pela IA e validada.`);
            } else {
                 // Se generateQuestionWithAI falhou internamente mas não lançou erro catastrófico
                 aiResponseText = "Tentei criar uma questão, mas não consegui gerar um formato válido no momento.";
            }
        } catch (generationError) {
            console.error(`[ERRO] ${functionName}: Falha na GERAÇÃO da questão:`, generationError);
            aiResponseText = `Desculpe, tive um problema ao tentar criar a questão: ${generationError.message}`;
        }

    } else if (isAskingForExisting) {
        // --- TENTAR BUSCAR QUESTÃO EXISTENTE ---
        console.log(`[LOG] ${functionName}: Detectado pedido para BUSCAR questão.`);
        let questoesRelevantes = [];
        try { /* Bloco try/catch para ler R2 e filtrar */
            const r2Object = await r2Bucket.get('questoes.json');
            if (r2Object !== null) {
                const allQuestionsData = await r2Object.json();
                if (Array.isArray(allQuestionsData)) {
                    questoesRelevantes = filtrarQuestoes(allQuestionsData, userQuery);
                }
            }
        } catch (e) { console.error(`[ERRO] ${functionName} (Busca): Falha ao ler/processar R2:`, e); }

        if (questoesRelevantes.length > 0) {
            console.log(`[LOG] ${functionName} (Busca): ${questoesRelevantes.length} questões encontradas. Preparando para mostrar.`);
            const questaoSelecionada = questoesRelevantes[0]; // Pega a primeira mais relevante
            questionsToReturn = [ // Prepara para enviar ao frontend
                 {
                    ano: questaoSelecionada?.ano, etapa: questaoSelecionada?.etapa, materia: questaoSelecionada?.materia, topico: questaoSelecionada?.topico,
                    texto_questao: questaoSelecionada?.texto_questao, referencia: questaoSelecionada?.referencia,
                    alternativas: questaoSelecionada?.alternativas, resposta_letra: questaoSelecionada?.resposta_letra
                 }
            ];
            // Pede intro para a IA
            const introPrompt = `O usuário pediu questões sobre "${userQuery}" e uma relevante foi encontrada sobre "${questaoSelecionada?.topico || questaoSelecionada?.materia}". Gere APENAS uma frase curta e amigável para introduzir esta questão (Ex: "Ok! Encontrei esta questão sobre ${questaoSelecionada?.topico || 'o tema'}:", "Com certeza! Veja este exemplo:").`;
            try { /* Bloco try/catch para chamada Gemini da INTRO */
                 const genAI = new GoogleGenerativeAI(geminiApiKey);
                 const model = genAI.getGenerativeModel({ model: modelName});
                 const safetySettings = [ /* ... */ ];
                 const result = await model.generateContent(introPrompt, { safetySettings }); // Passa só o prompt de intro
                 aiResponseText = result.response.text()?.trim() || "Aqui está a questão que encontrei:";
            } catch(introError) {
                 console.error(`[ERRO] ${functionName} (Busca): Erro ao gerar intro:`, introError);
                 aiResponseText = "Encontrei esta questão para você:"; // Fallback
            }
        } else {
            console.log(`[LOG] ${functionName} (Busca): Nenhuma questão relevante encontrada. Chamando IA para resposta textual.`);
             // Chama IA para dizer que não achou (Fluxo Conversa Normal abaixo)
             const conversaPrompt = `Você é um assistente PAVE UFPEL... O usuário pediu questões sobre "${userQuery}", mas a busca na base de dados não retornou resultados. Informe isso educadamente... Sua Resposta Textual:`;
             try { /* Bloco try/catch para chamada Gemini de CONVERSA */
                  const genAI = new GoogleGenerativeAI(geminiApiKey);
                  const model = genAI.getGenerativeModel({ model: modelName });
                  const safetySettings = [ /* ... */ ];
                  const result = await model.generateContent({ contents: history, safetySettings }); // Usa histórico
                  aiResponseText = result.response.text()?.trim() || "(Não foi possível gerar uma resposta.)";
             } catch (conversaError) {
                  console.error(`[ERRO] ${functionName} (Busca-Falha): Erro ao chamar Gemini:`, conversaError);
                  aiResponseText = `(Desculpe, erro ao processar: ${conversaError.message})`;
             }
        }

    } else {
        // --- FLUXO DE CONVERSA NORMAL / QA ---
        console.log(`[LOG] ${functionName}: Intenção: Conversa/QA. Chamando IA.`);
        const conversaPrompt = `Você é um assistente PAVE UFPEL... Responda à ÚLTIMA pergunta do usuário ("${userQuery}") de forma conversacional... Contexto: ${contextForAI}... Sua Resposta Textual:`;
         try { /* Bloco try/catch para chamada Gemini de CONVERSA */
              const genAI = new GoogleGenerativeAI(geminiApiKey);
              const model = genAI.getGenerativeModel({ model: modelName });
              const safetySettings = [ /* ... */ ];
              const result = await model.generateContent({ contents: history, safetySettings }); // Usa histórico
              aiResponseText = result.response.text()?.trim() || "(Não foi possível gerar uma resposta.)";
         } catch (conversaError) {
              console.error(`[ERRO] ${functionName} (Conversa): Erro ao chamar Gemini:`, conversaError);
              aiResponseText = `(Desculpe, erro ao processar: ${conversaError.message})`;
         }
    }

    // --- Retornar Resposta Estruturada ---
    console.log(`[LOG] ${functionName}: Retornando resposta final. Comentário: ${aiResponseText ? 'Sim' : 'Não'}, Questões: ${questionsToReturn.length}`);
    return new Response(JSON.stringify({ commentary: aiResponseText, questions: questionsToReturn }), {
      headers: { 'Content-Type': 'application/json' }, status: 200
    });

  } catch (error) { /* ... Catch geral ... */ }
}

// Handler genérico para outros métodos
export async function onRequest(context) { /* ... como antes ... */ }
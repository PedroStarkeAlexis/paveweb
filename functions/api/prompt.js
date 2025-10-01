import { createTextPreview } from "./filter"; // Certifique-se que está importado/definido
import { Type } from "@google/genai";

const DEFAULT_QUESTION_COUNT = 1;

// ========================================
// FASE 1: ROUTER DE INTENÇÕES (Structured Output)
// ========================================

/**
 * Schema para o Router de Intenções.
 * Define a estrutura JSON que o modelo deve retornar.
 */
export const INTENT_ROUTER_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    intent: {
      type: Type.STRING,
      description: "A intenção detectada do usuário",
      enum: ["BUSCAR_QUESTAO", "CRIAR_QUESTAO", "CRIAR_FLASHCARDS", "INFO_PAVE", "CONVERSAR"],
    },
    entities: {
      type: Type.OBJECT,
      description: "Entidades extraídas da mensagem do usuário",
      properties: {
        materia: {
          type: Type.STRING,
          description: "Matéria mencionada (ex: História, Química, Biologia)",
          nullable: true,
        },
        topico: {
          type: Type.STRING,
          description: "Tópico específico mencionado",
          nullable: true,
        },
        ano: {
          type: Type.INTEGER,
          description: "Ano mencionado (ex: 2024)",
          nullable: true,
        },
      },
      nullable: true,
    },
    questionCount: {
      type: Type.INTEGER,
      description: "Número de questões solicitadas (se aplicável). Default: 1",
      nullable: true,
    },
    reasoning: {
      type: Type.STRING,
      description: "Breve explicação sobre a decisão tomada",
    },
  },
  required: ["intent", "reasoning"],
  propertyOrdering: ["intent", "entities", "questionCount", "reasoning"],
};

/**
 * Cria o prompt do Router de Intenções.
 * Este é um prompt SIMPLES focado apenas em classificação.
 */
export function createIntentRouterPrompt(history, userQuery) {
  return `Você é um assistente especialista em classificar intenções de usuários do PAVE UFPel.

**Histórico da Conversa:**
${JSON.stringify(history.slice(-5), null, 2)}

**Última mensagem do usuário:**
"${userQuery}"

**Sua Tarefa:**
Analise a mensagem do usuário e determine:

1. **Intent (intenção principal):**
   - BUSCAR_QUESTAO: Usuário quer ver questões EXISTENTES do banco de dados
   - CRIAR_QUESTAO: Usuário pede explicitamente para GERAR/CRIAR novas questões
   - CRIAR_FLASHCARDS: Usuário pede para criar flashcards de estudo
   - INFO_PAVE: Usuário pergunta sobre o PAVE (regras, datas, funcionamento)
   - CONVERSAR: Conversa geral, saudação, ou pergunta que não se encaixa nas anteriores

2. **Entities (entidades):**
   - materia: Nome da matéria mencionada (ex: "História", "Química")
   - topico: Tópico específico (ex: "Guerra Fria", "Fotossíntese")
   - ano: Ano mencionado (ex: 2024)

3. **questionCount:** Se o usuário pedir MÚLTIPLAS questões (ex: "crie 3 questões", "várias questões"), extraia o número. Caso contrário, use null.

**Regras Importantes:**
- Se o usuário pedir "uma questão sobre X" SEM mencionar "criar" ou "gerar", classifique como BUSCAR_QUESTAO
- Só classifique como CRIAR_QUESTAO se houver palavras como: "criar", "gerar", "fazer", "elaborar", "monte"
- Para CRIAR_QUESTAO, se não houver número explícito, deixe questionCount como null (será tratado como 1)

Responda com um objeto JSON seguindo o schema fornecido.`;
}

// ========================================
// FASE 2: SCHEMAS PARA GERAÇÃO DE CONTEÚDO
// ========================================

/**
 * Schema para uma alternativa de questão
 */
const ALTERNATIVE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    letra: {
      type: Type.STRING,
      description: "Letra da alternativa (A, B, C, D ou E)",
      enum: ["A", "B", "C", "D", "E"],
    },
    texto: {
      type: Type.STRING,
      description: "Texto completo da alternativa",
    },
  },
  required: ["letra", "texto"],
  propertyOrdering: ["letra", "texto"],
};

/**
 * Schema para uma questão do PAVE
 */
const QUESTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    id: {
      type: Type.STRING,
      description: "ID temporário da questão gerada",
    },
    materia: {
      type: Type.STRING,
      description: "Matéria da questão",
    },
    topico: {
      type: Type.STRING,
      description: "Tópico específico da questão",
    },
    texto_questao: {
      type: Type.STRING,
      description: "Enunciado completo da questão (pode usar Markdown)",
    },
    alternativas: {
      type: Type.ARRAY,
      description: "Array com as 5 alternativas (A-E)",
      items: ALTERNATIVE_SCHEMA,
    },
    resposta_letra: {
      type: Type.STRING,
      description: "Letra da alternativa correta",
      enum: ["A", "B", "C", "D", "E"],
    },
    referencia: {
      type: Type.STRING,
      description: "Referência da questão (sempre 'Gerado por IA')",
    },
  },
  required: ["id", "materia", "topico", "texto_questao", "alternativas", "resposta_letra", "referencia"],
  propertyOrdering: ["id", "materia", "topico", "texto_questao", "alternativas", "resposta_letra", "referencia"],
};

/**
 * Schema para resposta de geração de questões
 */
export const QUESTION_GENERATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      description: "Array de questões geradas",
      items: QUESTION_SCHEMA,
    },
  },
  required: ["questions"],
  propertyOrdering: ["questions"],
};

/**
 * Schema para um flashcard
 */
const FLASHCARD_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    id: {
      type: Type.STRING,
      description: "ID temporário do flashcard",
    },
    term: {
      type: Type.STRING,
      description: "Termo ou conceito do flashcard",
    },
    definition: {
      type: Type.STRING,
      description: "Definição ou explicação do termo",
    },
  },
  required: ["id", "term", "definition"],
  propertyOrdering: ["id", "term", "definition"],
};

/**
 * Schema para resposta de geração de flashcards
 */
export const FLASHCARD_GENERATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    flashcards: {
      type: Type.ARRAY,
      description: "Array de flashcards gerados",
      items: FLASHCARD_SCHEMA,
    },
  },
  required: ["flashcards"],
  propertyOrdering: ["flashcards"],
};

/**
 * Schema para re-ranking de questões
 */
export const QUESTION_RERANKING_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    selected_question_ids: {
      type: Type.ARRAY,
      description: "IDs das questões selecionadas como relevantes",
      items: {
        type: Type.STRING,
      },
    },
    reasoning: {
      type: Type.STRING,
      description: "Breve explicação da seleção feita",
    },
  },
  required: ["selected_question_ids"],
  propertyOrdering: ["selected_question_ids", "reasoning"],
};

/**
 * Cria o prompt para geração de questões (usado após o router detectar CRIAR_QUESTAO).
 * @param {string} materia - A matéria da questão.
 * @param {string} topico - O tópico específico.
 * @param {number} count - Número de questões a gerar.
 * @returns {string} O prompt.
 */
export function createQuestionGenerationPromptV2(materia, topico, count = 1) {
  let subjectSpecificInstructions = '';
  
  switch (materia) {
    case 'História':
      subjectSpecificInstructions = 'A questão deve focar em contextos históricos, análise de períodos, causas e consequências de eventos. Se citar documentos, use o formato de citação em Markdown.';
      break;
    case 'Química':
      subjectSpecificInstructions = 'A questão deve ser conceitual ou envolver cálculos simples. Use a formatação do Markdown para fórmulas químicas (ex: H₂O) e equações.';
      break;
    case 'Biologia':
      subjectSpecificInstructions = 'A questão deve abordar processos biológicos, estruturas, funções ou conceitos ecológicos. Use negrito para destacar termos científicos chave.';
      break;
    case 'Física':
      subjectSpecificInstructions = 'A questão pode envolver conceitos teóricos ou cálculos. Use Markdown para fórmulas e equações quando necessário.';
      break;
    case 'Matemática':
      subjectSpecificInstructions = 'A questão deve testar raciocínio matemático. Use Markdown para fórmulas e expressões matemáticas.';
      break;
    default:
      subjectSpecificInstructions = 'A questão deve ser clara, objetiva e bem formulada, seguindo o estilo do PAVE UFPel.';
  }

  return `Você é um especialista em elaborar questões para o PAVE UFPel.

**Sua Tarefa:**
Gere ${count} questão(ões) de múltipla escolha (A-E) com as seguintes especificações:

**Matéria:** ${materia}
**Tópico:** ${topico}
**Quantidade:** ${count} questão(ões)

**Instruções Específicas da Matéria:**
${subjectSpecificInstructions}

**Formato:**
- Enunciado claro e objetivo
- 5 alternativas (A, B, C, D, E)
- Apenas UMA alternativa correta
- Use Markdown para formatação quando apropriado
- Estilo PAVE UFPel: questões que testem raciocínio e conhecimento

**Importante:**
- Cada questão deve ter um ID temporário único (ex: "gen-${Date.now()}-1")
- O campo 'referencia' deve ser sempre "Gerado por IA"
- Gere questões INÉDITAS e variadas

Retorne um objeto JSON seguindo o schema fornecido.`;
}

/**
 * Cria o prompt para geração de flashcards.
 * @param {string} topico - O tópico para os flashcards.
 * @param {number} count - Número de flashcards a gerar.
 * @returns {string} O prompt.
 */
export function createFlashcardGenerationPrompt(topico, count = 5) {
  return `Você é um especialista em criar materiais de estudo para o PAVE UFPel.

**Sua Tarefa:**
Crie ${count} flashcards de estudo sobre o seguinte tópico:

**Tópico:** ${topico}

**Instruções:**
- Cada flashcard deve ter um TERMO/CONCEITO conciso e uma DEFINIÇÃO clara
- As definições devem ser diretas, fáceis de memorizar, mas completas
- Foque nos conceitos mais importantes do tópico
- Varie entre termos, conceitos, processos e fatos relevantes
- Mantenha um tom educativo e apropriado para estudantes

**Formato:**
- Cada flashcard deve ter um ID temporário único (ex: "fc-${Date.now()}-1")
- O termo deve ser curto e direto
- A definição deve ser clara e informativa (1-3 frases)

Retorne um objeto JSON seguindo o schema fornecido.`;
}

/**
 * Cria o prompt atualizado para re-ranking com structured output.
 */
export function createQuestionReRankingPromptV2(userQuery, candidateQuestions, entities) {
  const MAX_CANDIDATES_FOR_RERANKING = 8;
  const questionsForPrompt = candidateQuestions.slice(0, MAX_CANDIDATES_FOR_RERANKING);

  if (questionsForPrompt.length === 0) return null;

  const simplifiedQuestions = questionsForPrompt.map((q) => ({
    id: q.id.toString(),
    materia: q.materia || "N/A",
    topico: q.topico || "N/A",
    preview: createTextPreview(q.texto_questao, 150),
  }));

  let contextMessage = `Query do usuário: "${userQuery}"`;
  if (entities) {
    const entityParts = [];
    if (entities.materia) entityParts.push(`Matéria: '${entities.materia}'`);
    if (entities.topico) entityParts.push(`Tópico: '${entities.topico}'`);
    if (entities.ano) entityParts.push(`Ano: '${entities.ano}'`);
    if (entityParts.length > 0) {
      contextMessage += `\nEntidades detectadas: ${entityParts.join(", ")}`;
    }
  }

  return `Você é um especialista em selecionar questões relevantes do banco de dados do PAVE UFPel.

**Contexto:**
${contextMessage}

**Questões Candidatas (pré-filtradas):**
${JSON.stringify(simplifiedQuestions, null, 2)}

**Sua Tarefa:**
1. Analise a query do usuário e as entidades detectadas
2. Compare com as questões candidatas fornecidas
3. Selecione TODAS as questões que são relevantes para o pedido do usuário
4. Você pode selecionar uma, várias ou nenhuma questão

**Critérios de Seleção:**
- Relevância com o tópico/matéria solicitados
- Adequação ao contexto da pergunta
- Se houver dúvida, INCLUA a questão (é melhor mostrar mais que menos)

Retorne um objeto JSON com os IDs selecionados seguindo o schema fornecido.`;
}

// ========================================
// PROMPTS ANTIGOS (mantidos para compatibilidade)
// ========================================


export function createAnalysisPrompt(history, userQuery) {
  const analysisPrompt = `
      Você é um assistente focado em ajudar estudantes com questões do PAVE UFPel.
      Analise a última mensagem do usuário neste histórico:
      ${JSON.stringify(history)}

      Última mensagem do usuário: "${userQuery}"

      Sua Tarefa:
      1.  Determine a intenção principal: BUSCAR_QUESTAO (mostrar existente), CRIAR_QUESTAO (gerar nova questão de múltipla escolha), CRIAR_FLASHCARDS (gerar flashcards de termo/definição), INFO_PAVE (se o usuário perguntar sobre o PAVE em geral, como regras, datas, funcionamento, sem ser um pedido de questão ou flashcard), CONVERSAR (responder pergunta/comentário geral), DESCONHECIDO.
      1.5. Se o usuário pedir por uma questão mas não falar explicitamente que quer que essa questão seja CRIADA/GERADA ou algum termo similar, detecte como BUSCAR_QUESTAO.
      2.  Se BUSCAR_QUESTAO, CRIAR_QUESTAO, CRIAR_FLASHCARDS ou INFO_PAVE, extraia entidades: 'materia', 'topico', 'ano' (use null se não encontrar). Para CRIAR_FLASHCARDS, 'topico' é o mais importante (ex: "flashcards sobre Revolução Francesa").
      3.  **SE a intenção for CRIAR_QUESTAO:**
          a.  Verifique se o usuário pediu explicitamente por MAIS DE UMA questão (ex: "crie algumas questões", "gere 3 questões", "faça umas questões"). Se não for explícito, gere apenas UMA.
          b.  Gere a(s) questão(ões) INÉDITA(S) de múltipla escolha (A-E) sobre o tópico/descrição extraído, no estilo do PAVE UFPel. Você pode usar markdown.
          c.  **Formate a(s) questão(ões) GERADA(S) como um ARRAY de objetos JSON dentro do campo "generated_questions". Mesmo que você gere apenas UMA questão, coloque-a dentro de um array.** A estrutura de CADA objeto de questão DEVE ser: { "id": "gen-temp-id-${Math.random()}", "materia": "...", "topico": "...", "texto_questao": "...", "alternativas": [ { "letra": "A", "texto": "..." }, ... ], "resposta_letra": "..." }. Use null para matéria/tópico se não conseguir definir. O campo "id" pode ser um placeholder.
          d.  Você PODE fornecer um breve comentário introdutório (ex: "Certo, elaborei estas questões:") no campo "responseText". Se você não fornecer um "responseText" mas criar questões, um comentário padrão será usado.
          e.  Se não conseguir gerar o JSON de questões no formato de array, mas puder gerar o texto das questões, coloque o texto completo em "responseText" e deixe "generated_questions" como null.
          f.  O campo "generated_flashcards" DEVE ser null.
      4.  **SE a intenção for CRIAR_FLASHCARDS:**
          a.  Gere um conjunto de flashcards (termo e definição) sobre o 'topico' extraído.
          b.  **Formate os flashcards GERADOS como um ARRAY de objetos JSON dentro do campo "generated_flashcards".** A estrutura de CADA objeto de flashcard DEVE ser: { "id": "gen-fc-id-${Math.random()}", "term": "Termo conciso", "definition": "Definição concisa" }. O campo "id" pode ser um placeholder.
          c.  Você PODE fornecer um breve comentário introdutório (ex: "Ok, aqui estão alguns flashcards sobre [tópico]:") no campo "responseText(deixe o topico em negrito usando markdown)".
          d.  O campo "generated_questions" DEVE ser null.
      5.  **SE a intenção for INFO_PAVE:**
          a.  Gere uma resposta textual curta e amigável confirmando o pedido de informação e sugerindo consultar a página  (ex: "Para informações detalhadas sobre o PAVE, o ideal é consultar a página de informações ou o edital mais recente."). Coloque essa resposta em "responseText".Você pode usar markdown.
          b.  Os campos "generated_questions" e "generated_flashcards" DEVEM ser null.

      6.  **SE a intenção for CONVERSAR (e não for INFO_PAVE):** Gere uma resposta textual apropriada e coloque-a em "responseText". Os campos "generated_questions" e "generated_flashcards" DEVEM ser null.Você pode usar markdown.
      7.  **SE a intenção for BUSCAR_QUESTAO ou DESCONHECIDO:** Os campos "generated_questions", "generated_flashcards" e "responseText" DEVEM ser null.
      8.  Retorne ESTRITAMENTE um objeto JSON válido com a estrutura:
          {
            "intent": "...",
            "entities": { "materia": "...", "topico": "...", "ano": ... } | null,
            "generated_questions": [ { ... (objeto da questão) ... }, ... ] | null, // << NOTA: PLURAL e ARRAY
            "responseText": "..." | null
          }
      `;
  return analysisPrompt;
}

export function createQuestionGenerationPrompt(subject, topic, customTopic, count) {
  const questionCount = count > 0 ? count : DEFAULT_QUESTION_COUNT;
  const finalTopic = customTopic && customTopic.trim() !== '' ? customTopic.trim() : topic;

  let subjectSpecificInstructions = '';
  switch (subject) {
    case 'História':
      subjectSpecificInstructions = 'A questão deve focar em contextos históricos, análise de períodos, causas e consequências de eventos. Se citar documentos, use o formato de citação em Markdown.';
      break;
    case 'Química':
      subjectSpecificInstructions = 'A questão deve ser conceitual ou envolver cálculos simples. Use a formatação do Markdown para fórmulas químicas (ex: H₂O) e equações.';
      break;
    case 'Biologia':
      subjectSpecificInstructions = 'A questão deve abordar processos biológicos, estruturas, funções ou conceitos ecológicos. Use negrito para destacar termos científicos chave.';
      break;
    // Adicionar outros casos aqui no futuro
    default:
      subjectSpecificInstructions = 'A questão deve ser clara, objetiva e bem formulada.';
  }

  const prompt = `
    Sua tarefa é atuar como um especialista em elaborar questões para o PAVE UFPel.
    Você DEVE gerar ${questionCount} questão(ões) de múltipla escolha (A-E) com base nas seguintes especificações:

    1.  **Matéria Principal:** ${subject}
    2.  **Tópico Específico:** ${finalTopic}
    3.  **Estilo:** A(s) questão(ões) deve(m) seguir o estilo do PAVE UFPel: enunciados claros, que podem incluir textos de apoio, e alternativas que testem o raciocínio e o conhecimento do candidato.
    4.  **Instruções da Matéria:** ${subjectSpecificInstructions}
    5.  **Suporte a Markdown:** Utilize formatação Markdown para melhorar a legibilidade (negrito, itálico, listas, etc.), especialmente para fórmulas ou citações.

    **Formato de Saída OBRIGATÓRIO:**
    Sua resposta deve ser ESTRITAMENTE um objeto JSON. Este objeto JSON deve conter uma única chave chamada "questions", que é um ARRAY de objetos.
    Cada objeto dentro do array representa uma questão e DEVE seguir a seguinte estrutura:
    {
      "id": "gen-id-${Math.random()}", // Pode ser um placeholder
      "materia": "${subject}",
      "topico": "${topic}", // Use o tópico da lista, não o customizado
      "texto_questao": "Enunciado completo da questão aqui. Pode usar markdown.",
      "alternativas": [
        { "letra": "A", "texto": "Texto da alternativa A." },
        { "letra": "B", "texto": "Texto da alternativa B." },
        { "letra": "C", "texto": "Texto da alternativa C." },
        { "letra": "D", "texto": "Texto da alternativa D." },
        { "letra": "E", "texto": "Texto da alternativa E." }
      ],
      "resposta_letra": "C", // A letra correta
      "referencia": "Gerado por IA"
    }

    **Exemplo para uma solicitação de 1 questão:**
    {
      "questions": [
        {
          "id": "gen-id-12345",
          "materia": "História",
          "topico": "Guerra Fria",
          "texto_questao": "Durante a Guerra Fria, a competição entre EUA e URSS se manifestou em diversas áreas. Qual dos eventos abaixo **não** está diretamente relacionado a essa disputa?",
          "alternativas": [
            { "letra": "A", "texto": "A Corrida Espacial." },
            { "letra": "B", "texto": "A Guerra do Vietnã." },
            { "letra": "C", "texto": "A Crise dos Mísseis em Cuba." },
            { "letra": "D", "texto": "A construção do Muro de Berlim." },
            { "letra": "E", "texto": "A Revolução Francesa." }
          ],
          "resposta_letra": "E",
          "referencia": "Gerado por IA"
        }
      ]
    }

    NÃO adicione nenhuma outra palavra, explicação ou formatação fora do objeto JSON. Sua resposta deve ser APENAS o JSON.
  `;
  return prompt;
}

/**
 * Cria o prompt para a IA re-rankear/selecionar a(s) melhor(es) questão(ões).
 * @param {string} userQuery - A query original do usuário.
 * @param {Array} candidateQuestions - Lista CURTA de questões candidatas de alta qualidade.
 * @param {object|null} entities - Entidades extraídas (materia, topico, ano).
 * @returns {string | null} O prompt ou null se não houver candidatas.
 */
export function createQuestionReRankingPrompt(
  userQuery,
  candidateQuestions,
  entities
) {
  const MAX_CANDIDATES_FOR_RERANKING = 8; // Limita quantas enviar para a IA escolher
  const questionsForPrompt = candidateQuestions.slice(
    0,
    MAX_CANDIDATES_FOR_RERANKING
  );

  if (questionsForPrompt.length === 0) return null;

  const simplifiedQuestions = questionsForPrompt.map((q) => ({
    id: q.id.toString(),
    materia: q.materia || "N/A",
    topico: q.topico || "N/A",
    preview: createTextPreview(q.texto_questao, 150),
  }));

  let contextMessage = `O usuário perguntou: "${userQuery}".`;
  if (entities) {
    const entityParts = [];
    if (entities.materia) entityParts.push(`matéria '${entities.materia}'`);
    if (entities.topico) entityParts.push(`tópico '${entities.topico}'`);
    if (entities.ano) entityParts.push(`ano '${entities.ano}'`);
    if (entityParts.length > 0) {
      contextMessage += ` Ele parece interessado em ${entityParts.join(
        " e "
      )}.`;
    }
  }

  // --- MUDANÇA AQUI ---
  return `
Você é um assistente especialista em selecionar questões relevantes do PAVE UFPel.
${contextMessage}

Estas são algumas questões candidatas que PARECEM relevantes (já pré-filtradas):
${JSON.stringify(simplifiedQuestions, null, 2)}

Sua Tarefa:
1.  Reavalie a pergunta do usuário e as entidades em relação às opções fornecidas.
2.  Identifique **TODAS** as questões da lista que são relevantes e fazem sentido com o pedido do usuário. Pode ser uma, várias ou nenhuma voce pode decidir isso baseado no pedido do usuario.
3.  Responda ESTRITAMENTE com um objeto JSON contendo uma lista (array) de IDs das questões selecionadas. A chave deve ser "selected_question_ids".
    *   Se encontrar uma ou mais questões relevantes:
        { "selected_question_ids": ["ID_1", "ID_2", ...] }
    *   Se NENHUMA destas opções for relevante:
        { "selected_question_ids": [] }
4.  NÃO adicione NENHUMA outra palavra, explicação ou formatação fora do objeto JSON. Sua resposta deve ser APENAS o JSON.
`;
}



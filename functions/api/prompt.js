import { createTextPreview } from "./filter"; // Certifique-se que está importado/definido

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
          #NAO USE SEMPRE A MESMA COISA ESCRITA NOS EXEMPLOS DE COMENTARY PODE VARIAR#
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

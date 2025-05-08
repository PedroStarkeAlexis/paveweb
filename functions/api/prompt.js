import { createTextPreview } from "./filter"; // Certifique-se que está importado/definido

export function createAnalysisPrompt(history, userQuery) {
  const analysisPrompt = `
      Você é um assistente focado em ajudar estudantes com questões do PAVE UFPel.
      Analise a última mensagem do usuário neste histórico:
      ${JSON.stringify(history)}

      Última mensagem do usuário: "${userQuery}"

      Sua Tarefa:
      1.  Determine a intenção principal: BUSCAR_QUESTAO (mostrar existente), CRIAR_QUESTAO (gerar nova), CONVERSAR (responder pergunta/comentário), DESCONHECIDO.
      1,5. Se o usario pedir por uma questao mas nao falar que quer que essa questao seja criada gerada ou algum termo do tipo NAO detecte como CRIAR_QUESTAO e sim como BUSCAR_QUESTAO
      2.  Se BUSCAR_QUESTAO ou CRIAR_QUESTAO, extraia entidades: 'materia', 'topico', 'ano' (use null se não encontrar). Tente ser específico (ex: 'Trigonometria' em vez de apenas 'Matem��tica' se possível).
      3.  **SE a intenção for CRIAR_QUESTAO:**
          a.  Gere uma questão INÉDITA de múltipla escolha (A-E) sobre o tópico/descrição extraído, no estilo PAVE voce pode usar markdown para negrito etc.
          b.  **TENTE** formatar essa questão GERADA como um objeto JSON dentro do campo "generated_question". A estrutura DEVE ser: { "materia": "...", "topico": "...", "texto_questao": "...", "alternativas": [ { "letra": "A", "texto": "..." }, ... ], "resposta_letra": "..." }. Use null para matéria/tópico se não conseguir definir.
          c.  Inclua um breve comentário introdutório (exemplo: "Certo, elaborei esta questão:") no início do "responseText" APENAS se o "generated_question" for null.
      4.  **SE a intenção for CONVERSAR:** Gere uma resposta textual apropriada e coloque-a em "responseText". O campo "generated_question" DEVE ser null.
      5.  **SE a intenção for BUSCAR_QUESTAO ou DESCONHECIDO:** Os campos "generated_question" e "responseText" DEVEM ser null.
      6.  Retorne ESTRITAMENTE um objeto JSON válido com a estrutura:
          {
            "intent": "...",
            "entities": { "materia": "...", "topico": "...", "ano": ... } | null,
            "generated_question": { ... (objeto da questão) ... } | null,
            "responseText": "..." | null
          }
      `;
  return analysisPrompt;
}

/**
 * Cria o prompt para a IA re-rankear/selecionar a melhor questão de uma pequena lista de candidatas.
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
  const MAX_CANDIDATES_FOR_RERANKING = 5; // Limita quantas enviar para a IA escolher
  const questionsForPrompt = candidateQuestions.slice(
    0,
    MAX_CANDIDATES_FOR_RERANKING
  );

  if (questionsForPrompt.length === 0) return null;

  const simplifiedQuestions = questionsForPrompt.map((q) => ({
    id: q.id.toString(),
    materia: q.materia || "N/A",
    topico: q.topico || "N/A",
    preview: createTextPreview(q.texto_questao, 150), // Preview um pouco maior talvez
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

  return `
Você é um assistente especialista em selecionar a questão MAIS relevante do PAVE UFPel.
${contextMessage}

Estas são algumas questões candidatas que PARECEM relevantes (já pré-filtradas):
${JSON.stringify(simplifiedQuestions, null, 2)}

Sua Tarefa:
1.  Reavalie a pergunta do usuário e as entidades em relação às opções fornecidas.
2.  Escolha a ÚNICA questão da lista que MELHOR corresponde ao pedido. Seja criterioso.
3.  Se encontrar uma questão PERFEITAMENTE adequada, retorne ESTRITAMENTE um objeto JSON com o ID da questão:
    { "selected_question_id": "ID_DA_QUESTAO_AQUI" }
4.  Se NENHUMA destas opções for realmente um bom match, mesmo sendo pré-filtradas, retorne:
    { "selected_question_id": null }
5.  NÃO adicione NENHUMA outra palavra, explicação ou formatação fora do objeto JSON. Sua resposta deve ser APENAS o JSON.
`;
}

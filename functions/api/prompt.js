// /functions/api/prompt.js
// Responsável por construir o prompt para análise da IA.

/**
 * Cria o prompt para a API Gemini analisar a intenção e extrair entidades.
 * @param {Array} history - O histórico da conversa.
 * @param {string} userQuery - A última mensagem do usuário.
 * @returns {string} O prompt formatado para a API.
 */
export function createAnalysisPrompt(history, userQuery) {
    // Instruções claras para a IA
    const analysisPrompt = `
  Você é um assistente focado em ajudar estudantes com questões do PAVE UFPel.
  Analise a última mensagem do usuário no contexto do histórico da conversa fornecido.
  Histórico:
  ${JSON.stringify(history)}
  
  Última mensagem do usuário: "${userQuery}"
  
  Sua Tarefa:
  1. Determine a intenção principal do usuário. Escolha EXATAMENTE uma das seguintes: BUSCAR_QUESTAO, CRIAR_QUESTAO, CONVERSAR, DESCONHECIDO.
  2. Se a intenção for BUSCAR_QUESTAO ou CRIAR_QUESTAO, extraia entidades relevantes como 'materia', 'topico', 'ano'. Se não encontrar uma entidade específica, use null para seu valor. O tópico deve ser um resumo curto do assunto principal pedido.
  3. **IMPORTANTE:** Se a intenção for CRIAR_QUESTAO ou CONVERSAR, você DEVE gerar uma resposta textual apropriada no campo 'responseText'.
     - Para CRIAR_QUESTAO: Gere uma questão INÉDITA de múltipla escolha (A-E) no estilo do PAVE sobre o tópico/descrição extraído. Formate a questão claramente com as seções: Matéria:, Tópico:, Enunciado:, A) ..., B) ..., C) ..., D) ..., E) ..., Resposta Correta: [Letra]. Inclua um breve comentário introdutório antes da questão, como "Certo, elaborei esta questão:". Coloque TUDO isso dentro do campo 'responseText'.
     - Para CONVERSAR: Gere uma resposta curta e útil à pergunta ou comentário do usuário no campo 'responseText'.
     - Para BUSCAR_QUESTAO ou DESCONHECIDO: O campo 'responseText' DEVE ser null.
  4. Retorne sua análise E a resposta gerada (se aplicável) ESTRITAMENTE como um objeto JSON válido, sem nenhum texto antes ou depois. Use a seguinte estrutura:
  {
    "intent": "SUA_INTENCAO_ESCOLHIDA",
    "entities": { "materia": "...", "topico": "...", "ano": ... }, // Ou null se não aplicável/encontrado
    "responseText": "Seu texto gerado aqui (para CRIAR ou CONVERSAR)" // Ou null para BUSCAR/DESCONHECIDO
  }
  `;
    return analysisPrompt;
  }
  
  // Poderiam existir outras funções de criação de prompt aqui no futuro.
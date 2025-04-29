// functions/api/config.js
import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export const config = {
  // --- Configurações Gerais ---
  maxQuestionsToShow: 3, // Máximo de cards de questão a retornar
  requestKeywords: [ // Palavras que indicam pedido por questões
    'questão', 'questões', 'exercício', 'exercícios',
    'exemplo de prova', 'mostre', 'mande', 'liste', 'quero ver',
    'me dá', 'apresente', 'quais foram'
  ],
  r2FileName: "questoes.json", // Nome do arquivo no R2

  // --- Configurações da API Gemini ---
  gemini: {
    // Tenta usar flash, mas tenha 'gemini-pro' como fallback se necessário
    modelName: "gemini-2.0-flash",
    // Definições de Segurança
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ],
    // generationConfig: { // Configurações opcionais de geração
    //     temperature: 0.7,
    // }
  },

  // --- Prompts e Textos ---
  prompts: {
    // Instrução adicionada ao final do histórico para guiar a decisão da IA
    // Recebe o contexto da busca como argumento
    decisionInstructionTemplate: (contextForAI) => `\n\n[Instrução Interna] Você é um assistente PAVE UFPEL. Analise a conversa acima. Considere o contexto da busca: "${contextForAI}". Se a ÚLTIMA mensagem do usuário pedir explicitamente por exemplos de questões (usando palavras como 'questão', 'exercício', 'mostre', 'liste', etc.), inclua a tag [MOSTRAR_QUESTOES] na sua resposta textual. Caso contrário, apenas responda à última pergunta de forma conversacional e útil. Se o contexto indica que não foram encontradas questões relevantes para um pedido, informe isso ao usuário. Seja conciso.`,

    // Comentário padrão quando o backend decide mostrar questões (se a IA não gerar um)
    // Recebe a contagem e os tópicos como argumentos
    fallbackCommentQuestionsFound: (count, topics) => `Ok! Encontrei ${count} questão(ões) sobre ${topics || 'o tema pedido'}. Aqui estão algumas:`,

    // Mensagens de erro ou fallback para o usuário
    fallbackGenericError: "(Desculpe, não consegui gerar uma resposta completa no momento.)",
    fallbackBlocked: "(Desculpe, não posso responder a isso devido às políticas de segurança.)",
    // Recebe a mensagem de erro da API como argumento
    fallbackApiError: (errorMessage) => `(Desculpe, ocorreu um erro ao contatar a IA: ${errorMessage})`,
    fallbackNoContextFound: "Não encontrei informações relevantes para sua busca nos dados atuais.", // Usado se IA e questões falharem
  }
};

// Para garantir que está exportando corretamente (opcional, mas boa prática)
export default config;
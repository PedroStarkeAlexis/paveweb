import { createTextPreview } from "../filter";

/**
 * Encapsula a chamada para a API Generative AI do Google (Gemini) usando a nova biblioteca @google/genai.
 * @param {Object} params Os parâmetros da chamada.
 * @param {string} params.promptText O prompt completo a ser enviado.
 * @param {import('@google/genai').GoogleGenAI} params.genAIInstance Uma instância do GoogleGenAI.
 * @param {string} [params.modelName="gemini-2.5-flash"] O nome do modelo a ser usado.
 * @param {Array} [params.safetySettings] As configurações de segurança para a chamada.
 * @param {string} [params.callType="generica"] Um identificador para logging do tipo de chamada.
 * @param {Object} [params.responseSchema] Schema para structured output (com Type).
 * @param {string} [params.responseMimeType] Tipo MIME da resposta (ex: "application/json").
 * @param {Array} [params.tools] Ferramentas/functions disponíveis para o modelo.
 * @param {Object} [params.toolConfig] Configuração de tool calling.
 * @param {Object} [params.systemInstruction] Instrução de sistema para o modelo.
 * @param {number} [params.temperature] Temperatura para geração (0-2).
 * @param {number} [params.maxOutputTokens] Número máximo de tokens de saída.
 * @returns {Promise<import('@google/genai').GenerateContentResponse>} A resposta completa da IA.
 */
export async function callGeminiAPI({
  promptText,
  genAIInstance,
  modelName = "gemini-2.5-flash",
  safetySettings = [],
  callType = "generica",
  responseSchema = null,
  responseMimeType = null,
  tools = null,
  toolConfig = null,
  systemInstruction = null,
  temperature = null,
  maxOutputTokens = null,
}) {
  console.log(
    `[LOG] Enviando prompt ${callType.toUpperCase()} para Gemini ${modelName} (${createTextPreview(
      promptText,
      100
    )}...).`
  );

  // Construir o config object
  const config = {};
  
  if (safetySettings && safetySettings.length > 0) {
    config.safetySettings = safetySettings;
  }
  
  if (responseSchema) {
    config.responseSchema = responseSchema;
  }
  
  if (responseMimeType) {
    config.responseMimeType = responseMimeType;
  }
  
  if (tools) {
    config.tools = tools;
  }
  
  if (toolConfig) {
    config.toolConfig = toolConfig;
  }
  
  if (systemInstruction) {
    config.systemInstruction = systemInstruction;
  }
  
  if (temperature !== null) {
    config.temperature = temperature;
  }
  
  if (maxOutputTokens !== null) {
    config.maxOutputTokens = maxOutputTokens;
  }

  // Fazer a chamada usando a nova API
  // A nova API aceita contents como string direta
  const response = await genAIInstance.models.generateContent({
    model: modelName,
    contents: promptText, // String é aceita diretamente
    config: Object.keys(config).length > 0 ? config : undefined,
  });

  // Validações
  if (!response) {
    throw new Error(`Resposta da API Gemini (${callType}) inválida.`);
  }

  if (response.promptFeedback?.blockReason) {
    throw new Error(
      `Bloqueado pela IA (${callType}): ${response.promptFeedback.blockReason}`
    );
  }

  // Log da resposta
  if (response.text) {
    console.log(
      `[LOG] Resposta IA (${callType}): ${createTextPreview(response.text, 150)}`
    );
  } else if (response.functionCalls) {
    console.log(
      `[LOG] Function Calls (${callType}):`, 
      JSON.stringify(response.functionCalls, null, 2)
    );
  }

  return response;
}

/**
 * Helper para extrair texto de uma resposta Gemini.
 * @param {import('@google/genai').GenerateContentResponse} response A resposta da API.
 * @param {string} [callType="generica"] Tipo da chamada para logging.
 * @returns {string} O texto extraído.
 */
export function extractTextFromResponse(response, callType = "generica") {
  // Tentar diferentes formas de acessar o texto
  let text = response.text;
  
  // Se text não existir, tentar acessar de outras formas
  if (!text) {
    // Tentar acessar via candidates
    text = response.candidates?.[0]?.content?.parts?.[0]?.text;
  }
  
  if (!text || text.trim() === "") {
    console.error(`[ERRO] extractTextFromResponse (${callType}): Estrutura da resposta:`, JSON.stringify(response, null, 2));
    throw new Error(`A IA (${callType}) retornou texto vazio ou estrutura inesperada.`);
  }
  
  return text;
}

/**
 * Helper para extrair function calls de uma resposta Gemini.
 * @param {import('@google/genai').GenerateContentResponse} response A resposta da API.
 * @returns {Array|null} Os function calls ou null.
 */
export function extractFunctionCalls(response) {
  return response.functionCalls || null;
}


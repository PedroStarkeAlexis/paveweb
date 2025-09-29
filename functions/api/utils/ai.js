import { createTextPreview } from "../filter";

/**
 * Encapsula a chamada para a API Generative AI do Google (Gemini).
 * @param {string} promptText O prompt completo a ser enviado.
 * @param {GoogleGenerativeAI} genAIInstance Uma instância do GoogleGenerativeAI.
 * @param {string} modelName O nome do modelo a ser usado (ex: "gemini-1.5-flash-latest").
 * @param {Array} safetySettings As configurações de segurança para a chamada.
 * @param {string} [callType="generica"] Um identificador para logging do tipo de chamada.
 * @returns {Promise<string>} O texto da resposta da IA.
 */
export async function callGeminiAPI(
  promptText,
  genAIInstance,
  modelName,
  safetySettings,
  callType = "generica"
) {
  console.log(
    `[LOG] Enviando prompt ${callType.toUpperCase()} para Gemini (${createTextPreview(
      promptText,
      100
    )}...).`
  );
  const model = genAIInstance.getGenerativeModel({ model: modelName });
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: promptText }] }],
    safetySettings,
  });
  const response = result.response;
  if (!response) {
    throw new Error(`Resposta da API Gemini (${callType}) inválida.`);
  }
  if (response.promptFeedback?.blockReason) {
    throw new Error(
      `Bloqueado pela IA (${callType}): ${response.promptFeedback.blockReason}`
    );
  }
  const responseText = response.text
    ? response.text()
    : response.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (!responseText) {
    throw new Error(`A IA (${callType}) retornou texto vazio.`);
  }
  console.log(
    `[LOG] Resposta IA (${callType}): ${createTextPreview(responseText, 150)}`
  );
  return responseText;
}
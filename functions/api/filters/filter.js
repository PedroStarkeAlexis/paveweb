// /functions/api/filter.js
// Contém funções para processar/filtrar dados das questões.

/**
 * Remove acentos de uma string.
 * @param {string} str - A string de entrada.
 * @returns {string} A string sem acentos.
 */
export function removeAccents(str) {
  if (typeof str !== "string") return "";
  try {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch (e) {
    console.warn("Erro em removeAccents:", e, "Input:", str);
    return str || "";
  }
}

/**
 * Cria um preview curto do texto da questão.
 * @param {string} text - O texto completo da questão.
 * @param {number} maxLength - Comprimento máximo do preview.
 * @returns {string}
 */
export function createTextPreview(text, maxLength = 100) {
  if (!text || typeof text !== "string") return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

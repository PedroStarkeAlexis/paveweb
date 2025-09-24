// src/utils/vibration.js

/**
 * Aciona uma vibração curta no dispositivo, se a API de Vibração for suportada.
 * @param {number} duration - A duração da vibração em milissegundos. O padrão é 5ms.
 */
export const triggerVibration = (duration = 5) => {
  try {
    // Verifica se o navigator e a função vibrate existem
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(duration);
    }
  } catch (err) {
    // Falha silenciosamente em ambientes onde `navigator` não está disponível ou é restrito.
    // console.warn("Vibration API is not supported or failed:", err);
  }
};

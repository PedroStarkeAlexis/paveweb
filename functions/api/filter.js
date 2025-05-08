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
 * Tenta parsear texto que PODE conter uma questão, como um fallback.
 * MENOS ROBUSTO que pedir JSON direto para a IA.
 * @param {string} text - Texto que pode conter a questão.
 * @returns {object | null} Objeto de questão ou null.
 */
export function parseAiGeneratedQuestion(text) {
  if (typeof text !== "string" || !text) return null;
  console.log("[filter.js] Tentando parse de fallback...");
  try {
    // Regex muito simples para tentar extrair o básico
    // Procura por Enunciado:, A), B), ..., Resposta Correta: [Letra]
    const questaoMatch = text.match(
      /Enunciado:([\s\S]+)A\)([\s\S]+)B\)([\s\S]+)C\)([\s\S]+)D\)([\s\S]+)E\)([\s\S]+)(?:Resposta Correta|Gabarito):\s*\[?([A-E])\]?/im
    );
    if (questaoMatch) {
      // Captura os grupos do regex
      const [_, enunciado, a, b, c, d, e, resp] = questaoMatch.map((s) =>
        s?.trim()
      ); // Usa trim em cada grupo

      // Validação mínima
      if (!enunciado || !a || !b || !c || !d || !e || !resp) {
        console.warn(
          "[filter.js] Parse fallback: Faltam partes essenciais da questão."
        );
        return null;
      }

      // Cria um objeto básico (sem matéria/tópico extraídos daqui)
      return {
        id: `gen-fallback-${Date.now()}`,
        ano: null,
        etapa: null,
        materia: "Gerada (Fallback)",
        topico: "Gerado (Fallback)",
        texto_questao: enunciado,
        referencia: "Questão gerada por IA (fallback).",
        alternativas: [
          { letra: "A", texto: a },
          { letra: "B", texto: b },
          { letra: "C", texto: c },
          { letra: "D", texto: d },
          { letra: "E", texto: e },
        ],
        resposta_letra: resp.toUpperCase(),
      };
    }
    console.warn(
      "[filter.js] Parse fallback: Regex principal não encontrou correspondência."
    );
    return null; // Falhou no parse simples
  } catch (e) {
    console.error("[filter.js] Erro no parse de fallback:", e);
    return null;
  }
}

/**
 * Filtra um array de questões com base nas entidades extraídas pela IA.
 * @param {object} entities - Objeto com entidades como { materia, ano, topico }.
 * @param {Array} allQuestions - Array completo de objetos de questão.
 * @returns {Array} Array filtrado de questões.
 */
export function findQuestionsByEntities(entities, allQuestions) {
  if (
    !entities ||
    typeof entities !== "object" ||
    !Array.isArray(allQuestions)
  ) {
    return [];
  }
  const { materia, ano, topico } = entities;

  let filtered = allQuestions.filter((q) => {
    if (!q || typeof q !== "object") return false;
    let match = true;
    // Filtragem por matéria (case-insensitive e sem acentos)
    if (
      materia &&
      q.materia &&
      removeAccents(q.materia.toLowerCase()) !==
        removeAccents(materia.toLowerCase())
    ) {
      match = false;
    }
    // Filtragem por ano (numérico)
    if (ano && q.ano && q.ano !== parseInt(ano, 10)) {
      match = false;
    }
    // Filtragem por tópico (palavras-chave)
    if (match && topico) {
      const topicoQuestaoNorm = removeAccents((q.topico || "").toLowerCase());
      const enunciadoQuestaoNorm = removeAccents(
        (q.texto_questao || "").toLowerCase()
      );
      // Extrai palavras chave do tópico pedido (ignora palavras curtas)
      const palavrasTopicoFiltro = removeAccents(topico.toLowerCase())
        .split(/\s+/)
        .filter((p) => p && p.length > 2);
      if (palavrasTopicoFiltro.length > 0) {
        // Verifica se ALGUMA palavra chave do pedido existe no tópico OU enunciado da questão
        const topicoMatchFound = palavrasTopicoFiltro.some(
          (pFiltro) =>
            topicoQuestaoNorm.includes(pFiltro) ||
            enunciadoQuestaoNorm.includes(pFiltro)
        );
        if (!topicoMatchFound) {
          match = false;
        } // Se nenhuma palavra chave bateu, desconsidera a questão
      }
    }
    return match;
  });
  console.log(
    `[filter.js] Encontradas ${filtered.length} questões com entidades:`,
    entities
  );
  // Embaralha resultados para variedade se encontrar mais de uma
  if (filtered.length > 1) {
    filtered.sort(() => 0.5 - Math.random());
  }
  return filtered;
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

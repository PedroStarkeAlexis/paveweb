// /functions/api/filter.js
// Contém funções para processar/filtrar dados das questões.

/**
 * Remove acentos de uma string.
 * @param {string} str - A string de entrada.
 * @returns {string} A string sem acentos.
 */
export function removeAccents(str) {
    if (typeof str !== 'string') return '';
    try { return str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
    catch (e) { console.warn("Erro em removeAccents:", e, "Input:", str); return str || ''; }
}

/**
 * Tenta parsear texto gerado pela IA para um objeto de questão estruturado.
 * @param {string} aiText - O texto completo retornado pela IA.
 * @returns {object | null} Um objeto de questão formatado ou null se o parse falhar.
 */
export function parseAiGeneratedQuestion(aiText) {
    console.log("[filter.js] Tentando parsear texto da IA para questão...");
    if (typeof aiText !== 'string' || !aiText) return null;
    try {
        let enunciado = null; const alternativas = []; let respostaLetra = null;
        let materia = "Indefinida"; let topico = "Indefinido";
        let textoRestante = aiText; const referencia = "Questão gerada por IA.";
        const materiaRegex = /^\s*Matéria[:\s]+([\s\S]*?)(?=\n|$)/im;
        const topicoRegex = /^\s*Tópico[:\s]+([\s\S]*?)(?=\n|$)/im;
        const enunciadoRegex = /^(?:Enunciado|Questão|Pergunta|Leia o texto a seguir)[:\s]*([\s\S]*?)(?=\n\s*[A-Ea-e][).:]\s|\n\s*Resposta Correta:|\n\s*Alternativas:|$)/im;
        const alternativaRegex = /^\s*([A-Ea-e])[).:]\s+([\s\S]*?)(?=\n\s*[A-Ea-e][).:]|\n\s*Resposta Correta:|$)/gm;
        const respostaRegex = /(?:Resposta Correta|Gabarito|Correta)[:\s]*\s*([A-Ea-e])(?:[).:]|\s|$)/i;

        const materiaMatch = textoRestante.match(materiaRegex);
        if (materiaMatch?.[1]) { materia = materiaMatch[1].trim(); textoRestante = textoRestante.replace(materiaMatch[0], '').trim(); }

        const topicoMatch = textoRestante.match(topicoRegex);
        if (topicoMatch?.[1]) { topico = topicoMatch[1].trim(); textoRestante = textoRestante.replace(topicoMatch[0], '').trim(); }

        let textoParaEnunciado = textoRestante;
        const enunciadoMatch = textoParaEnunciado.match(enunciadoRegex);
        let textoParaAlternativas = textoRestante;

        if (enunciadoMatch?.[1]) {
            enunciado = enunciadoMatch[1].trim().replace(/^(Enunciado|Questão|Pergunta)[:\s]*/i, '').trim();
             if (textoParaAlternativas.startsWith(enunciadoMatch[0])) {
                 textoParaAlternativas = textoParaAlternativas.substring(enunciadoMatch[0].length).trim();
             } else {
                 const idxEnunciado = textoParaAlternativas.indexOf(enunciado);
                 if (idxEnunciado !== -1) { textoParaAlternativas = textoParaAlternativas.substring(idxEnunciado + enunciado.length).trim(); }
             }
        } else {
            const firstAltIndex = textoParaAlternativas.search(/^\s*[A-Ea-e][).:]\s+/m);
            if (firstAltIndex > 0) {
                enunciado = textoParaAlternativas.substring(0, firstAltIndex).trim();
                textoParaAlternativas = textoParaAlternativas.substring(firstAltIndex);
            } else { enunciado = textoParaAlternativas; textoParaAlternativas = ""; }
        }
        if (!enunciado) { console.warn("[filter.js] Parse: Enunciado vazio."); return null; }

        let match;
        while ((match = alternativaRegex.exec(textoParaAlternativas)) !== null) {
            if (match.index === alternativaRegex.lastIndex) { alternativaRegex.lastIndex++; }
            const letra = match[1]?.toUpperCase(); const texto = match[2]?.trim();
            if (letra && texto) { alternativas.push({ letra: letra, texto: texto }); }
        }
        if (alternativas.length < 2 && textoParaAlternativas !== "") { console.warn(`[filter.js] Parse: Alternativas insuficientes (${alternativas.length}).`); }

        const respostaMatch = aiText.match(respostaRegex);
        if (respostaMatch?.[1]) {
            respostaLetra = respostaMatch[1].toUpperCase();
            if (!alternativas.some(alt => alt.letra === respostaLetra)) { respostaLetra = null; }
        }
        if (alternativas.length < 2 || !respostaLetra) {
             console.warn("[filter.js] Parse: Estrutura de questão incompleta. Retornando null.");
             return null;
        }

        const generatedQuestion = { id: `gen-${Date.now()}`, ano: null, etapa: null, materia: materia, topico: topico, texto_questao: enunciado, referencia: referencia, alternativas: alternativas, resposta_letra: respostaLetra };
        console.log("[filter.js] Parse: Questão gerada parseada com sucesso.");
        return generatedQuestion;
    } catch (error) { console.error("[filter.js] Parse: Erro inesperado:", error); return null; }
}

/**
 * Filtra um array de questões com base nas entidades extraídas pela IA.
 * @param {object} entities - Objeto com entidades como { materia, ano, topico }.
 * @param {Array} allQuestions - Array completo de objetos de questão.
 * @returns {Array} Array filtrado de questões.
 */
export function findQuestionsByEntities(entities, allQuestions) {
    if (!entities || typeof entities !== 'object' || !Array.isArray(allQuestions)) { return []; }
    const { materia, ano, topico } = entities;

    let filtered = allQuestions.filter(q => {
        if (!q || typeof q !== 'object') return false;
        let match = true;
        if (materia && q.materia && removeAccents(q.materia.toLowerCase()) !== removeAccents(materia.toLowerCase())) { match = false; }
        if (ano && q.ano && q.ano !== parseInt(ano, 10)) { match = false; }
        if (match && topico) {
            const topicoQuestaoNorm = removeAccents((q.topico || '').toLowerCase());
            const enunciadoQuestaoNorm = removeAccents((q.texto_questao || '').toLowerCase());
            const palavrasTopicoFiltro = removeAccents(topico.toLowerCase()).split(/\s+/).filter(p => p && p.length > 2);
            if (palavrasTopicoFiltro.length > 0) {
                const topicoMatchFound = palavrasTopicoFiltro.some(pFiltro => topicoQuestaoNorm.includes(pFiltro) || enunciadoQuestaoNorm.includes(pFiltro));
                if (!topicoMatchFound) { match = false; }
            }
        }
        return match;
    });
    console.log(`[filter.js] Encontradas ${filtered.length} questões com entidades:`, entities);
    if (filtered.length > 1) { filtered.sort(() => 0.5 - Math.random()); } // Shuffle
    return filtered;
}
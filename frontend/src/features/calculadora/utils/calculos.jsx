// src/utils/calculos.js

// Importa as constantes necessárias
import {
  PONTOS_ACERTO_E1E2,
  PENALIDADE_ERRO_E1E2,
  PONTOS_ACERTO_E3_OBJ,
  PENALIDADE_ERRO_E3_OBJ,
  TOTAL_QUESTOES,
  PESO_ETAPA_1,
  PESO_ETAPA_2,
  PESO_ETAPA_3,
  SOMA_PESOS,
  NOTA_MIN_REDAÇÃO,
  NOTA_MAX_REDAÇÃO,
  BASE_CALCULO_PORCENTAGEM,
  NOTA_MIN_GERAL,
  ETAPA_VIEW_1, // Garanta que estas estão sendo importadas
  ETAPA_VIEW_2, // Garanta que estas estão sendo importadas
  ETAPA_VIEW_3  // Garanta que estas estão sendo importadas
} from '../constants'; // Ajuste o caminho se necessário

/**
 * Calcula a nota bruta de uma etapa específica (sem incluir redação aqui).
 * @param {number} etapa - O número da etapa (1, 2 ou 3).
 * @param {number} numAcertos - Número de acertos na etapa.
 * @param {number} numIgnoradas - Número de questões ignoradas (I.R.).
 * @returns {number} A nota calculada para a etapa (mínimo NOTA_MIN_GERAL).
 */
export function calcularNotaEtapa(etapa, numAcertos, numIgnoradas) {
  const acertos = numAcertos || 0;
  const ignoradas = numIgnoradas || 0;

  const acertosValidos = Math.max(NOTA_MIN_GERAL, acertos);
  const ignoradasValidas = Math.max(NOTA_MIN_GERAL, ignoradas);

  if (acertosValidos + ignoradasValidas > TOTAL_QUESTOES) {
     console.warn("Soma de acertos e ignoradas excede o total de questões.");
     return NOTA_MIN_GERAL;
  }

  const erros = TOTAL_QUESTOES - acertosValidos - ignoradasValidas;
  let nota = 0;

  // Usando constantes para os números das etapas se importadas, senão números direto
  if (etapa === ETAPA_VIEW_1 || etapa === ETAPA_VIEW_2) {
    nota = (acertosValidos * PONTOS_ACERTO_E1E2) - (erros * PENALIDADE_ERRO_E1E2);
  } else if (etapa === ETAPA_VIEW_3) {
    nota = (acertosValidos * PONTOS_ACERTO_E3_OBJ) - (erros * PENALIDADE_ERRO_E3_OBJ);
  } else {
    console.warn(`Etapa inválida fornecida: ${etapa}`);
    return NOTA_MIN_GERAL;
  }

  return Math.max(NOTA_MIN_GERAL, nota); // Garante que a nota nunca seja negativa
}

/**
 * Calcula a nota final ponderada do PAVE.
 * @param {object} notasEtapas - Objeto com as notas das etapas objetivas { 1: nota1, 2: nota2, 3: nota3_obj }.
 * @param {number} notaRedacaoInput - A nota da redação (0-14) inserida pelo usuário.
 * @param {boolean} incluirRedacao - Flag indicando se a redação deve ser incluída.
 * @returns {string} A nota final formatada com duas casas decimais.
 */
export function calcularNotaFinal(notasEtapas, notaRedacaoInput, incluirRedacao) {
  const notaEtapa1 = notasEtapas[ETAPA_VIEW_1] || 0;
  const notaEtapa2 = notasEtapas[ETAPA_VIEW_2] || 0;
  let notaEtapa3Combinada = notasEtapas[ETAPA_VIEW_3] || 0;

  if (incluirRedacao) {
    // Garante que a nota da redação esteja dentro dos limites definidos
    const redacaoValida = Math.max(NOTA_MIN_REDAÇÃO, Math.min(NOTA_MAX_REDAÇÃO, notaRedacaoInput || 0));
    notaEtapa3Combinada += redacaoValida;
  }

  const notaFinalCalculada = (
    (notaEtapa1 * PESO_ETAPA_1) +
    (notaEtapa2 * PESO_ETAPA_2) +
    (notaEtapa3Combinada * PESO_ETAPA_3)
  ) / SOMA_PESOS;

  // Garante que a nota final também não seja negativa (embora improvável com Math.max nas etapas)
  return Math.max(NOTA_MIN_GERAL, notaFinalCalculada).toFixed(2);
}

/**
 * Calcula a porcentagem de contribuição de uma nota de etapa para a nota final máxima teórica.
 * @param {number} nota - A nota da etapa (para Etapa 3 no ResultadoFinal, pode ser a nota objetiva ou a nota da redação).
 * @param {number} etapa - O número da etapa (1, 2 ou 3) para determinar o peso.
 * @returns {number} A porcentagem de contribuição.
 */
export function calcularPorcentagemEtapa(nota, etapa) {
  let peso = 0;
  if (etapa === ETAPA_VIEW_1) peso = PESO_ETAPA_1;
  else if (etapa === ETAPA_VIEW_2) peso = PESO_ETAPA_2;
  else if (etapa === ETAPA_VIEW_3) peso = PESO_ETAPA_3; // Redação também usa PESO_ETAPA_3

  if (peso === 0 || BASE_CALCULO_PORCENTAGEM === 0) return 0; // Evita divisão por zero

  // Garante que a nota usada para % não seja negativa
  const notaPositiva = Math.max(NOTA_MIN_GERAL, nota || 0);
  return ( (notaPositiva * peso) / BASE_CALCULO_PORCENTAGEM ) * 100;
}
// src/features/calculadora/utils/calculos.js

// ... (imports e funções existentes: calcularNotaEtapa, calcularNotaFinal, calcularPorcentagemEtapa) ...


/**
 * Calcula a classificação de chances com base na nota do usuário e na nota de corte.
 * @param {number} notaUsuario - A nota final calculada do usuário (como número).
 * @param {number} notaCorte - A nota de corte do curso selecionado.
 * @returns {string} A classificação das chances ('Altas', 'Médias', 'Baixas').
 */
export function calcularChances(notaUsuario, notaCorte) {
  // Garante que estamos comparando números
  const numUsuario = parseFloat(notaUsuario) || 0;
  const numCorte = parseFloat(notaCorte) || 0;

  // Caso a nota de corte seja 0 ou inválida, retorna indeterminado
  if (numCorte <= 0) {
    return 'Indeterminadas';
  }

  if (numUsuario >= numCorte) {
    return 'Altas';
  } else if (numUsuario >= numCorte * 0.95) { // Limite inferior para Médias
    return 'Médias';
  } else { // Tudo abaixo de 95% da nota de corte
    return 'Baixas';
  }
}
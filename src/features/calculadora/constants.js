// src/features/calculadora/constants.js

// --- Configuração Geral ---
export const TOTAL_QUESTOES = 32;

// --- Pontuação Etapas 1 e 2 ---
export const PONTOS_ACERTO_E1E2 = 3.125;
export const PENALIDADE_ERRO_E1E2 = 0.3125;

// --- Pontuação Etapa 3 (Objetiva) ---
export const PONTOS_ACERTO_E3_OBJ = 2.6875;
export const PENALIDADE_ERRO_E3_OBJ = 0.26875;

// --- Pontuação Redação ---
export const NOTA_MIN_REDAÇÃO = 0;
export const NOTA_MAX_REDAÇÃO = 14;

// --- Pesos das Etapas para Nota Final ---
export const PESO_ETAPA_1 = 1;
export const PESO_ETAPA_2 = 2;
export const PESO_ETAPA_3 = 3;
export const SOMA_PESOS = PESO_ETAPA_1 + PESO_ETAPA_2 + PESO_ETAPA_3;

// --- Cálculo de Porcentagem ---
export const BASE_CALCULO_PORCENTAGEM = 600;

// --- Limites Gerais ---
export const NOTA_MIN_GERAL = 0;

// --- Identificadores das Etapas PAVE (Usados na Lógica de Cálculo) ---
export const ETAPA_VIEW_1 = 1; // Mantido
export const ETAPA_VIEW_2 = 2; // Mantido
export const ETAPA_VIEW_3 = 3; // Mantido
// export const ETAPA_VIEW_REDAÇÃO = 4; // REMOVIDO
// export const ETAPA_VIEW_RESULTADO = 5; // REMOVIDO

// --- Constantes para o Fluxo do Wizard ---
export const WIZARD_STEPS = {
    SELECAO_ETAPAS: 0,
    ETAPA_1: 1,
    ETAPA_2: 2,
    ETAPA_3: 3,
    REDACAO: 4,
    CURSO: 5,
    RESULTADO: 6,
};
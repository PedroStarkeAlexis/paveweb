/* eslint-env jest */
/* global describe, test, expect, jest */
// src/utils/calculos.test.js
import { calcularNotaEtapa, calcularNotaFinal, calcularPorcentagemEtapa } from './calculos';
// Importa as constantes REAIS para usar nos testes
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
  ETAPA_VIEW_1,
  ETAPA_VIEW_2,
  ETAPA_VIEW_3
} from '../constants'; // Ajuste o caminho se necessário


describe('Funções de Cálculo PAVE', () => {
  // --- Testes para calcularNotaEtapa ---
  describe('calcularNotaEtapa', () => {
    test('Etapa 1: Max score', () => {
      expect(calcularNotaEtapa(ETAPA_VIEW_1, TOTAL_QUESTOES, 0)).toBeCloseTo(TOTAL_QUESTOES * PONTOS_ACERTO_E1E2);
    });
    test('Etapa 2: Zero score (ignoradas)', () => {
      expect(calcularNotaEtapa(ETAPA_VIEW_2, 0, TOTAL_QUESTOES)).toBeCloseTo(NOTA_MIN_GERAL);
    });
    test('Etapa 1: Alguns erros', () => {
      const acertos = 20;
      const ignoradas = 5;
      const erros = TOTAL_QUESTOES - acertos - ignoradas;
      const expected = (acertos * PONTOS_ACERTO_E1E2) - (erros * PENALIDADE_ERRO_E1E2);
      expect(calcularNotaEtapa(ETAPA_VIEW_1, acertos, ignoradas)).toBeCloseTo(expected);
    });
     test('Etapa 2: Nota negativa vira 0', () => {
      const acertos = 1;
      const ignoradas = 0;
      // const erros = TOTAL_QUESTOES - acertos - ignoradas; // 31
      // const expectedRaw = (acertos * PONTOS_ACERTO_E1E2) - (erros * PENALIDADE_ERRO_E1E2); // Negativo
      expect(calcularNotaEtapa(ETAPA_VIEW_2, acertos, ignoradas)).toBeCloseTo(NOTA_MIN_GERAL);
    });
     test('Etapa 3: Max score obj', () => {
      expect(calcularNotaEtapa(ETAPA_VIEW_3, TOTAL_QUESTOES, 0)).toBeCloseTo(TOTAL_QUESTOES * PONTOS_ACERTO_E3_OBJ);
    });
    // ... (outros testes de calcularNotaEtapa similares, usando constantes) ...
     test('Input inválido (soma > TOTAL_QUESTOES)', () => {
       const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
       expect(calcularNotaEtapa(ETAPA_VIEW_1, TOTAL_QUESTOES - 5, 10)).toBe(NOTA_MIN_GERAL);
       expect(consoleSpy).toHaveBeenCalledWith("Soma de acertos e ignoradas excede o total de questões.");
       consoleSpy.mockRestore();
     });
     test('Etapa inválida', () => {
       const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
       expect(calcularNotaEtapa(99, 10, 10)).toBe(NOTA_MIN_GERAL);
       expect(consoleSpy).toHaveBeenCalledWith("Etapa inválida fornecida: 99");
       consoleSpy.mockRestore();
     });
  });

  // --- Testes para calcularNotaFinal ---
  describe('calcularNotaFinal', () => {
    const notasObj = { [ETAPA_VIEW_1]: 60, [ETAPA_VIEW_2]: 70, [ETAPA_VIEW_3]: 80 };
    test('Incluindo redação (nota 10)', () => {
        const notaRed = 10;
        const incluirRed = true;
        const notaEtapa3Combinada = notasObj[ETAPA_VIEW_3] + notaRed;
        const expected = ((notasObj[ETAPA_VIEW_1] * PESO_ETAPA_1) + (notasObj[ETAPA_VIEW_2] * PESO_ETAPA_2) + (notaEtapa3Combinada * PESO_ETAPA_3)) / SOMA_PESOS;
        expect(calcularNotaFinal(notasObj, notaRed, incluirRed)).toBe(expected.toFixed(2));
    });
     test('Não incluindo redação', () => {
        const notaRed = 10;
        const incluirRed = false;
        const notaEtapa3Combinada = notasObj[ETAPA_VIEW_3];
        const expected = ((notasObj[ETAPA_VIEW_1] * PESO_ETAPA_1) + (notasObj[ETAPA_VIEW_2] * PESO_ETAPA_2) + (notaEtapa3Combinada * PESO_ETAPA_3)) / SOMA_PESOS;
        expect(calcularNotaFinal(notasObj, notaRed, incluirRed)).toBe(expected.toFixed(2));
    });
    // ... (outros testes de calcularNotaFinal similares, usando constantes) ...
     test('Nota redação inválida (> MAX) é limitada', () => {
       const notasObj = { 1: 50, 2: 50, 3: 50 };
       const notaEtapa3Combinada = 50 + NOTA_MAX_REDAÇÃO; // Usa NOTA_MAX_REDAÇÃO
       const expected = ((50 * PESO_ETAPA_1) + (50 * PESO_ETAPA_2) + (notaEtapa3Combinada * PESO_ETAPA_3)) / SOMA_PESOS;
       expect(calcularNotaFinal(notasObj, NOTA_MAX_REDAÇÃO + 5, true)).toBe(expected.toFixed(2));
     });
     test('Nota redação inválida (< MIN) é limitada', () => {
       const notasObj = { 1: 50, 2: 50, 3: 50 };
       const notaEtapa3Combinada = 50 + NOTA_MIN_REDAÇÃO; // Usa NOTA_MIN_REDAÇÃO
       const expected = ((50 * PESO_ETAPA_1) + (50 * PESO_ETAPA_2) + (notaEtapa3Combinada * PESO_ETAPA_3)) / SOMA_PESOS;
       expect(calcularNotaFinal(notasObj, NOTA_MIN_REDAÇÃO - 5, true)).toBe(expected.toFixed(2));
     });
  });

  // --- Testes para calcularPorcentagemEtapa ---
  describe('calcularPorcentagemEtapa', () => {
    test('Etapa 1: Nota 50', () => {
        expect(calcularPorcentagemEtapa(50, ETAPA_VIEW_1)).toBeCloseTo((50 * PESO_ETAPA_1 / BASE_CALCULO_PORCENTAGEM) * 100);
    });
    test('Etapa 2: Nota 80', () => {
        expect(calcularPorcentagemEtapa(80, ETAPA_VIEW_2)).toBeCloseTo((80 * PESO_ETAPA_2 / BASE_CALCULO_PORCENTAGEM) * 100);
    });
    test('Etapa 3: Nota 90 (para % objetiva ou redação)', () => {
        expect(calcularPorcentagemEtapa(90, ETAPA_VIEW_3)).toBeCloseTo((90 * PESO_ETAPA_3 / BASE_CALCULO_PORCENTAGEM) * 100);
    });
    // ... (outros testes de calcularPorcentagemEtapa similares, usando constantes) ...
  });
});
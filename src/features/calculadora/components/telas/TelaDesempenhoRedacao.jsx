// src/features/calculadora/components/telas/TelaDesempenhoRedacao.jsx
import React from 'react';
import { NOTA_MIN_REDAÇÃO, NOTA_MAX_REDAÇÃO } from '../../constants';
import { triggerVibration } from '../../../../utils/vibration';
import '../../styles/WizardButtons.css';
import './TelaDesempenhoRedacao.css';

function TelaDesempenhoRedacao({ onChange, values, onNextStep, isNextStepDisabled, nextStepText }) {
  const { incluirRedacao, notaRedacao } = values;

  const handleIncrement = () => {
    const currentValue = parseFloat(notaRedacao) || 0;
    if (currentValue < NOTA_MAX_REDAÇÃO) {
      const newValue = Math.min(currentValue + 0.5, NOTA_MAX_REDAÇÃO);
      onChange('notaRedacao', String(newValue));
      triggerVibration();
    }
  };

  const handleDecrement = () => {
    const currentValue = parseFloat(notaRedacao) || 0;
    if (currentValue > NOTA_MIN_REDAÇÃO) {
      const newValue = Math.max(currentValue - 0.5, NOTA_MIN_REDAÇÃO);
      onChange('notaRedacao', String(newValue));
      triggerVibration();
    }
  };

  return (
    <div className="calc-tela-redacao">
      <h2 className="calc-tela-titulo">Deseja incluir a Redação?</h2>
      <p className="calc-tela-subtitulo">
        Selecione se deseja incluir a nota da redação no cálculo (0 a {NOTA_MAX_REDAÇÃO})
      </p>

      <div className="wizard-buttons-container">
        <button
          className={`wizard-option-button ${incluirRedacao === true ? 'selected' : ''}`}
          onClick={() => {
            triggerVibration(10);
            onChange('incluirRedacao', true);
          }}
        >
          Sim, incluir Redação
        </button>
        <button
          className={`wizard-option-button ${incluirRedacao === false ? 'selected' : ''}`}
          onClick={() => {
            triggerVibration(10);
            onChange('incluirRedacao', false);
          }}
        >
          Não incluir
        </button>

        {incluirRedacao === true && (
          <div className="wizard-input-group" style={{ marginTop: '16px' }}>
            <label htmlFor="notaRedacao" className="wizard-input-label">Qual foi sua nota?</label>
            <div className="wizard-input-with-buttons">
              <button 
                type="button"
                className="wizard-stepper-button"
                onClick={handleDecrement}
                disabled={!notaRedacao || notaRedacao <= NOTA_MIN_REDAÇÃO}
                aria-label="Diminuir nota"
              >
                −
              </button>
              <input
                type="number"
                id="notaRedacao"
                name="notaRedacao"
                value={notaRedacao}
                onChange={(e) => onChange('notaRedacao', e.target.value)}
                min={NOTA_MIN_REDAÇÃO}
                max={NOTA_MAX_REDAÇÃO}
                step="0.1"
                placeholder="Digite sua nota"
                className="wizard-input-field"
              />
              <button 
                type="button"
                className="wizard-stepper-button"
                onClick={handleIncrement}
                disabled={notaRedacao >= NOTA_MAX_REDAÇÃO}
                aria-label="Aumentar nota"
              >
                +
              </button>
            </div>
          </div>
        )}

        {incluirRedacao === false && (
          <p style={{ 
            fontSize: '0.9rem', 
            color: 'var(--calculator-text-secondary)', 
            textAlign: 'center',
            marginTop: '16px'
          }}>
            A nota da redação não será considerada no cálculo.
          </p>
        )}
      </div>

      {/* Primary action button is rendered globally in CalculadoraPage to avoid duplication */}
    </div>
  );
}

export default TelaDesempenhoRedacao;
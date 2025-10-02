// src/features/calculadora/components/telas/TelaDesempenhoRedacao.jsx
import React from 'react';
import { NOTA_MIN_REDAÇÃO, NOTA_MAX_REDAÇÃO } from '../../constants';
import { triggerVibration } from '../../../../utils/vibration';
import '../../styles/WizardButtons.css';
import './TelaDesempenhoRedacao.css';

function TelaDesempenhoRedacao({ onChange, values, onNextStep, isNextStepDisabled, nextStepText }) {
  const { incluirRedacao, notaRedacao } = values;

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

      <div style={{ marginTop: '32px', textAlign: 'center', padding: '0 16px', width: '100%' }}>
        <button
          className="wizard-primary-button"
          onClick={() => {
            triggerVibration(5);
            onNextStep();
          }}
          disabled={isNextStepDisabled}
        >
          {nextStepText}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /> </svg>
        </button>
      </div>
    </div>
  );
}

export default TelaDesempenhoRedacao;
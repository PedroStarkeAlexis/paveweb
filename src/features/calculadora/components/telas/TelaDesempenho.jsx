import React from 'react';
import { TOTAL_QUESTOES } from '../../constants';
import './TelaDesempenho.css';
import '../shared/NextStepButton.css';

function TelaDesempenho({ etapaNumero, onChange, values, errors, onNextStep, isNextStepDisabled, nextStepText }) {
  const acertosKey = `acertosE${etapaNumero}`;
  const ignoradasKey = `ignoradasE${etapaNumero}`;
  const errorKey = `etapa${etapaNumero}`;

  return (
    <div className="calc-tela-desempenho">
      <h2 className="calc-tela-titulo">Como foi seu desempenho na <strong>Etapa {etapaNumero}</strong>?</h2>
      <p className="calc-tela-subtitulo">Informe seus acertos e respostas ignoradas (I.R.).</p>
      <p className="calc-max-info">(Máximo: {TOTAL_QUESTOES} questões - Acertos + I.R.)</p>

      <div className="calc-input-group">
        <div className="calc-input-item">
          <label htmlFor={acertosKey}>Acertos</label>
          <input
            type="number"
            id={acertosKey}
            name={acertosKey}
            value={values[acertosKey]}
            onChange={(e) => onChange(etapaNumero, 'acertos', e.target.value)}
            min="0"
            max={TOTAL_QUESTOES}
            placeholder="0"
            aria-invalid={!!errors[errorKey]}
            aria-describedby={errors[errorKey] ? `${errorKey}-error` : undefined}
            className="calc-input-desempenho"
          />
        </div>

        <div className="calc-input-item">
          <label htmlFor={ignoradasKey}>I.R.</label>
          <input
            type="number"
            id={ignoradasKey}
            name={ignoradasKey}
            value={values[ignoradasKey]}
            onChange={(e) => onChange(etapaNumero, 'ignoradas', e.target.value)}
            min="0"
            max={TOTAL_QUESTOES}
            placeholder="0"
            aria-invalid={!!errors[errorKey]}
            aria-describedby={errors[errorKey] ? `${errorKey}-error` : undefined}
            className="calc-input-desempenho"
          />
        </div>
      </div>

      {errors[errorKey] && (
        <p id={`${errorKey}-error`} className="calc-error-message" role="alert">
          {errors[errorKey]}
        </p>
      )}

      <div className="calc-next-step-button-container">
        <button
          className="calc-step-next-button"
          onClick={onNextStep}
          disabled={isNextStepDisabled}
        >
          {nextStepText}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /> </svg>
        </button>
      </div>
    </div>
  );
}

export default TelaDesempenho;
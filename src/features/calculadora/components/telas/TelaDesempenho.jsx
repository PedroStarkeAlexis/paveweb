import React from 'react';
import { TOTAL_QUESTOES } from '../../constants';
import { triggerVibration } from '../../../../utils/vibration';
import '../../styles/WizardButtons.css';
import './TelaDesempenho.css';

function TelaDesempenho({ etapaNumero, onChange, values, errors, onNextStep, isNextStepDisabled, nextStepText }) {
  const acertosKey = `acertosE${etapaNumero}`;
  const ignoradasKey = `ignoradasE${etapaNumero}`;
  const errorKey = `etapa${etapaNumero}`;

  // Handler for increment/decrement buttons
  const handleIncrement = (campo) => {
    const key = campo === 'acertos' ? acertosKey : ignoradasKey;
    const currentValue = parseInt(values[key], 10) || 0;
    if (currentValue < TOTAL_QUESTOES) {
      triggerVibration(1);
      onChange(etapaNumero, campo, String(currentValue + 1));
    }
  };

  const handleDecrement = (campo) => {
    const key = campo === 'acertos' ? acertosKey : ignoradasKey;
    const currentValue = parseInt(values[key], 10) || 0;
    if (currentValue > 0) {
      triggerVibration(1);
      onChange(etapaNumero, campo, String(currentValue - 1));
    }
  };

  return (
    <div className="calc-tela-desempenho">
      <h2 className="calc-tela-titulo">Como foi seu desempenho na Etapa {etapaNumero}?</h2>
      <p className="calc-tela-subtitulo">
        Informe seus acertos e respostas ignoradas (I.R.). Máximo: {TOTAL_QUESTOES} questões.
      </p>

      <div className="wizard-buttons-container">
        <div className="wizard-input-group">
          <label htmlFor={acertosKey} className="wizard-input-label">Acertos</label>
          <div className="wizard-input-with-buttons">
            <button
              type="button"
              className="wizard-stepper-button"
              onClick={() => handleDecrement('acertos')}
              aria-label="Diminuir acertos"
            >
              −
            </button>
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
              className={`wizard-input-field ${errors[errorKey] ? 'wizard-input-error' : ''}`}
            />
            <button
              type="button"
              className="wizard-stepper-button"
              onClick={() => handleIncrement('acertos')}
              aria-label="Aumentar acertos"
            >
              +
            </button>
          </div>
        </div>

        <div className="wizard-input-group">
          <label htmlFor={ignoradasKey} className="wizard-input-label">I.R. (Ignoradas)</label>
          <div className="wizard-input-with-buttons">
            <button
              type="button"
              className="wizard-stepper-button"
              onClick={() => handleDecrement('ignoradas')}
              aria-label="Diminuir ignoradas"
            >
              −
            </button>
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
              className={`wizard-input-field ${errors[errorKey] ? 'wizard-input-error' : ''}`}
            />
            <button
              type="button"
              className="wizard-stepper-button"
              onClick={() => handleIncrement('ignoradas')}
              aria-label="Aumentar ignoradas"
            >
              +
            </button>
          </div>
        </div>

        {errors[errorKey] && (
          <p id={`${errorKey}-error`} className="wizard-error-message" role="alert">
            {errors[errorKey]}
          </p>
        )}
      </div>

      {/* Primary action button is rendered globally in CalculadoraPage to avoid duplication */}
    </div>
  );
}

export default TelaDesempenho;
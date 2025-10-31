import React from 'react';
import { TOTAL_QUESTOES } from '../../constants';
import StepperInput from '../shared/StepperInput';
import '../../styles/WizardButtons.css';
import './TelaDesempenho.css';

function TelaDesempenho({ etapaNumero, onChange, values, errors }) {
  const acertosKey = `acertosE${etapaNumero}`;
  const ignoradasKey = `ignoradasE${etapaNumero}`;
  const errorKey = `etapa${etapaNumero}`;

  // Handlers for increment/decrement
  const handleAcertosIncrement = () => {
    const currentValue = parseInt(values[acertosKey], 10) || 0;
    if (currentValue < TOTAL_QUESTOES) {
      onChange(etapaNumero, 'acertos', String(currentValue + 1));
    }
  };

  const handleAcertosDecrement = () => {
    const currentValue = parseInt(values[acertosKey], 10) || 0;
    if (currentValue > 0) {
      onChange(etapaNumero, 'acertos', String(currentValue - 1));
    }
  };

  const handleIgnoradasIncrement = () => {
    const currentValue = parseInt(values[ignoradasKey], 10) || 0;
    if (currentValue < TOTAL_QUESTOES) {
      onChange(etapaNumero, 'ignoradas', String(currentValue + 1));
    }
  };

  const handleIgnoradasDecrement = () => {
    const currentValue = parseInt(values[ignoradasKey], 10) || 0;
    if (currentValue > 0) {
      onChange(etapaNumero, 'ignoradas', String(currentValue - 1));
    }
  };

  return (
    <div className="calc-tela-desempenho">
      <h2 className="calc-tela-titulo">Como foi seu desempenho na Etapa {etapaNumero}?</h2>
      <p className="calc-tela-subtitulo">
        Informe seus acertos e respostas ignoradas (I.R.). Máximo: {TOTAL_QUESTOES} questões.
      </p>

      <div className="wizard-buttons-container">
        <StepperInput
          label="Acertos"
          id={acertosKey}
          name={acertosKey}
          value={values[acertosKey]}
          onChange={(e) => onChange(etapaNumero, 'acertos', e.target.value)}
          onIncrement={handleAcertosIncrement}
          onDecrement={handleAcertosDecrement}
          min={0}
          max={TOTAL_QUESTOES}
          hasError={!!errors[errorKey]}
          ariaDescribedBy={errors[errorKey] ? `${errorKey}-error` : undefined}
        />

        <StepperInput
          label="I.R. (Ignoradas)"
          id={ignoradasKey}
          name={ignoradasKey}
          value={values[ignoradasKey]}
          onChange={(e) => onChange(etapaNumero, 'ignoradas', e.target.value)}
          onIncrement={handleIgnoradasIncrement}
          onDecrement={handleIgnoradasDecrement}
          min={0}
          max={TOTAL_QUESTOES}
          hasError={!!errors[errorKey]}
          ariaDescribedBy={errors[errorKey] ? `${errorKey}-error` : undefined}
        />

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
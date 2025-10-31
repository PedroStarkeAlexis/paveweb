// src/features/calculadora/components/shared/StepperInput.jsx
import React from 'react';
import { triggerVibration } from '../../../../utils/vibration';
import '../../styles/WizardButtons.css';

/**
 * StepperInput - Componente reutilizável para inputs numéricos com botões de incremento/decremento
 * 
 * @param {Object} props
 * @param {string} props.label - Texto do label do campo
 * @param {string} props.id - ID do input (para acessibilidade)
 * @param {string} props.name - Nome do input
 * @param {string|number} props.value - Valor atual do input
 * @param {Function} props.onChange - Callback quando o valor muda (e: Event) => void
 * @param {Function} props.onIncrement - Callback para incrementar o valor
 * @param {Function} props.onDecrement - Callback para decrementar o valor
 * @param {number} props.min - Valor mínimo permitido
 * @param {number} props.max - Valor máximo permitido
 * @param {string} [props.step='1'] - Incremento do input (padrão: '1')
 * @param {string} [props.placeholder='0'] - Placeholder do input
 * @param {boolean} [props.hasError=false] - Se deve mostrar estado de erro
 * @param {string} [props.ariaDescribedBy] - ID do elemento que descreve o erro
 * @param {string} [props.decrementLabel='Diminuir'] - Label do botão de decrementar
 * @param {string} [props.incrementLabel='Aumentar'] - Label do botão de incrementar
 */
function StepperInput({
  label,
  id,
  name,
  value,
  onChange,
  onIncrement,
  onDecrement,
  min = 0,
  max,
  step = '1',
  placeholder = '0',
  hasError = false,
  ariaDescribedBy,
  decrementLabel = 'Diminuir',
  incrementLabel = 'Aumentar'
}) {
  const currentValue = parseFloat(value) || 0;
  const isAtMin = currentValue <= min;
  const isAtMax = max !== undefined && currentValue >= max;

  const handleIncrement = () => {
    if (!isAtMax) {
      triggerVibration(1);
      onIncrement();
    }
  };

  const handleDecrement = () => {
    if (!isAtMin) {
      triggerVibration(1);
      onDecrement();
    }
  };

  return (
    <div className="wizard-input-group">
      <label htmlFor={id} className="wizard-input-label">
        {label}
      </label>
      <div className="wizard-input-with-buttons">
        <button
          type="button"
          className="wizard-stepper-button"
          onClick={handleDecrement}
          disabled={isAtMin}
          aria-label={`${decrementLabel} ${label.toLowerCase()}`}
        >
          −
        </button>
        <input
          type="number"
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          aria-invalid={hasError}
          aria-describedby={ariaDescribedBy}
          className={`wizard-input-field ${hasError ? 'wizard-input-error' : ''}`}
        />
        <button
          type="button"
          className="wizard-stepper-button"
          onClick={handleIncrement}
          disabled={isAtMax}
          aria-label={`${incrementLabel} ${label.toLowerCase()}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default StepperInput;

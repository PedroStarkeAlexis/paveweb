// src/features/calculadora/components/Stepper.jsx
import React from 'react';
import './Stepper.css'; // Importaremos o CSS que criaremos a seguir
import { WIZARD_STEPS } from '../constants';
// Mapeamento de etapas do wizard para evitar hardcoding de números mágicos


function Stepper({ currentStep }) {
  // Definindo a ordem e o número total de passos ANTES do resultado
  const stepsInFlow = [
    WIZARD_STEPS.ETAPA_1,
    WIZARD_STEPS.ETAPA_2,
    WIZARD_STEPS.ETAPA_3,
    WIZARD_STEPS.REDACAO,
    WIZARD_STEPS.CURSO,
  ];
  const totalStepsInFlow = stepsInFlow.length;

  // Não mostrar o stepper na tela de resultado
  if (currentStep === WIZARD_STEPS.RESULTADO) {
    return null;
  }

  return (
    <div className="calc-stepper-container">
      {stepsInFlow.map((step, index) => {
        const stepNumberForDisplay = index + 1; // Mostra 1, 2, 3...
        const isActive = step === currentStep;
        const isCompleted = step < currentStep; // Passo anterior ao atual é considerado completo

        let stepClasses = "calc-stepper-step";
        if (isActive) stepClasses += " active";
        if (isCompleted) stepClasses += " completed";

        // Linha conectora (aparece DEPOIS de cada passo, exceto o último)
        let lineClasses = "calc-stepper-line";
        // A linha DEPOIS de um passo completo deve ser ativa/completa
        if (isCompleted) {
           lineClasses += " completed";
        }
         // A linha DEPOIS do passo ativo também pode ter um estilo diferente (opcional)
         // if (isActive) { lineClasses += " active-next"; }


        return (
          <React.Fragment key={step}>
            <div className={stepClasses} aria-current={isActive ? 'step' : undefined}>
              {/* Mostra checkmark se completo, senão o número */}
              {isCompleted ? (
                <svg className="calc-stepper-checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
              ) : (
                stepNumberForDisplay
              )}
            </div>
            {/* Renderiza a linha conectora se não for o último passo do fluxo */}
            {index < totalStepsInFlow - 1 && (
              <div className={lineClasses}></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default Stepper;
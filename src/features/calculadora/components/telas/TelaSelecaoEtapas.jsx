// src/features/calculadora/components/telas/TelaSelecaoEtapas.jsx
import React, { useState } from 'react';
import { triggerVibration } from '../../../../utils/vibration';
import '../../styles/WizardButtons.css';
import './TelaSelecaoEtapas.css';

function TelaSelecaoEtapas({ selectedEtapas, onSelectionChange, onNextStep, isNextStepDisabled }) {
    const [localSelection, setLocalSelection] = useState(selectedEtapas || []);

    const handleToggleEtapa = (etapaNum) => {
        triggerVibration(3); // Vibração curta de 10ms
        let newSelection;
        if (localSelection.includes(etapaNum)) {
            // Remover etapa
            newSelection = localSelection.filter(e => e !== etapaNum);
        } else {
            // Adicionar etapa (máximo 3)
            if (localSelection.length < 3) {
                newSelection = [...localSelection, etapaNum].sort();
            } else {
                return; // Já tem 3 selecionadas
            }
        }
        setLocalSelection(newSelection);
        onSelectionChange(newSelection);
    };

    const isSelected = (etapaNum) => localSelection.includes(etapaNum);

    return (
        <div className="tela-selecao-etapas">
            <h2 className="calc-tela-titulo">
                Quais etapas do PAVE você já realizou?
            </h2>
            <p className="calc-tela-subtitulo">
                .
            </p>

            <div className="wizard-buttons-container">

                <button
                    className={`wizard-option-button ${isSelected(1) ? 'selected' : ''}`}
                    onClick={() => handleToggleEtapa(1)}
                    type="button"
                >
                    Etapa 1
                </button>

                <button
                    className={`wizard-option-button ${isSelected(2) ? 'selected' : ''}`}
                    onClick={() => handleToggleEtapa(2)}
                    type="button"
                >
                    Etapa 2
                </button>

                <button
                    className={`wizard-option-button ${isSelected(3) ? 'selected' : ''}`}
                    onClick={() => handleToggleEtapa(3)}
                    type="button"
                >
                    Etapa 3
                </button>

                {localSelection.length === 1 && localSelection[0] === 3 && (
                    <p className="wizard-error-message" style={{ textAlign: 'center', marginTop: '16px' }}>
                        Você deve selecionar pelo menos uma das etapas 1 ou 2 junto com a Etapa 3
                    </p>
                )}
            </div>

            {/* Primary action button is rendered globally in CalculadoraPage to avoid duplication */}
        </div>
    );
}

export default TelaSelecaoEtapas;

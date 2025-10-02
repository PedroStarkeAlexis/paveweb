// src/features/calculadora/components/telas/TelaSelecaoEtapas.jsx
import React, { useState } from 'react';
import './TelaSelecaoEtapas.css';

function TelaSelecaoEtapas({ selectedEtapas, onSelectionChange, onNextStep, isNextStepDisabled }) {
    const [localSelection, setLocalSelection] = useState(selectedEtapas || []);

    const handleToggleEtapa = (etapaNum) => {
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
            <div className="selecao-header">
                <div className="progress-bar">
                    <div 
                        className="progress-fill" 
                        style={{ width: `${(localSelection.length / 3) * 100}%` }}
                    />
                </div>
            </div>

            <div className="selecao-content">
                <h1 className="selecao-title">
                    Vamos começar!
                </h1>
                <h2 className="selecao-question">
                    Quais etapas do PAVE você já realizou?
                </h2>
                <p className="selecao-subtitle">Escolha até 3 etapas</p>

                <div className="etapas-buttons">
                    <button
                        className={`etapa-button ${isSelected(1) ? 'selected' : ''}`}
                        onClick={() => handleToggleEtapa(1)}
                        type="button"
                    >
                        <div className="etapa-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                            </svg>
                        </div>
                        <span className="etapa-text">Etapa 1</span>
                    </button>

                    <button
                        className={`etapa-button ${isSelected(2) ? 'selected' : ''}`}
                        onClick={() => handleToggleEtapa(2)}
                        type="button"
                    >
                        <div className="etapa-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                            </svg>
                        </div>
                        <span className="etapa-text">Etapa 2</span>
                    </button>

                    <button
                        className={`etapa-button ${isSelected(3) ? 'selected' : ''}`}
                        onClick={() => handleToggleEtapa(3)}
                        type="button"
                    >
                        <div className="etapa-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                            </svg>
                        </div>
                        <span className="etapa-text">Etapa 3</span>
                    </button>
                </div>

                {localSelection.length === 1 && localSelection[0] === 3 && (
                    <p className="validation-message">
                        Você deve selecionar pelo menos uma das etapas 1 ou 2 junto com a Etapa 3
                    </p>
                )}

                <button
                    className="continue-button"
                    onClick={onNextStep}
                    disabled={isNextStepDisabled}
                    type="button"
                >
                    Continuar
                </button>
            </div>
        </div>
    );
}

export default TelaSelecaoEtapas;

// src/features/calculadora/CalculadoraPage.jsx
import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useCalculadoraWizard from './hooks/useCalculadoraWizard';

// --- COMPONENTES DAS TELAS ---
import TelaSelecaoEtapas from './components/telas/TelaSelecaoEtapas';
import TelaDesempenho from './components/telas/TelaDesempenho';
import TelaDesempenhoRedacao from './components/telas/TelaDesempenhoRedacao';
import TelaSelecaoCurso from './components/telas/TelaSelecaoCurso';
import TelaResultado from './components/telas/TelaResultado';

// --- COMPONENTES VISUAIS ---
import Stepper from './components/Stepper';

// --- UTILS, CONSTANTES, DATA, CSS ---
import { WIZARD_STEPS } from './constants';
import './styles/CalculadoraWizard.css';

// --- DEFINIÇÕES DA ANIMAÇÃO ---
const slideVariants = {
    hidden: { y: '50%', opacity: 0, transition: { type: 'tween', duration: 0.3, ease: 'easeOut' } },
    visible: { y: 0, opacity: 1, transition: { type: 'tween', duration: 0.3, ease: 'easeOut' } },
    exit: { y: '-50%', opacity: 0, position: 'absolute', width: '100%', transition: { type: 'tween', duration: 0.3, ease: 'easeIn' } }
};


function CalculadoraPage() {
    const {
        wizardStep,
        setWizardStep,
        selectedEtapas,
        etapasFlow,
        handleEtapasSelectionChange,
        desempenho,
        handleDesempenhoChange,
        handleRedacaoChange,
        selecaoCurso,
        handleCursoChange,
        resultados,
        validationErrors,
        cursosDisponiveis,
        loadingCursos,
        errorCursos,
        handleProximaEtapa,
        handleEtapaAnterior,
        isNextStepDisabled,
        nextStepText,
    } = useCalculadoraWizard();


    // --- RENDERIZAÇÃO CONDICIONAL DA TELA ATUAL ---
    const renderCurrentStep = () => {
        // Define as props comuns para o botão de próxima etapa, a ser renderizado por cada tela
        const nextStepProps = {
            onNextStep: handleProximaEtapa,
            isNextStepDisabled: isNextStepDisabled,
            nextStepText: nextStepText,
        };

        switch (wizardStep) {
            case WIZARD_STEPS.SELECAO_ETAPAS:
                return <TelaSelecaoEtapas
                    selectedEtapas={selectedEtapas}
                    onSelectionChange={handleEtapasSelectionChange}
                    {...nextStepProps}
                />;
            case WIZARD_STEPS.ETAPA_1:
            case WIZARD_STEPS.ETAPA_2:
            case WIZARD_STEPS.ETAPA_3:
                return <TelaDesempenho
                    etapaNumero={wizardStep}
                    onChange={handleDesempenhoChange}
                    values={desempenho}
                    errors={validationErrors}
                    {...nextStepProps}
                />;
            case WIZARD_STEPS.REDACAO: return <TelaDesempenhoRedacao onChange={handleRedacaoChange} values={desempenho} {...nextStepProps} />;
            case WIZARD_STEPS.CURSO:
                return <TelaSelecaoCurso
                    onChange={handleCursoChange}
                    selectedId={selecaoCurso.cursoId}
                    cursos={cursosDisponiveis}
                    isLoading={loadingCursos}
                    error={errorCursos}
                    {...nextStepProps}
                />;
            case WIZARD_STEPS.RESULTADO: return <TelaResultado resultados={resultados} onSimularNovamente={() => setWizardStep(WIZARD_STEPS.SELECAO_ETAPAS)} />;
            default: return <div>Etapa inválida</div>;
        }
    };


    // --- RENDERIZAÇÃO PRINCIPAL DO WIZARD ---
    return (
        <div className="calc-wizard-container">
            {wizardStep !== WIZARD_STEPS.RESULTADO && wizardStep !== WIZARD_STEPS.SELECAO_ETAPAS && (
                <div className="calc-wizard-header">
                    <button onClick={handleEtapaAnterior} className="calc-wizard-back-button" aria-label="Etapa anterior">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" > <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /> </svg>
                    </button>
                    <Stepper currentStep={wizardStep} etapasFlow={etapasFlow} />
                    <div style={{ width: '40px', flexShrink: 0 }}></div>
                </div>
            )}
            <div className="calc-wizard-content">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={wizardStep}
                        variants={slideVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                        {renderCurrentStep()}
                    </motion.div>
                </AnimatePresence>
            </div>
            <div className="calc-wizard-footer">
                {wizardStep === WIZARD_STEPS.RESULTADO && (
                    <button className="calc-wizard-next-button" onClick={() => setWizardStep(WIZARD_STEPS.ETAPA_1)} >
                        Simular Novamente
                    </button>
                )}
            </div>
        </div>
    );
}

export default CalculadoraPage;
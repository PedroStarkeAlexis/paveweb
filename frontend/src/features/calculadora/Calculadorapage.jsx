import React from 'react';
import { motion as Motion, AnimatePresence } from 'motion/react';
import useCalculadoraWizard from './hooks/useCalculadoraWizard';
import useCursos from './hooks/useCursos';
import TelaSelecaoEtapas from './components/telas/TelaSelecaoEtapas';
import TelaDesempenho from './components/telas/TelaDesempenho';
import TelaDesempenhoRedacao from './components/telas/TelaDesempenhoRedacao';
import TelaSelecaoCurso from './components/telas/TelaSelecaoCurso';
import TelaResultado from './components/telas/TelaResultado';
import { WIZARD_STEPS } from './constants';
import './styles/CalculadoraWizard.css';

// Define a animação de transição entre as telas do wizard.
const slideVariants = {
    hidden: { x: '100%', opacity: 0, transition: { type: 'tween', duration: 0.3, ease: 'easeOut' } },
    visible: { x: 0, opacity: 1, transition: { type: 'tween', duration: 0.3, ease: 'easeOut' } },
    exit: { x: '-100%', opacity: 0, position: 'absolute', width: '100%', transition: { type: 'tween', duration: 0.3, ease: 'easeIn' } }
};

/**
 * Componente principal da Calculadora PAVE.
 * Orquestra o fluxo de um "wizard" (passo a passo) para coletar os dados do usuário
 * e exibir o resultado final do cálculo da nota.
 */
function CalculadoraPage() {
    // Hook principal que gerencia todo o estado e lógica do wizard.
    const {
        wizardStep, setWizardStep, selectedEtapas, etapasFlow, handleEtapasSelectionChange,
        desempenho, handleDesempenhoChange, handleRedacaoChange,
        selecaoCurso, handleCursoChange, resultados, validationErrors,
        handleProximaEtapa, handleEtapaAnterior, isNextStepDisabled, nextStepText,
    } = useCalculadoraWizard();

    // Hook separado para buscar a lista de cursos disponíveis.
    const { cursos: cursosDisponiveis, isLoading: loadingCursos, error: errorCursos } = useCursos();

    // Função que decide qual tela (componente) renderizar com base no passo atual do wizard.
    const renderCurrentStep = () => {
        const nextStepProps = {
            onNextStep: () => handleProximaEtapa(cursosDisponiveis),
            isNextStepDisabled: isNextStepDisabled,
            nextStepText: nextStepText,
        };

        switch (wizardStep) {
            case WIZARD_STEPS.SELECAO_ETAPAS:
                return <TelaSelecaoEtapas selectedEtapas={selectedEtapas} onSelectionChange={handleEtapasSelectionChange} {...nextStepProps} />;
            case WIZARD_STEPS.ETAPA_1:
            case WIZARD_STEPS.ETAPA_2:
            case WIZARD_STEPS.ETAPA_3:
                return <TelaDesempenho etapaNumero={wizardStep} onChange={handleDesempenhoChange} values={desempenho} errors={validationErrors} {...nextStepProps} />;
            case WIZARD_STEPS.REDACAO:
                return <TelaDesempenhoRedacao onChange={handleRedacaoChange} values={desempenho} {...nextStepProps} />;
            case WIZARD_STEPS.CURSO:
                return <TelaSelecaoCurso onChange={handleCursoChange} selectedId={selecaoCurso.cursoId} cursos={cursosDisponiveis} isLoading={loadingCursos} error={errorCursos} {...nextStepProps} />;
            case WIZARD_STEPS.RESULTADO:
                return <TelaResultado resultados={resultados} onSimularNovamente={() => setWizardStep(WIZARD_STEPS.SELECAO_ETAPAS)} />;
            default:
                return <div>Etapa inválida</div>;
        }
    };

    // Calcula o progresso (0-100%) para a barra de progresso.
    const calculateProgress = () => {
        const totalSteps = etapasFlow.length;
        const currentIndex = etapasFlow.indexOf(wizardStep);
        if (currentIndex === -1 || totalSteps === 0) return 0;
        return ((currentIndex + 1) / totalSteps) * 100;
    };

    return (
        <div className="calc-wizard-container with-fixed-action">
            {wizardStep !== WIZARD_STEPS.RESULTADO && (
                <div className="calc-wizard-header">
                    <button onClick={handleEtapaAnterior} className="calc-wizard-back-button" aria-label="Etapa anterior">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /> </svg>
                    </button>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${calculateProgress()}%` }}></div>
                    </div>
                </div>
            )}
            <div className="calc-wizard-content">
                <AnimatePresence mode='wait'>
                    <Motion.div
                        key={wizardStep}
                        variants={slideVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                        {renderCurrentStep()}
                    </Motion.div>
                </AnimatePresence>
            </div>
            
            {/* O botão de "Continuar" fica fixo na parte de baixo da tela para melhor usabilidade. */}
            {wizardStep !== WIZARD_STEPS.RESULTADO && (
                <div className="wizard-primary-action-fixed">
                    <button
                        className="wizard-primary-button"
                        onClick={() => handleProximaEtapa(cursosDisponiveis)}
                        disabled={isNextStepDisabled}
                        type="button"
                    >
                        {nextStepText || 'Continuar'}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /> </svg>
                    </button>
                </div>
            )}
            <div className="calc-wizard-footer">
                {wizardStep === WIZARD_STEPS.RESULTADO && (
                    <button className="calc-wizard-next-button" onClick={() => setWizardStep(WIZARD_STEPS.SELECAO_ETAPAS)}>
                        Simular Novamente
                    </button>
                )}
            </div>
        </div>
    );
}

export default CalculadoraPage;

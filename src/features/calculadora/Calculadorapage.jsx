// src/features/calculadora/CalculadoraPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // <<< IMPORTAR FRAMER MOTION

// --- COMPONENTES DAS TELAS ---
import TelaDesempenhoEtapa1 from './components/telas/TelaDesempenhoEtapa1';
import TelaDesempenhoEtapa2 from './components/telas/TelaDesempenhoEtapa2';
import TelaDesempenhoEtapa3 from './components/telas/TelaDesempenhoEtapa3';
import TelaDesempenhoRedacao from './components/telas/TelaDesempenhoRedacao';
import TelaSelecaoCurso from './components/telas/TelaSelecaoCurso';
import TelaResultado from './components/telas/TelaResultado';

// --- COMPONENTES VISUAIS ---
import Stepper from './components/Stepper';

// --- UTILS, CONSTANTES, DATA, CSS ---
import { calcularNotaEtapa, calcularNotaFinal, calcularPorcentagemEtapa, calcularChances } from './utils/calculos';
import {
    TOTAL_QUESTOES,
    NOTA_MIN_REDAÇÃO,
    NOTA_MAX_REDAÇÃO,
    ETAPA_VIEW_1,
    ETAPA_VIEW_2,
    ETAPA_VIEW_3,
    WIZARD_STEPS
} from './constants';
import cursosData from './data/cursos.json';
import './styles/CalculadoraWizard.css';

// --- DEFINIÇÕES DA ANIMAÇÃO ---
const slideVariants = {
  hidden: { y: '50%', opacity: 0, transition: { type: 'tween', duration: 0.3, ease: 'easeOut' } },
  visible: { y: 0, opacity: 1, transition: { type: 'tween', duration: 0.3, ease: 'easeOut' } },
  exit: { y: '-50%', opacity: 0, position: 'absolute', width: '100%', transition: { type: 'tween', duration: 0.3, ease: 'easeIn' } }
};


function CalculadoraPage() {
    // --- ESTADO DO WIZARD ---
    const [wizardStep, setWizardStep] = useState(WIZARD_STEPS.ETAPA_1);

    // --- ESTADOS DOS DADOS ---
    const [desempenho, setDesempenho] = useState({
        acertosE1: '', ignoradasE1: '',
        acertosE2: '', ignoradasE2: '',
        acertosE3: '', ignoradasE3: '',
        notaRedacao: '', incluirRedacao: null,
    });
    const [selecaoCurso, setSelecaoCurso] = useState({ cursoId: '' });
    const [resultados, setResultados] = useState({
        notasEtapas: { [ETAPA_VIEW_1]: 0, [ETAPA_VIEW_2]: 0, [ETAPA_VIEW_3]: 0 },
        notaFinal: null,
        cursoSelecionadoInfo: null,
        chances: null,
        incluirRedacao: null,
        notaRedacao: 0,
    });
    const [validationErrors, setValidationErrors] = useState({});

    // --- FUNÇÕES AUXILIARES ---
    const getKeysForEtapa = useCallback((etapaPAVE) => {
        return {
            acertosKey: `acertosE${etapaPAVE}`,
            ignoradasKey: `ignoradasE${etapaPAVE}`,
            errorKey: `etapa${etapaPAVE}`
        };
    }, []);

    // --- Função de Validação ---
    const validateEtapaPAVE = useCallback((etapaPAVE, currentAcertos, currentIgnoradas) => {
        const { errorKey } = getKeysForEtapa(etapaPAVE);
        const numAcertos = parseInt(currentAcertos, 10) || 0;
        const numIgnoradas = parseInt(currentIgnoradas, 10) || 0;
        const total = numAcertos + numIgnoradas;

        if (total > TOTAL_QUESTOES) {
            setValidationErrors(prev => ({ ...prev, [errorKey]: `Soma excede ${TOTAL_QUESTOES}` }));
            return false;
        } else {
            setValidationErrors(prev => {
                if (prev[errorKey]) {
                    const newState = { ...prev };
                    delete newState[errorKey];
                    return newState;
                }
                return prev;
            });
            return true;
        }
    }, [getKeysForEtapa]);

    // --- HANDLERS DE INPUT ---
    const handleDesempenhoChange = useCallback((etapa, campo, value) => {
        const { acertosKey, ignoradasKey } = getKeysForEtapa(etapa);
        const isAcertos = campo === 'acertos';
        const keyToUpdate = isAcertos ? acertosKey : ignoradasKey;
        const cleanValue = value === '' ? '' : Math.max(0, Math.min(TOTAL_QUESTOES, parseInt(value, 10) || 0));

        const novoDesempenho = { ...desempenho, [keyToUpdate]: cleanValue };
        setDesempenho(novoDesempenho);

        const currentAcertos = isAcertos ? cleanValue : novoDesempenho[acertosKey];
        const currentIgnoradas = !isAcertos ? cleanValue : novoDesempenho[ignoradasKey];
        validateEtapaPAVE(etapa, currentAcertos, currentIgnoradas);

    }, [desempenho, getKeysForEtapa, validateEtapaPAVE]);

    const handleRedacaoChange = useCallback((campo, value) => {
        setDesempenho(prev => {
            const newState = { ...prev };
            if (campo === 'incluirRedacao') {
                newState.incluirRedacao = value;
                if (!value) newState.notaRedacao = '';
            } else if (campo === 'notaRedacao') {
                if (value === '') { newState.notaRedacao = ''; }
                else {
                    const numRedacao = parseFloat(value);
                    if (isNaN(numRedacao) && value !== '.' && value !== '-') { newState.notaRedacao = ''; }
                    else if (numRedacao > NOTA_MAX_REDAÇÃO) { newState.notaRedacao = NOTA_MAX_REDAÇÃO.toString(); }
                    else { newState.notaRedacao = value; }
                }
            }
            return newState;
        });
    }, []);

    const handleCursoChange = useCallback((event) => {
        setSelecaoCurso({ cursoId: event.target.value });
    }, []);

    // --- Cálculo das Notas das Etapas ---
    useEffect(() => {
        const novasNotasEtapas = {};
        let calculoValidoGeral = true;

        for (let i = 1; i <= 3; i++) {
            const { acertosKey, ignoradasKey, errorKey } = getKeysForEtapa(i);
            const numAcertos = parseInt(desempenho[acertosKey], 10) || 0;
            const numIgnoradas = parseInt(desempenho[ignoradasKey], 10) || 0;
            const total = numAcertos + numIgnoradas;

            if (total <= TOTAL_QUESTOES && !validationErrors[errorKey]) {
                novasNotasEtapas[ETAPA_VIEW_1 + i - 1] = calcularNotaEtapa(i, numAcertos, numIgnoradas);
            } else {
                novasNotasEtapas[ETAPA_VIEW_1 + i - 1] = 0;
                if (total > TOTAL_QUESTOES) { calculoValidoGeral = false; }
            }
        }

        setResultados(prevResultados => ({
            ...prevResultados,
            notasEtapas: novasNotasEtapas
        }));

    }, [desempenho.acertosE1, desempenho.ignoradasE1,
        desempenho.acertosE2, desempenho.ignoradasE2,
        desempenho.acertosE3, desempenho.ignoradasE3,
        getKeysForEtapa, validationErrors]);

    // --- CALCULAR RESULTADOS FINAIS ---
    const calcularResultadosFinais = useCallback(() => {
        const notasCalculadas = resultados.notasEtapas;
        const incluirRedacaoFinal = desempenho.incluirRedacao;
        const notaRedacaoValida = incluirRedacaoFinal
            ? Math.max(NOTA_MIN_REDAÇÃO, Math.min(NOTA_MAX_REDAÇÃO, parseFloat(desempenho.notaRedacao) || 0))
            : 0;

        const notaFinalCalculada = calcularNotaFinal(notasCalculadas, notaRedacaoValida, incluirRedacaoFinal);
        const notaFinalNum = parseFloat(notaFinalCalculada);

        const cursoInfo = cursosData.find(c => c.id === selecaoCurso.cursoId) || null;
        let chancesCalculadas = null;
        if (cursoInfo) {
            chancesCalculadas = calcularChances(notaFinalNum, cursoInfo.notaCorte);
        }

        setResultados(prevResultados => ({
            ...prevResultados,
            notaFinal: notaFinalNum,
            cursoSelecionadoInfo: cursoInfo,
            chances: chancesCalculadas,
            incluirRedacao: incluirRedacaoFinal,
            notaRedacao: notaRedacaoValida,
        }));
    }, [resultados.notasEtapas, desempenho.incluirRedacao, desempenho.notaRedacao, selecaoCurso.cursoId]);

    // --- Verifica se a etapa ATUAL do wizard é válida para avançar ---
    const isCurrentWizardStepValid = useCallback(() => {
        const etapaPAVE = wizardStep;
        switch (wizardStep) {
            case WIZARD_STEPS.ETAPA_1:
            case WIZARD_STEPS.ETAPA_2:
            case WIZARD_STEPS.ETAPA_3:
                const { errorKey } = getKeysForEtapa(etapaPAVE);
                return !validationErrors[errorKey];
            case WIZARD_STEPS.REDACAO:
                if (desempenho.incluirRedacao === null) return false;
                if (desempenho.incluirRedacao && desempenho.notaRedacao === '') return false;
                return true;
            case WIZARD_STEPS.CURSO:
                return !!selecaoCurso.cursoId;
            default:
                return true;
        }
    }, [wizardStep, desempenho, selecaoCurso.cursoId, validationErrors, getKeysForEtapa]);

    // --- NAVEGAÇÃO DO WIZARD ---
    const handleProximaEtapa = useCallback(() => {
        if (!isCurrentWizardStepValid()) {
            console.warn("Tentou avançar etapa inválida:", wizardStep);
            return;
        }
        if (wizardStep === WIZARD_STEPS.CURSO) {
            calcularResultadosFinais();
            setWizardStep(WIZARD_STEPS.RESULTADO);
        } else if (wizardStep < WIZARD_STEPS.RESULTADO) {
            setWizardStep(prev => prev + 1);
        }
    }, [wizardStep, isCurrentWizardStepValid, calcularResultadosFinais]);

    const handleEtapaAnterior = useCallback(() => {
        if (wizardStep > WIZARD_STEPS.ETAPA_1) {
            const etapaAnteriorNum = wizardStep - 1;
            setWizardStep(etapaAnteriorNum);
            const { errorKey } = getKeysForEtapa(etapaAnteriorNum);
             if (validationErrors[errorKey]) {
                 setValidationErrors(prev => {
                     const newState = { ...prev };
                     delete newState[errorKey];
                     return newState;
                 });
             }
        }
    }, [wizardStep, getKeysForEtapa, validationErrors]);

    // --- RENDERIZAÇÃO CONDICIONAL DA TELA ATUAL ---
    const renderCurrentStep = useCallback(() => {
        switch (wizardStep) {
            case WIZARD_STEPS.ETAPA_1: return <TelaDesempenhoEtapa1 onChange={handleDesempenhoChange} values={desempenho} errors={validationErrors} />;
            case WIZARD_STEPS.ETAPA_2: return <TelaDesempenhoEtapa2 onChange={handleDesempenhoChange} values={desempenho} errors={validationErrors} />;
            case WIZARD_STEPS.ETAPA_3: return <TelaDesempenhoEtapa3 onChange={handleDesempenhoChange} values={desempenho} errors={validationErrors} />;
            case WIZARD_STEPS.REDACAO: return <TelaDesempenhoRedacao onChange={handleRedacaoChange} values={desempenho} />;
            case WIZARD_STEPS.CURSO: return <TelaSelecaoCurso onChange={handleCursoChange} selectedId={selecaoCurso.cursoId} cursos={cursosData} />;
            case WIZARD_STEPS.RESULTADO: return <TelaResultado resultados={resultados} onSimularNovamente={() => setWizardStep(WIZARD_STEPS.ETAPA_1)} />;
            default: return <div>Etapa inválida</div>;
        }
    }, [wizardStep, handleDesempenhoChange, handleRedacaoChange, handleCursoChange, desempenho, validationErrors, selecaoCurso.cursoId, resultados]);


    // --- RENDERIZAÇÃO PRINCIPAL DO WIZARD ---
    return (
        <div className="calc-wizard-container">
            {wizardStep !== WIZARD_STEPS.RESULTADO && (
                 <div className="calc-wizard-header">
                     <button onClick={handleEtapaAnterior} disabled={wizardStep === WIZARD_STEPS.ETAPA_1} className="calc-wizard-back-button" aria-label="Etapa anterior">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" > <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /> </svg>
                     </button>
                     <Stepper currentStep={wizardStep} />
                     <div style={{width: '40px', flexShrink: 0}}></div>
                 </div>
            )}

            {/* <<< Área de Conteúdo com Animação >>> */}
            <div className="calc-wizard-content">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={wizardStep} // Chave muda a cada etapa
                        variants={slideVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }} // Estilo para ocupar espaço e centralizar
                    >
                        {renderCurrentStep()}
                    </motion.div>
                </AnimatePresence>
            </div>
             {/* <<< Fim Área de Conteúdo >>> */}


            <div className="calc-wizard-footer">
                {wizardStep !== WIZARD_STEPS.RESULTADO && (
                    <button className="calc-wizard-next-button" onClick={handleProximaEtapa} disabled={!isCurrentWizardStepValid()} >
                        {wizardStep === WIZARD_STEPS.CURSO ? 'Simular agora' : 'Próxima etapa'}
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /> </svg>
                    </button>
                )}
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
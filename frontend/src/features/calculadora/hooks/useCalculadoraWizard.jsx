import { useReducer, useEffect, useCallback } from 'react';
import { TOTAL_QUESTOES, NOTA_MIN_REDAÇÃO, NOTA_MAX_REDAÇÃO, ETAPA_VIEW_1, ETAPA_VIEW_2, ETAPA_VIEW_3, WIZARD_STEPS } from '../constants';
import { calcularNotaEtapa, calcularNotaFinal, calcularChances } from '../utils/calculos';

// Define o estado inicial para a calculadora.
const initialState = {
    wizardStep: WIZARD_STEPS.SELECAO_ETAPAS,
    selectedEtapas: [], // Etapas que o usuário participou (ex: [1, 2, 3])
    etapasFlow: [], // A sequência de telas a serem exibidas (ex: [ETAPA_1, ETAPA_2, ...])
    desempenho: { acertosE1: '', ignoradasE1: '', acertosE2: '', ignoradasE2: '', acertosE3: '', ignoradasE3: '', notaRedacao: '', incluirRedacao: null },
    selecaoCurso: { cursoId: '' },
    resultados: { notasEtapas: { [ETAPA_VIEW_1]: 0, [ETAPA_VIEW_2]: 0, [ETAPA_VIEW_3]: 0 }, notaFinal: null, cursoSelecionadoInfo: null, chances: null, incluirRedacao: null, notaRedacao: 0 },
    validationErrors: {},
};

// Define os tipos de ações que podem modificar o estado.
const ACTION_TYPES = {
    SET_WIZARD_STEP: 'SET_WIZARD_STEP', SET_SELECTED_ETAPAS: 'SET_SELECTED_ETAPAS', UPDATE_DESEMPENHO: 'UPDATE_DESEMPENHO',
    UPDATE_SELECAO_CURSO: 'UPDATE_SELECAO_CURSO', UPDATE_RESULTADOS: 'UPDATE_RESULTADOS', SET_VALIDATION_ERROR: 'SET_VALIDATION_ERROR',
    CLEAR_VALIDATION_ERROR: 'CLEAR_VALIDATION_ERROR', AVANCAR_ETAPA: 'AVANCAR_ETAPA', VOLTAR_ETAPA: 'VOLTAR_ETAPA',
    ATUALIZAR_NOTAS_ETAPAS: 'ATUALIZAR_NOTAS_ETAPAS',
};

// A função "reducer" que atualiza o estado com base na ação recebida.
const wizardReducer = (state, action) => {
    switch (action.type) {
        case ACTION_TYPES.SET_WIZARD_STEP: return { ...state, wizardStep: action.payload };
        case ACTION_TYPES.SET_SELECTED_ETAPAS: return { ...state, selectedEtapas: action.payload.etapas, etapasFlow: action.payload.flow };
        case ACTION_TYPES.UPDATE_DESEMPENHO: return { ...state, desempenho: { ...state.desempenho, ...action.payload } };
        case ACTION_TYPES.UPDATE_SELECAO_CURSO: return { ...state, selecaoCurso: action.payload };
        case ACTION_TYPES.UPDATE_RESULTADOS: return { ...state, resultados: { ...state.resultados, ...action.payload } };
        case ACTION_TYPES.SET_VALIDATION_ERROR: return { ...state, validationErrors: { ...state.validationErrors, [action.payload.key]: action.payload.message } };
        case ACTION_TYPES.CLEAR_VALIDATION_ERROR: const newErrors = { ...state.validationErrors }; delete newErrors[action.payload]; return { ...state, validationErrors: newErrors };
        case ACTION_TYPES.AVANCAR_ETAPA: const updates = { wizardStep: action.payload.nextStep }; if (action.payload.resultadosFinais) { updates.resultados = { ...state.resultados, ...action.payload.resultadosFinais }; } return { ...state, ...updates };
        case ACTION_TYPES.VOLTAR_ETAPA: return { ...state, wizardStep: action.payload };
        case ACTION_TYPES.ATUALIZAR_NOTAS_ETAPAS: return { ...state, resultados: { ...state.resultados, notasEtapas: action.payload } };
        default: return state;
    }
};

/**
 * Hook customizado que tem a lógica de estado, validação e navegação da Calculadora.
 * Utiliza o padrão `useReducer` para gerenciar o estado complexo do wizard de forma previsível.
 */
const useCalculadoraWizard = () => {
    const [state, dispatch] = useReducer(wizardReducer, initialState);

    const getKeysForEtapa = useCallback((etapaPAVE) => ({ acertosKey: `acertosE${etapaPAVE}`, ignoradasKey: `ignoradasE${etapaPAVE}`, errorKey: `etapa${etapaPAVE}` }), []);

    // Valida se a soma de acertos e ignoradas não excede o total de questões.
    const validateEtapaPAVE = useCallback((etapaPAVE, currentAcertos, currentIgnoradas) => {
        const { errorKey } = getKeysForEtapa(etapaPAVE);
        const total = (parseInt(currentAcertos, 10) || 0) + (parseInt(currentIgnoradas, 10) || 0);
        if (total > TOTAL_QUESTOES) {
            dispatch({ type: ACTION_TYPES.SET_VALIDATION_ERROR, payload: { key: errorKey, message: `Soma excede ${TOTAL_QUESTOES}` } });
            return false;
        } else {
            if (state.validationErrors[errorKey]) {
                dispatch({ type: ACTION_TYPES.CLEAR_VALIDATION_ERROR, payload: errorKey });
            }
            return true;
        }
    }, [getKeysForEtapa, state.validationErrors]);

    // Atualiza o estado de desempenho quando o usuário digita nos campos.
    const handleDesempenhoChange = useCallback((etapa, campo, value) => {
        const { acertosKey, ignoradasKey } = getKeysForEtapa(etapa);
        const keyToUpdate = campo === 'acertos' ? acertosKey : ignoradasKey;
        const cleanValue = value === '' ? '' : Math.max(0, Math.min(TOTAL_QUESTOES, parseInt(value, 10) || 0));
        const novoDesempenho = { ...state.desempenho, [keyToUpdate]: cleanValue };
        dispatch({ type: ACTION_TYPES.UPDATE_DESEMPENHO, payload: { [keyToUpdate]: cleanValue } });
        validateEtapaPAVE(etapa, campo === 'acertos' ? cleanValue : novoDesempenho[acertosKey], campo !== 'acertos' ? cleanValue : novoDesempenho[ignoradasKey]);
    }, [state.desempenho, getKeysForEtapa, validateEtapaPAVE]);

    // Atualiza o estado da redação.
    const handleRedacaoChange = useCallback((campo, value) => {
        const updates = {};
        if (campo === 'incluirRedacao') {
            updates.incluirRedacao = value;
            if (!value) updates.notaRedacao = '';
        } else if (campo === 'notaRedacao') {
            updates.notaRedacao = value === '' ? '' : (parseFloat(value) > NOTA_MAX_REDAÇÃO ? NOTA_MAX_REDAÇÃO.toString() : value);
        }
        dispatch({ type: ACTION_TYPES.UPDATE_DESEMPENHO, payload: updates });
    }, []);

    const handleCursoChange = useCallback((event) => dispatch({ type: ACTION_TYPES.UPDATE_SELECAO_CURSO, payload: { cursoId: event.target.value } }), []);

    // Define o fluxo de telas com base nas etapas que o usuário selecionou.
    const handleEtapasSelectionChange = useCallback((etapas) => {
        const newFlow = [];
        if (etapas.includes(1)) newFlow.push(WIZARD_STEPS.ETAPA_1);
        if (etapas.includes(2)) newFlow.push(WIZARD_STEPS.ETAPA_2);
        if (etapas.includes(3)) {
            newFlow.push(WIZARD_STEPS.ETAPA_3);
            newFlow.push(WIZARD_STEPS.REDACAO);
        }
        newFlow.push(WIZARD_STEPS.CURSO);
        dispatch({ type: ACTION_TYPES.SET_SELECTED_ETAPAS, payload: { etapas, flow: newFlow } });
    }, []);

    // Calcula as notas brutas das etapas sempre que o desempenho do usuário muda.
    useEffect(() => {
        const novasNotasEtapas = {};
        for (let i = 1; i <= 3; i++) {
            const { acertosKey, ignoradasKey, errorKey } = getKeysForEtapa(i);
            const numAcertos = parseInt(state.desempenho[acertosKey], 10) || 0;
            const numIgnoradas = parseInt(state.desempenho[ignoradasKey], 10) || 0;
            if (numAcertos + numIgnoradas <= TOTAL_QUESTOES && !state.validationErrors[errorKey]) {
                novasNotasEtapas[ETAPA_VIEW_1 + i - 1] = calcularNotaEtapa(i, numAcertos, numIgnoradas);
            } else {
                novasNotasEtapas[ETAPA_VIEW_1 + i - 1] = 0;
            }
        }
        dispatch({ type: ACTION_TYPES.ATUALIZAR_NOTAS_ETAPAS, payload: novasNotasEtapas });
    }, [state.desempenho, getKeysForEtapa, state.validationErrors]);

    // Calcula a nota final e as chances de aprovação quando o usuário chega na tela de curso.
    const calcularResultadosFinais = useCallback((cursosDisponiveis = []) => {
        const { notasEtapas } = state.resultados;
        const { incluirRedacao, notaRedacao, cursoId } = { ...state.desempenho, ...state.selecaoCurso };
        const notaRedacaoValida = incluirRedacao ? Math.max(NOTA_MIN_REDAÇÃO, Math.min(NOTA_MAX_REDAÇÃO, parseFloat(notaRedacao) || 0)) : 0;
        const notaFinalCalculada = parseFloat(calcularNotaFinal(notasEtapas, notaRedacaoValida, incluirRedacao));
        const cursoInfo = cursosDisponiveis.find(c => c.id === cursoId) || null;
        const chancesCalculadas = cursoInfo ? calcularChances(notaFinalCalculada, cursoInfo.notaCorte) : null;
        return { notaFinal: notaFinalCalculada, cursoSelecionadoInfo: cursoInfo, chances: chancesCalculadas, incluirRedacao, notaRedacao: notaRedacaoValida };
    }, [state.resultados, state.desempenho, state.selecaoCurso]);

    // Verifica se a tela atual está válida para permitir que o usuário avance.
    const isCurrentWizardStepValid = useCallback(() => {
        switch (state.wizardStep) {
            case WIZARD_STEPS.SELECAO_ETAPAS: return state.selectedEtapas.length > 0 && !(state.selectedEtapas.length === 1 && state.selectedEtapas[0] === 3);
            case WIZARD_STEPS.ETAPA_1: case WIZARD_STEPS.ETAPA_2: case WIZARD_STEPS.ETAPA_3: return !state.validationErrors[getKeysForEtapa(state.wizardStep).errorKey];
            case WIZARD_STEPS.REDACAO: return state.desempenho.incluirRedacao !== null && (!state.desempenho.incluirRedacao || state.desempenho.notaRedacao !== '');
            case WIZARD_STEPS.CURSO: return !!state.selecaoCurso.cursoId;
            default: return true;
        }
    }, [state.wizardStep, state.desempenho, state.selecaoCurso.cursoId, state.validationErrors, getKeysForEtapa, state.selectedEtapas]);

    // Lógica para avançar para a próxima tela do wizard.
    const handleProximaEtapa = useCallback((cursosDisponiveis) => {
        if (!isCurrentWizardStepValid()) return;
        if (state.wizardStep === WIZARD_STEPS.SELECAO_ETAPAS) {
            if (state.etapasFlow.length > 0) dispatch({ type: ACTION_TYPES.AVANCAR_ETAPA, payload: { nextStep: state.etapasFlow[0] } });
        } else if (state.wizardStep === WIZARD_STEPS.CURSO) {
            dispatch({ type: ACTION_TYPES.AVANCAR_ETAPA, payload: { nextStep: WIZARD_STEPS.RESULTADO, resultadosFinais: calcularResultadosFinais(cursosDisponiveis) } });
        } else {
            const currentIndex = state.etapasFlow.indexOf(state.wizardStep);
            if (currentIndex < state.etapasFlow.length - 1) dispatch({ type: ACTION_TYPES.AVANCAR_ETAPA, payload: { nextStep: state.etapasFlow[currentIndex + 1] } });
        }
    }, [state.wizardStep, state.etapasFlow, isCurrentWizardStepValid, calcularResultadosFinais]);

    // Lógica para voltar para a tela anterior.
    const handleEtapaAnterior = useCallback(() => {
        if (state.etapasFlow.length > 0 && state.wizardStep === state.etapasFlow[0]) {
            dispatch({ type: ACTION_TYPES.VOLTAR_ETAPA, payload: WIZARD_STEPS.SELECAO_ETAPAS });
        } else {
            const currentIndex = state.etapasFlow.indexOf(state.wizardStep);
            if (currentIndex > 0) dispatch({ type: ACTION_TYPES.VOLTAR_ETAPA, payload: state.etapasFlow[currentIndex - 1] });
        }
    }, [state.wizardStep, state.etapasFlow]);

    const setWizardStep = useCallback((step) => dispatch({ type: ACTION_TYPES.SET_WIZARD_STEP, payload: step }), []);

    let nextStepText = 'Próxima etapa';
    if (state.wizardStep === WIZARD_STEPS.CURSO) nextStepText = 'Simular agora';
    else if (state.wizardStep === WIZARD_STEPS.SELECAO_ETAPAS) nextStepText = 'Continuar';

    // Retorna todas as variáveis e funções necessárias para o componente da calculadora.
    return {
        wizardStep: state.wizardStep, setWizardStep, selectedEtapas: state.selectedEtapas, etapasFlow: state.etapasFlow, handleEtapasSelectionChange,
        desempenho: state.desempenho, handleDesempenhoChange, handleRedacaoChange, selecaoCurso: state.selecaoCurso, handleCursoChange,
        resultados: state.resultados, validationErrors: state.validationErrors, handleProximaEtapa, handleEtapaAnterior,
        isNextStepDisabled: !isCurrentWizardStepValid(), nextStepText,
    };
};

export default useCalculadoraWizard;

import { useReducer, useEffect, useCallback } from 'react';
import {
    TOTAL_QUESTOES,
    NOTA_MIN_REDAÇÃO,
    NOTA_MAX_REDAÇÃO,
    ETAPA_VIEW_1,
    ETAPA_VIEW_2,
    ETAPA_VIEW_3,
    WIZARD_STEPS
} from '../constants';
import { calcularNotaEtapa, calcularNotaFinal, calcularChances } from '../utils/calculos';

// --- ESTADO INICIAL ---
const initialState = {
    wizardStep: WIZARD_STEPS.SELECAO_ETAPAS,
    selectedEtapas: [],
    etapasFlow: [],
    desempenho: {
        acertosE1: '', ignoradasE1: '',
        acertosE2: '', ignoradasE2: '',
        acertosE3: '', ignoradasE3: '',
        notaRedacao: '', incluirRedacao: null,
    },
    selecaoCurso: { cursoId: '' },
    resultados: {
        notasEtapas: { [ETAPA_VIEW_1]: 0, [ETAPA_VIEW_2]: 0, [ETAPA_VIEW_3]: 0 },
        notaFinal: null,
        cursoSelecionadoInfo: null,
        chances: null,
        incluirRedacao: null,
        notaRedacao: 0,
    },
    validationErrors: {},
};

// --- TIPOS DE AÇÃO ---
const ACTION_TYPES = {
    SET_WIZARD_STEP: 'SET_WIZARD_STEP',
    SET_SELECTED_ETAPAS: 'SET_SELECTED_ETAPAS',
    UPDATE_DESEMPENHO: 'UPDATE_DESEMPENHO',
    UPDATE_SELECAO_CURSO: 'UPDATE_SELECAO_CURSO',
    UPDATE_RESULTADOS: 'UPDATE_RESULTADOS',
    SET_VALIDATION_ERROR: 'SET_VALIDATION_ERROR',
    CLEAR_VALIDATION_ERROR: 'CLEAR_VALIDATION_ERROR',
    AVANCAR_ETAPA: 'AVANCAR_ETAPA',
    VOLTAR_ETAPA: 'VOLTAR_ETAPA',
    ATUALIZAR_NOTAS_ETAPAS: 'ATUALIZAR_NOTAS_ETAPAS',
};

// --- REDUCER ---
const wizardReducer = (state, action) => {
    switch (action.type) {
        case ACTION_TYPES.SET_WIZARD_STEP:
            return { ...state, wizardStep: action.payload };

        case ACTION_TYPES.SET_SELECTED_ETAPAS: {
            const { etapas, flow } = action.payload;
            return {
                ...state,
                selectedEtapas: etapas,
                etapasFlow: flow,
            };
        }

        case ACTION_TYPES.UPDATE_DESEMPENHO:
            return {
                ...state,
                desempenho: { ...state.desempenho, ...action.payload },
            };

        case ACTION_TYPES.UPDATE_SELECAO_CURSO:
            return {
                ...state,
                selecaoCurso: action.payload,
            };

        case ACTION_TYPES.UPDATE_RESULTADOS:
            return {
                ...state,
                resultados: { ...state.resultados, ...action.payload },
            };

        case ACTION_TYPES.SET_VALIDATION_ERROR:
            return {
                ...state,
                validationErrors: { ...state.validationErrors, [action.payload.key]: action.payload.message },
            };

        case ACTION_TYPES.CLEAR_VALIDATION_ERROR: {
            const newErrors = { ...state.validationErrors };
            delete newErrors[action.payload];
            return {
                ...state,
                validationErrors: newErrors,
            };
        }

        case ACTION_TYPES.AVANCAR_ETAPA: {
            const { nextStep, resultadosFinais } = action.payload;
            const updates = { wizardStep: nextStep };
            if (resultadosFinais) {
                updates.resultados = { ...state.resultados, ...resultadosFinais };
            }
            return { ...state, ...updates };
        }

        case ACTION_TYPES.VOLTAR_ETAPA:
            return {
                ...state,
                wizardStep: action.payload,
            };

        case ACTION_TYPES.ATUALIZAR_NOTAS_ETAPAS:
            return {
                ...state,
                resultados: {
                    ...state.resultados,
                    notasEtapas: action.payload,
                },
            };

        default:
            return state;
    }
};

const useCalculadoraWizard = () => {
    const [state, dispatch] = useReducer(wizardReducer, initialState);

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
            dispatch({
                type: ACTION_TYPES.SET_VALIDATION_ERROR,
                payload: { key: errorKey, message: `Soma excede ${TOTAL_QUESTOES}` }
            });
            return false;
        } else {
            if (state.validationErrors[errorKey]) {
                dispatch({ type: ACTION_TYPES.CLEAR_VALIDATION_ERROR, payload: errorKey });
            }
            return true;
        }
    }, [getKeysForEtapa, state.validationErrors]);

    // --- HANDLERS DE INPUT ---
    const handleDesempenhoChange = useCallback((etapa, campo, value) => {
        const { acertosKey, ignoradasKey } = getKeysForEtapa(etapa);
        const isAcertos = campo === 'acertos';
        const keyToUpdate = isAcertos ? acertosKey : ignoradasKey;
        const cleanValue = value === '' ? '' : Math.max(0, Math.min(TOTAL_QUESTOES, parseInt(value, 10) || 0));

        const novoDesempenho = { ...state.desempenho, [keyToUpdate]: cleanValue };
        dispatch({
            type: ACTION_TYPES.UPDATE_DESEMPENHO,
            payload: { [keyToUpdate]: cleanValue }
        });

        const currentAcertos = isAcertos ? cleanValue : novoDesempenho[acertosKey];
        const currentIgnoradas = !isAcertos ? cleanValue : novoDesempenho[ignoradasKey];
        validateEtapaPAVE(etapa, currentAcertos, currentIgnoradas);

    }, [state.desempenho, getKeysForEtapa, validateEtapaPAVE]);

    const handleRedacaoChange = useCallback((campo, value) => {
        const updates = {};
        if (campo === 'incluirRedacao') {
            updates.incluirRedacao = value;
            if (!value) updates.notaRedacao = '';
        } else if (campo === 'notaRedacao') {
            if (value === '') {
                updates.notaRedacao = '';
            } else {
                const numRedacao = parseFloat(value);
                if (isNaN(numRedacao) && value !== '.' && value !== '-') {
                    updates.notaRedacao = '';
                } else if (numRedacao > NOTA_MAX_REDAÇÃO) {
                    updates.notaRedacao = NOTA_MAX_REDAÇÃO.toString();
                } else {
                    updates.notaRedacao = value;
                }
            }
        }
        dispatch({ type: ACTION_TYPES.UPDATE_DESEMPENHO, payload: updates });
    }, []);

    const handleCursoChange = useCallback((event) => {
        dispatch({
            type: ACTION_TYPES.UPDATE_SELECAO_CURSO,
            payload: { cursoId: event.target.value }
        });
    }, []);

    // --- NOVO: Handler para seleção de etapas ---
    const handleEtapasSelectionChange = useCallback((etapas) => {
        // Construir o fluxo dinâmico baseado nas etapas selecionadas
        const newFlow = [];
        
        // Adicionar etapas PAVE selecionadas em ordem
        if (etapas.includes(1)) newFlow.push(WIZARD_STEPS.ETAPA_1);
        if (etapas.includes(2)) newFlow.push(WIZARD_STEPS.ETAPA_2);
        if (etapas.includes(3)) {
            newFlow.push(WIZARD_STEPS.ETAPA_3);
            // Se Etapa 3 foi selecionada, incluir tela de redação
            newFlow.push(WIZARD_STEPS.REDACAO);
        }
        
        // Adicionar tela de seleção de curso
        newFlow.push(WIZARD_STEPS.CURSO);
        
        dispatch({
            type: ACTION_TYPES.SET_SELECTED_ETAPAS,
            payload: { etapas, flow: newFlow }
        });
    }, []);

    // --- Cálculo das Notas das Etapas ---
    useEffect(() => {
        const novasNotasEtapas = {};

        for (let i = 1; i <= 3; i++) {
            const { acertosKey, ignoradasKey, errorKey } = getKeysForEtapa(i);
            const numAcertos = parseInt(state.desempenho[acertosKey], 10) || 0;
            const numIgnoradas = parseInt(state.desempenho[ignoradasKey], 10) || 0;
            const total = numAcertos + numIgnoradas;

            if (total <= TOTAL_QUESTOES && !state.validationErrors[errorKey]) {
                novasNotasEtapas[ETAPA_VIEW_1 + i - 1] = calcularNotaEtapa(i, numAcertos, numIgnoradas);
            } else {
                novasNotasEtapas[ETAPA_VIEW_1 + i - 1] = 0;
            }
        }
        
        dispatch({ type: ACTION_TYPES.ATUALIZAR_NOTAS_ETAPAS, payload: novasNotasEtapas });

    }, [state.desempenho, getKeysForEtapa, state.validationErrors]);

    // --- CALCULAR RESULTADOS FINAIS ---
    const calcularResultadosFinais = useCallback((cursosDisponiveis) => {
        const listaCursos = Array.isArray(cursosDisponiveis) ? cursosDisponiveis : [];
        const notasCalculadas = state.resultados.notasEtapas;
        const incluirRedacaoFinal = state.desempenho.incluirRedacao;
        const notaRedacaoValida = incluirRedacaoFinal
            ? Math.max(NOTA_MIN_REDAÇÃO, Math.min(NOTA_MAX_REDAÇÃO, parseFloat(state.desempenho.notaRedacao) || 0))
            : 0;

        const notaFinalCalculada = calcularNotaFinal(notasCalculadas, notaRedacaoValida, incluirRedacaoFinal);
        const notaFinalNum = parseFloat(notaFinalCalculada);

        // Busca informações do curso selecionado
        const cursoInfo = listaCursos.find(c => c.id === state.selecaoCurso.cursoId) || null;
        let chancesCalculadas = null;
        if (cursoInfo) {
            chancesCalculadas = calcularChances(notaFinalNum, cursoInfo.notaCorte);
        }

        return {
            notaFinal: notaFinalNum,
            cursoSelecionadoInfo: cursoInfo,
            chances: chancesCalculadas,
            incluirRedacao: incluirRedacaoFinal,
            notaRedacao: notaRedacaoValida,
        };
    }, [state.resultados.notasEtapas, state.desempenho.incluirRedacao, state.desempenho.notaRedacao, state.selecaoCurso.cursoId]);

    // --- Verifica se a etapa ATUAL do wizard é válida para avançar ---
    const isCurrentWizardStepValid = useCallback(() => {
        const etapaPAVE = state.wizardStep;
        switch (state.wizardStep) {
            case WIZARD_STEPS.SELECAO_ETAPAS:
                // Pelo menos uma etapa deve estar selecionada e não pode ser apenas Etapa 3
                if (state.selectedEtapas.length === 0) return false;
                if (state.selectedEtapas.length === 1 && state.selectedEtapas[0] === 3) return false;
                return true;
            case WIZARD_STEPS.ETAPA_1:
            case WIZARD_STEPS.ETAPA_2:
            case WIZARD_STEPS.ETAPA_3: {
                const { errorKey } = getKeysForEtapa(etapaPAVE);
                return !state.validationErrors[errorKey];
            }
            case WIZARD_STEPS.REDACAO:
                if (state.desempenho.incluirRedacao === null) return false;
                if (state.desempenho.incluirRedacao && state.desempenho.notaRedacao === '') return false;
                return true;
            case WIZARD_STEPS.CURSO:
                return !!state.selecaoCurso.cursoId;
            default:
                return true;
        }
    }, [state.wizardStep, state.desempenho, state.selecaoCurso.cursoId, state.validationErrors, getKeysForEtapa, state.selectedEtapas]);

    // --- NAVEGAÇÃO DO WIZARD ---
    const handleProximaEtapa = useCallback((cursosDisponiveis = []) => {
        if (!isCurrentWizardStepValid()) {
            console.warn("Tentou avançar etapa inválida:", state.wizardStep);
            return;
        }
        
        // Se estamos na tela de seleção de etapas, navegar para a primeira etapa selecionada
        if (state.wizardStep === WIZARD_STEPS.SELECAO_ETAPAS) {
            if (state.etapasFlow.length > 0) {
                dispatch({
                    type: ACTION_TYPES.AVANCAR_ETAPA,
                    payload: { nextStep: state.etapasFlow[0] }
                });
            }
            return;
        }
        
        // Se estamos na seleção de curso, calcular resultados e ir para resultado
        if (state.wizardStep === WIZARD_STEPS.CURSO) {
            const resultadosFinais = calcularResultadosFinais(cursosDisponiveis);
            dispatch({
                type: ACTION_TYPES.AVANCAR_ETAPA,
                payload: { nextStep: WIZARD_STEPS.RESULTADO, resultadosFinais }
            });
            return;
        }
        
        // Navegação dinâmica baseada no fluxo
        const currentIndex = state.etapasFlow.indexOf(state.wizardStep);
        if (currentIndex !== -1 && currentIndex < state.etapasFlow.length - 1) {
            dispatch({
                type: ACTION_TYPES.AVANCAR_ETAPA,
                payload: { nextStep: state.etapasFlow[currentIndex + 1] }
            });
        }
    }, [state.wizardStep, state.etapasFlow, isCurrentWizardStepValid, calcularResultadosFinais]);

    const handleEtapaAnterior = useCallback(() => {
        // Se estamos na primeira etapa do fluxo, voltar para seleção
        if (state.etapasFlow.length > 0 && state.wizardStep === state.etapasFlow[0]) {
            dispatch({
                type: ACTION_TYPES.VOLTAR_ETAPA,
                payload: WIZARD_STEPS.SELECAO_ETAPAS
            });
            return;
        }
        
        // Navegação dinâmica baseada no fluxo
        const currentIndex = state.etapasFlow.indexOf(state.wizardStep);
        if (currentIndex > 0) {
            const etapaAnterior = state.etapasFlow[currentIndex - 1];
            dispatch({
                type: ACTION_TYPES.VOLTAR_ETAPA,
                payload: etapaAnterior
            });
            
            // Limpar erros de validação da etapa anterior se for uma etapa PAVE
            if (etapaAnterior >= WIZARD_STEPS.ETAPA_1 && etapaAnterior <= WIZARD_STEPS.ETAPA_3) {
                const { errorKey } = getKeysForEtapa(etapaAnterior);
                if (state.validationErrors[errorKey]) {
                    dispatch({ type: ACTION_TYPES.CLEAR_VALIDATION_ERROR, payload: errorKey });
                }
            }
        }
    }, [state.wizardStep, state.etapasFlow, getKeysForEtapa, state.validationErrors]);

    // Função auxiliar para permitir controle direto do wizard step (usada em casos especiais)
    const setWizardStep = useCallback((step) => {
        dispatch({ type: ACTION_TYPES.SET_WIZARD_STEP, payload: step });
    }, []);

    // Determinar texto e estado do botão Próxima Etapa para passar aos componentes filhos
    const isNextStepDisabled = !isCurrentWizardStepValid();
    // Preserve per-screen button texts: "Continuar" on selection screen, "Simular agora" on curso, otherwise "Próxima etapa"
    let nextStepText = 'Próxima etapa';
    if (state.wizardStep === WIZARD_STEPS.CURSO) nextStepText = 'Simular agora';
    else if (state.wizardStep === WIZARD_STEPS.SELECAO_ETAPAS) nextStepText = 'Continuar';

    return {
        wizardStep: state.wizardStep,
        setWizardStep,
        selectedEtapas: state.selectedEtapas,
        etapasFlow: state.etapasFlow,
        handleEtapasSelectionChange,
        desempenho: state.desempenho,
        handleDesempenhoChange,
        handleRedacaoChange,
        selecaoCurso: state.selecaoCurso,
        handleCursoChange,
        resultados: state.resultados,
        validationErrors: state.validationErrors,
        handleProximaEtapa,
        handleEtapaAnterior,
        isNextStepDisabled,
        nextStepText,
    };
};

export default useCalculadoraWizard;
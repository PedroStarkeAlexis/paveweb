import { useState, useEffect, useCallback } from 'react';
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

const useCalculadoraWizard = () => {
    // --- ESTADO DO WIZARD ---
    const [wizardStep, setWizardStep] = useState(WIZARD_STEPS.SELECAO_ETAPAS);
    
    // --- NOVO: Estado para etapas selecionadas e fluxo dinâmico ---
    const [selectedEtapas, setSelectedEtapas] = useState([]);
    const [etapasFlow, setEtapasFlow] = useState([]);

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

    // <<< NOVO ESTADO PARA CURSOS >>>
    const [cursosDisponiveis, setCursosDisponiveis] = useState([]);
    const [loadingCursos, setLoadingCursos] = useState(true);
    const [errorCursos, setErrorCursos] = useState(null);

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

    // --- NOVO: Handler para seleção de etapas ---
    const handleEtapasSelectionChange = useCallback((etapas) => {
        setSelectedEtapas(etapas);
        
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
        
        setEtapasFlow(newFlow);
    }, []);

    // <<< NOVO useEffect PARA BUSCAR CURSOS >>>
    useEffect(() => {
        const fetchCursos = async () => {
            setLoadingCursos(true);
            setErrorCursos(null);
            try {
                // <<< USA A URL PÚBLICA DO R2 FORNECIDA >>>
                const publicR2Url = 'https://pub-bb3996c786cd4543b2f53acdabbd9915.r2.dev/cursos.json';

                console.log(`Buscando cursos de: ${publicR2Url}`);

                const response = await fetch(publicR2Url, {
                    cache: 'no-cache' // Evita cache durante testes
                });

                if (!response.ok) {
                    console.error(`Erro ao carregar cursos: ${response.status} ${response.statusText}`);
                    const errorBody = await response.text();
                    console.error("Corpo da resposta de erro:", errorBody);
                    throw new Error(`Erro ${response.status} ao buscar cursos.`);
                }

                const data = await response.json();
                setCursosDisponiveis(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Falha ao buscar/processar cursos.json do R2:", error);
                setErrorCursos("Não foi possível carregar a lista de cursos.");
                setCursosDisponiveis([]);
            } finally {
                setLoadingCursos(false);
            }
        };

        fetchCursos();
    }, []); // Roda apenas uma vez na montagem

    // --- Cálculo das Notas das Etapas ---
    useEffect(() => {
        const novasNotasEtapas = {};
        let calculoValidoGeral = true; // Esta variável não está sendo usada para nada.

        for (let i = 1; i <= 3; i++) {
            const { acertosKey, ignoradasKey, errorKey } = getKeysForEtapa(i);
            const numAcertos = parseInt(desempenho[acertosKey], 10) || 0;
            const numIgnoradas = parseInt(desempenho[ignoradasKey], 10) || 0;
            const total = numAcertos + numIgnoradas;

            if (total <= TOTAL_QUESTOES && !validationErrors[errorKey]) {
                novasNotasEtapas[ETAPA_VIEW_1 + i - 1] = calcularNotaEtapa(i, numAcertos, numIgnoradas);
            } else {
                novasNotasEtapas[ETAPA_VIEW_1 + i - 1] = 0;
                // A linha abaixo não é necessária, pois calculoValidoGeral não é usada.
                // if (total > TOTAL_QUESTOES) { calculoValidoGeral = false; }
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

        // <<< USA cursosDisponiveis DO ESTADO >>>
        const cursoInfo = cursosDisponiveis.find(c => c.id === selecaoCurso.cursoId) || null;
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
    }, [resultados.notasEtapas, desempenho.incluirRedacao, desempenho.notaRedacao, selecaoCurso.cursoId, cursosDisponiveis]);

    // --- Verifica se a etapa ATUAL do wizard é válida para avançar ---
    const isCurrentWizardStepValid = useCallback(() => {
        const etapaPAVE = wizardStep;
        switch (wizardStep) {
            case WIZARD_STEPS.SELECAO_ETAPAS:
                // Pelo menos uma etapa deve estar selecionada e não pode ser apenas Etapa 3
                if (selectedEtapas.length === 0) return false;
                if (selectedEtapas.length === 1 && selectedEtapas[0] === 3) return false;
                return true;
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
    }, [wizardStep, desempenho, selecaoCurso.cursoId, validationErrors, getKeysForEtapa, selectedEtapas]);

    // --- NAVEGAÇÃO DO WIZARD ---
    const handleProximaEtapa = useCallback(() => {
        if (!isCurrentWizardStepValid()) {
            console.warn("Tentou avançar etapa inválida:", wizardStep);
            return;
        }
        
        // Se estamos na tela de seleção de etapas, navegar para a primeira etapa selecionada
        if (wizardStep === WIZARD_STEPS.SELECAO_ETAPAS) {
            if (etapasFlow.length > 0) {
                setWizardStep(etapasFlow[0]);
            }
            return;
        }
        
        // Se estamos na seleção de curso, calcular resultados e ir para resultado
        if (wizardStep === WIZARD_STEPS.CURSO) {
            calcularResultadosFinais();
            setWizardStep(WIZARD_STEPS.RESULTADO);
            return;
        }
        
        // Navegação dinâmica baseada no fluxo
        const currentIndex = etapasFlow.indexOf(wizardStep);
        if (currentIndex !== -1 && currentIndex < etapasFlow.length - 1) {
            setWizardStep(etapasFlow[currentIndex + 1]);
        }
    }, [wizardStep, isCurrentWizardStepValid, calcularResultadosFinais, etapasFlow]);

    const handleEtapaAnterior = useCallback(() => {
        // Se estamos na primeira etapa do fluxo, voltar para seleção
        if (etapasFlow.length > 0 && wizardStep === etapasFlow[0]) {
            setWizardStep(WIZARD_STEPS.SELECAO_ETAPAS);
            return;
        }
        
        // Navegação dinâmica baseada no fluxo
        const currentIndex = etapasFlow.indexOf(wizardStep);
        if (currentIndex > 0) {
            const etapaAnterior = etapasFlow[currentIndex - 1];
            setWizardStep(etapaAnterior);
            
            // Limpar erros de validação da etapa anterior se for uma etapa PAVE
            if (etapaAnterior >= WIZARD_STEPS.ETAPA_1 && etapaAnterior <= WIZARD_STEPS.ETAPA_3) {
                const { errorKey } = getKeysForEtapa(etapaAnterior);
                if (validationErrors[errorKey]) {
                    setValidationErrors(prev => {
                        const newState = { ...prev };
                        delete newState[errorKey];
                        return newState;
                    });
                }
            }
        }
    }, [wizardStep, getKeysForEtapa, validationErrors, etapasFlow]);

    // Determinar texto e estado do botão Próxima Etapa para passar aos componentes filhos
    const isNextStepDisabled = !isCurrentWizardStepValid();
    const nextStepText = wizardStep === WIZARD_STEPS.CURSO ? 'Simular agora' : 'Próxima etapa';

    return {
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
    };
};

export default useCalculadoraWizard;
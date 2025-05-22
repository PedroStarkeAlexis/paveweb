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

    // Determinar texto e estado do botão Próxima Etapa para passar aos componentes filhos
    const isNextStepDisabled = !isCurrentWizardStepValid();
    const nextStepText = wizardStep === WIZARD_STEPS.CURSO ? 'Simular agora' : 'Próxima etapa';

    return {
        wizardStep,
        setWizardStep,
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
import React, { useState, useEffect, useMemo } from 'react';
// <<< REMOVER imports de react-window e AutoSizer >>>

import Filters from './Filters.jsx'; // <<< MANTENHA .jsx se o arquivo se chama assim
import QuestionList from './QuestionList'; // Import original
// <<< REMOVER import de QuestionLayout se não for usado diretamente aqui >>>

function QuestionBankPage() {
    const [allQuestions, setAllQuestions] = useState([]); // <<< VOLTA a guardar TODAS
    const [filteredQuestions, setFilteredQuestions] = useState([]); // <<< Lista filtrada no frontend
    const [filters, setFilters] = useState({ ano: null, materia: null, etapa: null });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    // <<< REMOVER estados de pagination e isLoadingFilters >>>
    // <<< REMOVER estado filterOptions (será derivado com useMemo) >>>

    // --- Efeito para Buscar Todas as Questões (LÓGICA ORIGINAL) ---
    useEffect(() => {
        const fetchQuestions = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // <<< VOLTA a buscar questoes.json diretamente >>>
                const response = await fetch('/questoes.json'); // Assume que está em /public
                if (!response.ok) { throw new Error(`Erro ${response.status}`); }
                const questions = await response.json();
                const validQuestions = Array.isArray(questions) ? questions : [];
                setAllQuestions(validQuestions);
                setFilteredQuestions(validQuestions); // Inicializa filtrado com tudo
            } catch (err) {
                console.error("Erro no fetch das questões:", err);
                setError(err.message || "Falha ao buscar dados.");
                setAllQuestions([]);
                setFilteredQuestions([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuestions();
    }, []); // Roda apenas uma vez

    // --- Memo para Derivar Opções de Filtro (LÓGICA ORIGINAL) ---
    const filterOptions = useMemo(() => {
        const anos = new Set();
        const materias = new Set();
        const etapas = new Set();
        allQuestions.forEach(q => {
            if (q?.ano) anos.add(q.ano); // Adiciona verificação opcional
            if (q?.materia) materias.add(q.materia);
            if (q?.etapa) etapas.add(q.etapa);
        });
        return {
            anos: Array.from(anos).sort((a, b) => b - a),
            materias: Array.from(materias).sort(),
            etapas: Array.from(etapas).sort((a, b) => a - b)
        };
    }, [allQuestions]);

    // --- Efeito para Filtrar Questões (LÓGICA ORIGINAL NO FRONTEND) ---
    useEffect(() => {
        let currentQuestions = [...allQuestions]; // Começa com todas as questões
        if (filters.ano) {
            const filterAnoNum = parseInt(filters.ano, 10);
            // Adiciona verificação q.ano existe antes de comparar
            currentQuestions = currentQuestions.filter(q => q.ano && q.ano === filterAnoNum);
        }
        if (filters.materia) {
            // Adiciona verificação q.materia existe antes de comparar
            currentQuestions = currentQuestions.filter(q => q.materia && q.materia === filters.materia);
        }
        if (filters.etapa) {
            const filterEtapaNum = parseInt(filters.etapa, 10);
            // Adiciona verificação q.etapa existe antes de comparar
            currentQuestions = currentQuestions.filter(q => q.etapa && q.etapa === filterEtapaNum);
        }
        setFilteredQuestions(currentQuestions); // Atualiza a lista filtrada
    }, [filters, allQuestions]); // Executa quando filtros ou allQuestions mudam

    // --- Handler para Mudanças nos Filtros (LÓGICA ORIGINAL) ---
    const handleFilterChange = (filterName, value) => {
        setFilters(prevFilters => ({ ...prevFilters, [filterName]: value }));
        // <<< REMOVER lógica de resetar página >>>
    };

    // <<< REMOVER handlers de paginação (handleNextPage, handlePrevPage) >>>

    return (
        <div className="question-bank-container">
            {/* Renderiza filtros normalmente */}
            <Filters
                anos={filterOptions.anos}
                materias={filterOptions.materias}
                etapas={filterOptions.etapas}
                filterValues={filters}
                onFilterChange={handleFilterChange}
            />
            {isLoading && <p className="loading-message">Carregando questões...</p>}
            {error && <p className="error-message">Erro: {error}</p>}
            {!isLoading && !error && (
                // <<< VOLTA a usar QuestionList diretamente com a lista filtrada >>>
                <div className="question-list" id="question-bank-list">
                    <p className="results-count">{filteredQuestions.length} questão(ões) encontrada(s).</p>
                    {/* <<< PASSA a lista filtrada do frontend >>> */}
                    <QuestionList questions={filteredQuestions} />
                </div>
            )}
            {/* <<< REMOVER container da lista virtualizada e controles de paginação >>> */}
        </div>
    );
}

export default QuestionBankPage;
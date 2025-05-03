import React, { useState, useEffect, useMemo } from 'react';
// --- Imports Locais Atualizados ---
import Filters from './Filters';
import QuestionList from './QuestionList';

function QuestionBankPage() {
    const [allQuestions, setAllQuestions] = useState([]);
    const [filteredQuestions, setFilteredQuestions] = useState([]);
    const [filters, setFilters] = useState({ ano: null, materia: null, etapa: null });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Efeito para Buscar Todas as Questões ---
    useEffect(() => {
        const fetchQuestions = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Mantendo fetch de public/ por enquanto, conforme estrutura da imagem
                const response = await fetch('/questoes.json');
                if (!response.ok) { throw new Error(`Erro ${response.status}`); }
                const questions = await response.json();
                // Validação básica se é um array
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

    // --- Memo para Derivar Opções de Filtro ---
    const filterOptions = useMemo(() => {
        const anos = new Set();
        const materias = new Set();
        const etapas = new Set();
        allQuestions.forEach(q => {
            if (q.ano) anos.add(q.ano);
            if (q.materia) materias.add(q.materia);
            if (q.etapa) etapas.add(q.etapa);
        });
        return {
            anos: Array.from(anos).sort((a, b) => b - a),
            materias: Array.from(materias).sort(),
            etapas: Array.from(etapas).sort((a, b) => a - b)
        };
    }, [allQuestions]);

    // --- Efeito para Filtrar Questões ---
    useEffect(() => {
        let currentQuestions = [...allQuestions];
        if (filters.ano) {
            const filterAnoNum = parseInt(filters.ano, 10);
            currentQuestions = currentQuestions.filter(q => q.ano === filterAnoNum);
        }
        if (filters.materia) {
            currentQuestions = currentQuestions.filter(q => q.materia === filters.materia);
        }
        if (filters.etapa) {
            const filterEtapaNum = parseInt(filters.etapa, 10);
            currentQuestions = currentQuestions.filter(q => q.etapa === filterEtapaNum);
        }
        setFilteredQuestions(currentQuestions);
    }, [filters, allQuestions]);

    // --- Handler para Mudanças nos Filtros ---
    const handleFilterChange = (filterName, value) => {
        setFilters(prevFilters => ({ ...prevFilters, [filterName]: value }));
    };

    return (
        <div className="question-bank-container">
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
                <div className="question-list" id="question-bank-list">
                    <p className="results-count">{filteredQuestions.length} questão(ões) encontrada(s).</p>
                    <QuestionList questions={filteredQuestions} />
                </div>
            )}
        </div>
    );
}

export default QuestionBankPage;
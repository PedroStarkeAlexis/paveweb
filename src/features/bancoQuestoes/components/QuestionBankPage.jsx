import React, { useState, useEffect, useCallback, useRef } from 'react';

import Filters from './Filters.jsx'; // Certifique-se que o caminho e extensão estão corretos
import QuestionLayout from '../../../components/common/QuestionLayout'; // Caminho correto

// Componente para o campo de busca (mantido)
const SearchInput = ({ onSearch, isLoading, initialQuery = '' }) => {
    const [searchTerm, setSearchTerm] = useState(initialQuery);

    useEffect(() => {
        setSearchTerm(initialQuery);
    }, [initialQuery]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        onSearch(searchTerm.trim());
    };

    return (
        <form onSubmit={handleSearchSubmit} className="search-section">
            <input
                type="search"
                placeholder="Buscar questões por tema, conceito..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input-field"
                disabled={isLoading}
            />
            <button type="submit" className="search-button" disabled={isLoading || !searchTerm.trim()}>
                {isLoading ? 'Buscando...' : 'Buscar'}
            </button>
        </form>
    );
};

function QuestionBankPage() {
    const [questionsToDisplay, setQuestionsToDisplay] = useState([]); // Questões para exibir na tela
    const [filters, setFilters] = useState({ ano: null, materia: null, etapa: null });
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOptions, setFilterOptions] = useState({ anos: [], materias: [], etapas: [] });
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, limit: 10 }); // Limite padrão
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isLoadingFilters, setIsLoadingFilters] = useState(true);

    // Função para buscar dados da API
    const fetchData = useCallback(async (page, currentFilters, currentSearchQuery) => {
        setIsLoading(true);
        setError(null);
        console.log(`[QuestionBankPage] Fetching data - Page: ${page}, Query: "${currentSearchQuery}", Filters:`, currentFilters);

        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: pagination.limit.toString()
            });

            let apiPath = '/api/search-questions'; // Usaremos sempre esta API agora

            if (currentSearchQuery && currentSearchQuery.trim() !== '') {
                params.set('query', currentSearchQuery.trim());
            }
            if (currentFilters.materia) {
                params.set('materia', currentFilters.materia);
            }
            if (currentFilters.ano) {
                params.set('ano', currentFilters.ano);
            }
            if (currentFilters.etapa) {
                params.set('etapa', currentFilters.etapa);
            }

            // Mesmo se não houver query ou filtros, a API /api/search-questions
            // foi ajustada para retornar vazio ou lidar com isso.
            const finalApiPath = `${apiPath}?${params.toString()}`;
            console.log(`[QuestionBankPage] Calling API: ${finalApiPath}`);

            const response = await fetch(finalApiPath);
            const responseBodyText = await response.text(); // Ler como texto primeiro para debug
            console.log("[QuestionBankPage] API Response Status:", response.status);
            console.log("[QuestionBankPage] API Response Body Text:", responseBodyText);


            if (!response.ok) {
                let errorMsg = `Erro ${response.status}`;
                try {
                    const errorJson = JSON.parse(responseBodyText);
                    errorMsg = errorJson.error || errorMsg;
                } catch (e) {
                    errorMsg = `${errorMsg} - ${responseBodyText.substring(0, 100)}`;
                }
                throw new Error(errorMsg);
            }

            const data = JSON.parse(responseBodyText);
            setQuestionsToDisplay(data.questions || []);
            setPagination(prev => ({ ...prev, ...data.pagination, currentPage: page })); // Garante que currentPage seja atualizado corretamente

        } catch (err) {
            console.error("[QuestionBankPage] Erro no fetch das questões:", err);
            setError(err.message || "Falha ao buscar dados.");
            setQuestionsToDisplay([]); // Limpa questões em caso de erro
            setPagination(prev => ({ ...prev, currentPage: 1, totalPages: 1, totalItems: 0 }));
        } finally {
            setIsLoading(false);
        }
    }, [pagination.limit]); // Dependência no limit da paginação

    // Efeito para buscar opções de filtro (uma vez) e carga inicial
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoadingFilters(true);
            try {
                const response = await fetch('/api/get-filter-options'); // Caminho simplificado
                if (!response.ok) throw new Error(`Erro ${response.status} ao buscar opções de filtro`);
                const options = await response.json();
                setFilterOptions({
                    anos: options.anos || [],
                    materias: options.materias || [],
                    etapas: options.etapas || [],
                });
            } catch (err) {
                console.error("[QuestionBankPage] Erro ao buscar opções de filtro:", err);
                setError("Falha ao carregar opções de filtro."); // Define um erro para o usuário
            } finally {
                setIsLoadingFilters(false);
            }
            // Carga inicial de questões (página 1, sem filtros, sem query)
            // A API /api/search-questions deve retornar uma lista vazia ou as primeiras X se não houver query/filtro.
            fetchData(1, { ano: null, materia: null, etapa: null }, '');
        };
        loadInitialData();
    }, [fetchData]); // fetchData é memoizado

    // Handler para quando os filtros mudam
    const handleFilterChange = useCallback((filterName, value) => {
        setFilters(prevFilters => {
            const newFilters = { ...prevFilters, [filterName]: value };
            fetchData(1, newFilters, searchQuery); // Busca da página 1 com novos filtros
            return newFilters;
        });
    }, [searchQuery, fetchData]);

    // Handler para quando a busca é submetida
    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        fetchData(1, filters, query); // Busca da página 1 com nova query
    }, [filters, fetchData]);

    // Handlers para paginação
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages && newPage !== pagination.currentPage && !isLoading) {
            fetchData(newPage, filters, searchQuery);
        }
    };
    const handleNextPage = () => handlePageChange(pagination.currentPage + 1);
    const handlePrevPage = () => handlePageChange(pagination.currentPage - 1);

    return (
        <div className="question-bank-container">
            <SearchInput onSearch={handleSearch} isLoading={isLoading} initialQuery={searchQuery} />

            {isLoadingFilters && <p className="loading-message">Carregando filtros...</p>}
            {!isLoadingFilters && filterOptions.materias.length === 0 && !error && (
                <p className="error-message">Opções de filtro não puderam ser carregadas.</p>
            )}
            {!isLoadingFilters && filterOptions.materias.length > 0 && (
                <Filters
                    anos={filterOptions.anos}
                    materias={filterOptions.materias}
                    etapas={filterOptions.etapas}
                    filterValues={filters}
                    onFilterChange={handleFilterChange}
                />
            )}

            <div className="results-summary">
                {!isLoading && ( // Mostra mesmo se houver erro, para o erro ser visível
                    <p className="results-count">
                        {pagination.totalItems} questão(ões) encontrada(s).
                        {pagination.totalPages > 0 && ` Exibindo página ${pagination.currentPage} de ${pagination.totalPages}.`}
                    </p>
                )}
            </div>

            {/* Container da Lista de Questões (sem virtualização por agora) */}
            <div className="question-list-container"> {/* Use uma classe genérica para estilização */}
                {isLoading && <p className="loading-message">Carregando questões...</p>}
                {error && !isLoading && <p className="error-message">Erro ao carregar questões: {error}</p>}
                {!isLoading && !error && questionsToDisplay.length === 0 && (
                    <p className="no-results-message">Nenhuma questão encontrada com os critérios atuais.</p>
                )}
                {!isLoading && !error && questionsToDisplay.length > 0 && (
                    questionsToDisplay.map((question) => (
                        <QuestionLayout key={question.id || `q-${Math.random()}`} questionData={question} />
                    ))
                )}
            </div>

            {/* Controles de Paginação */}
            {!isLoading && !error && pagination.totalPages > 1 && (
                <div className="pagination-controls">
                    <button onClick={handlePrevPage} disabled={pagination.currentPage === 1 || isLoading}>
                        Anterior
                    </button>
                    <span>Página {pagination.currentPage} de {pagination.totalPages}</span>
                    <button onClick={handleNextPage} disabled={pagination.currentPage >= pagination.totalPages || isLoading}>
                        Próxima
                    </button>
                </div>
            )}
        </div>
    );
}
export default QuestionBankPage;
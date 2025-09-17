import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import Filters from './Filters.jsx'; // Certifique-se que o caminho e extensão estão corretos
import QuestionLayout from '../../../components/common/QuestionLayout'; // Caminho correto
import '../styles/QuestionBankPage.css'; // Importar os estilos

// Componente para o campo de busca (melhorado)
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
            <div className="search-input-container">
                <input
                    type="search"
                    placeholder="Buscar questões por tema, conceito... (opcional)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input-field"
                    disabled={isLoading}
                />
                <button type="submit" className="search-button" disabled={isLoading}>
                    {isLoading ? 'Buscando...' : 'Buscar'}
                </button>
            </div>
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
    const [hasSearched, setHasSearched] = useState(false); // Novo: controla se uma busca já foi feita
    const [isLoadingFilters, setIsLoadingFilters] = useState(true);

    // Função para buscar dados da API
    const fetchData = useCallback(async (page, currentFilters, currentSearchQuery) => {
        setIsLoading(true);
        setError(null);
        console.log(`[QuestionBankPage] Fetching data - Page: ${page}, Query: "${currentSearchQuery}", Filters:`, currentFilters);

        try {
            // Verifica se há pelo menos algum critério de busca (query OU filtros)
            const hasQuery = currentSearchQuery && currentSearchQuery.trim() !== '';
            const hasFilters = currentFilters.materia || currentFilters.ano || currentFilters.etapa;
            
            if (!hasQuery && !hasFilters) {
                // Se não há nem query nem filtros, não faz a busca
                setQuestionsToDisplay([]);
                setPagination(prev => ({ ...prev, currentPage: 1, totalPages: 1, totalItems: 0 }));
                setHasSearched(false);
                return;
            }

            const params = new URLSearchParams({
                page: page.toString(),
                limit: pagination.limit.toString()
            });

            let apiPath = '/api/search-questions'; // Usaremos sempre esta API agora

            if (hasQuery) {
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
            setHasSearched(true); // Marca que uma busca foi realizada

        } catch (err) {
            console.error("[QuestionBankPage] Erro no fetch das questões:", err);
            setHasSearched(true); // Marca que uma busca foi tentada, para mostrar o erro
            setError(err.message || "Falha ao buscar dados.");
            setQuestionsToDisplay([]); // Limpa questões em caso de erro
            setPagination(prev => ({ ...prev, currentPage: 1, totalPages: 1, totalItems: 0 }));
        } finally {
            setIsLoading(false);
        }
    }, [pagination.limit]); // Dependência no limit da paginação

    // Efeito para buscar opções de filtro (uma vez na montagem)
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
        };
        loadInitialData();
    }, []); // Roda apenas uma vez

    // Handler para quando os filtros mudam
    const handleFilterChange = useCallback((filterName, value) => {
        // Apenas atualiza o estado dos filtros, não busca mais automaticamente
        setFilters(prevFilters => ({ ...prevFilters, [filterName]: value }));
    }, []);

    // Handler para quando a busca é submetida
    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        fetchData(1, filters, query); // Busca da página 1 com nova query
    }, [filters, fetchData]);

    // Handler para aplicar apenas os filtros (novo)
    const handleApplyFilters = useCallback(() => {
        fetchData(1, filters, searchQuery); // Busca com filtros atuais
    }, [filters, searchQuery, fetchData]);

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
            <div className="search-and-filters-container">
                <SearchInput onSearch={handleSearch} isLoading={isLoading} initialQuery={searchQuery} />

                {isLoadingFilters && <p className="loading-message">Carregando filtros...</p>}
                {!isLoadingFilters && filterOptions.materias.length === 0 && !error && (
                    <p className="error-message">Opções de filtro não puderam ser carregadas.</p>
                )}
                {!isLoadingFilters && filterOptions.materias.length > 0 && (
                    <div className="filters-container">
                        <Filters
                            anos={filterOptions.anos}
                            materias={filterOptions.materias}
                            etapas={filterOptions.etapas}
                            filterValues={filters}
                            onFilterChange={handleFilterChange}
                        />
                        <div className="filter-actions">
                            <button 
                                className="apply-filters-button" 
                                onClick={handleApplyFilters}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Aplicando...' : 'Aplicar Filtros'}
                            </button>
                            <button 
                                className="clear-filters-button" 
                                onClick={() => {
                                    setFilters({ ano: null, materia: null, etapa: null });
                                    setSearchQuery('');
                                    setHasSearched(false);
                                    setQuestionsToDisplay([]);
                                }}
                                disabled={isLoading}
                            >
                                Limpar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Link para Questões Salvas */}
            <div className="saved-questions-link-container">
                <Link to="/questoes-salvas" className="saved-questions-page-link">
                    Ver Questões Salvas
                </Link>
                <Link to="/criar-questao" className="create-question-page-link">
                    Criar Questão
                </Link>
            </div>

            {/* Mostra o resumo apenas se uma busca foi feita e não está carregando */}
            {hasSearched && !isLoading && (
                <div className="results-summary">
                    <p className="results-count">
                        {pagination.totalItems} questão(ões) encontrada(s).
                        {pagination.totalPages > 0 && ` Exibindo página ${pagination.currentPage} de ${pagination.totalPages}.`}
                    </p>
                </div>
            )}

            {/* Container da Lista de Questões (sem virtualização por agora) */}
            <div className="question-list-container"> {/* Use uma classe genérica para estilização */}
                {isLoading && <p className="loading-message">Carregando questões...</p>}
                {!isLoading && !hasSearched && (
                    <div className="search-help">
                        <h3>Como buscar questões:</h3>
                        <ul>
                            <li>📝 <strong>Digite um termo</strong> e clique em "Buscar" para pesquisar por conteúdo</li>
                            <li>🔍 <strong>Use os filtros</strong> (matéria, ano, etapa) e clique em "Aplicar Filtros"</li>
                            <li>⚡ <strong>Combine ambos</strong> para resultados mais precisos</li>
                        </ul>
                    </div>
                )}
                {hasSearched && error && !isLoading && <p className="error-message">Erro ao carregar questões: {error}</p>}
                {hasSearched && !isLoading && !error && questionsToDisplay.length === 0 && (
                    <p className="no-results-message">Nenhuma questão encontrada com os critérios atuais.</p>
                )}
                {hasSearched && !isLoading && !error && questionsToDisplay.length > 0 && (
                    questionsToDisplay.map((question) => (
                        <QuestionLayout key={question.id || `q-${Math.random()}`} questionData={question} />
                    ))
                )}
            </div>

            {/* Controles de Paginação (só aparecem após uma busca bem-sucedida com mais de uma página) */}
            {hasSearched && !isLoading && !error && pagination.totalPages > 1 && (
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
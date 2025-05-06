// src/features/bancoQuestoes/components/QuestionBankPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';

import Filters from './Filters.jsx';
import QuestionLayout from '../../../components/common/QuestionLayout';

const Row = React.memo(({ index, style, data }) => {
    const question = data.questions[index]; // Acessa questions de dentro do objeto data
    const { highlightTerms } = data; // Pega os termos de destaque

    // Função simples para destacar (pode ser melhorada)
    const getHighlightedText = (text, terms) => {
        if (!terms || !text) return text;
        // Escapa termos para regex e cria uma regex insensível a maiúsculas/minúsculas
        const escapedTerms = terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
        
        if (escapedTerms.join('').length === 0) return text; // Se não houver termos válidos

        const parts = text.split(regex);
        return parts.map((part, i) =>
            regex.test(part) ? <mark key={i}>{part}</mark> : part
        );
    };
    
    // Modifica questionData para incluir texto destacado se necessário
    const questionDataForLayout = {
        ...question,
        // Descomente e ajuste se quiser destacar no texto da questão
        // texto_questao: highlightTerms && question.texto_questao ? getHighlightedText(question.texto_questao, highlightTerms) : question.texto_questao,
    };


    return (
        <div style={style}>
            <div style={{ paddingBottom: '25px', paddingRight: '10px' }}> {/* Ajuste o padding se necessário */}
                <QuestionLayout questionData={questionDataForLayout} />
            </div>
        </div>
    );
});


const SearchInput = ({ onSearch, isLoading, initialQuery = '' }) => {
    const [searchTerm, setSearchTerm] = useState(initialQuery);
    const inputRef = useRef(null);

    useEffect(() => {
        setSearchTerm(initialQuery); // Sincroniza se initialQuery mudar (ex: de URL params)
    }, [initialQuery]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        onSearch(searchTerm.trim());
    };

    return (
        <form onSubmit={handleSearchSubmit} className="search-section">
            <input
                ref={inputRef}
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
    const [currentPageQuestions, setCurrentPageQuestions] = useState([]);
    const [filters, setFilters] = useState({ ano: null, materia: null, etapa: null });
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOptions, setFilterOptions] = useState({ anos: [], materias: [], etapas: [] });
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, limit: 10 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isLoadingFilters, setIsLoadingFilters] = useState(true);
    const listRef = useRef(null);

    const fetchQuestionsData = useCallback(async (page, currentFilters, currentSearchQuery) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: pagination.limit.toString()
            });

            let apiPathBase = '/api/search-questions'; // Default to semantic search API
            let hasSearchParams = false;

            if (currentSearchQuery && currentSearchQuery.trim() !== '') {
                params.set('query', currentSearchQuery.trim());
                hasSearchParams = true;
            }
            if (currentFilters.materia) {
                params.set('materia', currentFilters.materia);
                hasSearchParams = true;
            }
            if (currentFilters.ano) {
                params.set('ano', currentFilters.ano);
                hasSearchParams = true;
            }
            if (currentFilters.etapa) {
                params.set('etapa', currentFilters.etapa);
                hasSearchParams = true;
            }
            
            // Se não houver query de busca nem filtros, poderia usar uma API de listagem geral,
            // mas a /api/search-questions já foi adaptada para lidar com isso (retornando vazio ou filtrando).
            // A lógica aqui é que se não há query nem filtros, talvez não devesse chamar search-questions
            // a menos que ela tenha um bom fallback para listagem geral.
            // Por ora, se não houver query E nenhum filtro, a API /api/search-questions retornará vazio.
            // Se você quiser que ela liste tudo paginado nesse caso, a API backend precisa ser ajustada.

            const finalApiPath = `${apiPathBase}?${params.toString()}`;
            console.log(`Fetching from: ${finalApiPath}`);

            const response = await fetch(finalApiPath);
            if (!response.ok) {
                let errorMsg = `Erro ${response.status}`;
                try { errorMsg = (await response.json()).error || errorMsg; } catch (e) { /* ignora */ }
                throw new Error(errorMsg);
            }
            const data = await response.json();
            setCurrentPageQuestions(data.questions || []);
            setPagination(prev => ({ ...prev, ...data.pagination }));

            if (listRef.current) {
                listRef.current.scrollToItem(0);
            }

        } catch (err) {
            console.error("Erro no fetch das questões:", err);
            setError(err.message || "Falha ao buscar dados.");
            setCurrentPageQuestions([]);
            setPagination(prev => ({ ...prev, currentPage: 1, totalPages: 1, totalItems: 0 }));
        } finally {
            setIsLoading(false);
        }
    }, [pagination.limit]); // Adiciona pagination.limit como dependência se ele puder mudar

    useEffect(() => {
        const fetchFilterOpts = async () => {
            setIsLoadingFilters(true);
            try {
                const response = await fetch('/api/questions/filters');
                if (!response.ok) throw new Error(`Erro ${response.status} ao buscar opções de filtro`);
                const options = await response.json();
                setFilterOptions({
                    anos: options.anos || [],
                    materias: options.materias || [],
                    etapas: options.etapas || [],
                });
            } catch (err) {
                console.error("Erro ao buscar opções de filtro:", err);
                setError("Falha ao carregar opções de filtro. Tente recarregar a página.");
            } finally {
                setIsLoadingFilters(false);
            }
        };
        fetchFilterOpts();
        // Busca inicial (página 1, sem filtros, sem query)
        fetchQuestionsData(1, filters, searchQuery);
    }, [fetchQuestionsData]); // fetchQuestionsData é memoizado

    const handleFilterChange = useCallback((filterName, value) => {
        setFilters(prevFilters => {
            const newFilters = { ...prevFilters, [filterName]: value };
            // Não precisa mexer na paginação aqui, pois fetchQuestionsData será chamado
            fetchQuestionsData(1, newFilters, searchQuery); // Sempre busca página 1 com novos filtros
            return newFilters;
        });
    }, [searchQuery, fetchQuestionsData]);

    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        // Não precisa mexer na paginação aqui
        fetchQuestionsData(1, filters, query); // Sempre busca página 1 com nova query
    }, [filters, fetchQuestionsData]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages && newPage !== pagination.currentPage && !isLoading) {
            // Não precisa setar paginação aqui diretamente
            fetchQuestionsData(newPage, filters, searchQuery);
        }
    };
    const handleNextPage = () => handlePageChange(pagination.currentPage + 1);
    const handlePrevPage = () => handlePageChange(pagination.currentPage - 1);

    const ESTIMATED_ROW_HEIGHT = 480; // <<<< AJUSTE ESTE VALOR CUIDADOSAMENTE!

    // Prepara dados para react-window, incluindo termos de destaque
    const itemDataForList = {
        questions: currentPageQuestions,
        highlightTerms: searchQuery ? searchQuery.trim().split(/\s+/).filter(Boolean) : null
    };

    return (
        <div className="question-bank-container">
            <SearchInput onSearch={handleSearch} isLoading={isLoading} initialQuery={searchQuery} />

            {isLoadingFilters && <p className="loading-message">Carregando filtros...</p>}
            {!isLoadingFilters && filterOptions.materias.length > 0 && ( // Mostra filtros apenas se carregados
                <Filters
                    anos={filterOptions.anos}
                    materias={filterOptions.materias}
                    etapas={filterOptions.etapas}
                    filterValues={filters}
                    onFilterChange={handleFilterChange}
                />
            )}
            {/* Mensagem se filtros não carregarem */}
            {!isLoadingFilters && filterOptions.materias.length === 0 && !error && (
                 <p className="error-message">Não foi possível carregar as opções de filtro.</p>
            )}


            <div className="results-summary">
                {!isLoading && !error && (
                    <p className="results-count">
                        {pagination.totalItems} questão(ões) encontrada(s).
                        {pagination.totalPages > 0 && ` Exibindo página ${pagination.currentPage} de ${pagination.totalPages}.`}
                    </p>
                )}
            </div>

            <div className="question-list-virtualized-container">
                {isLoading && <p className="loading-message">Carregando questões...</p>}
                {error && !isLoading && <p className="error-message">Erro: {error}</p>}
                {!isLoading && !error && currentPageQuestions.length === 0 && (
                    <p className="no-results-message">Nenhuma questão encontrada com os critérios atuais.</p>
                )}
                {!isLoading && !error && currentPageQuestions.length > 0 && (
                    <AutoSizer>
                        {({ height, width }) => (
                            <List
                                ref={listRef}
                                height={height}
                                itemCount={currentPageQuestions.length}
                                itemSize={ESTIMATED_ROW_HEIGHT}
                                width={width}
                                itemData={itemDataForList} // Passa o objeto com questões e termos de destaque
                            >
                                {Row}
                            </List>
                        )}
                    </AutoSizer>
                )}
            </div>

            {!isLoading && pagination.totalPages > 1 && (
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
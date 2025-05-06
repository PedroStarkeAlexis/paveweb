import React, { useState, useEffect, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window'; // Importa react-window
import AutoSizer from 'react-virtualized-auto-sizer'; // Para obter altura/largura dinâmicas

import Filters from './Filters.jsx'; // Mantém o nome como estava
import QuestionLayout from '../../../components/common/QuestionLayout'; // Caminho correto

// Componente interno para renderizar cada item na lista virtualizada
const Row = React.memo(({ index, style, data }) => { // Usa React.memo aqui também!
    const question = data[index];
    // Aplicamos o 'style' que react-window passa para posicionamento
    return (
        <div style={style}>
            {/* Adiciona um padding interno para o item na lista virtualizada */}
            <div style={{ paddingBottom: '25px', paddingRight: '10px' }}>
                <QuestionLayout questionData={question} />
            </div>
        </div>
    );
});


function QuestionBankPage() {
    // Estado para as questões da PÁGINA ATUAL
    const [currentPageQuestions, setCurrentPageQuestions] = useState([]);
    // Estado para os filtros
    const [filters, setFilters] = useState({ ano: null, materia: null, etapa: null });
    // Estado para opções de filtro carregadas da API
    const [filterOptions, setFilterOptions] = useState({ anos: [], materias: [], etapas: [] });
    // Estado para informações de paginação
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
    // Estados de controle
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isLoadingFilters, setIsLoadingFilters] = useState(true);

    // Função para buscar questões da API
    const fetchPaginatedQuestions = useCallback(async (page = 1, currentFilters) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ page: page.toString(), limit: '20' }); // Limite fixo por enquanto
            if (currentFilters.materia) params.set('materia', currentFilters.materia);
            if (currentFilters.ano) params.set('ano', currentFilters.ano);
            if (currentFilters.etapa) params.set('etapa', currentFilters.etapa);

            // <<< CHAMA A NOVA API >>>
            const response = await fetch(`/api/questions?${params.toString()}`);
            if (!response.ok) {
                let errorMsg = `Erro ${response.status}`;
                try { errorMsg = (await response.json()).error || errorMsg; } catch (e) { /* ignora */ }
                throw new Error(errorMsg);
            }
            const data = await response.json();
            setCurrentPageQuestions(data.questions || []);
            setPagination(data.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 });
        } catch (err) {
            console.error("Erro no fetch das questões paginadas:", err);
            setError(err.message || "Falha ao buscar dados.");
            setCurrentPageQuestions([]);
            setPagination({ currentPage: 1, totalPages: 1, totalItems: 0 });
        } finally {
            setIsLoading(false);
        }
    }, []); // useCallback sem dependências, pois usa os parâmetros passados

    // Efeito para buscar opções de filtro UMA VEZ
    useEffect(() => {
        const fetchFilterOptions = async () => {
            setIsLoadingFilters(true);
            try {
                // <<< CHAMA A NOVA API DE FILTROS >>>
                const response = await fetch('/api/questions/filters'); // Ajuste o caminho se necessário
                if (!response.ok) throw new Error(`Erro ${response.status}`);
                const options = await response.json();
                setFilterOptions({
                    anos: options.anos || [],
                    materias: options.materias || [],
                    etapas: options.etapas || [],
                });
            } catch (err) {
                console.error("Erro ao buscar opções de filtro:", err);
                // Poderia setar um erro específico para filtros
            } finally {
                setIsLoadingFilters(false);
            }
        };
        fetchFilterOptions();
    }, []); // Roda apenas na montagem

    // Efeito para buscar questões quando filtros ou página mudam
    useEffect(() => {
        // Busca a página 1 quando os filtros mudam
        fetchPaginatedQuestions(pagination.currentPage, filters);
    }, [filters, pagination.currentPage, fetchPaginatedQuestions]); // Re-executa se filtros ou página mudarem

    // Handler para Mudanças nos Filtros
    const handleFilterChange = useCallback((filterName, value) => {
        setFilters(prevFilters => {
            const newFilters = { ...prevFilters, [filterName]: value };
            // IMPORTANTE: Quando o filtro muda, voltamos para a página 1
            setPagination(prevPag => ({ ...prevPag, currentPage: 1 }));
            // O useEffect acima vai disparar a busca com a nova página e filtros
            return newFilters;
        });
    }, []);

    // Handlers para Paginação
    const handleNextPage = () => {
        if (pagination.currentPage < pagination.totalPages) {
            setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }));
        }
    };
    const handlePrevPage = () => {
        if (pagination.currentPage > 1) {
            setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }));
        }
    };

    // Estimativa da altura de cada item (QuestionLayout). AJUSTE conforme necessário!
    // Pode ser necessário inspecionar o elemento renderizado ou usar bibliotecas para medir.
    const ESTIMATED_ROW_HEIGHT = 450; // <<<< AJUSTE ESTE VALOR!

    return (
        <div className="question-bank-container">
            {/* Passa as opções carregadas da API para Filters */}
            {!isLoadingFilters && (
                <Filters
                    anos={filterOptions.anos}
                    materias={filterOptions.materias}
                    etapas={filterOptions.etapas}
                    filterValues={filters}
                    onFilterChange={handleFilterChange}
                />
            )}
            {isLoadingFilters && <p className="loading-message">Carregando filtros...</p>}

            <div className="results-summary">
                {!isLoading && !error && (
                    <p className="results-count">
                        {pagination.totalItems} questão(ões) encontrada(s). Exibindo página {pagination.currentPage} de {pagination.totalPages}.
                    </p>
                )}
            </div>

            {/* Container para a lista que terá altura definida */}
            <div className="question-list-virtualized-container">
                {isLoading && <p className="loading-message">Carregando questões...</p>}
                {error && <p className="error-message">Erro: {error}</p>}
                {!isLoading && !error && currentPageQuestions.length === 0 && (
                    <p className="no-results-message">Nenhuma questão encontrada com os filtros selecionados.</p>
                )}
                {!isLoading && !error && currentPageQuestions.length > 0 && (
                    // AutoSizer fornece altura e largura para react-window
                    <AutoSizer>
                        {({ height, width }) => (
                            <List
                                height={height}
                                itemCount={currentPageQuestions.length}
                                itemSize={ESTIMATED_ROW_HEIGHT} // <<<< USA A ALTURA ESTIMADA
                                width={width}
                                itemData={currentPageQuestions} // Passa as questões para o componente Row
                            >
                                {Row}
                            </List>
                        )}
                    </AutoSizer>
                )}
            </div>

            {/* Controles de Paginação */}
            {!isLoading && pagination.totalPages > 1 && (
                <div className="pagination-controls">
                    <button onClick={handlePrevPage} disabled={pagination.currentPage === 1}>
                        Anterior
                    </button>
                    <span>Página {pagination.currentPage} de {pagination.totalPages}</span>
                    <button onClick={handleNextPage} disabled={pagination.currentPage >= pagination.totalPages}>
                        Próxima
                    </button>
                </div>
            )}
        </div>
    );
}

export default QuestionBankPage;
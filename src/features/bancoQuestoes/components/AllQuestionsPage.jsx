import React, { useState, useEffect } from 'react';
import QuestionList from './QuestionList';
import FiltersDesktop from './FiltersDesktop';
import FilterModalMobile from './FilterModalMobile';
import useWindowSize from '../../../hooks/useWindowSize';
import useQuestionSearch from '../hooks/useQuestionSearch';
import './AllQuestionsPage.css';

function AllQuestionsPage({ initialFilters = {} }) {
  const [filterOptions, setFilterOptions] = useState({ materias: [], anos: [], etapas: [] });
  const [filters, setFilters] = useState({ query: '', materia: null, ano: null, etapa: null });
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  // Hook customizado para gerenciar a busca de questões
  const { questions, isLoading, error, hasSearched, performSearch } = useQuestionSearch(filters);
  
  const { width } = useWindowSize();
  const isMobile = width < 768;

  // Aplicar filtros iniciais quando recebidos
  useEffect(() => {
    if (Object.keys(initialFilters).length > 0) {
      setFilters(prevFilters => ({ ...prevFilters, ...initialFilters }));
    }
  }, [initialFilters]);

  // Buscar opções de filtro ao montar o componente
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await fetch('/api/get-filter-options');
        if (!response.ok) throw new Error('Falha ao carregar opções de filtro');
        const data = await response.json();
        setFilterOptions({
          materias: data.materias || [],
          anos: data.anos || [],
          etapas: data.etapas || []
        });
      } catch (err) {
        console.error('Erro ao buscar opções de filtro:', err);
      }
    };
    fetchFilterOptions();
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleMobileFilterApply = (newFilters) => {
    setFilters(newFilters);
    setIsMobileFilterOpen(false);
  };

  // Estado Inicial (antes da primeira busca)
  const renderInitialState = () => (
    <div className="initial-state">
      <div className="initial-icon">🔍</div>
      <h2>Busca Avançada de Questões</h2>
      <p>Utilize os filtros acima para encontrar questões por palavra-chave, matéria, ano ou etapa.</p>
      <p className="initial-hint">Digite algo ou selecione um filtro para começar</p>
    </div>
  );

  // Estado de Carregamento
  const renderLoadingState = () => (
    <div className="loading-state">
      <div className="loading-spinner"></div>
      <p>Buscando questões...</p>
    </div>
  );

  // Estado de Erro
  const renderErrorState = () => (
    <div className="error-state">
      <div className="error-icon">⚠️</div>
      <h2>Erro ao buscar questões</h2>
      <p>{error}</p>
      <button onClick={() => performSearch(filters)} className="retry-button">
        Tentar novamente
      </button>
    </div>
  );

  // Estado Sem Resultados
  const renderEmptyState = () => (
    <div className="empty-state">
      <div className="empty-icon">📭</div>
      <h2>Nenhuma questão encontrada</h2>
      <p>Tente ajustar os filtros ou usar termos de busca diferentes.</p>
    </div>
  );

  // Estado com Resultados
  const renderResultsState = () => (
    <>
      <div className="results-summary">
        {questions.length} {questions.length === 1 ? 'questão encontrada' : 'questões encontradas'}
      </div>
      <QuestionList
        questions={questions}
        containerClassName="questions-list"
        emptyMessage="Nenhuma questão encontrada com os filtros selecionados."
      />
    </>
  );

  return (
    <div className="all-questions-page-container">
      <header className="all-questions-header">
       

        {!isMobile && (
          <FiltersDesktop 
            filters={filters} 
            onFilterChange={handleFilterChange} 
            options={filterOptions} 
          />
        )}

        {isMobile && (
          <button 
            className="mobile-filter-button" 
            onClick={() => setIsMobileFilterOpen(true)}
          >
            ☰ Busque por termo, assunto, prova...
          </button>
        )}
      </header>
      
      <main className="results-container">
        {!hasSearched && renderInitialState()}
        {isLoading && renderLoadingState()}
        {!isLoading && hasSearched && error && renderErrorState()}
        {!isLoading && hasSearched && !error && questions.length === 0 && renderEmptyState()}
        {!isLoading && hasSearched && !error && questions.length > 0 && renderResultsState()}
      </main>

      {isMobile && (
        <FilterModalMobile
          isOpen={isMobileFilterOpen}
          onClose={() => setIsMobileFilterOpen(false)}
          initialFilters={filters}
          onApplyFilters={handleMobileFilterApply}
          options={filterOptions}
        />
      )}
    </div>
  );
}

export default AllQuestionsPage;


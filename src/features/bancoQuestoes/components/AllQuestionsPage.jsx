import React, { useState, useEffect } from 'react';
import QuestionLayout from '../../../components/common/QuestionLayout';
import FiltersDesktop from './FiltersDesktop';
import FilterModalMobile from './FilterModalMobile';
import useWindowSize from '../../../hooks/useWindowSize';
import './AllQuestionsPage.css';

function AllQuestionsPage({ initialFilters = {} }) {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [filterOptions, setFilterOptions] = useState({ materias: [], anos: [], etapas: [] });
  const [filters, setFilters] = useState({ query: '', materia: null, ano: null, etapa: null });
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
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

  // Função para realizar a busca
  const performSearch = async (searchFilters) => {
    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      if (searchFilters.query) params.append('query', searchFilters.query);
      if (searchFilters.materia) params.append('materia', searchFilters.materia);
      if (searchFilters.ano) params.append('ano', searchFilters.ano);
      if (searchFilters.etapa) params.append('etapa', searchFilters.etapa);
      
      // Adicionar limite de 100 questões para evitar paginação
      params.append('limit', '100');

      const response = await fetch(`/api/search-questions?${params.toString()}`);
      if (!response.ok) throw new Error('Falha ao buscar questões');
      
      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (err) {
      console.error('Erro ao buscar questões:', err);
      setError(err.message);
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Disparar busca quando os filtros mudarem (mas apenas se houver algum filtro ativo)
  useEffect(() => {
    const hasActiveFilters = filters.query || filters.materia || filters.ano || filters.etapa;
    
    if (hasActiveFilters) {
      const debounceTimer = setTimeout(() => {
        performSearch(filters);
      }, 500); // Debounce de 500ms para evitar muitas requisições

      return () => clearTimeout(debounceTimer);
    }
  }, [filters]);

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
      <div className="questions-list">
        {questions.map((question, index) => (
          <div key={question.id || `question-${index}`} className="question-item">
            <QuestionLayout itemProva={question} />
          </div>
        ))}
      </div>
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
            🔍 Filtros
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


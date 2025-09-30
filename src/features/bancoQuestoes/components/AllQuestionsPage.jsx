import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QuestionLayout from '../../../components/common/QuestionLayout';
import FiltersDesktop from './FiltersDesktop';
import FilterModalMobile from './FilterModalMobile';
import useWindowSize from '../../../hooks/useWindowSize';
import './AllQuestionsPage.css';

const IconFilter = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.572a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
  </svg>
);

function AllQuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterOptions, setFilterOptions] = useState({ anos: [], materias: [], etapas: [] });
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [filters, setFilters] = useState({ query: '', materia: null, ano: null, etapa: null, page: 1 });
  const [hasSearched, setHasSearched] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  const { width } = useWindowSize();
  const isMobile = width < 768;

  const fetchData = useCallback(async (currentFilters) => {
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const params = new URLSearchParams({ page: currentFilters.page.toString(), limit: '10' });
      if (currentFilters.query) params.set('query', currentFilters.query);
      if (currentFilters.materia) params.set('materia', currentFilters.materia);
      if (currentFilters.ano) params.set('ano', currentFilters.ano);
      if (currentFilters.etapa) params.set('etapa', currentFilters.etapa);
      
      const response = await fetch(`/api/search-questions?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao buscar questões.');
      
      setQuestions(data.questions || []);
      setPagination(data.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 });
    } catch (err) {
      setError(err.message);
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await fetch('/api/get-filter-options');
        const data = await response.json();
        setFilterOptions(data);
      } catch (err) {
        console.error("Erro ao buscar opções de filtro:", err);
      }
    };
    fetchOptions();
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    fetchData(newFilters);
  };
  
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages && !isLoading) {
      handleFilterChange({ ...filters, page: newPage });
    }
  };

  const handleApplyMobileFilters = (mobileFilters) => {
    setIsMobileFilterOpen(false);
    const newFilters = { ...filters, ...mobileFilters, page: 1 };
    handleFilterChange(newFilters);
  };
  
  return (
    <div className="all-questions-page-container">
      <header className="all-questions-header">
        <div className="title-section">
          <h1>Busca Avançada</h1>
          <p>Encontre questões por palavra-chave, matéria, ano ou etapa.</p>
        </div>
        {isMobile && (
          <button className="mobile-filter-button" onClick={() => setIsMobileFilterOpen(true)}>
            <IconFilter /> Filtros
          </button>
        )}
      </header>

      {!isMobile && (
        <FiltersDesktop filters={filters} onFilterChange={handleFilterChange} options={filterOptions} />
      )}
      
      {hasSearched && !isLoading && (
        <div className="results-summary">
          {pagination.totalItems} questões encontradas.
        </div>
      )}

      <main className="results-list">
        <AnimatePresence>
          {isLoading && <div className="loading-message">Buscando questões...</div>}
          {error && <div className="error-message">{error}</div>}
          {!hasSearched && !isLoading && (
            <div className="no-results-message">Use a busca ou os filtros para começar.</div>
          )}
          {hasSearched && !isLoading && !error && questions.length === 0 && (
            <div className="no-results-message">Nenhuma questão encontrada com os critérios atuais.</div>
          )}
          {questions.length > 0 && questions.map((q, index) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <QuestionLayout questionData={q} />
            </motion.div>
          ))}
        </AnimatePresence>
      </main>

      {!isLoading && pagination.totalPages > 1 && (
        <div className="pagination-controls">
          <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1}>Anterior</button>
          <span>Página {pagination.currentPage} de {pagination.totalPages}</span>
          <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages}>Próxima</button>
        </div>
      )}

      {isMobile && (
        <FilterModalMobile
          isOpen={isMobileFilterOpen}
          onClose={() => setIsMobileFilterOpen(false)}
          initialFilters={{ materia: filters.materia, ano: filters.ano, etapa: filters.etapa }}
          onApplyFilters={handleApplyMobileFilters}
          options={filterOptions}
        />
      )}
    </div>
  );
}

export default AllQuestionsPage;

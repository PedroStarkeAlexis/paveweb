import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import QuestionLayout from '../../../components/common/QuestionLayout';
import FiltersDesktop from './FiltersDesktop';
import FilterModalMobile from './FilterModalMobile';
import useWindowSize from '../../../hooks/useWindowSize';
import './AllQuestionsPage.css';

function AllQuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [filterOptions, setFilterOptions] = useState({ anos: [], materias: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const isMobile = width <= 768;

  const parseFiltersFromURL = useCallback(() => {
    const params = new URLSearchParams(location.search);
    return {
      query: params.get('q') || '',
      materia: params.get('materia') || null,
      ano: params.get('ano') || null,
      page: parseInt(params.get('page') || '1', 10),
    };
  }, [location.search]);
  
  const [filters, setFilters] = useState(parseFiltersFromURL);

  useEffect(() => {
    setFilters(parseFiltersFromURL());
  }, [location.search, parseFiltersFromURL]);

  const updateURL = useCallback((newFilters) => {
    const params = new URLSearchParams();
    if (newFilters.query) params.set('q', newFilters.query);
    if (newFilters.materia) params.set('materia', newFilters.materia);
    if (newFilters.ano) params.set('ano', newFilters.ano);
    if (newFilters.page > 1) params.set('page', newFilters.page);
    
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [navigate, location.pathname]);
  
  const fetchData = useCallback(async (currentFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: currentFilters.page.toString(), limit: '10' });
      if (currentFilters.query) params.set('query', currentFilters.query);
      if (currentFilters.materia) params.set('materia', currentFilters.materia);
      if (currentFilters.ano) params.set('ano', currentFilters.ano);
      
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
    fetchData(filters);
  }, [filters, fetchData]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await fetch('/api/get-filter-options');
        const data = await response.json();
        setFilterOptions({
          anos: data.anos || [],
          materias: data.materias || [],
        });
      } catch (err) {
        console.error("Erro ao buscar opções de filtro:", err);
      }
    };
    fetchOptions();
  }, []);

  const handleFilterChange = (newFilters) => {
    updateURL({ ...newFilters, page: 1 });
  };
  
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      updateURL({ ...filters, page: newPage });
    }
  };

  const handleApplyMobileFilters = (mobileFilters) => {
    setIsMobileModalOpen(false);
    handleFilterChange({
        query: filters.query, // Mantém a query atual
        ...mobileFilters
    });
  };

  return (
    <div className="all-questions-page-container">
      <header className="all-questions-header">
        <div className="title-section">
            <h1>Todas as Questões</h1>
            <p>Use os filtros para encontrar exatamente o que você procura.</p>
        </div>
        {isMobile && (
          <button className="mobile-filter-button" onClick={() => setIsMobileModalOpen(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" /></svg>
            Filtros
          </button>
        )}
      </header>
      
      {!isMobile && (
        <FiltersDesktop
          filters={filters}
          onFilterChange={handleFilterChange}
          options={filterOptions}
        />
      )}
      
      <div className="results-summary">
        Mostrando {questions.length} de {pagination.totalItems} questões
      </div>
      
      <main className="results-list">
        {isLoading && <div className="loading-message">Buscando questões...</div>}
        {error && <div className="error-message">{error}</div>}
        {!isLoading && !error && questions.length === 0 && (
          <div className="no-results-message">Nenhuma questão encontrada com os filtros atuais.</div>
        )}
        {!isLoading && questions.length > 0 && (
          questions.map(q => <QuestionLayout key={q.id} questionData={q} />)
        )}
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
          isOpen={isMobileModalOpen}
          onClose={() => setIsMobileModalOpen(false)}
          initialFilters={filters}
          onApplyFilters={handleApplyMobileFilters}
          options={filterOptions}
        />
      )}
    </div>
  );
}

export default AllQuestionsPage;
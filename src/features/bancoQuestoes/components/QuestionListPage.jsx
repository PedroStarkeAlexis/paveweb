import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import QuestionLayout from '../../../components/common/QuestionLayout';
import './QuestionListPage.css';

function QuestionListPage() {
  const { subject } = useParams();
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });

  const location = useLocation();
  const navigate = useNavigate();

  const parseFiltersFromURL = useCallback(() => {
    const params = new URLSearchParams(location.search);
    return {
      ano: params.get('ano') || null,
      page: parseInt(params.get('page') || '1', 10),
    };
  }, [location.search]);

  const [filters, setFilters] = useState(parseFiltersFromURL);
  const [filterOptions, setFilterOptions] = useState({ anos: [] });
  
  useEffect(() => {
    setFilters(parseFiltersFromURL());
  }, [location.search, parseFiltersFromURL]);

  const updateURL = useCallback((newFilters) => {
    const params = new URLSearchParams();
    if (newFilters.ano) params.set('ano', newFilters.ano);
    if (newFilters.page > 1) params.set('page', newFilters.page);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [navigate, location.pathname]);

  const fetchData = useCallback(async (currentFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentFilters.page.toString(),
        limit: '10',
        materia: subject, // Matéria fixa da URL
      });
      if (currentFilters.ano) params.set('ano', currentFilters.ano);
      
      const response = await fetch(`/api/search-questions?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao buscar questões.');
      
      setQuestions(data.questions || []);
      setPagination(data.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [subject]);
  
  useEffect(() => {
    fetchData(filters);
  }, [filters, fetchData]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await fetch('/api/get-filter-options');
        const data = await response.json();
        setFilterOptions({ anos: data.anos || [] });
      } catch (err) {
        console.error("Erro ao buscar opções de filtro:", err);
      }
    };
    fetchOptions();
  }, []);

  const handleFilterChange = (filterName, value) => {
    updateURL({ [filterName]: value, page: 1 });
  };
  
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      updateURL({ ...filters, page: newPage });
    }
  };

  return (
    <div className="question-list-page-container">
      <header className="question-list-header">
        <h1>Questões de {subject}</h1>
        <div className="filter-group">
          <label htmlFor="filter-ano">Filtrar por Ano:</label>
          <select
            id="filter-ano"
            name="ano"
            value={filters.ano || 'todos'}
            onChange={(e) => handleFilterChange('ano', e.target.value === 'todos' ? null : e.target.value)}
          >
            <option value="todos">Todos os anos</option>
            {filterOptions.anos.map(ano => <option key={ano} value={ano}>{ano}</option>)}
          </select>
        </div>
      </header>

      <div className="results-summary">
        Mostrando {questions.length} de {pagination.totalItems} questões
      </div>
      
      <main className="results-list">
        {isLoading && <div className="loading-message">Buscando questões...</div>}
        {error && <div className="error-message">{error}</div>}
        {!isLoading && !error && questions.length === 0 && (
          <div className="no-results-message">Nenhuma questão encontrada.</div>
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
    </div>
  );
}

export default QuestionListPage;
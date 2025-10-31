// src/features/bancoQuestoes/hooks/useQuestionSearch.js
import { useState, useEffect, useCallback } from 'react';

/**
 * Hook customizado para busca de questões com filtros e debounce
 * Separa a lógica de busca da lógica de apresentação
 * 
 * @param {Object} filters - Objeto com os filtros de busca
 * @param {string} [filters.query] - Termo de busca
 * @param {string} [filters.materia] - Matéria filtrada
 * @param {string} [filters.ano] - Ano filtrado
 * @param {string} [filters.etapa] - Etapa filtrada
 * @param {number} [debounceMs=500] - Tempo de debounce em milissegundos
 * 
 * @returns {{
 *   questions: Array,
 *   isLoading: boolean,
 *   error: string | null,
 *   hasSearched: boolean,
 *   performSearch: Function
 * }}
 */
const useQuestionSearch = (filters = {}, debounceMs = 500) => {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  /**
   * Função para realizar a busca de questões
   * @param {Object} searchFilters - Filtros a serem aplicados na busca
   */
  const performSearch = useCallback(async (searchFilters) => {
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
  }, []);

  // Disparar busca quando os filtros mudarem (com debounce)
  useEffect(() => {
    const hasActiveFilters = filters.query || filters.materia || filters.ano || filters.etapa;
    
    if (hasActiveFilters) {
      const debounceTimer = setTimeout(() => {
        performSearch(filters);
      }, debounceMs);

      return () => clearTimeout(debounceTimer);
    }
  }, [filters, debounceMs, performSearch]);

  return {
    questions,
    isLoading,
    error,
    hasSearched,
    performSearch
  };
};

export default useQuestionSearch;

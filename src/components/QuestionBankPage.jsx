import React, { useState, useEffect, useMemo } from 'react';
import Filters from '../components/filters.jsx'; // Importa o componente de filtros
import QuestionList from '../components/QuestionList'; // Importa o componente de lista de questões

function QuestionBankPage() {
  // Estado para armazenar TODAS as questões buscadas da API
  const [allQuestions, setAllQuestions] = useState([]);
  // Estado para armazenar a lista de questões VISÍVEIS após aplicar os filtros
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  // Estado para armazenar os valores selecionados nos filtros
  const [filters, setFilters] = useState({ ano: null, materia: null, etapa: null }); // Usa null para "Todos"
  // Estado para controlar o estado de carregamento
  const [isLoading, setIsLoading] = useState(true);
  // Estado para armazenar mensagens de erro
  const [error, setError] = useState(null);

  // --- Efeito para Buscar Todas as Questões ---
  // Roda apenas uma vez quando o componente é montado
  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Chama a API para buscar as questões (ajuste a rota/método se necessário)
        const response = await fetch('/api/ask', { // Ou /api/questions se voltou para GET
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ getAll: true }) // Ou remove body se for GET
        });

        if (!response.ok) {
          let errorMsg = `Erro ${response.status}`;
          try {
            const errData = await response.json();
            errorMsg = errData.error || errData.commentary || errorMsg;
          } catch {}
          throw new Error(errorMsg);
        }

        const data = await response.json();
        // Usa data.questions se a API /api/ask retornar nesse formato
        const questionsData = Array.isArray(data.questions) ? data.questions : (Array.isArray(data) ? data : []);
        setAllQuestions(questionsData);
        setFilteredQuestions(questionsData); // Inicializa com todas

      } catch (err) {
        console.error("Erro no fetch das questões:", err);
        setError(err.message || "Falha ao buscar dados.");
        setAllQuestions([]);
        setFilteredQuestions([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, []); // Dependência vazia = roda só na montagem

  // --- Memo para Derivar Opções de Filtro ---
  const filterOptions = useMemo(() => {
    const anos = new Set();
    const materias = new Set();
    const etapas = new Set();
    allQuestions.forEach(q => {
      if (q.ano) anos.add(q.ano);
      if (q.materia) materias.add(q.materia);
      if (q.etapa) etapas.add(q.etapa);
    });
    return {
      anos: Array.from(anos).sort((a, b) => b - a),
      materias: Array.from(materias).sort(),
      etapas: Array.from(etapas).sort((a, b) => a - b)
    };
  }, [allQuestions]);

  // --- Efeito para Filtrar Questões ---
  // Roda sempre que os filtros ou a lista completa mudam
  useEffect(() => {
    let currentQuestions = [...allQuestions];

    if (filters.ano) {
      const filterAnoNum = parseInt(filters.ano, 10);
      currentQuestions = currentQuestions.filter(q => q.ano === filterAnoNum);
    }
    if (filters.materia) {
      currentQuestions = currentQuestions.filter(q => q.materia === filters.materia);
    }
    if (filters.etapa) {
      const filterEtapaNum = parseInt(filters.etapa, 10);
      currentQuestions = currentQuestions.filter(q => q.etapa === filterEtapaNum);
    }
    setFilteredQuestions(currentQuestions); // Atualiza a lista visível
  }, [filters, allQuestions]);

  // --- Handler para Mudanças nos Filtros ---
  // Chamado pelo componente Filters
  const handleFilterChange = (filterName, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterName]: value,
    }));
  };

  // --- Renderização ---
  return (
    // Container da página (ajuste classe se necessário)
    <div className="question-bank-page-content">

      {/* Componente de Filtros */}
      <Filters
        anos={filterOptions.anos}
        materias={filterOptions.materias}
        etapas={filterOptions.etapas}
        filterValues={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Feedback de Carregamento e Erro */}
      {isLoading && <p className="loading-message">Carregando questões...</p>}
      {error && <p className="error-message">Erro: {error}</p>}

      {/* Área da Lista de Questões (só renderiza se não houver erro e não estiver carregando) */}
      {!isLoading && !error && (
        <div className="question-list-area">
          <p className="results-count">{filteredQuestions.length} questão(ões) encontrada(s).</p>
          {/* Componente que renderiza a lista de questões (reutilizando QuestionLayout) */}
          <QuestionList questions={filteredQuestions} />
        </div>
      )}
    </div>
  );
}

export default QuestionBankPage;
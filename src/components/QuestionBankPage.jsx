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

  // --- Efeito para Buscar Todas as Questões (Roda Apenas na Montagem) ---
  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true); // Inicia carregamento
      setError(null);     // Limpa erros anteriores

      try {
        // Chama a nova API GET que retorna todas as questões do R2
        const response = await fetch('/api/questions');

        if (!response.ok) {
          // Se a resposta não for 2xx, lança um erro
          throw new Error(`Erro ao buscar questões: ${response.statusText} (${response.status})`);
        }

        // Pega os dados JSON
        const data = await response.json();

        // Atualiza o estado com todas as questões (garante que é um array)
        setAllQuestions(Array.isArray(data) ? data : []);
        // Inicialmente, a lista filtrada é igual à lista completa
        setFilteredQuestions(Array.isArray(data) ? data : []);

      } catch (err) {
        // Captura e exibe erros
        console.error("Erro no fetch das questões:", err);
        setError(err.message);
        // Limpa as listas em caso de erro
        setAllQuestions([]);
        setFilteredQuestions([]);
      } finally {
        // Finaliza o estado de carregamento, independente de sucesso ou erro
        setIsLoading(false);
      }
    };

    fetchQuestions(); // Executa a função de fetch

  }, []); // Array de dependências vazio: este efeito roda APENAS uma vez, quando o componente é montado.

  // --- Memo para Derivar Opções de Filtro (Otimização de Performance) ---
  // Recalcula as opções de filtro (lista única de anos, matérias, etapas) apenas quando 'allQuestions' muda.
  const filterOptions = useMemo(() => {
    const anos = new Set();
    const materias = new Set();
    const etapas = new Set();

    // Percorre todas as questões para coletar valores únicos
    allQuestions.forEach(q => {
      if (q.ano) anos.add(q.ano);
      if (q.materia) materias.add(q.materia);
      if (q.etapa) etapas.add(q.etapa);
    });

    // Retorna arrays ordenados para os selects
    return {
      anos: Array.from(anos).sort((a, b) => b - a), // Ano mais recente primeiro
      materias: Array.from(materias).sort(),       // Ordem alfabética
      etapas: Array.from(etapas).sort((a, b) => a - b) // Ordem numérica
    };
  }, [allQuestions]); // Depende de 'allQuestions'

  // --- Efeito para Filtrar Questões (Roda Quando Filtros ou Lista Completa Mudam) ---
  // Atualiza a lista de filteredQuestions sempre que os valores dos filtros ou a lista completa de questões mudam.
  useEffect(() => {
    let currentQuestions = [...allQuestions]; // Começa com a lista completa

    // Aplica o filtro por Ano
    if (filters.ano) {
      // Converte o valor do filtro para número para comparar corretamente
      const filterAnoNum = parseInt(filters.ano, 10);
      currentQuestions = currentQuestions.filter(q => q.ano === filterAnoNum);
    }

    // Aplica o filtro por Matéria
    if (filters.materia) {
      currentQuestions = currentQuestions.filter(q => q.materia === filters.materia);
    }

    // Aplica o filtro por Etapa
    if (filters.etapa) {
      // Converte o valor do filtro para número para comparar corretamente
      const filterEtapaNum = parseInt(filters.etapa, 10);
      currentQuestions = currentQuestions.filter(q => q.etapa === filterEtapaNum);
    }

    // Atualiza o estado com a lista de questões filtradas
    setFilteredQuestions(currentQuestions);

  }, [filters, allQuestions]); // Depende de 'filters' e 'allQuestions'

  // --- Handler para Mudanças nos Filtros ---
  const handleFilterChange = (filterName, value) => {
    // Atualiza o estado do filtro específico que mudou
    setFilters(prevFilters => ({
      ...prevFilters,       // Copia os filtros anteriores
      [filterName]: value,  // Atualiza o filtro pelo nome dinamicamente
    }));
  };

  return (
    // Container principal da página do banco de questões
    <div className="question-bank-container">
      {/* Título da página */}
      <h2>Banco de Questões PAVE</h2>

      {/* Componente de Filtros */}
      {/* Passa as opções disponíveis e os valores/handler atuais */}
      <Filters
        anos={filterOptions.anos}
        materias={filterOptions.materias}
        etapas={filterOptions.etapas}
        filterValues={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Exibe mensagem de carregamento ou erro */}
      {isLoading && <p className="loading-message">Carregando questões...</p>}
      {error && <p className="error-message">Erro: {error}</p>}

      {/* Exibe a lista de questões filtradas ou mensagem de resultados zero */}
      {/* Só renderiza se não estiver carregando e não houver erro */}
      {!isLoading && !error && (
        <div className="question-list">
          {/* Contador de resultados */}
          <p className="results-count">{filteredQuestions.length} questão(ões) encontrada(s).</p>
          {/* Componente de lista de questões, passando apenas as filtradas */}
          {/* A lógica de "Nenhuma questão encontrada" está dentro de QuestionList agora */}
          <QuestionList questions={filteredQuestions} />
        </div>
      )}
    </div>
  );
}

export default QuestionBankPage;
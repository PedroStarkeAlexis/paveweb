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
      setIsLoading(true); // Inicia carregamento
      setError(null);     // Limpa erros anteriores

      try {
        // Chama /api/ask com método POST e corpo especial para indicar que quer todas as questões
        const response = await fetch('/api/ask', {
          method: 'POST', // <<< Usa POST
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ getAll: true }) // <<< Envia o parâmetro especial
        });

        // Verifica se a resposta da API foi bem-sucedida
        if (!response.ok) {
          let errorMsg = `Erro ${response.status}`; // Mensagem de erro padrão
          try {
            // Tenta obter uma mensagem de erro mais específica do corpo da resposta JSON
            const errData = await response.json();
            // Usa o campo 'error' ou 'commentary' da resposta, ou a mensagem padrão
            errorMsg = errData.error || errData.commentary || errorMsg;
          } catch (e) {
             // Ignora se o corpo do erro não for JSON válido
             console.warn("Não foi possível parsear a resposta de erro como JSON.");
          }
          throw new Error(errorMsg); // Lança um erro para ser pego pelo catch
        }

        // Se a resposta foi OK, processa os dados JSON
        const data = await response.json();

        // A resposta deve ter a estrutura { commentary: null, questions: [...] }
        // Atualiza o estado com todas as questões (garante que seja um array)
        setAllQuestions(Array.isArray(data.questions) ? data.questions : []);
        // Inicialmente, a lista filtrada é igual à lista completa
        setFilteredQuestions(Array.isArray(data.questions) ? data.questions : []);

      } catch (err) {
        // Captura e exibe erros do fetch ou do tratamento da resposta
        console.error("Erro no fetch das questões (via /api/ask):", err);
        setError(err.message || "Falha ao buscar dados das questões."); // Define a mensagem de erro
        // Limpa as listas em caso de erro
        setAllQuestions([]);
        setFilteredQuestions([]);
      } finally {
        // Finaliza o estado de carregamento, independente de sucesso ou erro
        setIsLoading(false);
      }
    };

    fetchQuestions(); // Executa a função de fetch ao montar

  }, []); // Array de dependências vazio: este efeito roda APENAS uma vez.

  // --- Memo para Derivar Opções de Filtro (Otimização) ---
  // Recalcula as opções de filtro (anos, matérias, etapas únicas) apenas quando 'allQuestions' muda.
  const filterOptions = useMemo(() => {
    const anos = new Set();
    const materias = new Set();
    const etapas = new Set();

    // Percorre todas as questões carregadas para coletar valores únicos
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
  }, [allQuestions]); // Depende apenas de 'allQuestions'

  // --- Efeito para Filtrar Questões (Roda Quando Filtros ou Lista Completa Mudam) ---
  // Atualiza a lista de 'filteredQuestions' sempre que os filtros ou a lista 'allQuestions' mudam.
  useEffect(() => {
    let currentQuestions = [...allQuestions]; // Começa com a lista completa

    // Aplica o filtro por Ano (se um ano estiver selecionado)
    if (filters.ano) {
      // Converte o valor do filtro para número para comparação correta
      const filterAnoNum = parseInt(filters.ano, 10);
      currentQuestions = currentQuestions.filter(q => q.ano === filterAnoNum);
    }

    // Aplica o filtro por Matéria (se uma matéria estiver selecionada)
    if (filters.materia) {
      currentQuestions = currentQuestions.filter(q => q.materia === filters.materia);
    }

    // Aplica o filtro por Etapa (se uma etapa estiver selecionada)
    if (filters.etapa) {
      // Converte o valor do filtro para número para comparação correta
      const filterEtapaNum = parseInt(filters.etapa, 10);
      currentQuestions = currentQuestions.filter(q => q.etapa === filterEtapaNum);
    }

    // Atualiza o estado com a lista de questões que passaram pelos filtros
    setFilteredQuestions(currentQuestions);

  }, [filters, allQuestions]); // Depende dos estados 'filters' e 'allQuestions'

  // --- Handler para Mudanças nos Filtros ---
  // Esta função é chamada pelo componente Filters quando um select muda
  const handleFilterChange = (filterName, value) => {
    // Atualiza o estado do filtro específico que mudou
    setFilters(prevFilters => ({
      ...prevFilters,       // Mantém os valores dos outros filtros
      [filterName]: value,  // Atualiza o filtro modificado (pode ser null se "Todos" foi selecionado)
    }));
  };

  // --- Renderização do Componente ---
  return (
    // Container principal da página do banco de questões
    <div className="question-bank-container">
      {/* Título removido conforme solicitado */}
      {/* <h2>Banco de Questões PAVE</h2> */}

      {/* Componente de Filtros */}
      {/* Passa as opções disponíveis, os valores atuais e a função de callback */}
      <Filters
        anos={filterOptions.anos}
        materias={filterOptions.materias}
        etapas={filterOptions.etapas}
        filterValues={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Exibe mensagem de carregamento enquanto busca dados */}
      {isLoading && <p className="loading-message">Carregando questões...</p>}

      {/* Exibe mensagem de erro se o fetch falhar */}
      {error && <p className="error-message">Erro: {error}</p>}

      {/* Exibe a lista de questões filtradas APENAS se não estiver carregando e não houver erro */}
      {!isLoading && !error && (
        <div className="question-list" id="question-bank-list"> {/* Adiciona ID para especificidade CSS se necessário */}
          {/* Mostra a contagem de resultados */}
          <p className="results-count">{filteredQuestions.length} questão(ões) encontrada(s).</p>
          {/* Renderiza o componente QuestionList, passando as questões filtradas */}
          <QuestionList questions={filteredQuestions} />
        </div>
      )}
    </div>
  );
}

// Exporta o componente para ser usado no App.jsx
export default QuestionBankPage;
import React, { useState, useEffect, useCallback } from 'react';
import { useSavedQuestions } from '../../../hooks/useSavedQuestions';
import QuestionLayout from '../../../components/common/QuestionLayout';
import QuestionList from '../../questions/components/QuestionList';
import './SavedQuestionsPage.css'; // Criaremos este CSS

// Objeto da questão de exemplo para desenvolvimento
const placeholderQuestion = {
  id: "placeholder-1",
  ano: 2024,
  etapa: 1,
  materia: "Desenvolvimento",
  topico: "Placeholder",
  corpo_questao: [
    {
      tipo: "texto",
      conteudo: "Esta é uma questão de exemplo para visualização em ambiente de desenvolvimento. Ela aparece quando não há questões salvas e o backend não está conectado.\n\nQual a principal vantagem de usar um placeholder como este?"
    }
  ],
  texto_questao: "Esta é uma questão de exemplo para visualização em ambiente de desenvolvimento. Ela aparece quando não há questões salvas e o backend não está conectado.\n\nQual a principal vantagem de usar um placeholder como este?", // compatibilidade
  referencia: "Gerado localmente para desenvolvimento.",
  alternativas: [
    { letra: "A", texto: "Facilita a visualização do layout e estilo do componente." },
    { letra: "B", texto: "Adiciona dados desnecessários à produção." },
    { letra: "C", texto: "Testa a performance da API de busca." },
    { letra: "D", texto: "Substitui a necessidade de testes unitários." },
    { letra: "E", texto: "Não possui nenhuma vantagem." }
  ],
  gabarito: "A",
  resposta_letra: "A" // compatibilidade
};

function SavedQuestionsPage() {
  const { savedQuestionIds } = useSavedQuestions();
  const [savedQuestionsData, setSavedQuestionsData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAllQuestions = useCallback(async () => {
    if (savedQuestionIds.length === 0) {
      setSavedQuestionsData([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/search-questions?limit=10000`); // Limite alto
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Erro ${response.status}` }));
        throw new Error(errorData.error || `Erro ao buscar questões: ${response.status}`);
      }
      const data = await response.json();
      if (data.questions && Array.isArray(data.questions)) {
        const filtered = data.questions.filter(q => savedQuestionIds.includes(q.id.toString()));
        setSavedQuestionsData(filtered);
      } else {
        setSavedQuestionsData([]);
      }
    } catch (err) {
      console.error("Erro ao buscar dados das questões salvas:", err);
      setError(err.message || "Falha ao carregar questões salvas.");
      setSavedQuestionsData([]);
    } finally {
      setIsLoading(false);
    }
  }, [savedQuestionIds]);

  useEffect(() => {
    fetchAllQuestions();
  }, [fetchAllQuestions]);

  const envShowPlaceholder = typeof import.meta !== 'undefined' &&
    import.meta.env &&
    (import.meta.env.VITE_SHOW_PLACEHOLDER === 'true' || import.meta.env.VITE_SHOW_PLACEHOLDER === true || import.meta.env.DEV);

  const showPlaceholder = envShowPlaceholder && savedQuestionIds.length === 0 && !isLoading && !error;

  const renderListContent = () => {
    if (isLoading) {
      return <div className="saved-questions-message">Carregando questões salvas...</div>;
    }
    if (error) {
      return <div className="saved-questions-message error">{error}</div>;
    }
    if (showPlaceholder) {
      return (
        <>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '10px' }}>
            Modo de Desenvolvimento: Exibindo questão de exemplo.
          </p>
          <QuestionLayout questionData={placeholderQuestion} />
        </>
      );
    }
    if (savedQuestionsData.length > 0) {
      return (
        <QuestionList
          questions={savedQuestionsData}
          containerClassName="saved-questions-items"
          emptyMessage="Não foi possível encontrar questões salvas."
        />
      );
    }
    if (savedQuestionIds.length > 0 && !isLoading) {
      return <div className="saved-questions-message">Não foi possível encontrar os dados completos das questões salvas. Tente novamente mais tarde.</div>;
    }
    return (
      <div className="saved-questions-empty-state">
        <h2>Nenhuma Questão Salva Ainda</h2>
        <p>Você ainda não salvou nenhuma questão. Navegue pelo banco de questões ou peça ao assistente para encontrar e salvar as que mais te interessam!</p>
      </div>
    );
  };

  return (
    <div className="saved-questions-page-container">
      <h1 className="saved-questions-title">Minhas Questões Salvas</h1>
      <div className="saved-questions-list">
        {renderListContent()}
      </div>
    </div>
  );
}

export default SavedQuestionsPage;

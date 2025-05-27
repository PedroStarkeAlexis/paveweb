import React, { useState, useEffect, useCallback } from 'react';
import { useSavedQuestions } from '../../../hooks/useSavedQuestions';
import QuestionLayout from '../../../components/common/QuestionLayout';
import './SavedQuestionsPage.css'; // Criaremos este CSS

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
      // Usar a API /api/search-questions sem query para pegar todas as questões,
      // assumindo que ela retorna todas se não houver query.
      // Adicionar um limit grande para garantir que todas sejam retornadas.
      // Idealmente, a API deveria ter uma forma de buscar por IDs específicos.
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
  }, [savedQuestionIds]); // Dependência nos IDs salvos

  useEffect(() => {
    fetchAllQuestions();
  }, [fetchAllQuestions]); // Re-busca quando a lista de IDs salvos muda

  if (isLoading) {
    return <div className="saved-questions-message">Carregando questões salvas...</div>;
  }

  if (error) {
    return <div className="saved-questions-message error">{error}</div>;
  }

  if (savedQuestionIds.length === 0) {
    return (
      <div className="saved-questions-empty-state">
        <h2>Nenhuma Questão Salva Ainda</h2>
        <p>Você ainda não salvou nenhuma questão. Navegue pelo banco de questões ou peça ao assistente para encontrar e salvar as que mais te interessam!</p>
        {/* Opcional: Link para o banco de questões */}
        {/* <Link to="/banco-questoes" className="empty-state-cta">Explorar Questões</Link> */}
      </div>
    );
  }

  if (savedQuestionsData.length === 0 && savedQuestionIds.length > 0 && !isLoading) {
    return <div className="saved-questions-message">Não foi possível encontrar os dados completos das questões salvas. Tente novamente mais tarde.</div>;
  }


  return (
    <div className="saved-questions-page-container">
      <h1 className="saved-questions-title">Minhas Questões Salvas</h1>
      {savedQuestionsData.length > 0 ? (
        <div className="saved-questions-list">
          {savedQuestionsData.map((question) => (
            <QuestionLayout key={question.id} questionData={question} />
          ))}
        </div>
      ) : (
        // Esta mensagem pode aparecer brevemente se os IDs existem mas os dados ainda não foram encontrados
        !isLoading && <div className="saved-questions-message">Nenhuma questão salva para exibir.</div>
      )}
    </div>
  );
}

export default SavedQuestionsPage;
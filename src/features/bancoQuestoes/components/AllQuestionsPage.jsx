import React, { useState, useEffect } from 'react';
import QuestionLayout from '../../../components/common/QuestionLayout';
import './AllQuestionsPage.css';

function AllQuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Busca o novo arquivo de prova
        const response = await fetch(`/provas/et324.json`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Falha ao buscar a prova.');
        
        setQuestions(data || []);
      } catch (err) {
        setError(err.message);
        setQuestions([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="all-questions-page-container">
      <header className="all-questions-header">
        <div className="title-section">
            <h1>Prova PAVE 2024 - Etapa 3</h1>
            <p>Visualizando a prova completa com o novo formato.</p>
        </div>
      </header>
      
      <main className="results-list">
        {isLoading && <div className="loading-message">Carregando prova...</div>}
        {error && <div className="error-message">{error}</div>}
        {!isLoading && !error && questions.length === 0 && (
          <div className="no-results-message">Nenhuma questão encontrada no arquivo da prova.</div>
        )}
        {!isLoading && questions.length > 0 && (
          questions.map(item => <QuestionLayout key={item.id_questao} itemProva={item} />)
        )}
      </main>
    </div>
  );
}

export default AllQuestionsPage;

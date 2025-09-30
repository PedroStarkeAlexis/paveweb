import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import QuestionLayout from '../../../components/common/QuestionLayout';
import './QuestionListPage.css';

function QuestionListPage() {
  const { subject, year } = useParams();
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 20;

  // Determinar o tipo de filtro e o valor
  const filterType = subject ? 'materia' : 'ano';
  const filterValue = subject || year;

  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Construir a query string baseada no filtro
        const params = new URLSearchParams();
        if (subject) {
          params.append('materia', subject);
        } else if (year) {
          params.append('ano', year);
        }

        const response = await fetch(`/api/search-questions?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Falha ao buscar questões');
        }
        
        const data = await response.json();
        setQuestions(data.questions || []);
      } catch (err) {
        console.error('Erro ao buscar questões:', err);
        setError(err.message);
        setQuestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (filterValue) {
      fetchQuestions();
      setCurrentPage(1); // Reset para primeira página ao mudar filtro
    }
  }, [subject, year, filterValue]);

  // Paginação
  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = questions.slice(indexOfFirstQuestion, indexOfLastQuestion);
  const totalPages = Math.ceil(questions.length / questionsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Título dinâmico baseado no filtro
  const pageTitle = subject 
    ? `Questões de ${subject}` 
    : year 
    ? `Questões de ${year}` 
    : 'Questões';

  const pageDescription = subject
    ? `Explore todas as questões disponíveis da matéria ${subject}`
    : year
    ? `Explore todas as questões do ano ${year}`
    : 'Explore as questões disponíveis';

  return (
    <div className="question-list-page">
      <header className="question-list-header">
        <h1>{pageTitle}</h1>
        <p>{pageDescription}</p>
        {!isLoading && !error && questions.length > 0 && (
          <div className="question-count">
            {questions.length} {questions.length === 1 ? 'questão encontrada' : 'questões encontradas'}
          </div>
        )}
      </header>

      <main className="question-list-content">
        {isLoading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Carregando questões...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h2>Erro ao carregar questões</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="retry-button">
              Tentar novamente
            </button>
          </div>
        )}

        {!isLoading && !error && questions.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h2>Nenhuma questão encontrada</h2>
            <p>Não há questões disponíveis para este filtro no momento.</p>
          </div>
        )}

        {!isLoading && !error && currentQuestions.length > 0 && (
          <>
            <div className="questions-list">
              {currentQuestions.map((question, index) => (
                <div key={question.id || `question-${indexOfFirstQuestion + index}`} className="question-item">
                  <QuestionLayout itemProva={question} />
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-button"
                  aria-label="Página anterior"
                >
                  ← Anterior
                </button>

                <div className="pagination-info">
                  Página {currentPage} de {totalPages}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                  aria-label="Próxima página"
                >
                  Próxima →
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default QuestionListPage;

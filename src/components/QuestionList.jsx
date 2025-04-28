import React from 'react';
import QuestionLayout from './QuestionLayout'; // Reutiliza o componente existente

function QuestionList({ questions }) {
  if (!questions || questions.length === 0) {
    return <p className="no-results-message">Nenhuma questão encontrada com os filtros selecionados.</p>;
  }

  return (
    <div className="question-list-container">
      {questions.map((question, index) => (
        // Usar um ID mais estável se disponível no 'question', senão usar index (menos ideal)
        <QuestionLayout key={question.id || index} questionData={question} />
      ))}
    </div>
  );
}

export default QuestionList;
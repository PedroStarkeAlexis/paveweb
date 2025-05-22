import React from 'react';
import QuestionLayout from '../../../components/common/QuestionLayout';
import './QuestionCarousel.css';

function QuestionCarousel({ questionsData }) {
  if (!questionsData || questionsData.length === 0) {
    return <p className="carousel-empty-message">Nenhuma questão para exibir no carrossel.</p>;
  }

  return (
    <div className="question-carousel-container bot-message"> {/* Adiciona bot-message para estilo base */}
      <div className="question-carousel-scroll-area">
        {questionsData.map((question, index) => (
          <div className="question-carousel-item" key={question.id || `carousel-q-${index}`}>
            <QuestionLayout questionData={question} />
          </div>
        ))}
      </div>
      {questionsData.length > 1 && (
        <p className="carousel-scroll-hint">Arraste para ver mais questões →</p>
      )}
    </div>
  );
}

export default QuestionCarousel;
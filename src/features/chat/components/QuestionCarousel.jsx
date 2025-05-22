import React, { useState, useEffect } from 'react'; // Removido useRef para scrollAreaRef e itemRefs
import QuestionLayout from '../../../components/common/QuestionLayout';
import './QuestionCarousel.css';

// Ícones (mantidos)
const IconChevronLeft = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
  </svg>
);

const IconChevronRight = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

function QuestionCarousel({ questionsData }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Resetar o índice se os dados das questões mudarem
  useEffect(() => {
    setCurrentIndex(0);
  }, [questionsData]);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => Math.max(0, prevIndex - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => Math.min(questionsData.length - 1, prevIndex + 1));
  };

  if (!questionsData || questionsData.length === 0) {
    return <p className="carousel-empty-message">Nenhuma questão para exibir no carrossel.</p>;
  }

  const isPrevDisabled = currentIndex === 0;
  const isNextDisabled = currentIndex === questionsData.length - 1;

  // Estilo para mover o track
  const trackStyle = {
    transform: `translateX(-${currentIndex * 100}%)`, // Move o track
    width: `${questionsData.length * 100}%`, // Largura total do track
  };

  return (
    <div className="question-carousel-container bot-message">
      {questionsData.length > 1 && (
        <div className="carousel-controls">
          <button
            onClick={handlePrev}
            disabled={isPrevDisabled}
            className="carousel-nav-button prev"
            aria-label="Questão anterior"
          >
            <IconChevronLeft />
          </button>
          <span className="carousel-counter">
            {currentIndex + 1} / {questionsData.length}
          </span>
          <button
            onClick={handleNext}
            disabled={isNextDisabled}
            className="carousel-nav-button next"
            aria-label="Próxima questão"
          >
            <IconChevronRight />
          </button>
        </div>
      )}
      {/* Viewport do Carrossel */}
      <div className="carousel-viewport">
        {/* Track que contém todos os itens e se move */}
        <div className="carousel-track" style={trackStyle}>
          {questionsData.map((question, index) => (
            <div
              className="question-carousel-item"
              key={question.id || `carousel-q-${index}`}
              aria-hidden={index !== currentIndex} // Para acessibilidade
            >
              <QuestionLayout questionData={question} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default QuestionCarousel;
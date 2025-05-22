import React, { useState, useRef, useEffect } from 'react';
import QuestionLayout from '../../../components/common/QuestionLayout';
import './QuestionCarousel.css';

// Ícones simples para os botões (você pode usar SVGs mais elaborados se preferir)
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
  const scrollAreaRef = useRef(null);
  const itemRefs = useRef([]); // Array para armazenar refs dos itens

  // Garantir que itemRefs seja um array com o tamanho correto
  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, questionsData.length);
  }, [questionsData]);

  const scrollToItem = (index) => {
    if (itemRefs.current[index] && scrollAreaRef.current) {
      // Calcula a posição de scroll para centralizar o item o máximo possível,
      // ou simplesmente rolar para o início dele.
      const itemLeft = itemRefs.current[index].offsetLeft;
      const itemWidth = itemRefs.current[index].offsetWidth;
      const scrollAreaWidth = scrollAreaRef.current.offsetWidth;

      let scrollPosition = itemLeft - (scrollAreaWidth / 2) + (itemWidth / 2);
      // Ajusta para não rolar para antes do início ou depois do fim
      scrollPosition = Math.max(0, scrollPosition);
      scrollPosition = Math.min(scrollPosition, scrollAreaRef.current.scrollWidth - scrollAreaWidth);

      scrollAreaRef.current.scrollTo({
        left: itemRefs.current[index].offsetLeft - 10, // -10 para dar uma pequena margem à esquerda
        behavior: 'smooth',
      });
    }
  };

  const handlePrev = () => {
    const newIndex = Math.max(0, currentIndex - 1);
    setCurrentIndex(newIndex);
    scrollToItem(newIndex);
  };

  const handleNext = () => {
    const newIndex = Math.min(questionsData.length - 1, currentIndex + 1);
    setCurrentIndex(newIndex);
    scrollToItem(newIndex);
  };

  if (!questionsData || questionsData.length === 0) {
    return <p className="carousel-empty-message">Nenhuma questão para exibir no carrossel.</p>;
  }

  const isPrevDisabled = currentIndex === 0;
  const isNextDisabled = currentIndex === questionsData.length - 1;

  return (
    <div className="question-carousel-container bot-message">
      {questionsData.length > 1 && ( // Só mostra controles se houver mais de 1 item
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
      <div className="question-carousel-scroll-area" ref={scrollAreaRef}>
        {questionsData.map((question, index) => (
          <div
            className="question-carousel-item"
            key={question.id || `carousel-q-${index}`}
            ref={el => itemRefs.current[index] = el} // Atribui o elemento DOM ao array de refs
          >
            <QuestionLayout questionData={question} />
          </div>
        ))}
      </div>
      {/* A dica de arrastar pode ser mantida ou removida se os botões forem suficientes */}
      {/* {questionsData.length > 1 && (
         <p className="carousel-scroll-hint">Arraste para ver mais questões →</p>
      )} */}
    </div>
  );
}

export default QuestionCarousel;
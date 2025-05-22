import React, { useState, useEffect } from 'react';
import QuestionLayout from '../../../components/common/QuestionLayout';
import { motion, AnimatePresence } from 'framer-motion'; // Importar para animação
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

// Variantes de animação para o slide
const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? '100%' : '-100%', // Entra da direita se 'next', da esquerda se 'prev'
    opacity: 0,
    scale: 0.98, // Leve zoom out ao entrar
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.42, 0, 0.58, 1] } // Curva de ease suave
  },
  exit: (direction) => ({
    x: direction < 0 ? '100%' : '-100%', // Sai para a direita se 'prev' foi clicado, para a esquerda se 'next'
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.2, ease: [0.42, 0, 0.58, 1] }
  }),
};

function QuestionCarousel({ questionsData }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // Para controlar a direção da animação

  // Resetar o índice se os dados das questões mudarem (ex: nova busca)
  useEffect(() => {
    setCurrentIndex(0);
    setDirection(0); // Reseta direção para não animar na primeira carga de novas questões
  }, [questionsData]);

  const handlePrev = () => {
    setDirection(-1); // Indica que estamos indo para a esquerda (anterior)
    setCurrentIndex((prevIndex) => Math.max(0, prevIndex - 1));
  };

  const handleNext = () => {
    setDirection(1); // Indica que estamos indo para a direita (próximo)
    setCurrentIndex((prevIndex) => Math.min(questionsData.length - 1, prevIndex + 1));
  };

  if (!questionsData || questionsData.length === 0) {
    return <p className="carousel-empty-message">Nenhuma questão para exibir no carrossel.</p>;
  }

  const isPrevDisabled = currentIndex === 0;
  const isNextDisabled = currentIndex === questionsData.length - 1;
  const currentQuestion = questionsData[currentIndex];

  return (
    // O container principal continua sendo a "bolha" da mensagem do bot
    <div className="question-carousel-container bot-message">
      {/* Controles de navegação no topo */}
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

      {/* Viewport para AnimatePresence e para conter a questão atual */}
      <div className="carousel-single-item-viewport">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          {/*
            A key={currentIndex} é crucial para AnimatePresence detectar
            a mudança de componente e aplicar animações de entrada/saída.
          */}
          <motion.div
            key={currentIndex}
            custom={direction} // Passa a direção para as variantes
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="carousel-motion-item" // Wrapper para o QuestionLayout
          >
            {/* Renderiza apenas a questão atual */}
            {currentQuestion && (
              <QuestionLayout questionData={currentQuestion} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default QuestionCarousel;
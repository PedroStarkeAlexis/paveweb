import React, { useState, useEffect } from 'react';
import QuestionLayout from '../../../components/common/QuestionLayout';
import { motion, AnimatePresence } from 'framer-motion';
import './QuestionCarousel.css';

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

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.98,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.42, 0, 0.58, 1] }
  },
  exit: (direction) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.2, ease: [0.42, 0, 0.58, 1] }
  }),
};

function QuestionCarousel({ questionsData }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
    setDirection(0);
  }, [questionsData]);

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prevIndex) => Math.max(0, prevIndex - 1));
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prevIndex) => Math.min(questionsData.length - 1, prevIndex + 1));
  };

  if (!questionsData || questionsData.length === 0) {
    return (
      <div className="question-carousel-wrapper">
        <p className="carousel-empty-message">Nenhuma questão para exibir no carrossel.</p>
      </div>
    );
  }

  const isPrevDisabled = currentIndex === 0;
  const isNextDisabled = currentIndex === questionsData.length - 1;
  const currentQuestion = questionsData[currentIndex];

  return (
    <div className="question-carousel-wrapper"> {/* Wrapper principal para alinhar no chat */}
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

      <div className="carousel-single-item-viewport">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            // A classe .bot-message é aplicada aqui para que o item animado seja a bolha
            // E o QuestionLayout dentro dele será transparente/sem bordas próprias
            className="carousel-motion-item bot-message"
          >
            {currentQuestion && (
              // Passar uma prop para QuestionLayout para que ele não renderize sua borda/fundo
              <QuestionLayout questionData={currentQuestion} isInsideCarousel={true} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default QuestionCarousel;
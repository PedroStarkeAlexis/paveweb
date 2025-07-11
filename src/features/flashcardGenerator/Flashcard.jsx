// src/features/flashcardGenerator/Flashcard.jsx
import React, { useState } from 'react';
import './Flashcard.css';

function Flashcard({ term, definition, id }) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleFlip();
    }
  };

  // Cria um ID único para acessibilidade, caso não seja fornecido
  const cardId = id || `flashcard-${Math.random().toString(36).substring(2, 9)}`;
  const termId = `${cardId}-term`;
  const definitionId = `${cardId}-definition`;

  return (
    <div className="flashcard-wrapper">
      <div
        className={`flashcard ${isFlipped ? 'flipped' : ''}`}
        onClick={handleFlip}
        onKeyPress={handleKeyPress}
        tabIndex="0" // Torna o card focável
        role="button" // Semântica de botão
        aria-pressed={isFlipped}
        aria-describedby={isFlipped ? definitionId : termId}
        aria-label={`Flashcard: ${term}. Clique ou pressione Enter para ${isFlipped ? 'ver o termo' : 'ver a definição'}.`}
      >
        <div className="flashcard-inner">
          <div className="flashcard-front" aria-hidden={isFlipped}>
            <div className="flashcard-term" id={termId}>
              {term}
            </div>
          </div>
          <div className="flashcard-back" aria-hidden={!isFlipped}>
            <div className="flashcard-definition" id={definitionId}>
              {definition}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Flashcard;

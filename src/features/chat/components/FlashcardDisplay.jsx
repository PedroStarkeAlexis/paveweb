// src/features/chat/components/FlashcardDisplay.jsx
import React from 'react';
import Flashcard from './Flashcard';
import './FlashcardDisplay.css';

function FlashcardDisplay({ flashcardsData }) {
  if (!flashcardsData || flashcardsData.length === 0) {
    // Isso não deve acontecer se a API e o ChatBox estiverem tratando bem
    // mas é uma boa salvaguarda.
    return <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum flashcard para exibir.</p>;
  }

  return (
    <div className="flashcard-display-container">
      <div className="flashcard-display-grid">
        {flashcardsData.map((card, index) => (
          <Flashcard
            key={card.id || `fc-${index}`} // Usar um ID da IA se disponível, senão index
            term={card.term}
            definition={card.definition}
            id={card.id || `fc-item-${index}`} // Passa um ID para o componente filho
          />
        ))}
      </div>
    </div>
  );
}

import React, { useRef, useEffect } from 'react';
import Message from './Message';
import QuestionLayout from '../../../components/common/QuestionLayout';
import QuestionCarousel from './QuestionCarousel';
import InfoPaveCard from './InfoPaveCard';
import FlashcardDisplay from './FlashcardDisplay'; // Importar o novo componente

function ChatBox({ messages, isLoading }) {
  const chatBoxRef = useRef(null);

  useEffect(() => {
    if (chatBoxRef.current) {
      const element = chatBoxRef.current;
      setTimeout(() => {
        element.scrollTop = element.scrollHeight;
      }, 100);
    }
  }, [messages, isLoading]);

  return (
    <div id="chat-box" className="flex-grow overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 pb-[100px]" ref={chatBoxRef}>
      {messages.map((msg, index) => {
        if (msg.type === 'question_carousel' && msg.questionsData && msg.questionsData.length > 0) {
          return <QuestionCarousel key={msg.id || `carousel-${index}`} questionsData={msg.questionsData} />;
        } else if (msg.type === 'question' && msg.questionData) {
          return <QuestionLayout key={msg.id || `q-${index}`} questionData={msg.questionData} />;
        } else if (msg.type === 'text' && typeof msg.content === 'string') {
          return <Message key={msg.id || `msg-${index}`} sender={msg.sender} text={msg.content} />;
        } else if (msg.type === 'flashcard_display' && msg.flashcardsData && msg.flashcardsData.length > 0) { // NOVO: Condição para flashcards
          return <FlashcardDisplay key={msg.id || `flashcards-${index}`} flashcardsData={msg.flashcardsData} />;
        } else if (msg.type === 'pave_info_card') {
          return <InfoPaveCard key={msg.id || `infocard-${index}`} />;
        }
        console.warn("Mensagem inválida ou incompleta no ChatBox:", msg);
        return null;
      })}

      {isLoading && (
        <div id="typing-indicator" className="self-start bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-bl-lg rounded-2xl max-w-[85%] md:max-w-[80%] py-2.5 px-4 flex items-center">
          <div className="typing-dots">
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatBox;
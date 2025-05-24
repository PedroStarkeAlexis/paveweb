import React, { useRef, useEffect } from 'react';
import Message from './Message';
import QuestionLayout from '../../../components/common/QuestionLayout';
import QuestionCarousel from './QuestionCarousel';
import InfoPaveCard from './InfoPaveCard';

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
    <div id="chat-box" className="chat-box" ref={chatBoxRef}>
      {messages.map((msg, index) => {
        if (msg.type === 'question_carousel' && msg.questionsData && msg.questionsData.length > 0) {
          return <QuestionCarousel key={msg.id || `carousel-${index}`} questionsData={msg.questionsData} />;
        } else if (msg.type === 'question' && msg.questionData) {
          return <QuestionLayout key={msg.id || `q-${index}`} questionData={msg.questionData} />;
        } else if (msg.type === 'text' && typeof msg.content === 'string') {
          return <Message key={msg.id || `msg-${index}`} sender={msg.sender} text={msg.content} />;
        } else if (msg.type === 'pave_info_card') {
          return <InfoPaveCard key={msg.id || `infocard-${index}`} />;
        }
        console.warn("Mensagem inválida ou incompleta no ChatBox:", msg);
        return null;
      })}

      {isLoading && (
        <div id="typing-indicator" className="message bot-message typing-indicator">
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
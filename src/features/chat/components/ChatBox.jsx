import React, { useRef, useEffect } from 'react';
import Message from './Message';
import QuestionLayout from '../../../components/common/QuestionLayout';

function ChatBox({ messages, isLoading }) {
  const chatBoxRef = useRef(null);

  useEffect(() => {
    if (chatBoxRef.current) {
      const element = chatBoxRef.current;
      // Um pequeno delay para garantir que a renderização terminou antes de rolar
      setTimeout(() => {
        element.scrollTop = element.scrollHeight;
      }, 100);
    }
  }, [messages, isLoading]); // Rola quando novas mensagens chegam ou o estado de loading muda

  return (
    <div id="chat-box" className="chat-box" ref={chatBoxRef}>
      {messages.map((msg, index) => {
        if (msg.type === 'question' && msg.questionData) {
          return <QuestionLayout key={msg.id || `q-${index}`} questionData={msg.questionData} />;
        } else if (msg.type === 'text' && typeof msg.content === 'string') { // Verifica se content é string
          return <Message key={msg.id || `msg-${index}`} sender={msg.sender} text={msg.content} />;
        }
        console.warn("Mensagem inválida ou incompleta no ChatBox:", msg);
        return null;
      })}

      {/* Indicador de "Digitando..." atualizado */}
      {isLoading && (
        <div id="typing-indicator" className="message bot-message typing-indicator">
          <div className="typing-dots">
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
          </div>
          {/* Você pode manter o texto "Digitando..." ou removê-lo se as bolinhas forem suficientes */}
          {/* <p><em>Digitando...</em></p> */}
        </div>
      )}
    </div>
  );
}

export default ChatBox;
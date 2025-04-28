import React, { useRef, useEffect } from 'react';
import Message from './Message';
import QuestionLayout from './QuestionLayout';

function ChatBox({ messages, isLoading }) {
  const chatBoxRef = useRef(null);

  // Efeito para rolar para baixo quando novas mensagens chegam
  useEffect(() => {
    if (chatBoxRef.current) {
      const element = chatBoxRef.current;
      // Adiciona delay para garantir renderização
      setTimeout(() => {
        element.scrollTop = element.scrollHeight;
      }, 100);
    }
  }, [messages, isLoading]); // Roda quando mensagens ou loading mudam

  return (
    <div id="chat-box" className="chat-box" ref={chatBoxRef}>
      {messages.map((msg, index) => {
        if (msg.type === 'question') {
          // Renderiza componente de questão
          return <QuestionLayout key={index} questionData={msg.questionData} />;
        } else {
          // Renderiza mensagem de texto normal
          return <Message key={index} sender={msg.sender} text={msg.content} />;
        }
      })}
      {/* Indicador de "Digitando..." */}
      {isLoading && (
         <div id="typing-indicator" className="message bot-message typing-indicator">
            <p><em>Digitando...</em></p>
         </div>
      )}
    </div>
  );
}

export default ChatBox;
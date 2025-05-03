import React, { useRef, useEffect } from 'react';
import Message from './Message'; // Import local OK
// --- Import Atualizado ---
import QuestionLayout from '../../../components/common/QuestionLayout'; // Caminho para pasta comum

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
        if (msg.type === 'question' && msg.questionData) { // Adiciona verificação para questionData
          // Renderiza componente de questão
          return <QuestionLayout key={index} questionData={msg.questionData} />;
        } else if (msg.type === 'text' && msg.content) { // Adiciona verificação para content
          // Renderiza mensagem de texto normal
          return <Message key={index} sender={msg.sender} text={msg.content} />;
        }
        // Retorna null ou um placeholder se a mensagem for inválida
        console.warn("Mensagem inválida ou incompleta encontrada:", msg);
        return null;
      })}
      {isLoading && (
         <div id="typing-indicator" className="message bot-message typing-indicator">
            <p><em>Digitando...</em></p>
         </div>
      )}
    </div>
  );
}

export default ChatBox;
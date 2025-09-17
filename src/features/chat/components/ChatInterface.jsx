import React, { useState } from 'react';
import ChatBox from './ChatBox';
import InputArea from './InputArea';
import './ChatInterface.css';

function ChatInterface({ messages, isLoading, onSendMessage, showSuggestions = false }) {
  const [hasUserTyped, setHasUserTyped] = useState(false);

  const suggestions = [
    "Questões de matemática do PAVE",
    "Como funciona o PAVE?",
    "Questões mais recentes",
    "Me ajude a estudar física",
    "Questões de biologia",
    "Informações sobre o vestibular"
  ];

  const handleUserInput = (message) => {
    setHasUserTyped(true);
    onSendMessage(message);
  };

  return (
    <div className="chat-interface-container">
      <ChatBox messages={messages} isLoading={isLoading} />
      {showSuggestions && !hasUserTyped && (
        <div className="chat-suggestions">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="chat-suggestion-chip"
              onClick={() => handleUserInput(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      <InputArea onSendMessage={handleUserInput} isLoading={isLoading} />
    </div>
  );
}

export default ChatInterface;
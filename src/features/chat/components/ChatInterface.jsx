import React, { useState } from 'react';
import ChatBox from './ChatBox';
import InputArea from './InputArea';

function ChatInterface({ messages, isLoading, onSendMessage }) {
  const [hasUserTyped, setHasUserTyped] = useState(false);

  const suggestions = ["Quais são as questões mais recentes?", "Me mostre questões de matemática", "Como funciona o PAVE?"];

  const handleUserInput = (message) => {
    setHasUserTyped(true);
    onSendMessage(message);
  };

  return (
    <div className="chat-interface-container">
      {!hasUserTyped && (
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
      <ChatBox messages={messages} isLoading={isLoading} />
      <InputArea onSendMessage={handleUserInput} isLoading={isLoading} />
    </div>
  );
}

export default ChatInterface;
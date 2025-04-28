import React, { useState } from 'react';

function InputArea({ onSendMessage, isLoading }) {
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !isLoading) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="input-area">
      <input
        type="text"
        id="user-input" // Mantém ID se o CSS usar
        placeholder="Digite sua pergunta ou comando..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={isLoading}
      />
      <button id="send-button" onClick={handleSend} disabled={isLoading}>
        {isLoading ? '...' : 'Enviar'}
      </button>
    </div>
  );
}

export default InputArea;
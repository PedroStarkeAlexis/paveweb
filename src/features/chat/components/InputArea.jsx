import React, { useState } from 'react';
import IconSend from '../../../components/icons/IconSend'; // Ajuste o caminho se necessário
import './InputArea.css'; // Criaremos este arquivo CSS

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
    <div className={`chat-input-container ${isLoading ? 'loading' : ''}`}>
      <input
        type="text"
        className="chat-input-field"
        placeholder="Digite sua mensagem..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={isLoading}
        aria-label="Campo de mensagem"
      />
      <button
        className="chat-send-button"
        onClick={handleSend}
        disabled={isLoading || !inputValue.trim()}
        aria-label="Enviar mensagem"
      >
        <IconSend />
      </button>
    </div>
  );
}

export default InputArea;
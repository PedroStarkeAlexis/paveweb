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
    <div
      className={`sticky bottom-4 mx-auto flex items-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-full p-2 w-full max-w-3xl shadow-lg focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all duration-200 ${isLoading ? 'loading' : ''
        }`}
    >
      <textarea
        className="flex-grow bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 text-base leading-relaxed px-4 py-2 resize-none h-10 max-h-40"
        placeholder="Digite sua mensagem..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={isLoading}
        aria-label="Campo de mensagem"
        rows="1"
      />
      <button
        className="flex items-center justify-center bg-emerald-600 text-white rounded-full w-10 h-10 p-0 ml-2 cursor-pointer transition-colors flex-shrink-0 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:text-gray-500 disabled:cursor-not-allowed"
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
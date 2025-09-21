import React, { useState } from 'react';
import ChatBox from './ChatBox';
import InputArea from './InputArea';

function ChatInterface({ messages, isLoading, onSendMessage }) {
  const [hasUserTyped, setHasUserTyped] = useState(false);

  // Sugestões de chips para o início da conversa
  const suggestions = [
    "Questões de matemática do PAVE",
    "Como funciona o PAVE?",
    "Questões mais recentes",
    "Me ajude a estudar física",
  ];

  const handleSuggestionClick = (suggestion) => {
    setHasUserTyped(true); // Considera o clique como uma interação do usuário
    onSendMessage(suggestion);
  };
  
  // O InputArea agora vai gerenciar a digitação, então não precisamos mais de handleUserInput aqui
  // Apenas passamos a função onSendMessage diretamente

  return (
    // Container que preenche o espaço disponível e organiza os elementos
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
      <ChatBox messages={messages} isLoading={isLoading} />
      
      {/* Container para Sugestões e InputArea */}
      <div className="mt-auto px-4 pb-4">
        {!hasUserTyped && messages.length < 3 && ( // Condição para mostrar sugestões
          <div className="flex flex-wrap justify-center gap-2 mb-3 animate-fade-in-up">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="px-4 py-2 text-sm font-medium transition-colors duration-200 border rounded-full text-text-secondary border-border-primary bg-bg-secondary hover:bg-bg-tertiary hover:text-text-primary"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
        <InputArea onSendMessage={onSendMessage} isLoading={isLoading} onType={() => setHasUserTyped(true)} />
      </div>
    </div>
  );
}

export default ChatInterface;

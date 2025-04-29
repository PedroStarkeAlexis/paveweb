import React from 'react';
import ReactMarkdown from 'react-markdown'; // Importa a biblioteca
import remarkGfm from 'remark-gfm';       // Importa o plugin GFM

function Message({ sender, text }) {
  // Não precisamos mais da função createMarkup

  return (
    // A classe da bolha continua a mesma
    <div className={`message ${sender === 'user' ? 'user-message' : 'bot-message'}`}>
      {/* Usa o componente ReactMarkdown para renderizar o texto */}
      {/* Passamos o texto como children e habilitamos o plugin GFM */}
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {text || ''} {/* Passa o texto aqui. Usa string vazia como fallback */}
      </ReactMarkdown>
    </div>
  );
}

export default Message;
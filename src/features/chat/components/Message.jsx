import React from 'react';
import ReactMarkdown from 'react-markdown'; // Importa a biblioteca
import remarkGfm from 'remark-gfm';       // Importa o plugin GFM

function Message({ sender, text }) { // Recebe sender e text como props

  // Garante que text seja uma string, mesmo que seja vazia
  const markdownContent = typeof text === 'string' ? text : '';

  return (
    // Renderiza a div da bolha com as classes corretas
    <div className={`message ${sender === 'user' ? 'user-message' : 'bot-message'}`}>
      {/*
        Renderiza o conteúdo usando ReactMarkdown.
        O conteúdo (markdownContent) é passado como filho direto do componente.
        remarkPlugins={[remarkGfm]} habilita funcionalidades extras como tabelas, etc.
      */}
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {markdownContent}
      </ReactMarkdown>
    </div>
  );
}

export default Message;
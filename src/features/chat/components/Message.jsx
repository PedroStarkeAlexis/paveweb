import React from 'react';
import ReactMarkdown from 'react-markdown'; // Importa a biblioteca
import remarkGfm from 'remark-gfm';       // Importa o plugin GFM

function Message({ sender, text }) { // Recebe sender e text como props

  // Garante que text seja uma string, mesmo que seja vazia
  const markdownContent = typeof text === 'string' ? text : '';

  return (
    // Renderiza a div da bolha com as classes corretas
    <div
      className={`max-w-[85%] md:max-w-[80%] py-2.5 px-4 rounded-2xl leading-relaxed break-words transition-colors duration-300 ${sender === 'user'
          ? 'self-end bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-100 rounded-br-lg'
          : 'self-start bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-bl-lg'
        }`}
    >
      {/*
        Renderiza o conteúdo usando ReactMarkdown.
        O conteúdo (markdownContent) é passado como filho direto do componente.
        remarkPlugins={[remarkGfm]} habilita funcionalidades extras como tabelas, etc.
      */}
      <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2">
        {markdownContent}
      </ReactMarkdown>
    </div>
  );
}

export default Message;
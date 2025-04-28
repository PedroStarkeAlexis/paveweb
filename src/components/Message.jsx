import React from 'react';

function Message({ sender, text }) {
  // Usa dangerouslySetInnerHTML para renderizar <br> do \n (cuidado com XSS se a fonte não for confiável)
  const createMarkup = () => {
    return { __html: text ? text.replace(/\n/g, '<br>') : '' };
  };

  return (
    <div className={`message ${sender === 'user' ? 'user-message' : 'bot-message'}`}>
      <p dangerouslySetInnerHTML={createMarkup()} />
    </div>
  );
}

export default Message;
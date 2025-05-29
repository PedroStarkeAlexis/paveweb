import React from 'react';
import ChatBox from './ChatBox';
import InputArea from './InputArea';

function ChatInterface({ messages, isLoading, onSendMessage, onRequestExplanation }) { // <<< NOVA PROP
  return (
    <div className="chat-interface-container">
      <ChatBox
        messages={messages}
        isLoading={isLoading}
        onRequestExplanation={onRequestExplanation} // <<< PASSAR PROP
      />
      <InputArea onSendMessage={onSendMessage} isLoading={isLoading} />
    </div>
  );
}

export default ChatInterface;
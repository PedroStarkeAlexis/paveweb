import React from 'react';
import ChatBox from './ChatBox';
import InputArea from './InputArea';

function ChatInterface({ messages, isLoading, onSendMessage }) {
  return (
    <div className="chat-interface-container">
      <ChatBox messages={messages} isLoading={isLoading} />
      <InputArea onSendMessage={onSendMessage} isLoading={isLoading} />
    </div>
  );
}

export default ChatInterface;
import React from 'react';
import ChatBox from './ChatBox';
import InputArea from './InputArea';

function ChatInterface({ messages, isLoading, onSendMessage }) {
  return (
    <div className="chat-interface-container w-full max-w-4xl mx-auto flex flex-col flex-grow min-h-0 p-0 sm:px-4">
      <ChatBox messages={messages} isLoading={isLoading} />
      <InputArea onSendMessage={onSendMessage} isLoading={isLoading} />
    </div>
  );
}

export default ChatInterface;
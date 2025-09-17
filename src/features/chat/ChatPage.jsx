import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import { getAIResponse } from '../../services/chatService';

// A página agora gerencia o estado e a lógica do chat
function ChatPage({ modelName }) {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Efeito para a mensagem inicial do bot
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                { type: 'text', sender: 'bot', content: 'Que bom te ver por aqui! 👋 Eu posso buscar questões do PAVE pra você ou, se preferir, criar uma nova. É só pedir!', id: `bot-initial-${Date.now()}` }
            ]);
        }
    }, [messages.length]); // Dependência garante que rode apenas uma vez

    // Lógica para enviar mensagem, movida do App.jsx
    const handleSendMessage = async (userQuery) => {
        const newUserMessage = { type: 'text', sender: 'user', content: userQuery, id: `user-${Date.now()}` };
        const updatedMessagesWithUser = [...messages, newUserMessage];

        setMessages(updatedMessagesWithUser);
        setIsLoading(true);

        try {
            const botResponses = await getAIResponse(updatedMessagesWithUser, modelName);
            if (botResponses.length > 0) {
                setMessages(prev => [...prev, ...botResponses]);
            }
        } catch (error) {
            console.error("Erro no handleSendMessage (ChatPage):", error);
            const errorResponse = { type: 'text', sender: 'bot', content: `Desculpe, ocorreu um problema: ${error.message}`, id: `err-${Date.now()}` };
            setMessages(prev => [...prev, errorResponse]);
        } finally {
            setIsLoading(false);
        }
    };

    // Renderiza o componente de UI do chat, passando o estado e a lógica
    return (
        <ChatInterface
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
        />
    );
}

export default ChatPage;
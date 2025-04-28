import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
// Seu CSS importado em main.jsx ou aqui
// import './style.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mensagem inicial do bot
  useEffect(() => {
    setMessages([
      {
        type: 'text',
        sender: 'bot',
        content: 'Olá! 👋 Use o campo abaixo para buscar questões por matéria, tópico, ano ou etapa. Você também pode me cumprimentar!'
      }
    ]);
  }, []);

  const handleSendMessage = async (userQuery) => {
    // Adiciona mensagem do usuário imediatamente
    const newUserMessage = { type: 'text', sender: 'user', content: userQuery };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setIsLoading(true);

    try {
      // Chama a API do Worker (Pages Function)
      const response = await fetch('/api/ask', { // Rota da function
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userQuery }),
      });

      if (!response.ok) {
        // Tenta pegar erro do backend
        let errorMsg = `Erro ${response.status}`;
        try {
          const errData = await response.json();
          errorMsg = errData.commentary || errData.error || errorMsg;
        } catch { /* ignora */ }
        throw new Error(errorMsg);
      }

      const data = await response.json();

      // Cria as novas mensagens/questões do bot
      const botResponses = [];
      if (data.commentary) {
        botResponses.push({ type: 'text', sender: 'bot', content: data.commentary });
      }
      if (data.questions && data.questions.length > 0) {
        data.questions.forEach(q => {
          // Verifica dados mínimos antes de adicionar como questão interativa
          if (q.alternativas && q.resposta_letra) {
             botResponses.push({ type: 'question', sender: 'bot', questionData: q });
          } else {
             console.warn("Dados da questão incompletos recebidos:", q);
             botResponses.push({ type: 'text', sender: 'bot', content: `(Questão sobre ${q.topico || q.materia} encontrada, mas dados incompletos.)`});
          }
        });
      }

      // Adiciona as respostas do bot ao estado
      setMessages(prevMessages => [...prevMessages, ...botResponses]);

    } catch (error) {
      console.error("Erro ao buscar resposta:", error);
      const errorResponse = { type: 'text', sender: 'bot', content: `Desculpe, tive um problema: ${error.message}` };
      setMessages(prevMessages => [...prevMessages, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  // Estrutura principal do App (Sidebar + Main) - Mantida do HTML anterior
  return (
    <div className="app-container">
      <aside className="sidebar">
        {/* Conteúdo da Sidebar (pode componentizar depois) */}
        <div className="sidebar-header">
            <span className="logo-placeholder"> PAVE </span>
        </div>
        <nav className="sidebar-nav">
            <ul>
                {/* Exemplo de itens - Tornar dinâmico/componente se necessário */}
                <li><a href="#" className="active"><span className="icon">💬</span> Busca (Chat)</a></li>
                <li><a href="#"><span className="icon">📋</span> Simulados (Futuro)</a></li>
                <li><a href="#"><span className="icon">📝</span> Listas (Futuro)</a></li>
            </ul>
        </nav>
         <div className="sidebar-footer">
             <ul>
                <li><a href="#"><span className="icon">❓</span> Ajuda</a></li>
             </ul>
             <div className="copyright">
                 © 2024 Chatbot PAVE
             </div>
         </div>
      </aside>
      <main className="main-content">
        {/* Passa o estado e a função para a interface do chat */}
        <ChatInterface
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
        />
      </main>
    </div>
  );
}

export default App;
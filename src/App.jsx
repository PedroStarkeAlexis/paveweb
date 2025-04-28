import React, { useState, useEffect } from 'react';
// Importa componentes de roteamento do react-router-dom
import { Routes, Route, Link, useLocation } from 'react-router-dom';

// Importa os componentes das páginas/interfaces
import ChatInterface from './components/ChatInterface'; // Interface principal do Chat
import QuestionBankPage from './components/QuestionBankPage'; // Nova página do Banco de Questões

// Importa o CSS global (se não estiver em main.jsx)
// import './style.css';

// --- Componente Auxiliar para Links da Sidebar ---
// Gerencia a classe 'active' automaticamente baseado na URL atual
function NavLink({ to, icon, children }) {
    const location = useLocation(); // Hook para obter a localização atual
    const isActive = location.pathname === to; // Verifica se o path atual é igual ao do link

    return (
        <li>
            {/* Usa o componente Link do React Router para navegação SPA */}
            <Link to={to} className={isActive ? 'active' : ''}> {/* Aplica classe 'active' condicionalmente */}
                <span className="icon">{icon}</span> {children}
            </Link>
        </li>
    );
}

// --- Componente Principal da Aplicação ---
function App() {
  // --- Estado do Chat (específico para a rota "/") ---
  const [messages, setMessages] = useState([]); // Array de mensagens/questões do chat
  const [isLoading, setIsLoading] = useState(false); // Flag para feedback de carregamento

  // --- Efeito para Mensagem Inicial do Chat ---
  // Roda apenas uma vez na montagem inicial do App
  useEffect(() => {
    setMessages([
      {
        type: 'text', // Tipo da mensagem
        sender: 'bot', // Remetente
        content: 'Olá! 👋 Use o campo abaixo para buscar questões por matéria, tópico, ano ou etapa. Você também pode me cumprimentar!' // Conteúdo
      }
    ]);
  }, []); // Array de dependências vazio = rodar só uma vez

  // --- Handler para Enviar Mensagem (passado para ChatInterface) ---
  const handleSendMessage = async (userQuery) => {
    // Adiciona mensagem do usuário à UI imediatamente
    const newUserMessage = { type: 'text', sender: 'user', content: userQuery };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setIsLoading(true); // Mostra indicador "Digitando..."

    try {
      // Chama a API backend (/api/ask)
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userQuery }),
      });

      // Tratamento de erro da API
      if (!response.ok) {
        let errorMsg = `Erro ${response.status}`;
        try {
          const errData = await response.json();
          errorMsg = errData.commentary || errData.error || errorMsg;
        } catch { /* Ignora erro ao parsear erro */ }
        throw new Error(errorMsg); // Lança o erro para o catch
      }

      // Processa a resposta bem-sucedida
      const data = await response.json();

      // Prepara as respostas do bot (comentário e/ou questões)
      const botResponses = [];
      if (data.commentary) {
        botResponses.push({ type: 'text', sender: 'bot', content: data.commentary });
      }
      if (data.questions && data.questions.length > 0) {
        data.questions.forEach(q => {
          if (q.alternativas && q.resposta_letra) {
            // Adiciona como tipo 'question' se tiver dados para interatividade
            botResponses.push({ type: 'question', sender: 'bot', questionData: q });
          } else {
            // Senão, adiciona como texto informando dados incompletos
            console.warn("Dados da questão incompletos recebidos:", q);
            // CORREÇÃO: Removido ``` do final da string
            botResponses.push({ type: 'text', sender: 'bot', content: `(Recebi uma questão sobre ${q.topico || q.materia}, mas os dados para interação estão incompletos.)` });
          }
        });
      }

      // Adiciona as respostas do bot ao estado de mensagens
      setMessages(prevMessages => [...prevMessages, ...botResponses]);

    } catch (error) {
      // Captura erros da chamada fetch ou do tratamento da resposta
      console.error("Erro ao buscar resposta da API:", error);
      const errorResponse = { type: 'text', sender: 'bot', content: `Desculpe, ocorreu um problema ao processar sua solicitação: ${error.message}` };
      setMessages(prevMessages => [...prevMessages, errorResponse]);
    } finally {
      // Desativa o indicador de carregamento em qualquer caso (sucesso ou erro)
      setIsLoading(false);
    }
  };

  // --- JSX para Renderização ---
  return (
      <div className="app-container"> {/* Container Flex principal */}
        {/* Barra Lateral */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <span className="logo-placeholder"> PAVE Chatbot </span>
          </div>
          <nav className="sidebar-nav">
            <ul>
              {/* Links de Navegação */}
              <NavLink to="/" icon="💬">Busca (Chat)</NavLink>
              <NavLink to="/banco-questoes" icon="📚">Banco de Questões</NavLink>
              {/* Adicionar outros links conforme necessário */}
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

        {/* Conteúdo Principal */}
        <main className="main-content">
          {/* Sistema de Roteamento */}
          <Routes>
            {/* Rota Raiz: Renderiza o ChatInterface */}
            <Route
              path="/"
              element={
                <ChatInterface
                  messages={messages}
                  isLoading={isLoading}
                  onSendMessage={handleSendMessage}
                />
              }
            />
            {/* Rota para o Banco de Questões */}
            <Route
                path="/banco-questoes"
                element={<QuestionBankPage />}
            />
            {/* Outras Rotas Futuras */}
            {/* <Route path="*" element={<div>Página não encontrada</div>} /> */}
          </Routes>
        </main>
      </div>
  );
}

// Exporta o componente principal
export default App;
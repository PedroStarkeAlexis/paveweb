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
  // --- Handler para Enviar Mensagem (VERSÃO MAIS SEGURA) ---
  const handleSendMessage = async (userQuery) => {
    const newUserMessage = { type: 'text', sender: 'user', content: userQuery };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userQuery }),
      });

      // Pega o corpo da resposta para análise, mesmo se não for OK
      const responseBody = await response.text(); // Lê como texto primeiro

      // Verifica se a resposta HTTP foi bem-sucedida (status 2xx)
      if (!response.ok) {
          let errorMsg = `Erro ${response.status}`;
          try {
              // Tenta parsear o corpo como JSON para pegar a mensagem de erro estruturada
              const errData = JSON.parse(responseBody);
              errorMsg = errData.error || errData.commentary || `Erro ${response.status} - ${response.statusText}`;
          } catch (e) {
              // Se não for JSON, usa o texto do corpo como erro (ou o status)
              errorMsg = responseBody || `Erro ${response.status} - ${response.statusText}`;
              console.warn("Resposta de erro não era JSON:", responseBody);
          }
          throw new Error(errorMsg); // Lança o erro
      }

      // Se a resposta foi OK, tenta parsear como JSON
      let data;
      try {
          data = JSON.parse(responseBody);
      } catch (e) {
          console.error("Falha ao parsear resposta JSON bem-sucedida:", responseBody, e);
          throw new Error("Recebi uma resposta inesperada do servidor.");
      }


      // --- Processamento Seguro dos Dados ---
      const botResponses = [];
      // Adiciona comentário APENAS se existir e for uma string
      if (data && typeof data.commentary === 'string' && data.commentary.length > 0) {
        botResponses.push({ type: 'text', sender: 'bot', content: data.commentary });
      }

      // Adiciona questões APENAS se data.questions for um array e tiver itens
      // VERIFICAÇÃO IMPORTANTE: Array.isArray(data.questions)
      if (data && Array.isArray(data.questions) && data.questions.length > 0) {
        data.questions.forEach(q => {
          if (q && q.alternativas && q.resposta_letra) { // Verifica se 'q' também é válido
            botResponses.push({ type: 'question', sender: 'bot', questionData: q });
          } else {
            console.warn("Dados da questão inválidos ou incompletos recebidos:", q);
            botResponses.push({ type: 'text', sender: 'bot', content: `(Recebi dados de questão incompletos.)` });
          }
        });
      } else if (data && data.questions !== undefined && data.questions !== null) {
          // Loga se 'questions' existe mas não é um array válido ou está vazio
          console.warn("Backend retornou 'questions', mas não é um array válido ou está vazio:", data.questions);
      }
      // --- Fim do Processamento Seguro ---


      // Adiciona as respostas do bot ao estado de mensagens
      setMessages(prevMessages => [...prevMessages, ...botResponses]);

    } catch (error) {
      // Captura erros (fetch, parse, ou o Error lançado)
      console.error("Erro no handleSendMessage:", error);
      const errorResponse = { type: 'text', sender: 'bot', content: `Desculpe, ocorreu um problema: ${error.message}` };
      setMessages(prevMessages => [...prevMessages, errorResponse]);
    } finally {
      // Garante que o loading termine
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
              <NavLink to="/banco-questoes" icon="📚">Banco de Questões</NavLink>
              {/* Adicionar outros links conforme necessário */}
            </ul>
          </nav>
          <div className="sidebar-footer">
             <ul>
                <li><a href="#"><span className="icon">❓</span> Ajuda</a></li>
             </ul>
             <div className="copyright">
                 © 2025 Desenvolvido por Pedro alexis
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
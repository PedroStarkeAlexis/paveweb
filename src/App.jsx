import React, { useState, useEffect } from 'react';
// Importa componentes de roteamento do react-router-dom
import { Routes, Route, Link, useLocation } from 'react-router-dom';

// Importa os componentes das páginas/interfaces
// VERIFIQUE se estes caminhos estão corretos para sua estrutura de pastas
import ChatInterface from './components/ChatInterface';
import QuestionBankPage from './components/QuestionBankPage'; // Ajuste se estiver em ./pages/

// Importa o CSS global (se não estiver importado em main.jsx)
// import './style.css';

// --- Componente Auxiliar para Links da Sidebar ---
// Gerencia a classe 'active' automaticamente baseado na URL atual
function NavLink({ to, icon, children }) {
    const location = useLocation(); // Hook do React Router para obter a localização atual
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
  // --- Estado do Chat ---
  // Mantém o histórico de mensagens para a interface do chat
  const [messages, setMessages] = useState([]);
  // Controla se uma resposta do bot está sendo carregada
  const [isLoading, setIsLoading] = useState(false);

  // --- Efeito para Mensagem Inicial do Chat ---
  // Roda apenas na primeira renderização do componente App
  useEffect(() => {
    setMessages([
      {
        type: 'text', // Tipo da mensagem
        sender: 'bot', // Remetente
        content: 'Olá! 👋 Use o campo abaixo para buscar questões por matéria, tópico, ano ou etapa. Você também pode me cumprimentar!' // Conteúdo
      }
    ]);
  }, []); // Array de dependências vazio garante execução única

  // --- Handler para Enviar Mensagem ---
  // Função assíncrona chamada quando o usuário envia uma mensagem pelo InputArea
  const handleSendMessage = async (userQuery) => {
    // Adiciona a mensagem do usuário à UI imediatamente
    const newUserMessage = { type: 'text', sender: 'user', content: userQuery };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setIsLoading(true); // Ativa o feedback visual de carregamento

    try {
      // Chama a API backend na rota /api/ask
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userQuery }),
      });

      // Lê o corpo da resposta como texto primeiro para análise segura
      const responseBody = await response.text();

      // Verifica se a resposta HTTP não foi bem-sucedida
      if (!response.ok) {
        let errorMsg = `Erro ${response.status}`;
        try {
          // Tenta extrair uma mensagem de erro mais detalhada do JSON da resposta
          const errData = JSON.parse(responseBody);
          errorMsg = errData.error || errData.commentary || `Erro ${response.status} (${response.statusText})`;
        } catch (e) {
          // Se o corpo do erro não for JSON, usa o próprio texto ou o status
          errorMsg = responseBody || `Erro ${response.status} (${response.statusText})`;
          console.warn("Resposta de erro da API não era JSON:", responseBody);
        }
        // Lança o erro para ser tratado pelo bloco catch
        throw new Error(errorMsg);
      }

      // Se a resposta HTTP foi OK, tenta interpretar o corpo como JSON
      let data;
      try {
        data = JSON.parse(responseBody);
      } catch (e) {
        console.error("Falha ao parsear resposta JSON bem-sucedida:", responseBody, e);
        // Lança um erro se a resposta OK não for JSON válido
        throw new Error("Recebi uma resposta inesperada do servidor.");
      }

      // Processa os dados recebidos da API
      const botResponses = [];
      // Adiciona o comentário do bot se ele existir e for uma string não vazia
      // CORREÇÃO: Adicionada verificação se data.commentary existe antes de acessar .trim()
      if (data?.commentary && typeof data.commentary === 'string' && data.commentary.trim().length > 0) {
        botResponses.push({ type: 'text', sender: 'bot', content: data.commentary });
      }

      // Adiciona as questões se 'data.questions' for um array válido e não vazio
      // CORREÇÃO: Acessa data.questions.length apenas se data.questions for um array
      if (data?.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        data.questions.forEach(q => {
          // Valida cada objeto de questão antes de adicioná-lo
          if (q && q.alternativas && q.resposta_letra) {
            botResponses.push({ type: 'question', sender: 'bot', questionData: q });
          } else {
            console.warn("Dados da questão inválidos ou incompletos recebidos do backend:", q);
            botResponses.push({ type: 'text', sender: 'bot', content: `(Recebi dados de questão incompletos.)` });
          }
        });
      } else if (data?.questions !== undefined && data.questions !== null) {
        // Loga um aviso se 'questions' foi retornado mas não é um array válido/populado
        console.warn("Backend retornou 'questions', mas não é um array válido ou está vazio:", data.questions);
      }

      // Adiciona uma mensagem padrão se NADA foi retornado (nem comentário, nem questões)
      // CORREÇÃO: Simplificada a condição para verificar se botResponses está vazio após processar dados
      if (botResponses.length === 0) {
          console.log("Nenhum comentário ou questão válida recebida da API.");
          botResponses.push({ type: 'text', sender: 'bot', content: 'Não encontrei informações relevantes para sua busca nos dados atuais.' });
      }

      // Adiciona as respostas preparadas (comentário e/ou questões) ao estado
      // Só atualiza se houver respostas novas para evitar renderização desnecessária
      // CORREÇÃO: A verificação if (botResponses.length > 0) aqui era redundante devido à adição da mensagem padrão acima. Removida.
      setMessages(prevMessages => [...prevMessages, ...botResponses]);


    } catch (error) {
      // Captura qualquer erro ocorrido no try (fetch, parse, etc.)
      console.error("Erro no handleSendMessage:", error);
      // Cria e exibe uma mensagem de erro no chat
      const errorResponse = { type: 'text', sender: 'bot', content: `Desculpe, ocorreu um problema: ${error.message}` };
      setMessages(prevMessages => [...prevMessages, errorResponse]);
    } finally {
      // Garante que o estado de carregamento seja desativado
      setIsLoading(false);
    }
  };

  // --- JSX para Renderização da UI ---
  return (
    <div className="app-container">
      {/* Barra Lateral Esquerda */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="logo-placeholder"> PAVE Chatbot </span>
        </div>
        <nav className="sidebar-nav">
          <ul>
            {/* Links de Navegação */}
            <NavLink to="/" icon="💬">Busca (Chat)</NavLink>
            <NavLink to="/banco-questoes" icon="📚">Banco de Questões</NavLink>
            {/* Adicionar outros links aqui */}
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

      {/* Conteúdo Principal à Direita */}
      <main className="main-content">
        {/* Define as Rotas */}
        <Routes>
          {/* Rota para a página inicial (Chat) */}
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
          {/* Rota para a página do Banco de Questões */}
          <Route
              path="/banco-questoes"
              element={<QuestionBankPage />}
          />
          {/* Outras Rotas */}
          {/* Exemplo de rota não encontrada: */}
          {/* <Route path="*" element={<div>Página não encontrada (404)</div>} /> */}
        </Routes>
      </main>
    </div>
  );
}

export default App;
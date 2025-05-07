import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';

// --- Importar páginas/features dos NOVOS locais ---
import HomePage from './pages/HomePage';
// --- Import da nova página ---
import ChatInterface from './features/chat/components/ChatInterface'; // Verifique se este é o componente da página ou se precisa criar ChatPage.jsx
import QuestionBankPage from './features/bancoQuestoes/components/QuestionBankPage'; // Verifique se este é o componente da página
import CalculadoraPage from './features/calculadora/Calculadorapage.jsx';

// --- Importar componentes comuns e hooks globais ---
// ATENÇÃO: No seu print, ThemeToggleButton está como .js, renomeie para .jsx se for componente React
import ThemeToggleButton from './components/common/ThemeToggleButton'; // Caminho atualizado
// ATENÇÃO: No seu print, useDarkModeToggle está como .js, renomeie para .jsx
import useDarkModeToggle from './hooks/useDarkModeToggle'; // Caminho atualizado

// Importar CSS global principal (geralmente feito em main.jsx, mas confirme)
import './style.css';

// --- Componente NavLink (com tratamento de link externo) ---
function NavLink({ to, icon, children }) {
    const location = useLocation();
    const isActive = !to.startsWith('http') && location.pathname === to; // Só marca ativo para links internos
    const linkClass = isActive ? 'active' : '';

    if (to.startsWith('http')) {
        return (
            <li>
                <a href={to} target="_blank" rel="noopener noreferrer" className="external-link">
                    <span className="icon">{icon}</span> {children}
                </a>
            </li>
        );
    }

    return (
        <li>
            <Link to={to} className={linkClass}>
                <span className="icon">{icon}</span> {children}
            </Link>
        </li>
    );
}

// --- Componente Principal App ---
function App() {
    // --- Estado do Chat (Mantido aqui por enquanto) ---
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // --- Estado do Tema ---
    // Tenta ler a preferência inicial
    const getInitialThemePreference = () => {
        if (typeof window !== 'undefined') { // Garante que rode apenas no client-side
            const storedPreference = localStorage.getItem('theme-preference');
            if (storedPreference) {
                return storedPreference === 'dark';
            }
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false; // Default no server-side ou build time
    };
    const [darkMode, setDarkMode] = useState(getInitialThemePreference);

    // --- Hook e Lógica de Tema ---
    useDarkModeToggle(darkMode, setDarkMode); // Hook aplica classe e data-theme

    // Função para o botão de toggle (salva no localStorage)
    const handleThemeToggle = useCallback(() => {
        setDarkMode(prevMode => {
            const newMode = !prevMode;
            // localStorage só existe no client-side
            if (typeof window !== 'undefined') {
                localStorage.setItem('theme-preference', newMode ? 'dark' : 'light');
            }
            return newMode;
        });
    }, [setDarkMode]); // setDarkMode é estável, não precisa estar na dependência geralmente

    // Sincroniza com mudanças no sistema operacional (se não houver preferência salva)
    useEffect(() => {
        if (typeof window !== 'undefined') { // Garante que rode apenas no client-side
            const matcher = window.matchMedia('(prefers-color-scheme: dark)');
            const listener = ({ matches: isDark }) => {
                // Atualiza SÓ SE não houver preferência explícita no localStorage
                if (!localStorage.getItem('theme-preference')) {
                    setDarkMode(isDark);
                }
            };
            // Listener moderno
            if (matcher.addEventListener) {
                 matcher.addEventListener('change', listener);
                 // Cleanup function
                 return () => matcher.removeEventListener('change', listener);
            }
            // Listener legado (para compatibilidade, embora menos provável com React 19)
            else if (matcher.addListener) {
                 matcher.addListener(listener);
                 // Cleanup function
                 return () => matcher.removeListener(listener);
            }
        }
    }, [setDarkMode]); // Depende do setDarkMode

    // --- Handler para Enviar Mensagem (Lógica permanece igual) ---
    const handleSendMessage = async (userQuery) => {
        const newUserMessage = { type: 'text', sender: 'user', content: userQuery };
        const updatedMessages = [...messages, newUserMessage];
        setMessages(updatedMessages);
        setIsLoading(true);

        const HISTORY_LENGTH = 8;
        const historyForAPI = updatedMessages.slice(-HISTORY_LENGTH).map(msg => {
            if (msg && typeof msg.sender === 'string' && typeof msg.content === 'string') {
                return { role: msg.sender === 'user' ? 'user' : 'model', parts: [{ text: msg.content }] };
            } return null;
        }).filter(Boolean);

        if (historyForAPI.length === 0) { setIsLoading(false); return; }

        try {
            const response = await fetch('/api/ask', { /* ... corpo da requisição ... */
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ history: historyForAPI }),
            });
            const responseBody = await response.text();
            if (!response.ok) {
                let errorMsg = `Erro ${response.status}`;
                try { errorMsg = JSON.parse(responseBody).error || errorMsg; } catch (e) { /* ignora erro de parse */ }
                throw new Error(errorMsg);
            }
            let data;
            try { data = JSON.parse(responseBody); }
            catch (e) { throw new Error("Resposta inesperada do servidor."); }

            const botResponses = [];
            if (data?.commentary?.trim()) { botResponses.push({ type: 'text', sender: 'bot', content: data.commentary }); }
            if (data?.questions?.length > 0) {
                data.questions.forEach(q => {
                    if (q && q.alternativas && q.resposta_letra) { botResponses.push({ type: 'question', sender: 'bot', questionData: q }); }
                    else { botResponses.push({ type: 'text', sender: 'bot', content: `(Dados de questão incompletos)` }); }
                });
            }
            if (botResponses.length === 0 && response.ok) { botResponses.push({ type: 'text', sender: 'bot', content: 'Entendido.' }); }
            if (botResponses.length > 0) { setMessages(prev => [...prev, ...botResponses]); }

        } catch (error) {
            console.error("Erro no handleSendMessage:", error);
            const errorResponse = { type: 'text', sender: 'bot', content: `Desculpe, ocorreu um problema: ${error.message}` };
            setMessages(prev => [...prev, errorResponse]);
        } finally {
            setIsLoading(false);
        }
    };


    // --- Efeito Inicial do Chat (Lógica permanece igual) ---
    useEffect(() => {
        if (messages.length === 0) {
             setMessages([
               { type: 'text', sender: 'bot', content: 'Oi! Que bom te ver por aqui! 👋 Eu posso buscar questões do PAVE pra você ou, se preferir, criar uma nova. É só pedir! 😊' }
             ]);
        }
    }, []); // Executa apenas na montagem inicial

    return (
        // Classe dark-mode será aplicada pelo hook no elemento <html> ou <body>
        <div className="app-container">
            <aside className="sidebar">
                {/* ... Sidebar Header ... */}
                <div className="sidebar-header">
                  <span className="logo-placeholder">LOGO AQUI</span>
                </div>
                <nav className="sidebar-nav">
                    <ul>
                        <NavLink to="/" icon="🏠">Início</NavLink> 
                        <NavLink to="/calculadora" icon="🧮">Calculadora PAVE</NavLink>
                        <NavLink to="/chat" icon="💬">Assistente IA</NavLink>
                        <NavLink to="/banco-questoes" icon="📚">Banco de Questões</NavLink>
                       
                        {/* Adicione outros links se necessário */}
                    </ul>
                </nav>
                {/* ... Sidebar Footer ... */}
                <div className="sidebar-footer">
                   <ul>
                      <li><a href="#"><span className="icon">?</span> Ajuda</a></li>
                   </ul>
                   <div className="copyright"> Desenvolvido por Pedro Alexis {new Date().getFullYear()} </div>
                </div>
            </aside>

            <main className="main-content">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route
                        path="/chat"
                        element={
                            <ChatInterface
                                messages={messages}
                                isLoading={isLoading}
                                onSendMessage={handleSendMessage}
                            />
                        }
                    />
                    <Route path="/banco-questoes" element={<QuestionBankPage />} />
                    {<Route path="/calculadora" element={<CalculadoraPage />} /> }
                    <Route path="*" element={<div style={{ padding: '40px', textAlign: 'center' }}><h2>Página não encontrada (404)</h2></div>} />
                </Routes>
            </main>

            {/* Botão de Tema Renderizado Globalmente */}
            <ThemeToggleButton isDarkMode={darkMode} toggleDarkMode={handleThemeToggle} />
        </div>
    );
}

export default App;
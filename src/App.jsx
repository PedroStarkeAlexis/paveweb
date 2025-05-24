// src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';

// --- Importar p��ginas/features ---
import HomePage from './pages/HomePage';
import ChatInterface from './features/chat/components/ChatInterface';
import QuestionBankPage from './features/bancoQuestoes/components/QuestionBankPage';
import CalculadoraPage from './features/calculadora/Calculadorapage.jsx';

// --- Importar componentes comuns e hooks globais ---
import ThemeToggleButton from './components/common/ThemeToggleButton';
import useDarkModeToggle from './hooks/useDarkModeToggle';
import BottomNavBar from './components/common/BottomNavBar';

// --- Importar Ícones SVG ---
import IconHome from './components/icons/IconHome';
import IconCalculator from './components/icons/IconCalculator';
import IconChat from './components/icons/IconChat';
import IconBook from './components/icons/IconBook';
import IconHelp from './components/icons/IconHelp';

// Importar CSS global principal
import './style.css';

// --- Componente NavLink (para Sidebar) ---
function NavLink({ to, icon: IconComponent, children }) {
    const location = useLocation();
    const isActive = !to.startsWith('http') && location.pathname === to;
    const linkClass = isActive ? 'active' : '';

    if (to.startsWith('http')) {
        return (
            <li>
                <a href={to} target="_blank" rel="noopener noreferrer" className="external-link">
                    {IconComponent && <IconComponent className="sidebar-icon" />}
                    <span className="nav-link-text">{children}</span>
                </a>
            </li>
        );
    }

    return (
        <li>
            <Link to={to} className={linkClass}>
                {IconComponent && <IconComponent className="sidebar-icon" />}
                <span className="nav-link-text">{children}</span>
            </Link>
        </li>
    );
}

// --- Componente Principal App ---
function App() {
    // --- Estado do Chat ---
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // --- Estado do Tema ---
    const getInitialThemePreference = () => {
        if (typeof window !== 'undefined') {
            const storedPreference = localStorage.getItem('theme-preference');
            if (storedPreference) {
                return storedPreference === 'dark';
            }
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    };
    const [darkMode, setDarkMode] = useState(getInitialThemePreference);

    // --- Hook e Lógica de Tema ---
    useDarkModeToggle(darkMode, setDarkMode);

    const handleThemeToggle = useCallback(() => {
        setDarkMode(prevMode => {
            const newMode = !prevMode;
            if (typeof window !== 'undefined') {
                localStorage.setItem('theme-preference', newMode ? 'dark' : 'light');
            }
            return newMode;
        });
    }, [setDarkMode]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const matcher = window.matchMedia('(prefers-color-scheme: dark)');
            const listener = ({ matches: isDark }) => {
                if (!localStorage.getItem('theme-preference')) {
                    setDarkMode(isDark);
                }
            };
            if (matcher.addEventListener) {
                matcher.addEventListener('change', listener);
                return () => matcher.removeEventListener('change', listener);
            } else if (matcher.addListener) { // Legado
                matcher.addListener(listener);
                return () => matcher.removeListener(listener);
            }
        }
    }, [setDarkMode]);

    // --- Handler para Enviar Mensagem ---
    const handleSendMessage = async (userQuery) => {
        const newUserMessage = { type: 'text', sender: 'user', content: userQuery, id: `user-${Date.now()}` }; // Adiciona ID
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
            const response = await fetch('/api/ask', {
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
            const botMessageIdBase = `bot-${Date.now()}`;

            // 1. Adiciona o comentário/resposta textual da IA, se houver
            if (data?.commentary?.trim()) {
                botResponses.push({
                    type: 'text',
                    sender: 'bot',
                    content: data.commentary,
                    id: `${botMessageIdBase}-comment`
                });
            }

            // 2. Adiciona o card de informações do PAVE, se sinalizado
            if (data?.displayCard === "pave_info_recommendation") {
                botResponses.push({
                    type: 'pave_info_card', // <<< NOVO TIPO DE MENSAGEM
                    sender: 'bot',
                    id: `${botMessageIdBase}-paveinfocard`
                    // Não precisa de dados extras, o card é estático por enquanto
                });
            }

            // 3. Adiciona questões (lógica do carrossel existente)
            if (data?.questions?.length > 0) {
                if (data.questions.length > 1) {
                    botResponses.push({
                        type: 'question_carousel',
                        sender: 'bot',
                        questionsData: data.questions.filter(q => q && q.alternativas && q.resposta_letra),
                        id: `${botMessageIdBase}-carousel`
                    });
                } else {
                    const q = data.questions[0];
                    if (q && q.alternativas && q.resposta_letra) {
                        botResponses.push({ type: 'question', sender: 'bot', questionData: q, id: `${botMessageIdBase}-q0` });
                    } else {
                        // Only add this error if no other meaningful response (like a comment or info card) is present
                        if (botResponses.length === 0 || data.displayCard !== "pave_info_recommendation") {
                            botResponses.push({ type: 'text', sender: 'bot', content: `(Dados de questão incompletos)`, id: `${botMessageIdBase}-qerr0` });
                        }
                    }
                }
            }

            // Fallback se nenhuma resposta foi preparada e a API retornou OK
            // (mas não se j�� tivermos um card de info, pois ele já é uma resposta)
            if (botResponses.length === 0 && response.ok && data?.displayCard !== "pave_info_recommendation") {
                botResponses.push({ type: 'text', sender: 'bot', content: 'Não tenho uma resposta específica para isso no momento.', id: `${botMessageIdBase}-fallback` });
            }

            if (botResponses.length > 0) { setMessages(prev => [...prev, ...botResponses]); }

        } catch (error) {
            console.error("Erro no handleSendMessage:", error);
            const errorResponse = { type: 'text', sender: 'bot', content: `Desculpe, ocorreu um problema: ${error.message}`, id: `err-${Date.now()}` };
            setMessages(prev => [...prev, errorResponse]);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Efeito Inicial do Chat ---
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                { type: 'text', sender: 'bot', content: 'Que bom te ver por aqui! 👋 Eu posso buscar questões do PAVE pra você ou, se preferir, criar uma nova. É só pedir! 😊', id: `bot-initial-${Date.now()}` }
            ]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Executa apenas na montagem inicial

    const bottomNavItems = [
        { to: "/", icon: IconHome, label: "Início" },
        { to: "/calculadora", icon: IconCalculator, label: "Calculadora" },
        { to: "/chat", icon: IconChat, label: "Chat IA" },
        { to: "/banco-questoes", icon: IconBook, label: "Questões" },
    ];

    return (
        <div className="app-container">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <span className="logo-placeholder">LOGO AQUI</span>
                </div>
                <nav className="sidebar-nav">
                    <ul>
                        <NavLink to="/" icon={IconHome}>Início</NavLink>
                        <NavLink to="/calculadora" icon={IconCalculator}>Calculadora PAVE</NavLink>
                        <NavLink to="/chat" icon={IconChat}>Assistente IA</NavLink>
                        <NavLink to="/banco-questoes" icon={IconBook}>Banco de Questões</NavLink>
                    </ul>
                </nav>
                <div className="sidebar-footer">
                    <ul>
                        <li>
                            {/*
                          O atributo data-az-l precisa do ID do SURVEY ou WIDGET específico do Appzi.
                          A 'token' (rcbhq) é para o script principal, NÃO para data-az-l.
                          Vá ao seu painel Appzi, encontre o ID do survey/widget que quer abrir
                          e substitua o placeholder abaixo.
                        */}
                            <a
                                href="#" // Appzi deve lidar com o clique.
                                data-az-l="5bbe131b-96af-48f5-986b-dc8cd1dbc158" // <<< SUBSTITUA ESTE VALOR
                                onClick={(e) => e.preventDefault()} // Opcional: Garante que o link não navegue
                            >
                                <IconHelp className="sidebar-icon-footer" />
                                <span className="nav-link-text">Ajuda</span>
                            </a>
                        </li>
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
                    <Route path="/calculadora" element={<CalculadoraPage />} />
                    <Route path="*" element={<div style={{ padding: '40px', textAlign: 'center' }}><h2>Página não encontrada (404)</h2></div>} />
                </Routes>
            </main>

            <ThemeToggleButton isDarkMode={darkMode} toggleDarkMode={handleThemeToggle} />
            <BottomNavBar items={bottomNavItems} />
        </div>
    );
}

export default App;
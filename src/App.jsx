import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';

// --- Importar páginas/features ---
import HomePage from './pages/HomePage';
import ChatInterface from './features/chat/components/ChatInterface';
import QuestionHubPage from './pages/QuestionHubPage';
import AllQuestionsPage from './features/bancoQuestoes/components/AllQuestionsPage';
import SubjectSelectionPage from './features/bancoQuestoes/components/SubjectSelectionPage';
import QuestionListPage from './features/bancoQuestoes/components/QuestionListPage';
import CreateQuestionPage from './pages/CreateQuestionPage';
import SavedQuestionsPage from './features/savedQuestions/components/SavedQuestionsPage';
import CalculadoraPage from './features/calculadora/Calculadorapage.jsx';
import FlashcardGeneratorPage from './features/flashcardGenerator/FlashcardGeneratorPage';
import DevModelSelector from './components/dev/DevModelSelector';

// --- Importar componentes comuns e hooks globais ---
import useDarkModeToggle from './hooks/useDarkModeToggle';
import BottomNavBar from './components/common/BottomNavBar';

// --- Importar Ícones SVG ---
import IconHome from './components/icons/IconHome';
import IconCalculator from './components/icons/IconCalculator';
import IconChat from './components/icons/IconChat';
import IconBook from './components/icons/IconBook';
import IconHelp from './components/icons/IconHelp';
import IconBookmark from './components/icons/IconBookmark';
import IconEllipsisHorizontal from './components/icons/IconEllipsisHorizontal';
import IconSun from './components/icons/IconSun';
import IconMoon from './components/icons/IconMoon';
import IconDocumentText from './components/icons/IconDocumentText';
// Importar CSS global principal
import './style.css';
import MoreMenu from './components/common/MoreMenu';
// Importar o SavedQuestionsProvider
import { SavedQuestionsProvider } from './contexts/SavedQuestionsContext';

// --- Componente NavLink (para Sidebar) ---
function NavLink({ to, icon: IconComponent, children, isFooter = false }) {
    const location = useLocation();
    const isActive = !to.startsWith('http') && (to === '/' ? location.pathname === to : location.pathname.startsWith(to));
    
    const baseLinkClasses = "flex items-center p-2.5 mx-2.5 rounded-md transition-colors duration-200 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary";
    const activeLinkClasses = "bg-brand-secondary text-brand-secondary-text font-semibold";
    
    const iconClasses = `shrink-0 ${isFooter ? 'w-4 h-4' : 'w-5 h-5'} ${isActive ? 'text-brand-primary' : 'text-text-muted'}`;
    const textClasses = "overflow-hidden text-ellipsis whitespace-nowrap text-sm";

    if (to.startsWith('http')) {
        return (
            <li>
                <a href={to} target="_blank" rel="noopener noreferrer" className={baseLinkClasses}>
                    <IconComponent className={`${iconClasses} mr-2.5`} />
                    <span className={textClasses}>{children}</span>
                </a>
            </li>
        );
    }

    return (
        <li>
            <Link to={to} className={`${baseLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
                <IconComponent className={`${iconClasses} mr-2.5`} />
                <span className={textClasses}>{children}</span>
            </Link>
        </li>
    );
}


// --- Constante para o Modelo Padrão ---
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-preview-05-20';
const DEV_MODEL_STORAGE_KEY = 'dev_selected_gemini_model';

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

    // --- NOVO: Estados para o Menu de Desenvolvedor ---
    const [isDevMenuOpen, setIsDevMenuOpen] = useState(false);
    const [selectedModelName, setSelectedModelName] = useState(
        () => localStorage.getItem(DEV_MODEL_STORAGE_KEY) || DEFAULT_GEMINI_MODEL
    );
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

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

    useEffect(() => {
        const handleKeyDown = (event) => {
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toUpperCase() === 'M') {
                event.preventDefault();
                setIsDevMenuOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const handleSelectModel = (modelId) => {
        setSelectedModelName(modelId);
        localStorage.setItem(DEV_MODEL_STORAGE_KEY, modelId);
    };

    const handleSendMessage = async (userQuery) => {
        const newUserMessage = { type: 'text', sender: 'user', content: userQuery, id: `user-${Date.now()}` };
        const updatedMessages = [...messages, newUserMessage];
        setMessages(updatedMessages);
        setIsLoading(true);

        const HISTORY_LENGTH = 8;
        const historyForAPI = updatedMessages.slice(-HISTORY_LENGTH).map(msg => {
            if (!msg) return null;
            const role = msg.sender === 'user' ? 'user' : 'model';
            if (msg.type === 'flashcard_display' && msg.flashcardsData && msg.flashcardsData.length > 0) {
                let flashcardsText = "Flashcards Gerados (Termos):\n";
                msg.flashcardsData.forEach((fc) => {
                    flashcardsText += `  - ${fc.term}\n`;
                });
                return { role: 'model', parts: [{ text: flashcardsText.trim() }] };
            } else if (typeof msg.content === 'string' && msg.content.trim() !== '') {
                return { role, parts: [{ text: msg.content }] };
            }
            return null;
        }).filter(Boolean);

        if (historyForAPI.length === 0 && userQuery) { setIsLoading(false); return; }

        try {
            const requestBody = { history: historyForAPI, modelName: selectedModelName };
            const response = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
            const responseBody = await response.text();
            if (!response.ok) {
                let errorMsg = `Erro ${response.status}`;
                try { errorMsg = JSON.parse(responseBody).error || errorMsg; } catch (e) { /* ignora erro de parse */ }
                throw new Error(errorMsg);
            }
            let data = JSON.parse(responseBody);
            const botResponses = [];
            const botMessageIdBase = `bot-${Date.now()}`;

            if (data?.commentary?.trim()) {
                botResponses.push({ type: 'text', sender: 'bot', content: data.commentary, id: `${botMessageIdBase}-comment` });
            }
            if (data?.displayCard === "pave_info_recommendation") {
                botResponses.push({ type: 'pave_info_card', sender: 'bot', id: `${botMessageIdBase}-paveinfocard` });
            }
            if (data?.flashcards?.length > 0) {
                const validFlashcards = data.flashcards.filter(fc => fc && fc.term && fc.definition);
                if (validFlashcards.length > 0) {
                    botResponses.push({ type: 'flashcard_display', sender: 'bot', flashcardsData: validFlashcards, id: `${botMessageIdBase}-flashcards` });
                }
            }
            if (data?.questions?.length > 0) {
                if (data.questions.length > 1) {
                    botResponses.push({ type: 'question_carousel', sender: 'bot', questionsData: data.questions.filter(q => q && q.alternativas && q.resposta_letra), id: `${botMessageIdBase}-carousel` });
                } else {
                    const q = data.questions[0];
                    if (q && q.alternativas && q.resposta_letra) {
                        botResponses.push({ type: 'question', sender: 'bot', questionData: q, id: `${botMessageIdBase}-q0` });
                    }
                }
            }
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

    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{ type: 'text', sender: 'bot', content: 'Que bom te ver por aqui! 👋 Eu posso buscar questões do PAVE pra você ou, se preferir, criar uma nova. É só pedir!', id: `bot-initial-${Date.now()}` }]);
        }
    }, []);

    const bottomNavItems = [
        { to: "/", icon: IconHome, label: "Início" },
        { to: "/calculadora", icon: IconCalculator, label: "Calculadora" },
        { to: "/chat", icon: IconChat, label: "Chat IA" },
        { to: "/banco-questoes", icon: IconBook, label: "Questões" },
        { type: 'button', onClick: () => setIsMoreMenuOpen(true), icon: IconEllipsisHorizontal, label: "Mais" },
    ];
    const moreMenuItems = [
        { to: "/questoes-salvas", icon: IconBookmark, label: "Questões Salvas" },
        { to: "/informacoes-pave", icon: IconDocumentText, label: "Info PAVE" },
    ];

    const handleAppziHelpClick = (e) => {
        e.preventDefault();
        if (window.appzi) {
            window.appzi.openWidget("5bbe131b-96af-48f5-986b-dc8cd1dbc158");
        } else {
            console.warn("Appzi não está carregado.");
        }
    };

    return (
        <div className="flex h-screen w-screen bg-bg-secondary">
            <aside className="hidden md:flex flex-col w-[240px] shrink-0 p-2">
                <div className="px-4 py-3 mb-4">
                    <span className="text-lg font-semibold text-brand-primary">Central PAVE</span>
                </div>
                <nav className="flex-grow">
                    <ul>
                        <NavLink to="/" icon={IconHome}>Início</NavLink>
                        <NavLink to="/calculadora" icon={IconCalculator}>Calculadora PAVE</NavLink>
                        <NavLink to="/banco-questoes" icon={IconBook}>Banco de Questões</NavLink>
                        <NavLink to="/chat" icon={IconChat}>Assistente IA</NavLink>
                    </ul>
                </nav>
                <div className="py-2">
                    <ul>
                        <NavLink to="/questoes-salvas" icon={IconBookmark} isFooter={true}>Questões Salvas</NavLink>
                        <li>
                            <a href="#" onClick={(e) => { e.preventDefault(); handleThemeToggle(); }} className="flex items-center p-2.5 mx-2.5 rounded-md transition-colors duration-200 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary">
                                {darkMode ? <IconSun className="w-4 h-4 mr-2.5 text-text-muted" /> : <IconMoon className="w-4 h-4 mr-2.5 text-text-muted" />}
                                <span className="text-sm">{darkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
                            </a>
                        </li>
                        <li>
                            <a href="#" data-az-l="5bbe131b-96af-48f5-986b-dc8cd1dbc158" onClick={handleAppziHelpClick} className="flex items-center p-2.5 mx-2.5 rounded-md transition-colors duration-200 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary">
                                <IconHelp className="w-4 h-4 mr-2.5 text-text-muted" />
                                <span className="text-sm">Ajuda</span>
                            </a>
                        </li>
                    </ul>
                    <div className="px-4 mt-2 text-center text-xs text-text-muted"> Desenvolvido por Pedro Alexis {new Date().getFullYear()} </div>
                </div>
            </aside>

            <main className="flex-grow h-full flex flex-col overflow-y-auto bg-bg-primary md:rounded-l-2xl">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/chat" element={<ChatInterface messages={messages} isLoading={isLoading} onSendMessage={handleSendMessage} />} />
                    <Route path="/banco-questoes" element={<QuestionHubPage />} />
                    <Route path="/banco-questoes/todas" element={<AllQuestionsPage />} />
                    <Route path="/banco-questoes/materias" element={<SubjectSelectionPage />} />
                    <Route path="/banco-questoes/materia/:subject" element={<QuestionListPage />} />
                    <Route path="/calculadora" element={<CalculadoraPage />} />
                    <Route path="/criar-questao" element={<CreateQuestionPage />} />
                    <Route path="/gerador-flashcards" element={<FlashcardGeneratorPage />} />
                    <Route path="/questoes-salvas" element={<SavedQuestionsPage />} />
                    <Route path="*" element={<div className="p-10 text-center"><h2>Página não encontrada (404)</h2></div>} />
                </Routes>
            </main>

            <BottomNavBar items={bottomNavItems} />

            <DevModelSelector isOpen={isDevMenuOpen} onClose={() => setIsDevMenuOpen(false)} currentModel={selectedModelName} onSelectModel={handleSelectModel} />
            <MoreMenu isOpen={isMoreMenuOpen} onClose={() => setIsMoreMenuOpen(false)} items={moreMenuItems} isDarkMode={darkMode} onToggleTheme={handleThemeToggle} />
        </div>
    );
}

function AppWrapper() {
    return (
        <SavedQuestionsProvider>
            <App />
        </SavedQuestionsProvider>
    );
}
export default AppWrapper;

// src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';

// --- Importar páginas/features ---
import HomePage from './pages/HomePage';
import ChatInterface from './features/chat/components/ChatInterface';
import QuestionBankPage from './features/bancoQuestoes/components/QuestionBankPage';
import CreateQuestionPage from './pages/CreateQuestionPage';
import SavedQuestionsPage from './features/savedQuestions/components/SavedQuestionsPage'; // Nova página
import CalculadoraPage from './features/calculadora/Calculadorapage.jsx';
import DevModelSelector from './components/dev/DevModelSelector'; // <<< NOVO IMPORT

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
import IconSparkles from './components/icons/IconSparkles'; // Novo ícone
import IconBookmark from './components/icons/IconBookmark'; // Ícone para Salvos
import IconEllipsisHorizontal from './components/icons/IconEllipsisHorizontal'; // Ícone para o "Mais"
import IconSun from './components/icons/IconSun'; // Ícone Sol para menu
import IconMoon from './components/icons/IconMoon'; // Ícone Lua para menu
import IconDocumentText from './components/icons/IconDocumentText'; // Ícone para Info PAVE
// Importar CSS global principal
import './style.css';
import MoreMenu from './components/common/MoreMenu'; // Componente para o menu "Mais"
// Importar o SavedQuestionsProvider
import { SavedQuestionsProvider } from './contexts/SavedQuestionsContext';

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

// --- Constante para o Modelo Padr��o ---
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-preview-05-20'; // Ou o que estiver em env.MODEL_NAME
const DEV_MODEL_STORAGE_KEY = 'dev_selected_gemini_model';

// --- Componente Principal App ---
function App() {
    // --- Estado do Chat ---
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // --- Estado do Tema ---
    // Modificada para priorizar localStorage, depois o sistema
    const getInitialThemePreference = () => {
        if (typeof window !== 'undefined') {
            const storedPreference = localStorage.getItem('theme-preference');
            if (storedPreference) {
                // Se existe preferência salva, usa ela
                return storedPreference === 'dark';
            }
            // Se não há preferência salva, usa o tema do sistema
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false; // Fallback para SSR ou ambientes sem window
    };
    const [darkMode, setDarkMode] = useState(getInitialThemePreference);

    // --- NOVO: Estados para o Menu de Desenvolvedor ---
    const [isDevMenuOpen, setIsDevMenuOpen] = useState(false);
    const [selectedModelName, setSelectedModelName] = useState(
        () => localStorage.getItem(DEV_MODEL_STORAGE_KEY) || DEFAULT_GEMINI_MODEL
    );
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false); // Reativado para o menu "Mais"

    // --- Hook e Lógica de Tema ---
    useDarkModeToggle(darkMode, setDarkMode); // Este hook aplica a classe e o data-attribute

    // handleThemeToggle agora explicitamente salva a preferência do usuário
    // no localStorage, indicando uma escolha manual.
    const handleThemeToggle = useCallback(() => {
        setDarkMode(prevMode => {
            const newMode = !prevMode;
            if (typeof window !== 'undefined') {
                localStorage.setItem('theme-preference', newMode ? 'dark' : 'light');
            }
            return newMode;
        });
    }, [setDarkMode]);

    // useEffect para escutar mudan��as no tema do sistema
    // S�� atualiza o tema do app se NENHUMA preferência manual foi salva.
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const matcher = window.matchMedia('(prefers-color-scheme: dark)');
            const listener = ({ matches: isDark }) => {
                // Só muda o tema do app se o usuário NÃO tiver feito uma escolha manual antes
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

    // --- NOVO: Efeito para o atalho do menu de desenvolvedor ---
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

    // --- NOVO: Handler para selecionar modelo e persistir ---
    const handleSelectModel = (modelId) => {
        setSelectedModelName(modelId);
        localStorage.setItem(DEV_MODEL_STORAGE_KEY, modelId);
        // Opcional: Fechar o menu ao selecionar
        // setIsDevMenuOpen(false);
    };

    // --- Handler para Enviar Mensagem ---
    const handleSendMessage = async (userQuery) => {
        const newUserMessage = { type: 'text', sender: 'user', content: userQuery, id: `user-${Date.now()}` }; // Adiciona ID
        const updatedMessages = [...messages, newUserMessage];
        setMessages(updatedMessages);
        setIsLoading(true);

        const HISTORY_LENGTH = 8;
        const historyForAPI = updatedMessages.slice(-HISTORY_LENGTH).map(msg => {
            if (!msg) return null;

            const role = msg.sender === 'user' ? 'user' : 'model';

            // Se a mensagem for do tipo flashcard_display, criar uma representação textual
            if (msg.type === 'flashcard_display' && msg.flashcardsData && msg.flashcardsData.length > 0) {
                let flashcardsText = "Flashcards Gerados (Termos):\n"; // Indicador
                msg.flashcardsData.forEach((fc, index) => {
                    flashcardsText += `  - ${fc.term}\n`; // Adiciona apenas o termo, formatado como item de lista
                });
                return { role: 'model', parts: [{ text: flashcardsText.trim() }] };
            }
            // Para mensagens de texto ou outros tipos que tenham conteúdo textual direto
            else if (typeof msg.content === 'string' && msg.content.trim() !== '') {
                return { role, parts: [{ text: msg.content }] };
            }
            // Para outros tipos de mensagens (como question_carousel, pave_info_card)
            // que não têm um 'content' textual direto para o histórico da IA,
            // e cujo comentário introdutório já foi adicionado como uma mensagem de texto separada.
            // Poder��amos adicionar uma representação textual deles também, se necessário no futuro.
            // Por agora, eles não adicionarão uma entrada separada ao historyForAPI além do seu comentário.
            return null;
        }).filter(Boolean);

        if (historyForAPI.length === 0 && userQuery) { setIsLoading(false); return; } // Pequena correção, só retorna se não houver userQuery também

        try {
            const requestBody = {
                history: historyForAPI,
                modelName: selectedModelName, // <<< NOVO: Envia o modelo selecionado
            };

            const response = await fetch('/api/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody), // <<< USA requestBody
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

            // 3. Adiciona Flashcards, se houver
            if (data?.flashcards?.length > 0) { // NOVO: Checa por flashcards
                // Validação simples dos dados dos flashcards
                const validFlashcards = data.flashcards.filter(fc => fc && fc.term && fc.definition);
                if (validFlashcards.length > 0) {
                    botResponses.push({
                        type: 'flashcard_display', // NOVO TIPO DE MENSAGEM
                        sender: 'bot',
                        flashcardsData: validFlashcards,
                        id: `${botMessageIdBase}-flashcards`
                    });
                }
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
            // (mas não se já tivermos um card de info, pois ele já é uma resposta)
            if (botResponses.length === 0 && response.ok && data?.displayCard !== "pave_info_recommendation") {
                botResponses.push({ type: 'text', sender: 'bot', content: 'Não tenho uma resposta espec��fica para isso no momento.', id: `${botMessageIdBase}-fallback` });
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
                { type: 'text', sender: 'bot', content: 'Que bom te ver por aqui! 👋 Eu posso buscar questões do PAVE pra você ou, se preferir, criar uma nova. É só pedir!', id: `bot-initial-${Date.now()}` }
            ]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Executa apenas na montagem inicial

    // Itens para a BottomNavBar (Mobile)
    const bottomNavItems = [
        { to: "/", icon: IconHome, label: "Início" },
        { to: "/calculadora", icon: IconCalculator, label: "Calculadora" }, // Calculadora de volta
        { to: "/chat", icon: IconChat, label: "Chat IA" },
        { to: "/banco-questoes", icon: IconBook, label: "Questões" },
        { type: 'button', onClick: () => setIsMoreMenuOpen(true), icon: IconEllipsisHorizontal, label: "Mais" },
    ];

    // Itens passados por prop para o menu "Mais"
    const moreMenuItems = [
        { to: "/informacoes-pave", icon: IconDocumentText, label: "Info PAVE" },
        // "Calculadora" e "Salvas" foram removidas daqui
    ];

    return (
        <div className="app-container" data-theme={darkMode ? 'dark' : 'light'}> {/* Garante que data-theme esteja no container principal */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <span className="logo-placeholder">Central PAVE</span> {/* Alterado para nome do app */}
                </div>
                <nav className="sidebar-nav">
                    <ul>
                        <NavLink to="/" icon={IconHome}>Início</NavLink>
                        <NavLink to="/calculadora" icon={IconCalculator}>Calculadora PAVE</NavLink>
                        <NavLink to="/chat" icon={IconChat}>Assistente IA</NavLink>
                        <NavLink to="/criar-questao" icon={IconSparkles}>Criar Questão</NavLink>
                        <NavLink to="/banco-questoes" icon={IconBook}>Banco de Questões</NavLink>
                        {/* "Info PAVE" foi removido da Sidebar */}
                    </ul>
                </nav>
                <div className="sidebar-footer">
                    <ul>
                        <li>
                            <a
                                href="#" 
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleThemeToggle();
                                }}
                            >
                                {darkMode ? <IconSun className="sidebar-icon-footer" /> : <IconMoon className="sidebar-icon-footer" />}
                                <span className="nav-link-text">{darkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
                            </a>
                        </li>
                        <li>
                            {/*
                          O atributo data-az-l precisa do ID do SURVEY ou WIDGET específico do Appzi.
                          A 'token' (rcbhq) é para o script principal, NÃO para data-az-l.
                          V�� ao seu painel Appzi, encontre o ID do survey/widget que quer abrir
                          e substitua o placeholder abaixo.
                        */}
                            <a
                                href="#" // Appzi deve lidar com o clique.
                                data-az-l="5bbe131b-96af-48f5-986b-dc8cd1dbc1dbc158" // <<< SUBSTITUA ESTE VALOR
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
                    {/* <Route path="/criar-questao" element={<CreateQuestionPage />} /> */}
                    <Route path="/questoes-salvas" element={<SavedQuestionsPage />} />
                    {/* <Route path="/informacoes-pave" element={<InformacoesPavePage />} />  Adicionar a rota quando o componente da página existir */}
                    <Route path="*" element={<div style={{ padding: '40px', textAlign: 'center' }}><h2>Página não encontrada (404)</h2></div>} />
                </Routes>
            </main>

            {/* O ThemeToggleButton fixo foi removido, pois o toggle agora está na sidebar (desktop) e MoreMenu (mobile) */}
            <BottomNavBar items={bottomNavItems} />

            {/* <<< NOVO: Renderiza o Seletor de Modelo >>> */}
            <DevModelSelector
                isOpen={isDevMenuOpen}
                onClose={() => setIsDevMenuOpen(false)}
                currentModel={selectedModelName}
                onSelectModel={handleSelectModel}
            />
            {/* Renderiza o Menu "Mais" - Este menu não será aberto pela BottomNavBar agora,
                 mas sim pelo botão "Mais" na BottomNavBar */}
            <MoreMenu
                isOpen={isMoreMenuOpen}
                onClose={() => setIsMoreMenuOpen(false)}
                items={moreMenuItems}
                isDarkMode={darkMode}
                onToggleTheme={handleThemeToggle}
            />
        </div>
    );
}

// Envolver App com SavedQuestionsProvider
function AppWrapper() {
    return (
        <SavedQuestionsProvider>
            <App />
        </SavedQuestionsProvider>
    );
}
export default AppWrapper;
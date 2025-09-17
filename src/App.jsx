// src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';

// --- Importar páginas/features ---
import HomePage from './pages/HomePage';
import ChatPage from './features/chat/ChatPage'; // <<< NOVO: Página que gerencia o chat
import QuestionBankPage from './features/bancoQuestoes/components/QuestionBankPage';
import SavedQuestionsPage from './features/savedQuestions/components/SavedQuestionsPage';
import CalculadoraPage from './features/calculadora/CalculadoraPage.jsx'; // Caminho atualizado
// As páginas de criação foram desativadas da navegação, mas os imports podem ser mantidos para o futuro
// import CreateQuestionPage from './features/questionCreator/CreateQuestionPage';
// import FlashcardGeneratorPage from './features/flashcardGenerator/FlashcardGeneratorPage';
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
// import IconSparkles from './components/icons/IconSparkles'; // Desativado
import IconEllipsisHorizontal from './components/icons/IconEllipsisHorizontal'; // Ícone para o "Mais"
import IconSun from './components/icons/IconSun'; // Ícone Sol para menu
import IconMoon from './components/icons/IconMoon'; // Ícone Lua para menu
import IconDocumentText from './components/icons/IconDocumentText'; // Ícone para Info PAVE
// Importar CSS global principal
import './style.css';
import MoreMenu from './components/common/MoreMenu'; // Componente para o menu "Mais"

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

// --- Constante para o Modelo Padrão ---
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-preview-05-20'; // Ou o que estiver em env.MODEL_NAME
const DEV_MODEL_STORAGE_KEY = 'dev_selected_gemini_model';

// --- Componente Principal App ---
function App() {
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

    // useEffect para escutar mudanças no tema do sistema
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
                        {/* <NavLink to="/criar-questao" icon={IconSparkles}>Criar Questão</NavLink> */}
                        {/* <NavLink to="/gerador-flashcards" icon={IconSparkles}>Gerador de Flashcards</NavLink> */}
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
                    <Route path="/chat" element={<ChatPage modelName={selectedModelName} />} />
                    <Route path="/banco-questoes" element={<QuestionBankPage />} />
                    <Route path="/calculadora" element={<CalculadoraPage />} />
                    {/* <Route path="/criar-questao" element={<CreateQuestionPage />} /> */}
                    {/* <Route path="/gerador-flashcards" element={<FlashcardGeneratorPage />} /> */}
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

export default App;
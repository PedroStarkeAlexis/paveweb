import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import QuestionHubPage from './pages/QuestionHubPage';
import AllQuestionsPage from './features/questions/components/AllQuestionsPage';
import QuestionListPage from './features/questions/components/QuestionListPage';
import SavedQuestionsPage from './features/saved/components/SavedQuestionsPage';
import CalculadoraPage from './features/calculadora/Calculadorapage.jsx';
import useDarkModeToggle from './hooks/useDarkModeToggle';
import BottomNavBar from './components/layout/BottomNavBar';
import MoreMenu from './components/layout/MoreMenu';
import { SavedQuestionsProvider } from './contexts/SavedQuestionsContext.jsx';
import IconHome from './components/icons/IconHome';
import IconCalculator from './components/icons/IconCalculator';
import IconBook from './components/icons/IconBook';
import IconHelp from './components/icons/IconHelp';
import IconBookmark from './components/icons/IconBookmark';
import IconEllipsisHorizontal from './components/icons/IconEllipsisHorizontal';
import IconSun from './components/icons/IconSun';
import IconMoon from './components/icons/IconMoon';
import IconDocumentText from './components/icons/IconDocumentText';
import './styles/style.css';

/**
 * Componente de link de navegação para a barra lateral.
 * Ele se estiliza como "ativo" se a rota atual corresponder ao seu destino.
 * @param {object} props - Propriedades do componente.
 * @param {string} props.to - O caminho de destino do link.
 * @param {React.ComponentType} props.icon - O componente de ícone a ser exibido.
 * @param {React.ReactNode} props.children - O texto do link.
 * @param {boolean} [props.isFooter=false] - Estilo alternativo para links no rodapé da sidebar.
 */
function NavLink({ to, icon, children, isFooter = false }) {
    const location = useLocation();
    const isActive = !to.startsWith('http') && (to === '/' ? location.pathname === to : location.pathname.startsWith(to));
    const linkClass = isActive ? 'active' : '';
    const iconClass = isFooter ? 'sidebar-icon-footer' : 'sidebar-icon';
    const IconElement = icon ? React.createElement(icon, { className: iconClass }) : null;

    // Se for um link externo, renderiza uma tag <a> normal.
    if (to.startsWith('http')) {
        return (
            <li>
                <a href={to} target="_blank" rel="noopener noreferrer" className="external-link">
                    {IconElement}
                    <span className="nav-link-text">{children}</span>
                </a>
            </li>
        );
    }

    // Para links internos, usa o componente <Link> do React Router.
    return (
        <li>
            <Link to={to} className={linkClass}>
                {IconElement}
                <span className="nav-link-text">{children}</span>
            </Link>
        </li>
    );
}

/**
 * Componente principal da aplicação.
 * Organiza a estrutura geral da página com a barra lateral (sidebar), o conteúdo principal,
 * a barra de navegação inferior (mobile) e o menu "Mais". Também gerencia o estado do tema (claro/escuro)
 * e define todas as rotas da aplicação.
 */
function App() {
    // Função para determinar o tema inicial com base nas preferências do usuário ou do sistema.
    const getInitialThemePreference = () => {
        if (typeof window !== 'undefined') {
            const storedPreference = localStorage.getItem('theme-preference');
            if (storedPreference) return storedPreference === 'dark';
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    };

    const [darkMode, setDarkMode] = useState(getInitialThemePreference);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

    // Hook customizado que aplica as classes e atributos de tema ao documento.
    useDarkModeToggle(darkMode, setDarkMode);

    // Função para alternar o tema e salvar a preferência no localStorage.
    const handleThemeToggle = useCallback(() => {
        setDarkMode(prevMode => {
            const newMode = !prevMode;
            if (typeof window !== 'undefined') {
                localStorage.setItem('theme-preference', newMode ? 'dark' : 'light');
            }
            return newMode;
        });
    }, [setDarkMode]);

    // Efeito que ouve mudanças no tema do sistema operacional do usuário.
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const matcher = window.matchMedia('(prefers-color-scheme: dark)');
            const listener = ({ matches: isDark }) => {
                // Só muda o tema se o usuário não tiver uma preferência salva.
                if (!localStorage.getItem('theme-preference')) {
                    setDarkMode(isDark);
                }
            };
            matcher.addEventListener('change', listener);
            return () => matcher.removeEventListener('change', listener);
        }
    }, [setDarkMode]);

    // Itens de navegação para a barra inferior (mobile).
    const bottomNavItems = [
        { to: "/calculadora", icon: IconCalculator, label: "Calculadora" },
        { to: "/banco-questoes", icon: IconBook, label: "Questões" },
        { type: 'button', onClick: () => setIsMoreMenuOpen(true), icon: IconEllipsisHorizontal, label: "Mais" },
    ];

    // Itens para o menu "Mais" (mobile).
    const moreMenuItems = [
        { to: "/questoes-salvas", icon: IconBookmark, label: "Questões Salvas" },
        { to: "/informacoes-pave", icon: IconDocumentText, label: "Info PAVE" },
    ];

    // Função para abrir o widget de ajuda da ferramenta Appzi (Não sei se vou manter).
    const handleAppziHelpClick = (e) => {
        e.preventDefault();
        if (window.appzi) {
            window.appzi.openWidget("5bbe131b-96af-48f5-986b-dc8cd1dbc158");
        } else {
            console.warn("Appzi não está carregado.");
        }
    };

    return (
        <div className="app-container" data-theme={darkMode ? 'dark' : 'light'}>
            <aside className="sidebar">
                <div className="sidebar-header">
                    <span className="logo-placeholder">Central PAVE</span>
                </div>
                <nav className="sidebar-nav">
                    <ul>
                        <NavLink to="/" icon={IconHome}>Início</NavLink>
                        <NavLink to="/calculadora" icon={IconCalculator}>Calculadora PAVE</NavLink>
                        <NavLink to="/banco-questoes" icon={IconBook}>Banco de Questões</NavLink>
                    </ul>
                </nav>
                <div className="sidebar-footer">
                    <ul>
                        <NavLink to="/questoes-salvas" icon={IconBookmark} isFooter={true}>Questões Salvas</NavLink>
                        <li>
                            <a href="#" onClick={(e) => { e.preventDefault(); handleThemeToggle(); }}>
                                {darkMode ? <IconSun className="sidebar-icon-footer" /> : <IconMoon className="sidebar-icon-footer" />}
                                <span className="nav-link-text">{darkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
                            </a>
                        </li>
                        <li>
                            <a href="#" data-az-l="5bbe131b-96af-48f5-986b-dc8cd1dbc158" onClick={handleAppziHelpClick}>
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
                    <Route path="/banco-questoes" element={<QuestionHubPage />} />
                    <Route path="/banco-questoes/busca" element={<AllQuestionsPage />} />
                    <Route path="/banco-questoes/materia/:subject" element={<QuestionListPage />} />
                    <Route path="/banco-questoes/ano/:year" element={<QuestionListPage />} />
                    <Route path="/calculadora" element={<CalculadoraPage />} />
                    <Route path="/questoes-salvas" element={<SavedQuestionsPage />} />
                    <Route path="*" element={<div style={{ padding: '40px', textAlign: 'center' }}><h2>Página não encontrada (404)</h2></div>} />
                </Routes>
            </main>

            <BottomNavBar items={bottomNavItems} />
            <MoreMenu isOpen={isMoreMenuOpen} onClose={() => setIsMoreMenuOpen(false)} items={moreMenuItems} isDarkMode={darkMode} onToggleTheme={handleThemeToggle} />
        </div>
    );
}

/**
 * Componente "Wrapper" que envolve a aplicação principal com o SavedQuestionsProvider.
 * Isso garante que qualquer componente dentro de App possa acessar o contexto de questões salvas.
 */
function AppWrapper() {
    return (
        <SavedQuestionsProvider>
            <App />
        </SavedQuestionsProvider>
    );
}
export default AppWrapper;

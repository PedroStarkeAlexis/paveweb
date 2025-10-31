import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';

// --- Importar páginas/features ---
import HomePage from './pages/HomePage';
import QuestionHubPage from './pages/QuestionHubPage';
import AllQuestionsPage from './features/bancoQuestoes/components/AllQuestionsPage';
import QuestionListPage from './features/bancoQuestoes/components/QuestionListPage';
import SavedQuestionsPage from './features/savedQuestions/components/SavedQuestionsPage';
import CalculadoraPage from './features/calculadora/Calculadorapage.jsx';

// --- Importar componentes comuns e hooks globais ---
import useDarkModeToggle from './hooks/useDarkModeToggle';
import BottomNavBar from './components/common/BottomNavBar';

// --- Importar Ícones SVG ---
import IconHome from './components/icons/IconHome';
import IconCalculator from './components/icons/IconCalculator';
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
function NavLink({ to, icon, children, isFooter = false }) {
    const location = useLocation();
    // CORREÇÃO: Lógica de 'isActive' ajustada
    // Para a home ('/'), a correspondência deve ser exata. Para as outras, `startsWith` funciona bem.
    const isActive = !to.startsWith('http') && (to === '/' ? location.pathname === to : location.pathname.startsWith(to));
    const linkClass = isActive ? 'active' : '';
    const iconClass = isFooter ? 'sidebar-icon-footer' : 'sidebar-icon';
    const IconElement = icon ? React.createElement(icon, { className: iconClass }) : null;

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

    return (
        <li>
            <Link to={to} className={linkClass}>
                {IconElement}
                <span className="nav-link-text">{children}</span>
            </Link>
        </li>
    );
}


// --- Componente Principal App ---
function App() {
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

    const bottomNavItems = [
        // { to: "/", icon: IconHome, label: "Início" },
        { to: "/calculadora", icon: IconCalculator, label: "Calculadora" },
        { to: "/banco-questoes", icon: IconBook, label: "Questões" },
        { type: 'button', onClick: () => setIsMoreMenuOpen(true), icon: IconEllipsisHorizontal, label: "Mais" },
    ];
    // CORREÇÃO: "Questões Salvas" adicionado ao menu mobile
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
                        {/* CORREÇÃO: Link "Questões Salvas" removido daqui */}
                    </ul>
                </nav>
                <div className="sidebar-footer">
                    <ul>
                        {/* CORREÇÃO: Link "Questões Salvas" adicionado ao footer */}
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

function AppWrapper() {
    return (
        <SavedQuestionsProvider>
            <App />
        </SavedQuestionsProvider>
    );
}
export default AppWrapper;

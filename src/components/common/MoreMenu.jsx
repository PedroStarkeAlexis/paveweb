import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './MoreMenu.css';
import IconHelp from '../icons/IconHelp'; // Ícone para Ajuda
import IconSun from '../icons/IconSun';   // Ícone Sol
import IconMoon from '../icons/IconMoon'; // Ícone Lua

const NavLinkItem = ({ to, icon: IconComponent, label, onClick }) => {
  const location = useLocation();
  const isActive = !to.startsWith('http') && location.pathname === to;

  if (to.startsWith('http')) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className="more-menu-item" onClick={onClick}>
        {IconComponent && <IconComponent className="more-menu-item-icon" />}
        <span className="more-menu-item-label">{label}</span>
      </a>
    );
  }

  return (
    <Link to={to} className={`more-menu-item ${isActive ? 'active' : ''}`} onClick={onClick}>
      {IconComponent && <IconComponent className="more-menu-item-icon" />}
      <span className="more-menu-item-label">{label}</span>
    </Link>
  );
};


function MoreMenu({ isOpen, onClose, items, isDarkMode, onToggleTheme }) {
  const handleAppziClick = (e) => {
    e.preventDefault(); // Previne navegação padrão
    // Para o Appzi, você precisa do ID do SURVEY ou WIDGET específico.
    // A 'token' (rcbhq) é para o script principal do Appzi.
    // Este data-az-l deve ser o ID do seu widget de ajuda/feedback.
    const appziWidgetId = "5bbe131b-96af-48f5-986b-dc8cd1dbc158"; // SUBSTITUA COM SEU ID

    if (window.appzi) {
      window.appzi.openWidget(appziWidgetId);
    } else {
      console.warn("Appzi não está carregado. Não é possível abrir o widget.");
    }
    onClose(); // Fecha o menu "Mais"
  };

  const handleThemeToggleClick = () => {
    onToggleTheme();
    // onClose(); // Opcional: fechar o menu ao mudar o tema
  };


  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="more-menu-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="more-menu-panel"
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "100%" }}
            transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()} // Evita fechar ao clicar no painel
          >
            <div className="more-menu-header">
              <h3 className="more-menu-title">Mais Opções</h3>
              <button onClick={onClose} className="more-menu-close-btn" aria-label="Fechar menu">
                {/* Ícone de Fechar (X) */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="more-menu-nav">
              {items.map(item => (
                <NavLinkItem
                  key={item.to}
                  to={item.to}
                  icon={item.icon}
                  label={item.label}
                  onClick={onClose} // Fecha o menu ao clicar em um item
                />
              ))}
              {/* Item de Mudar Tema - Agora antes de Ajuda */}
              <button className="more-menu-item more-menu-theme-toggle" onClick={handleThemeToggleClick}>
                {isDarkMode ? (
                  <IconSun className="more-menu-item-icon" />
                ) : (
                  <IconMoon className="more-menu-item-icon" />
                )}
                <span className="more-menu-item-label">Mudar para Modo {isDarkMode ? 'Claro' : 'Escuro'}</span>
              </button>
              {/* Item de Ajuda (Appzi) específico */}
              <a
                href="#" // Appzi lida com o clique
                className="more-menu-item"
                onClick={handleAppziClick} // Usa o handler customizado
              >
                <IconHelp className="more-menu-item-icon" />
                <span className="more-menu-item-label">Ajuda & Feedback</span>
              </a>

            </nav>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default MoreMenu;
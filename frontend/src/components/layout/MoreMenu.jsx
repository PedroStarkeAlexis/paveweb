import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'motion/react';
import './MoreMenu.css';
import IconHelp from '../icons/IconHelp'; // Ícone para Ajuda
import IconSun from '../icons/IconSun';   // Ícone Sol
import IconMoon from '../icons/IconMoon'; // Ícone Lua
import { triggerVibration } from '../../utils/vibration'; // Importa a função

const NavLinkItem = ({ to, icon: IconComponent, label, onClick }) => {
  const location = useLocation();
  const isActive = !to.startsWith('http') && location.pathname === to;

  const handleClick = () => {
    triggerVibration();
    if (onClick) onClick();
  };

  if (to.startsWith('http')) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className="more-menu-item" onClick={handleClick}>
        {IconComponent && <IconComponent className="more-menu-item-icon" />}
        <span className="more-menu-item-label">{label}</span>
      </a>
    );
  }

  return (
    <Link to={to} className={`more-menu-item ${isActive ? 'active' : ''}`} onClick={handleClick}>
      {IconComponent && <IconComponent className="more-menu-item-icon" />}
      <span className="more-menu-item-label">{label}</span>
    </Link>
  );
};


function MoreMenu({ isOpen, onClose, items, isDarkMode, onToggleTheme }) {
  const handleAppziClick = (e) => {
    e.preventDefault();
    triggerVibration();
    const appziWidgetId = "5bbe131b-96af-48f5-986b-dc8cd1dbc158"; // ID do widget Appzi

    if (window.appzi) {
        window.appzi.openWidget(appziWidgetId);
    } else {
        console.warn("Appzi não está carregado. Não é possível abrir o widget.");
    }
    onClose(); // Fecha o menu "Mais"
  };

  const handleThemeToggleClick = () => {
    triggerVibration();
    onToggleTheme();
    // onClose(); // Opcional: fechar o menu ao mudar o tema
  };

  const handleClose = () => {
    triggerVibration();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Motion.div
          className="more-menu-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          transition={{ duration: 0.2 }}
        >
          <Motion.div
            className="more-menu-panel"
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "100%" }}
            transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()} // Evita fechar ao clicar no painel
          >
            <div className="more-menu-header">
              <h3 className="more-menu-title">Mais Opções</h3>
              <button onClick={handleClose} className="more-menu-close-btn" aria-label="Fechar menu">
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
                  onClick={onClose} // A vibração já está no NavLinkItem
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
                onClick={handleAppziClick}
              >
                <IconHelp className="more-menu-item-icon" />
                <span className="more-menu-item-label">Ajuda & Feedback</span>
              </a>
            </nav>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}

export default MoreMenu;
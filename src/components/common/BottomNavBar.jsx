// src/components/common/BottomNavBar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './BottomNavBar.css';

const NavItem = ({ item }) => {
  const location = useLocation();

  // Se for um botão (como o "Mais")
  if (item.type === 'button') {
    const handleClick = (e) => {
      // vibração curta de 5ms quando suportado
      try {
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          navigator.vibrate(5);
        }
      } catch (err) {
        // nada - falha silente em ambientes onde `navigator` não existe
      }

      if (typeof item.onClick === 'function') {
        item.onClick(e);
      }
    };

    return (
      <button
        className="bottom-nav-item bottom-nav-button" // Adiciona classe específica para estilização se necessário
        onClick={handleClick}
        aria-label={item.label}
      >
        {item.icon && <item.icon className="bottom-nav-icon" />}
        <span className="bottom-nav-label">{item.label}</span>
      </button>
    );
  }

  // Se for um link normal
  const isActive = location.pathname === item.to;

  return (
    <Link to={item.to} className={`bottom-nav-item ${isActive ? 'active' : ''}`}>
      {item.icon && <item.icon className="bottom-nav-icon" />}
      <span className="bottom-nav-label">{item.label}</span>
    </Link>
  );
};

function BottomNavBar({ items }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav className="bottom-nav-bar">
      {items.map((item) => (
        <NavItem key={item.label || item.to} item={item} />
      ))}
    </nav>
  );
}

export default BottomNavBar;
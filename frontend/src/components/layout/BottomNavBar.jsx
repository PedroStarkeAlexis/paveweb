// src/components/layout/BottomNavBar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './BottomNavBar.css';
import { triggerVibration } from '../../utils/vibration'; // Importa a função

const NavItem = ({ item }) => {
  const location = useLocation();

  const handleClick = (e) => {
    triggerVibration(); // Aciona a vibração

    if (item.type === 'button' && typeof item.onClick === 'function') {
      item.onClick(e);
    }
  };

  // Se for um botão (como o "Mais")
  if (item.type === 'button') {
    return (
      <button
        className="bottom-nav-item bottom-nav-button"
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
    <Link to={item.to} className={`bottom-nav-item ${isActive ? 'active' : ''}`} onClick={handleClick}>
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
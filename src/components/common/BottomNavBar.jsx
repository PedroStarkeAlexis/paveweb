// src/components/common/BottomNavBar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './BottomNavBar.css';

const NavItem = ({ to, icon: IconComponent, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to} className={`bottom-nav-item ${isActive ? 'active' : ''}`}>
      {/* CORREÇÃO: Renderiza o IconComponent diretamente se ele existir */}
      {IconComponent && <IconComponent className="bottom-nav-icon" />}
      <span className="bottom-nav-label">{label}</span>
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
        <NavItem
          key={item.to}
          to={item.to}
          icon={item.icon} // Passa o componente SVG (referência da função/classe)
          label={item.label}
        />
      ))}
    </nav>
  );
}

export default BottomNavBar;
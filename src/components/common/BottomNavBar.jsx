// src/components/common/BottomNavBar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './BottomNavBar.css';

const NavItem = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to} className={`bottom-nav-item ${isActive ? 'active' : ''}`}>
      <span className="bottom-nav-icon">{icon}</span>
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
          icon={item.icon}
          label={item.label}
        />
      ))}
    </nav>
  );
}

export default BottomNavBar;
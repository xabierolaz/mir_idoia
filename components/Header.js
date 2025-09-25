import React, { useState } from 'react';

export default function Header({ currentMode, onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  
  const menuItems = [
    { id: 'home', label: 'Inicio', icon: '🏠' },
    { id: 'history', label: 'Historial', icon: '📋' },
    { id: 'stats', label: 'Estadísticas', icon: '📊' },
    { id: 'settings', label: 'Configuración', icon: '⚙️' },
    { id: 'about', label: 'Acerca de', icon: 'ℹ️' },
  ];
  
  const handleMenuClick = (mode) => {
    setMenuOpen(false);
    if (mode !== currentMode) {
      onNavigate(mode);
    }
  };
  
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-brand">
          <h1>🏥 OPE Medicina Preventiva</h1>
        </div>
        
        <nav className="header-nav desktop-nav">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${currentMode === item.id ? 'active' : ''}`}
              onClick={() => handleMenuClick(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className="menu-icon">
            {menuOpen ? '✕' : '☰'}
          </span>
        </button>
      </div>
      
      {menuOpen && (
        <div className="mobile-menu">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`mobile-menu-item ${currentMode === item.id ? 'active' : ''}`}
              onClick={() => handleMenuClick(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
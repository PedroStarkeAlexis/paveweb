// src/pages/HomePage.jsx
import React from 'react';
// Opcional: Importar um CSS específico se precisar de estilo
// import './HomePage.css';

function HomePage() {
  return (
    <div className="home-page-container" style={{ padding: '40px', textAlign: 'center' }}>
      <h1>Bem-vindo!</h1>
      <p>Selecione uma das opções na barra lateral para começar.</p>
      {/* Você pode adicionar logos, links rápidos ou outras informações aqui */}
    </div>
  );
}

export default HomePage;
// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // Importar
import App from './App.jsx';
import './style.css'; // Seu CSS

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* Envolver App */}
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
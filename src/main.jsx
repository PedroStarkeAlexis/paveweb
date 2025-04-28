// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // <<< VERIFIQUE ESTE IMPORT
import App from './App.jsx';
import './style.css'; // Seu CSS

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* <<< VERIFIQUE SE ESTÁ ENVOLVENDO O APP */}
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
// src/features/calculadora/components/Passos.jsx
import React from 'react';
import './Passos.css'; // Importa o CSS com as classes prefixadas

function Passos({ etapaAtual }) {
  // Mapeia as etapas da calculadora (1 a 4: Etapa 1, 2, 3, Redação)
  const etapasVisuais = [1, 2, 3, 4];

  return (
    // --- MUDANÇA 1: Adiciona prefixo na div container ---
    <div className="calc-passos">
      {etapasVisuais.map((etapaNumero) => {
         // --- MUDANÇA 2: Adiciona prefixo na classe base ---
         let classes = "calc-passo";
         if (etapaAtual === etapaNumero) {
           // --- MUDANÇA 3: Adiciona prefixo na classe ativa ---
           classes += " calc-ativo";
         } else if (etapaNumero < etapaAtual) {
           // --- MUDANÇA 4: Adiciona prefixo na classe completa ---
           classes += " calc-completo";
         }

         // O span agora usará as classes prefixadas contidas na variável 'classes'
         return (
           <span key={etapaNumero} className={classes}>
             {/* Exibe o número da etapa */}
             {etapaNumero}
           </span>
         );
      })}
    </div>
  );
}

export default Passos;
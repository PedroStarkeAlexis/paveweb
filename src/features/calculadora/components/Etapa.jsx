// src/features/calculadora/components/Etapa.jsx
import React from 'react';
// --- Import Atualizado ---
import { TOTAL_QUESTOES } from '../constants'; // Caminho relativo dentro de features/calculadora
import './Etapa.css'; // Adicionaremos no próximo passo

function Etapa({ etapa, acertos, ignoradas, onAcertosChange, onIgnoradasChange, nota, porcentagem, error }) {
  // ... (resto do código JSX igual, lembrando de prefixar classes depois)
  return (
    <div className="calc-etapa"> {/* Classe será prefixada */}
      <h2>Etapa {etapa}</h2>
      {/* ... inputs e labels ... */}
       <label htmlFor={`acertos${etapa}`}>Acertos:</label>
       <input
         type="number" id={`acertos${etapa}`} min="0" max={TOTAL_QUESTOES} value={acertos}
         onChange={(e) => onAcertosChange(etapa, e.target.value)} aria-invalid={!!error}
         aria-describedby={error ? `error-msg-${etapa}` : undefined}
       /> <br/>
       <label htmlFor={`ignoradas${etapa}`}>I.R.:</label>
       <input
         type="number" id={`ignoradas${etapa}`} min="0" max={TOTAL_QUESTOES} value={ignoradas}
         onChange={(e) => onIgnoradasChange(etapa, e.target.value)} aria-invalid={!!error}
         aria-describedby={error ? `error-msg-${etapa}` : undefined}
       /><br/>
      {error && <div id={`error-msg-${etapa}`} className="error-message">{error}</div>} {/* Classe será prefixada */}
      <div className="calc-nota-etapa-individual">Nota: {nota.toFixed(2)}</div> {/* Classe será prefixada */}
      <div className="calc-porcentagem-etapa">Contribuição para a nota final: {porcentagem.toFixed(2)}%</div> {/* Classe será prefixada */}
    </div>
  );
}
export default Etapa;
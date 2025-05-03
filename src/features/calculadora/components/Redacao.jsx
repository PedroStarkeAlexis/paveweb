// src/features/calculadora/components/Redacao.jsx
import React from "react";
// --- Import Atualizado ---
import { NOTA_MIN_REDAÇÃO, NOTA_MAX_REDAÇÃO } from '../constants'; // Caminho relativo
import './Redacao.css'; // Adicionaremos se necessário

function Redacao({ notaRedacao, onRedacaoChange, incluirRedacao, onIncluirRedacao, redacaoRespondida }) {
  // ... (resto do código JSX igual, lembrando de prefixar classes depois)
  return (
    <div className="calc-etapa"> {/* Classe será prefixada */}
      {!redacaoRespondida && ( /* ... botões sim/não ... */
        <>
          <p>Deseja incluir a nota da redação?</p>
          <button onClick={() => onIncluirRedacao(true)}>Sim</button>
          <button onClick={() => onIncluirRedacao(false)}>Não</button>
        </>
      )}
      {incluirRedacao && redacaoRespondida && ( /* ... input da nota ... */
        <div id="secaoRedacao" className="calc-ativo secaoRedacao"> {/* Classe será prefixada */}
          <label htmlFor="notaRedacao">Nota da Redação:</label>
          <input
            type="number" id="notaRedacao" min={NOTA_MIN_REDAÇÃO} max={NOTA_MAX_REDAÇÃO}
            step="0.1" value={notaRedacao} onChange={(e) => onRedacaoChange(e.target.value)}
          />
        </div>
      )}
      {redacaoRespondida && !incluirRedacao && ( /* ... mensagem não inclui ... */
           <p>A nota da redação não será incluída no cálculo final.</p>
       )}
    </div>
  );
}
export default Redacao;
// src/features/calculadora/components/telas/TelaDesempenhoEtapa1.jsx
import React from 'react';
import { TOTAL_QUESTOES } from '../../constants'; // Importa constante relevante
import './TelaDesempenho.css'; // <<< Criaremos um CSS compartilhado para as telas de desempenho

function TelaDesempenhoEtapa1({ onChange, values, errors }) {
  const etapaNumero = 2;
  const acertosKey = `acertosE${etapaNumero}`;
  const ignoradasKey = `ignoradasE${etapaNumero}`;
  const errorKey = `etapa${etapaNumero}`;

  return (
    <div className="calc-tela-desempenho">
      {/* Título da Tela - pode ser ajustado */}
      <h2 className="calc-tela-titulo">Como foi seu desempenho na <strong>Etapa {etapaNumero}</strong>?</h2>
      <p className="calc-tela-subtitulo">Informe seus acertos e respostas ignoradas (I.R.).</p>

      <div className="calc-input-group">
        {/* Input Acertos */}
        <div className="calc-input-item">
          <label htmlFor={acertosKey}>Acertos</label>
          <input
            type="number"
            id={acertosKey}
            name={acertosKey} // Útil para forms mais complexos
            value={values[acertosKey]}
            onChange={(e) => onChange(etapaNumero, 'acertos', e.target.value)}
            min="0"
            max={TOTAL_QUESTOES}
            placeholder="0" // Placeholder
            aria-invalid={!!errors[errorKey]} // Indica erro para acessibilidade
            aria-describedby={errors[errorKey] ? `${errorKey}-error` : undefined}
            className="calc-input-desempenho"
          />
        </div>

        {/* Input Ignoradas */}
        <div className="calc-input-item">
          <label htmlFor={ignoradasKey}>I.R.</label>
          <input
            type="number"
            id={ignoradasKey}
            name={ignoradasKey}
            value={values[ignoradasKey]}
            onChange={(e) => onChange(etapaNumero, 'ignoradas', e.target.value)}
            min="0"
            max={TOTAL_QUESTOES}
            placeholder="0" // Placeholder
            aria-invalid={!!errors[errorKey]} // Indica erro para acessibilidade
            aria-describedby={errors[errorKey] ? `${errorKey}-error` : undefined}
            className="calc-input-desempenho"
          />
        </div>
      </div>

      {/* Mensagem de Erro */}
      {errors[errorKey] && (
        <p id={`${errorKey}-error`} className="calc-error-message" role="alert">
          {errors[errorKey]}
        </p>
      )}
    </div>
  );
}

export default TelaDesempenhoEtapa1;
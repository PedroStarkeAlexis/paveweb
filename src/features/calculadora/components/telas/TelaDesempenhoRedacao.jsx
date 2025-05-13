// src/features/calculadora/components/telas/TelaDesempenhoRedacao.jsx
import React from 'react';
import { NOTA_MIN_REDAÇÃO, NOTA_MAX_REDAÇÃO } from '../../constants';
import './TelaDesempenhoRedacao.css';
import '../shared/NextStepButton.css'; // <<< Importar CSS do botão

// <<< Recebe as novas props para o botão
function TelaDesempenhoRedacao({ onChange, values, onNextStep, isNextStepDisabled, nextStepText }) {
  const { incluirRedacao, notaRedacao } = values;

  return (
    <div className="calc-tela-redacao">
      {/* ... (Título, subtítulo, botões Sim/Não, input de nota sem alterações) ... */}
      <h2 className="calc-tela-titulo">Deseja incluir a <strong>Redação</strong>?</h2>
      <p className="calc-tela-subtitulo">Selecione "Sim" para incluir a nota estimada (0 a {NOTA_MAX_REDAÇÃO}) no cálculo.</p>

      {/* Botões de Seleção Sim/Não */}
      <div className="calc-redacao-botoes">
        <button
          className={`calc-botao-opcao ${incluirRedacao === true ? 'active' : ''}`}
          onClick={() => onChange('incluirRedacao', true)}
        >
          Sim
        </button>
        <button
          className={`calc-botao-opcao ${incluirRedacao === false ? 'active' : ''}`}
          onClick={() => onChange('incluirRedacao', false)}
        >
          Não
        </button>
      </div>

      {/* Input da Nota (Condicional) */}
      {incluirRedacao === true && (
        <div className="calc-redacao-input-container">
          <label htmlFor="notaRedacao">Qual foi sua nota?</label>
          <input
            type="number"
            id="notaRedacao"
            name="notaRedacao"
            value={notaRedacao}
            onChange={(e) => onChange('notaRedacao', e.target.value)}
            min={NOTA_MIN_REDAÇÃO}
            max={NOTA_MAX_REDAÇÃO}
            step="0.1"
            placeholder="Sua nota"
            className="calc-input-redacao"
          />
        </div>
      )}

      {/* Mensagem se escolher Não */}
      {incluirRedacao === false && (
        <p className="calc-redacao-info">Ok, a nota da redação não será considerada.</p>
      )}


      {/* <<< Adiciona o botão Próxima Etapa aqui >>> */}
      <div className="calc-next-step-button-container">
        <button
          className="calc-step-next-button" // <<< Usa a nova classe CSS
          onClick={onNextStep}
          disabled={isNextStepDisabled}
        >
          {nextStepText}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /> </svg>
        </button>
      </div>
    </div>
  );
}

export default TelaDesempenhoRedacao;
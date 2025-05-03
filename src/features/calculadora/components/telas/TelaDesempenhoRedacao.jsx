// src/features/calculadora/components/telas/TelaDesempenhoRedacao.jsx
import React from 'react';
import { NOTA_MIN_REDAÇÃO, NOTA_MAX_REDAÇÃO } from '../../constants';
import './TelaDesempenhoRedacao.css'; // <<< Criaremos um CSS específico

function TelaDesempenhoRedacao({ onChange, values }) {
  const { incluirRedacao, notaRedacao } = values; // Pega os valores do objeto 'values'

  return (
    <div className="calc-tela-redacao">
      <h2 className="calc-tela-titulo">Você fez a <strong>Redação</strong>?</h2>
      <p className="calc-tela-subtitulo">Selecione "Sim" para incluir sua nota (0 a {NOTA_MAX_REDAÇÃO}) no cálculo.</p>

      {/* Botões de Seleção Sim/Não */}
      <div className="calc-redacao-botoes">
        <button
          // Aplica classe 'active' se for a opção selecionada
          className={`calc-botao-opcao ${incluirRedacao === true ? 'active' : ''}`}
          onClick={() => onChange('incluirRedacao', true)} // Chama onChange com o campo e o valor true
        >
          Sim
        </button>
        <button
          className={`calc-botao-opcao ${incluirRedacao === false ? 'active' : ''}`}
          onClick={() => onChange('incluirRedacao', false)} // Chama onChange com o campo e o valor false
        >
          Não
        </button>
      </div>

      {/* Input da Nota (Condicional) */}
      {/* Mostra apenas se 'incluirRedacao' for true */}
      {incluirRedacao === true && (
        <div className="calc-redacao-input-container">
          <label htmlFor="notaRedacao">Qual foi sua nota?</label>
          <input
            type="number"
            id="notaRedacao"
            name="notaRedacao"
            value={notaRedacao}
            onChange={(e) => onChange('notaRedacao', e.target.value)} // Chama onChange com o campo e o valor do input
            min={NOTA_MIN_REDAÇÃO}
            max={NOTA_MAX_REDAÇÃO}
            step="0.1" // Permite decimais
            placeholder="Sua nota"
            className="calc-input-redacao"
          />
           {/* Poderia adicionar validação/mensagem de erro específica aqui se necessário */}
        </div>
      )}

       {/* Mensagem se escolher Não */}
       {incluirRedacao === false && (
           <p className="calc-redacao-info">Ok, a nota da redação não será considerada.</p>
       )}

    </div>
  );
}

export default TelaDesempenhoRedacao;
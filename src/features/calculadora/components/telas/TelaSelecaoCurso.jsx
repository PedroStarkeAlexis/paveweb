// src/features/calculadora/components/telas/TelaSelecaoCurso.jsx
import React from 'react';
import './TelaSelecaoCurso.css'; // <<< Criaremos este CSS

function TelaSelecaoCurso({ onChange, selectedId, cursos }) {

  return (
    <div className="calc-tela-selecao-curso">
      <h2 className="calc-tela-titulo">Qual <strong>curso</strong> você gostaria de ingressar?</h2>
      <p className="calc-tela-subtitulo">Selecione o curso desejado na UFPel.</p>

      <div className="calc-select-group">
        <label htmlFor="cursoSelect">Curso</label>
        <select
          id="cursoSelect"
          name="cursoId" // Nome correspondente no estado do pai
          value={selectedId || ''} // Controlado pelo estado do pai (usa '' se selectedId for null/undefined)
          onChange={onChange} // Chama o handler passado por props (handleCursoChange)
          className="calc-select-dropdown"
        >
          {/* Opção padrão desabilitada */}
          <option value="" disabled>-- Selecione um curso --</option>

          {/* Mapeia a lista de cursos recebida por props */}
          {cursos && cursos.map((curso) => (
            <option key={curso.id} value={curso.id}>
              {curso.nome} - ({curso.turno}) {/* Exibe nome e turno */}
            </option>
          ))}
          {/* Mensagem se a lista de cursos não carregar */}
           {!cursos || cursos.length === 0 && (
               <option value="" disabled>Carregando cursos...</option>
           )}
        </select>
         {/* Poderia adicionar um segundo select para "Turno" ou "Concorrência" se necessário,
             mas o protótipo e o JSON atual não exigem isso separadamente.
             O turno já está associado ao curso. */}
      </div>

      {/* Espaço reservado para possíveis erros de seleção ou informações adicionais */}
      <div className="calc-select-feedback">
        {/* Exemplo: {error && <p className="error">{error}</p>} */}
      </div>
    </div>
  );
}

export default TelaSelecaoCurso;
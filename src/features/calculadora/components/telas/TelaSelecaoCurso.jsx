// src/features/calculadora/components/telas/TelaSelecaoCurso.jsx
import React from 'react';
import './TelaSelecaoCurso.css';
import '../shared/NextStepButton.css'; // <<< Importar CSS do botão

// <<< Recebe as novas props para o botão
function TelaSelecaoCurso({ onChange, selectedId, cursos, isLoading, error, onNextStep, isNextStepDisabled, nextStepText }) {

  let selectContent;
  if (isLoading) {
    selectContent = <option value="" disabled>Carregando cursos...</option>;
  } else if (error) {
    selectContent = <option value="" disabled>Erro ao carregar cursos</option>;
  } else {
    selectContent = (
      <>
        <option value="" disabled>-- Selecione um curso --</option>
        {cursos && cursos.map((curso) => (
          <option key={curso.id} value={curso.id}>
            {curso.nome} - ({curso.turno})
          </option>
        ))}
        {(!cursos || cursos.length === 0) && !isLoading && !error && (
          <option value="" disabled>Nenhum curso dispon��vel</option>
        )}
      </>
    );
  }


  return (
    <div className="calc-tela-selecao-curso">
      {/* ... (Título, subtítulo, select sem altera����es) ... */}
      <h2 className="calc-tela-titulo">Qual <strong>curso</strong> você gostaria de ingressar?</h2>
      <p className="calc-tela-subtitulo">Selecione o curso desejado na UFPel.</p>

      <div className="calc-select-group">
        <label htmlFor="cursoSelect">Curso</label>
        <select
          id="cursoSelect"
          name="cursoId"
          value={selectedId || ''}
          onChange={onChange}
          className="calc-select-dropdown"
          disabled={isLoading || !!error} // Desabilita se carregando ou erro
        >
          {selectContent}
        </select>
      </div>

      <div className="calc-select-feedback">
        {/* Mostra erro se houver */}
        {error && <p className="calc-error-message" style={{ textAlign: 'center' }}>{error}</p>}
      </div>

      {/* <<< Adiciona o botão Próxima Etapa aqui >>> */}
      <div className="calc-next-step-button-container">
        <button
          className="calc-step-next-button" // <<< Usa a nova classe CSS
          onClick={onNextStep}
          disabled={isNextStepDisabled || isLoading || !!error} // Desabilita tamb��m se carregando ou erro
        >
          {nextStepText}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /> </svg>
        </button>
      </div>
    </div>
  );
}

export default TelaSelecaoCurso;
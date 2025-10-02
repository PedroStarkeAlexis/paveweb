// src/features/calculadora/components/telas/TelaSelecaoCurso.jsx
import React from 'react';
import '../../styles/WizardButtons.css';
import './TelaSelecaoCurso.css';

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
          <option value="" disabled>Nenhum curso disponível</option>
        )}
      </>
    );
  }

  return (
    <div className="calc-tela-selecao-curso">
      <h2 className="calc-tela-titulo">Qual curso você gostaria de ingressar?</h2>
      <p className="calc-tela-subtitulo">Selecione o curso desejado na UFPel.</p>

      <div className="wizard-buttons-container">
        <div className="wizard-input-group">
          <label htmlFor="cursoSelect" className="wizard-input-label">Curso</label>
          <select
            id="cursoSelect"
            name="cursoId"
            value={selectedId || ''}
            onChange={onChange}
            className="wizard-select-field"
            disabled={isLoading || !!error}
          >
            {selectContent}
          </select>
        </div>

        {error && (
          <p className="wizard-error-message" style={{ textAlign: 'center', marginTop: '16px' }}>
            {error}
          </p>
        )}
      </div>

      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <button
          className="wizard-primary-button"
          onClick={onNextStep}
          disabled={isNextStepDisabled || isLoading || !!error}
        >
          {nextStepText}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /> </svg>
        </button>
      </div>
    </div>
  );
}

export default TelaSelecaoCurso;
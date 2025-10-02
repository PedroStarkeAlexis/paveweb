// src/features/calculadora/components/telas/TelaSelecaoCurso.jsx
import React from 'react';
import { triggerVibration } from '../../../../utils/vibration';
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

      {/* Primary action button is rendered globally in CalculadoraPage to avoid duplication */}
    </div>
  );
}

export default TelaSelecaoCurso;
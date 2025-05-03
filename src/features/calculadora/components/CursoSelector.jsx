// src/components/CursoSelector.js
import React from 'react';
import './CursoSelector.css'; // Create this CSS file for styling

function CursoSelector({
  cursos,
  cursoSelecionadoId,
  onCursoChange,
  loading,
  error
}) {

  // Determine content based on loading/error state
  let content;
  if (loading) {
    content = <p className="calc-curso-feedback">Carregando cursos...</p>;
  } else if (error) {
    content = <p className="calc-curso-feedback error">{error}</p>;
  } else if (cursos.length === 0) {
     content = <p className="calc-curso-feedback">Nenhum curso encontrado.</p>;
  } else {
    content = (
      <select
        id="cursoSelect"
        value={cursoSelecionadoId || ''} // Controlled component
        onChange={onCursoChange}
        className="calc-curso-select-dropdown"
        aria-labelledby="cursoSelectLabel" // Link label to select
      >
        <option value="" disabled>-- Selecione um curso --</option>
        {cursos.map((curso) => (
          <option key={curso.id} value={curso.id}>
            {curso.nome}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="calc-curso-selector-container">
      <label htmlFor="cursoSelect" id="cursoSelectLabel" className="calc-curso-select-label">
        Curso Desejado (Opcional):
      </label>
      {content}
    </div>
  );
}

export default CursoSelector;
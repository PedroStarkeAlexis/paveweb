import React from 'react';

function Filters({ anos, materias, etapas, filterValues, onFilterChange }) {
  const handleSelectChange = (event) => {
    const { name, value } = event.target;
    onFilterChange(name, value === 'todos' ? null : value); // Envia null se 'todos' for selecionado
  };

  return (
    <div className="filters-container">
      <select name="ano" value={filterValues.ano || 'todos'} onChange={handleSelectChange}>
        <option value="todos">Todos os Anos</option>
        {anos.map(ano => <option key={ano} value={ano}>{ano}</option>)}
      </select>

      <select name="materia" value={filterValues.materia || 'todos'} onChange={handleSelectChange}>
        <option value="todos">Todas as Matérias</option>
        {materias.map(materia => <option key={materia} value={materia}>{materia}</option>)}
      </select>

      <select name="etapa" value={filterValues.etapa || 'todos'} onChange={handleSelectChange}>
        <option value="todos">Todas as Etapas</option>
        {etapas.map(etapa => <option key={etapa} value={etapa}>{etapa}</option>)}
      </select>
    </div>
  );
}

export default Filters;
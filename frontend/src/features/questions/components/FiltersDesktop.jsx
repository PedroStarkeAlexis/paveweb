import React from 'react';
import './FiltersDesktop.css';

function FiltersDesktop({ filters, onFilterChange, options }) {

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value, page: 1 });
  };
  
  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value === 'todos' ? null : value, page: 1 });
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // A busca já acontece no onChange do input, mas podemos manter para o 'Enter'
    onFilterChange(filters);
  };
  
  return (
    <form className="filters-desktop-container" onSubmit={handleSearchSubmit}>
      <div className="filter-item">
        <label htmlFor="query">Palavra-chave</label>
        <input
          type="search"
          id="query"
          name="query"
          placeholder="Busque por um termo..."
          value={filters.query || ''}
          onChange={handleInputChange}
        />
      </div>
      <div className="filter-item">
        <label htmlFor="materia">Disciplina</label>
        <select id="materia" name="materia" value={filters.materia || 'todos'} onChange={handleSelectChange}>
          <option value="todos">Todas</option>
          {options.materias.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <div className="filter-item">
        <label htmlFor="ano">Ano</label>
        <select id="ano" name="ano" value={filters.ano || 'todos'} onChange={handleSelectChange}>
          <option value="todos">Todos</option>
          {options.anos.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div className="filter-item">
        <label htmlFor="etapa">Etapa</label>
        <select id="etapa" name="etapa" value={filters.etapa || 'todos'} onChange={handleSelectChange}>
          <option value="todos">Todas</option>
          {/* Assumindo que as opções de etapa virão de options.etapas */}
          {options.etapas && options.etapas.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>
    </form>
  );
}

export default FiltersDesktop;

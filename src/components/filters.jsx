import React from 'react';

function Filters({ anos, materias, etapas, filterValues, onFilterChange }) {
  const handleSelectChange = (event) => {
    const { name, value } = event.target;
    // Envia null se "todos" for selecionado, caso contrário envia o valor
    onFilterChange(name, value === 'todos' ? null : value);
  };

  // Helper para criar opções do select
  const renderOptions = (options, valueKey = item => item, labelKey = item => item) => {
    return options.map(item => (
      <option key={valueKey(item)} value={valueKey(item)}>
        {labelKey(item)}
      </option>
    ));
  };

  return (
    // Usa a classe principal fornecida no seu CSS
    <div className="filter-section">

      {/* Grupo de Filtro para Ano */}
      <div className="filter-group">
        <label htmlFor="filter-ano">Ano</label>
        <select
          id="filter-ano"
          name="ano"
          value={filterValues.ano || 'todos'} // Usa 'todos' se o valor for null/undefined
          onChange={handleSelectChange}
          // Removida a classe 'filter-select' se ela não for mais necessária
          // className="filter-select"
        >
          <option value="todos">Todos os Anos</option>
          {renderOptions(anos)}
        </select>
      </div>

      {/* Grupo de Filtro para Matéria */}
      <div className="filter-group">
         <label htmlFor="filter-materia">Matéria</label>
        <select
          id="filter-materia"
          name="materia"
          value={filterValues.materia || 'todos'}
          onChange={handleSelectChange}
          // className="filter-select"
        >
          <option value="todos">Todas as Matérias</option>
          {renderOptions(materias)}
        </select>
      </div>

      {/* Grupo de Filtro para Etapa */}
      <div className="filter-group">
         <label htmlFor="filter-etapa">Etapa</label>
        <select
          id="filter-etapa"
          name="etapa"
          value={filterValues.etapa || 'todos'}
          onChange={handleSelectChange}
          // className="filter-select"
        >
          <option value="todos">Todas as Etapas</option>
          {/* Ajusta o texto da opção para Etapa */}
          {renderOptions(etapas, etapa => etapa, etapa => `${etapa}ª Etapa`)}
        </select>
      </div>

      {/* Botão Aplicar (Opcional - remova se não quiser) */}
      {/* Se você quiser um botão para aplicar os filtros em vez de aplicar a cada mudança: */}
      {/* <button id="apply-filters-btn">Aplicar Filtros</button> */}

    </div>
  );
}

export default Filters;
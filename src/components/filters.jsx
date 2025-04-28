import React from 'react';

// Recebe as opções (anos, materias, etapas), os valores atuais (filterValues)
// e a função para chamar quando um filtro muda (onFilterChange)
function Filters({ anos, materias, etapas, filterValues, onFilterChange }) {

  // Handler genérico para quando o valor de um <select> muda
  const handleSelectChange = (event) => {
    const { name, value } = event.target;
    // Chama a função passada pelo pai, enviando o nome do filtro e o valor
    // Converte "todos" de volta para null para o estado do pai, facilitando a lógica de filtro
    onFilterChange(name, value === 'todos' ? null : value);
  };

  return (
    // Container principal dos filtros com a classe CSS fornecida
    <div className="filter-section">

      {/* Grupo para o filtro de Matéria */}
      <div className="filter-group">
        <label htmlFor="filter-materia">Matéria:</label>
        <select
          id="filter-materia"
          name="materia"
          value={filterValues.materia || 'todos'} // Controlado pelo estado do pai, usa 'todos' se null
          onChange={handleSelectChange}
        >
          <option value="todos">Todas</option>
          {/* Mapeia as matérias disponíveis para criar as opções */}
          {materias.map(materia => <option key={materia} value={materia}>{materia}</option>)}
        </select>
      </div>

      {/* Grupo para o filtro de Ano */}
      <div className="filter-group">
        <label htmlFor="filter-ano">Ano:</label>
        <select
          id="filter-ano"
          name="ano"
          value={filterValues.ano || 'todos'} // Controlado pelo estado do pai
          onChange={handleSelectChange}
        >
          <option value="todos">Todos</option>
          {/* Mapeia os anos disponíveis para criar as opções */}
          {anos.map(ano => <option key={ano} value={ano}>{ano}</option>)}
        </select>
      </div>

      {/* Grupo para o filtro de Etapa */}
      <div className="filter-group">
        <label htmlFor="filter-etapa">Etapa:</label>
        <select
          id="filter-etapa"
          name="etapa"
          value={filterValues.etapa || 'todos'} // Controlado pelo estado do pai
          onChange={handleSelectChange}
        >
          <option value="todos">Todas</option>
          {/* Mapeia as etapas disponíveis para criar as opções */}
          {etapas.map(etapa => <option key={etapa} value={etapa}>{etapa}</option>)}
        </select>
      </div>

      {/* O botão "Filtrar" foi removido daqui */}

    </div>
  );
}

export default Filters;
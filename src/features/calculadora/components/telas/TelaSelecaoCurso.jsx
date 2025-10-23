// src/features/calculadora/components/telas/TelaSelecaoCurso.jsx
import React, { useState, useMemo } from 'react';
import { triggerVibration } from '../../../../utils/vibration';
import '../../styles/WizardButtons.css';
import './TelaSelecaoCurso.css';

function TelaSelecaoCurso({ onChange, selectedId, cursos, isLoading, error, onNextStep, isNextStepDisabled, nextStepText }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar cursos baseado no termo de busca
  const filteredCursos = useMemo(() => {
    if (!cursos || cursos.length === 0) return [];
    if (!searchTerm.trim()) return cursos;
    
    const term = searchTerm.toLowerCase().trim();
    return cursos.filter(curso => 
      curso.nome.toLowerCase().includes(term) || 
      (curso.tipo && curso.tipo.toLowerCase().includes(term))
    );
  }, [cursos, searchTerm]);

  // Ordenar alfabeticamente
  const sortedCursos = useMemo(() => {
    return [...filteredCursos].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [filteredCursos]);

  const handleCursoClick = (cursoId) => {
    triggerVibration(5);
    // Simular evento onChange com estrutura esperada
    onChange({ target: { name: 'cursoId', value: cursoId } });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="calc-tela-selecao-curso">
      <h2 className="calc-tela-titulo">Qual curso você gostaria de ingressar?</h2>
      <p className="calc-tela-subtitulo">Selecione o curso desejado na UFPel.</p>

      <div className="curso-selection-container">
        {/* Input de Busca */}
        <div className="curso-search-box">
          <input
            type="text"
            placeholder="🔍 Buscar curso..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="curso-search-input"
            disabled={isLoading || !!error}
          />
        </div>

        {/* Lista de Cursos */}
        {isLoading ? (
          <div className="curso-loading">
            <div className="hub-loading-spinner"></div>
            <p>Carregando cursos...</p>
          </div>
        ) : error ? (
          <div className="curso-error">
            <p>❌ {error}</p>
          </div>
        ) : sortedCursos.length === 0 ? (
          <div className="curso-empty">
            {searchTerm ? (
              <p>🔍 Nenhum curso encontrado para "{searchTerm}"</p>
            ) : (
              <p>📚 Nenhum curso disponível</p>
            )}
          </div>
        ) : (
          <div className="curso-grid-container">
            <div className="curso-grid">
              {sortedCursos.map((curso, index) => (
                <button
                  key={`${curso.id}-${index}`}
                  className={`curso-card ${selectedId === curso.id ? 'selected' : ''}`}
                  onClick={() => handleCursoClick(curso.id)}
                  type="button"
                >
                  <div className="curso-card-content">
                    <h3 className="curso-card-nome">{curso.nome}</h3>
                    <span className="curso-card-turno">{curso.tipo || 'N/D'}</span>
                  </div>
                  {selectedId === curso.id && (
                    <div className="curso-card-check">✓</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Primary action button is rendered globally in CalculadoraPage to avoid duplication */}
    </div>
  );
}

export default TelaSelecaoCurso;
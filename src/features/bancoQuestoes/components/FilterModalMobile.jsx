import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './FilterModalMobile.css';

function FilterModalMobile({ isOpen, onClose, initialFilters, onApplyFilters, options }) {
  const [localFilters, setLocalFilters] = useState(initialFilters);

  useEffect(() => {
    setLocalFilters(initialFilters);
  }, [initialFilters, isOpen]);

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({ ...prev, [name]: value === 'todos' ? null : value }));
  };
  
  const handleClear = () => {
    setLocalFilters({ ano: null, materia: null, etapa: null });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onApplyFilters(localFilters);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="filter-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="filter-modal-content"
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="filter-modal-header">
              <h2>Filtros</h2>
              <div>
                <button type="button" onClick={handleClear} className="clear-button">Limpar</button>
                <button type="button" onClick={onClose} className="close-button">&times;</button>
              </div>
            </header>
            <form className="filter-modal-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="materia-mobile">Disciplina</label>
                <select id="materia-mobile" name="materia" value={localFilters.materia || 'todos'} onChange={handleSelectChange}>
                  <option value="todos">Todas as disciplinas</option>
                  {options.materias.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="ano-mobile">Ano</label>
                <select id="ano-mobile" name="ano" value={localFilters.ano || 'todos'} onChange={handleSelectChange}>
                  <option value="todos">Todos os anos</option>
                  {options.anos.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="etapa-mobile">Etapa</label>
                <select id="etapa-mobile" name="etapa" value={localFilters.etapa || 'todos'} onChange={handleSelectChange}>
                  <option value="todos">Todas as etapas</option>
                  {/* Assumindo que as opções de etapa virão de options.etapas */}
                  {options.etapas && options.etapas.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <footer className="filter-modal-footer">
                <button type="submit" className="apply-filters-button">Aplicar Filtros</button>
              </footer>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default FilterModalMobile;

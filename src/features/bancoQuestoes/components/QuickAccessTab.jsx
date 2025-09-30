import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  hover: { scale: 1.03, transition: { duration: 0.2 } },
  tap: { scale: 0.98 }
};

function QuickAccessTab({ onSelectFilter }) {
  const [filterOptions, setFilterOptions] = useState({ materias: [], anos: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await fetch('/api/get-filter-options');
        if (!response.ok) throw new Error('Falha ao carregar opções de filtro');
        const data = await response.json();
        setFilterOptions({
          materias: data.materias || [],
          anos: data.anos || []
        });
      } catch (err) {
        console.error('Erro ao buscar opções de filtro:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFilterOptions();
  }, []);

  const handleMateriaClick = (materia) => {
    onSelectFilter({ materia });
  };

  const handleAnoClick = (ano) => {
    onSelectFilter({ ano });
  };

  return (
    <div className="quick-access-content">
      {/* Carrossel: Navegar por Matéria */}
      <section className="hub-carousel-section">
        <h2 className="hub-section-title">Navegar por Matéria</h2>
        {isLoading && <div className="hub-loading">Carregando matérias...</div>}
        {error && <div className="hub-error">Erro ao carregar: {error}</div>}
        {!isLoading && !error && (
          <div className="hub-carousel">
            {filterOptions.materias.length === 0 ? (
              <p className="hub-empty-message">Nenhuma matéria disponível</p>
            ) : (
              filterOptions.materias.map((materia, index) => (
                <motion.div
                  key={materia}
                  className="hub-carousel-card"
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  whileTap="tap"
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleMateriaClick(materia)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="hub-carousel-link">
                    <div className="hub-carousel-icon">📚</div>
                    <h3>{materia}</h3>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </section>

      {/* Carrossel: Navegar por Ano */}
      <section className="hub-carousel-section">
        <h2 className="hub-section-title">Navegar por Ano</h2>
        {isLoading && <div className="hub-loading">Carregando anos...</div>}
        {error && <div className="hub-error">Erro ao carregar: {error}</div>}
        {!isLoading && !error && (
          <div className="hub-carousel">
            {filterOptions.anos.length === 0 ? (
              <p className="hub-empty-message">Nenhum ano disponível</p>
            ) : (
              filterOptions.anos.map((ano, index) => (
                <motion.div
                  key={ano}
                  className="hub-carousel-card"
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  whileTap="tap"
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleAnoClick(ano)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="hub-carousel-link">
                    <div className="hub-carousel-icon">📅</div>
                    <h3>{ano}</h3>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default QuickAccessTab;

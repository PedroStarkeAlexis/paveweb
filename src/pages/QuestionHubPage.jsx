import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './QuestionHubPage.css';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  hover: { scale: 1.03, transition: { duration: 0.2 } },
  tap: { scale: 0.98 }
};

function QuestionHubPage() {
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

  return (
    <div className="question-hub-container">
      <header className="question-hub-header">
        <h1>Banco de Questões</h1>
        <p>Explore as questões do PAVE da maneira que preferir.</p>
      </header>

      {/* Card de Busca Avançada em Destaque */}
      <motion.div
        className="hub-featured-card"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        whileTap="tap"
      >
        <Link to="/banco-questoes/busca" className="hub-featured-link">
          <div className="hub-featured-icon">🔍</div>
          <div className="hub-featured-text">
            <h2>Busca Avançada</h2>
            <p>Utilize filtros poderosos para encontrar exatamente o que você procura</p>
          </div>
        </Link>
      </motion.div>

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
                >
                  <Link to={`/banco-questoes/materia/${encodeURIComponent(materia)}`} className="hub-carousel-link">
                    <div className="hub-carousel-icon">�</div>
                    <h3>{materia}</h3>
                  </Link>
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
                >
                  <Link to={`/banco-questoes/ano/${ano}`} className="hub-carousel-link">
                    <div className="hub-carousel-icon">�</div>
                    <h3>{ano}</h3>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default QuestionHubPage;

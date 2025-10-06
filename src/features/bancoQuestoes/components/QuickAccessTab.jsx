import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  hover: { scale: 1.03, transition: { duration: 0.2 } },
  tap: { scale: 0.98 }
};

// Mapeamento de matérias para emojis — editar/adicionar conforme necessário
const materiaEmojiMap = {
  Biologia: '🧬',
  Filosofia: '🤔',
  Física: '⚛️',
  Geografia: '🗺️',
  História: '🏛️',
  'Literatura Brasileira': '📚',
  'Língua Estrangeira': '🗣️',
  'Língua Portuguesa': '✍️',
  Matemática: '➗',
  Química: '⚗️',
  Sociologia: '👥',

};

function getEmojiForMateria(materia) {
  if (!materia) return '📘';
  // procura correspondência exata
  if (materiaEmojiMap[materia]) return materiaEmojiMap[materia];
  // procura correspondências parciais (ex: "Matemática Avançada" -> Matemática)
  const lower = materia.toLowerCase();
  for (const key of Object.keys(materiaEmojiMap)) {
    if (lower.includes(key.toLowerCase())) return materiaEmojiMap[key];
  }
  // fallback aleatório/neutral
  return '📚';
}

function ordinalize(number) {
  // recebe string ou número; tenta parse
  const n = typeof number === 'number' ? number : parseInt(String(number).replace(/[^0-9]/g, ''), 10);
  if (Number.isNaN(n)) return String(number);
  // para português, 1ª, 2ª, 3ª, 4ª ... (todas no feminino 'etapa')
  return `${n}ª`;
}

function QuickAccessTab({ onSelectFilter }) {
  const [filterOptions, setFilterOptions] = useState({ materias: [], anos: [], etapas: [] });
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
          anos: data.anos || [],
          etapas: data.etapas || []
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

  const handleEtapaClick = (etapa) => {
    onSelectFilter({ etapa });
  };

  const handleAnoClick = (ano) => {
    onSelectFilter({ ano });
  };

  // Se está carregando, mostra apenas o loading centralizado
  if (isLoading) {
    return (
      <div className="quick-access-content">
        <div className="hub-loading-fullpage">
          <div className="hub-loading-spinner"></div>
          <p>Carregando conteúdo...</p>
        </div>
      </div>
    );
  }

  // Se houve erro, mostra apenas a mensagem de erro
  if (error) {
    return (
      <div className="quick-access-content">
        <div className="hub-error-fullpage">
          <p>Erro ao carregar conteúdo: {error}</p>
          <button onClick={() => window.location.reload()}>Tentar Novamente</button>
        </div>
      </div>
    );
  }

  return (
    <div className="quick-access-content">
      {/* Carrossel: Navegar por Matéria */}
      <section className="hub-carousel-section">
        <h2 className="hub-section-title">Navegar por Matéria</h2>
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
                  <div className="hub-carousel-icon">{getEmojiForMateria(materia)}</div>
                  <h3>{materia}</h3>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* Carrossel: Navegar por Etapa */}
      <section className="hub-carousel-section">
        <h2 className="hub-section-title">Navegar por Etapa</h2>
        <div className="hub-carousel">
          {filterOptions.etapas.length === 0 ? (
            <p className="hub-empty-message">Nenhuma etapa disponível</p>
          ) : (
            filterOptions.etapas.map((etapa, index) => (
              <motion.div
                key={etapa}
                className="hub-carousel-card"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                whileTap="tap"
                transition={{ delay: index * 0.05 }}
                onClick={() => handleEtapaClick(etapa)}
                style={{ cursor: 'pointer' }}
              >
                <div className="hub-carousel-link" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div className="hub-carousel-ordinal" style={{ fontSize: 28, fontWeight: 700 }}>{ordinalize(etapa)}</div>
                  <div className="hub-carousel-ordinal-label" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Etapa</div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* Carrossel: Navegar por Ano */}
      <section className="hub-carousel-section">
        <h2 className="hub-section-title">Navegar por Ano</h2>
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
                  <div className="hub-carousel-year" style={{ fontSize: 28, fontWeight: 700 }}>{ano}</div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default QuickAccessTab;

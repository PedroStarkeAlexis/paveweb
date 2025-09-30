import React from 'react';
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
  return (
    <div className="question-hub-container">
      <header className="question-hub-header">
        <h1>Banco de Questões</h1>
        <p>Explore as questões do PAVE da maneira que preferir.</p>
      </header>
      <div className="question-hub-options-grid">
        <motion.div
          className="hub-option-card"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          whileTap="tap"
          transition={{ delay: 0.1 }}
        >
          <Link to="/banco-questoes/materias" className="hub-option-link">
            <div className="hub-option-icon">📚</div>
            <div className="hub-option-text">
              <h2>Buscar por Matéria</h2>
              <p>Navegue pelas disciplinas e veja todas as questões disponíveis para cada uma.</p>
            </div>
          </Link>
        </motion.div>
        
        <motion.div
          className="hub-option-card"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          whileTap="tap"
          transition={{ delay: 0.25 }}
        >
          <Link to="/banco-questoes/todas" className="hub-option-link">
            <div className="hub-option-icon">🔍</div>
            <div className="hub-option-text">
              <h2>Busca Avançada</h2>
              <p>Use filtros detalhados de ano, matéria e palavras-chave para encontrar exatamente o que precisa.</p>
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

export default QuestionHubPage;

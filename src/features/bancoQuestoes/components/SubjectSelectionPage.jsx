import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import './SubjectSelectionPage.css';

const gridVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1 },
  hover: { scale: 1.05, backgroundColor: 'var(--bg-tertiary)' },
};

const SubjectCard = ({ subjectName }) => (
  <motion.div variants={cardVariants} whileHover="hover">
    <Link to={`/banco-questoes/materia/${encodeURIComponent(subjectName)}`} className="subject-card">
      <span className="subject-card-name">{subjectName}</span>
      <span className="subject-card-arrow">→</span>
    </Link>
  </motion.div>
);

function SubjectSelectionPage() {
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/get-filter-options');
        if (!response.ok) throw new Error('Falha ao carregar matérias');
        const data = await response.json();
        setSubjects(data.materias || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  return (
    <div className="subject-selection-container">
      <header className="subject-selection-header">
        <h1>Buscar por Matéria</h1>
        <p>Selecione uma matéria para ver todas as questões relacionadas.</p>
      </header>

      {isLoading && <div className="loading-message">Carregando matérias...</div>}
      {error && <div className="error-message">{error}</div>}
      
      {!isLoading && !error && (
        <motion.div 
          className="subjects-grid"
          variants={gridVariants}
          initial="hidden"
          animate="show"
        >
          {subjects.map(subject => (
            <SubjectCard key={subject} subjectName={subject} />
          ))}
        </motion.div>
      )}
    </div>
  );
}

export default SubjectSelectionPage;
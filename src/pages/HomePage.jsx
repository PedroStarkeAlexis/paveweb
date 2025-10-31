import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react'; // Importar motion
import './HomePage.css';

const IconWrapper = ({ children, label }) => (
  <div className="home-feature-icon-wrapper" aria-label={label}>
    {children}
  </div>
);

// Variantes de animação para o container dos cards (efeito dominó)
const gridContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15, // Atraso entre a animação de cada card filho
    },
  },
};

// Variantes de animação para cada card individual
const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 }, // Começa invisível, um pouco abaixo e menor
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
  hover: {
    scale: 1.04, // Aumenta um pouco
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)", // Sombra mais pronunciada
    // borderCcolor: "var(--brand-primary)", // Opcional: mudar borda no hover
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
  tap: {
    scale: 0.98, // Diminui ao clicar
  }
};


const FeatureCard = ({ to, icon, title, description }) => {
  return (
    // Transformado em motion.div e aplicando as variantes
    <motion.div
      className="home-feature-card"
      variants={cardVariants}
      // initial, animate são herdados do pai se não especificados,
      // mas podemos definir aqui se quisermos um comportamento específico
      // initial="hidden" // Já será controlado pelo stagger do pai
      // animate="show"
      whileHover="hover"
      whileTap="tap"
    >
      <Link to={to} className="home-feature-card-link-overlay" aria-label={`Acessar ${title}`} />
      <div className="home-feature-card-content">
        {icon}
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </motion.div>
  );
};

const ComingSoonCard = () => {
  return (
    // Também pode ser animado
    <motion.div
      className="home-coming-soon-card"
      variants={cardVariants} // Reutiliza as mesmas variantes ou cria novas se quiser um efeito diferente
      initial="hidden" // Animação individual para este card, já que não está no grid stagger
      animate="show"
      whileHover="hover"
    >
      <div className="home-coming-soon-icon-wrapper">
        <span role="img" aria-label="Foguete">🚀</span>
      </div>
      <h3>Novidades a Caminho!</h3>
      <p>Ainda mais ferramentas e recursos para facilitar seus estudos para o PAVE. Fique de olho!</p>
    </motion.div>
  );
};

function HomePage() {
  return (
    <motion.div // Container principal também pode ter uma animação de fade-in simples
      className="home-page-container-revised"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <header className="home-header-revised">
        <h1>Sua Central de Estudos PAVE</h1>
        <p className="home-subtitle-revised">
          Todas as ferramentas que você precisa para se preparar e alcançar a aprovação!
        </p>
      </header>

      {/* Aplicando variantes ao container da grade para o efeito dominó */}
      <motion.main
        className="home-features-grid-revised"
        variants={gridContainerVariants}
        initial="hidden"
        animate="show"
      >
        <FeatureCard
          to="/banco-questoes"
          icon={<IconWrapper label="Banco de Questões">📚</IconWrapper>}
          title="Banco de Questões PAVE"
          description="Explore e filtre manualmente o acervo completo de questões de edições anteriores do PAVE."
        />
        <FeatureCard
          to="/calculadora"
          icon={<IconWrapper label="Calculadora PAVE">🧮</IconWrapper>}
          title="Calculadora de Nota PAVE"
          description="Simule sua nota final no PAVE e veja suas chances de aprovação no curso desejado."
        />
      </motion.main>

      <section className="home-single-card-section">
        <ComingSoonCard />
      </section>
    </motion.div>
  );
}

export default HomePage;
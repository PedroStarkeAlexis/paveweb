import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion'; // Importar motion

const IconWrapper = ({ children, label }) => (
  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-gray-700 flex items-center justify-center text-2xl text-emerald-600 dark:text-emerald-400 mb-4" aria-label={label}>
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
    borderColor: "var(--brand-primary)", // Opcional: mudar borda no hover
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
    <motion.div // Este é o card em si
      variants={cardVariants}
      whileHover="hover"
      whileTap="tap"
      className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 flex flex-col text-left h-full shadow-sm"
    >
      <Link to={to} className="absolute inset-0 z-10" aria-label={`Acessar ${title}`} />
      <div className="relative z-20 flex flex-col flex-grow">
        {icon}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed flex-grow">{description}</p>
      </div>
    </motion.div>
  );
};

const ComingSoonCard = () => {
  return (
    // Também pode ser animado
    <motion.div // Este é o card em si
      variants={cardVariants} // Reutiliza as mesmas variantes ou cria novas se quiser um efeito diferente
      initial="hidden" // Animação individual para este card, já que não está no grid stagger
      animate="show"
      whileHover="hover"
      className="bg-blue-50 dark:bg-gray-800 text-center p-8 rounded-2xl max-w-2xl w-full shadow-sm border border-blue-200 dark:border-gray-700"
    >
      <div className="w-16 h-16 rounded-full bg-white/50 dark:bg-gray-700/50 flex items-center justify-center text-3xl text-blue-600 dark:text-blue-400 mx-auto mb-4">
        <span role="img" aria-label="Foguete">🚀</span>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Novidades a Caminho!</h3>
      <p className="text-gray-600 dark:text-gray-400">Ainda mais ferramentas e recursos para facilitar seus estudos para o PAVE. Fique de olho!</p>
    </motion.div>
  );
};

function HomePage() {
  return (
    <motion.div
      className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 overflow-y-auto h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100 mb-3">Sua Central de Estudos PAVE</h1>
        <p className="max-w-3xl mx-auto text-lg text-gray-600 dark:text-gray-300">
          Todas as ferramentas que você precisa para se preparar e alcançar a aprovação!
        </p>
      </header>

      <motion.main
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full"
        variants={gridContainerVariants}
        initial="hidden"
        animate="show"
      >
        <FeatureCard
          to="/chat"
          icon={<IconWrapper label="Assistente IA">💬</IconWrapper>}
          title="Chat e Busca IA"
          description="Converse com a IA sobre o PAVE ou use a busca inteligente para encontrar questões específicas."
        />
        <FeatureCard
          to="/criar-questao"
          icon={<IconWrapper label="Gerador de Questões IA">✨</IconWrapper>}
          title="Gerador de Questões"
          description="Crie questões inéditas sobre qualquer t��pico ou matéria no estilo do PAVE."
        />
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

      <section className="w-full flex justify-center mt-16">
        <ComingSoonCard />
      </section>
    </motion.div>
  );
}

export default HomePage;
import React from 'react';
import { Link as RouterLink } from 'react-router-dom'; // Renomeado para evitar conflito se houver
import { motion } from 'framer-motion';
import IconDocumentText from '../../../components/icons/IconDocumentText';
import './InfoPaveCard.css'; // Usaremos este CSS atualizado

const PAVE_INFO_PAGE_URL = "/informacoes-pave"; // Exemplo de rota interna
// const PAVE_INFO_PAGE_URL = "https://link.externo/pave-info"; // Exemplo de link externo

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

function InfoPaveCard() {
  const isExternalLink = PAVE_INFO_PAGE_URL.startsWith('http');

  const LinkComponent = isExternalLink ? 'a' : RouterLink;
  const linkProps = isExternalLink
    ? { href: PAVE_INFO_PAGE_URL, target: '_blank', rel: 'noopener noreferrer' }
    : { to: PAVE_INFO_PAGE_URL };

  return (
    // O wrapper continua útil para alinhamento dentro do chat-box
    <div className="info-pave-card-chat-wrapper">
      <motion.div
        className="info-pave-card-home-style"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover={{ y: -5, boxShadow: "0 8px 20px rgba(0, 0, 0, 0.08)" }}
        transition={{ duration: 0.2 }}
      >
        {/* Link invisível para acessibilidade e clique no card todo */}
        <LinkComponent {...linkProps} className="info-pave-card-overlay-link" aria-label="Acessar página de informações do PAVE" />

        <div className="info-pave-card-content-main">
          <div className="info-pave-card-icon-wrapper-home-style">
            <IconDocumentText className="info-pave-icon-home-style" />
          </div>
          <div className="info-pave-card-text-content">
            <h3 className="info-pave-card-title-home-style">Tudo sobre o PAVE UFPel</h3>
            <p className="info-pave-card-text-home-style">
              Acesse nossa central de informações para editais, datas,
              conteúdo programático e todas as regras do processo seletivo.
            </p>
          </div>
        </div>
        <div className="info-pave-card-footer-home-style">
          <LinkComponent {...linkProps} className="info-pave-card-cta-home-style">
            Ver Detalhes
            {/* Opcional: ícone de seta */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="cta-arrow-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </LinkComponent>
        </div>
      </motion.div>
    </div>
  );
}

export default InfoPaveCard;
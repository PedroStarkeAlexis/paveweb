import React from 'react';
import { Link } from 'react-router-dom'; // Se a página de info for interna
import IconDocumentText from '../../../components/icons/IconDocumentText'; // Importar o ícone
import './InfoPaveCard.css';

// URL da futura página de informações do PAVE
// Poderia vir de uma config ou ser hardcoded por enquanto
const PAVE_INFO_PAGE_URL = "/informacoes-pave"; // Exemplo de rota interna
// const PAVE_INFO_PAGE_URL = "https://link.externo/pave-info"; // Exemplo de link externo

function InfoPaveCard() {
  const isExternalLink = PAVE_INFO_PAGE_URL.startsWith('http');

  return (
    <div className="info-pave-card-wrapper"> {/* Wrapper para alinhar no chat */}
      <div className="info-pave-card">
        <div className="info-pave-card-icon-area">
          <IconDocumentText className="info-pave-icon" />
        </div>
        <div className="info-pave-card-content">
          <h3 className="info-pave-card-title">Informações Oficiais PAVE UFPel</h3>
          <p className="info-pave-card-text">
            Para detalhes completos sobre o PAVE, incluindo editais, datas de inscrição,
            conteúdo programático e regras, recomendamos visitar nossa página oficial de informações.
          </p>
          {isExternalLink ? (
            <a
              href={PAVE_INFO_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="info-pave-card-button"
            >
              Acessar Página de Informações
            </a>
          ) : (
            <Link to={PAVE_INFO_PAGE_URL} className="info-pave-card-button">
              Acessar Página de Informações
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default InfoPaveCard;
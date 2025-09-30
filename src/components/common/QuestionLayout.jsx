import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css'; // Import KaTeX CSS
import './QuestionLayout.css'; // Import do CSS específico do componente
import { useSavedQuestions } from '../../hooks/useSavedQuestions';
import IconBookmark from '../icons/IconBookmark';
import IconBookmarkFilled from '../icons/IconBookmarkFilled';
import IconEllipsisHorizontal from '../icons/IconEllipsisHorizontal';

const markdownComponents = {
  blockquote: ({ ...props }) => <div className="question-reference" {...props} />
};

const CorpoBloco = ({ bloco }) => {
  switch (bloco.tipo) {
    case 'texto':
    case 'texto_markdown':
      return (
        <ReactMarkdown 
          remarkPlugins={[remarkGfm, remarkMath]} 
          rehypePlugins={[rehypeKatex]}
          components={markdownComponents}
        >
          {bloco.conteudo_markdown || bloco.conteudo}
        </ReactMarkdown>
      );
    case 'imagem':
      return (
        <figure className="context-block context-image">
          <img 
            src={bloco.url_imagem || bloco.url} 
            alt={bloco.alt_text || bloco.legenda_markdown || 'Imagem de apoio da questão'} 
          />
          {(bloco.legenda_markdown || bloco.legenda) && (
            <figcaption>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {bloco.legenda_markdown || bloco.legenda}
              </ReactMarkdown>
            </figcaption>
          )}
        </figure>
      );
    default:
      return null;
  }
};

function QuestionLayoutInternal({ itemProva: questionData, isInsideCarousel = false }) {
  if (!questionData) {
    return null; // Retorna nulo se a questão for inválida
  }
  
  const questionId = questionData.id;
  
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState({});
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const { addSavedQuestion, removeSavedQuestion, isQuestionSaved } = useSavedQuestions();

  const {
    ano = null, etapa = null, materia = "Indefinida", topico = "Indefinido",
    corpo_questao = [], alternativas = [], 
    gabarito = null, resposta_letra = null, // suporte para ambos os nomes
    id = questionData?.id || questionId
  } = questionData || {};

  // Use gabarito se disponível, senão resposta_letra para compatibilidade
  const respostaCorreta = gabarito || resposta_letra;

  const isCurrentlySaved = isQuestionSaved(id.toString());

  useEffect(() => {
    setAnswered(false);
    setFeedback({});
    setShowDropdown(false);
  }, [questionId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const handleAlternativeClick = (clickedLetter) => {
    if (answered) return;
    setAnswered(true);
    const isCorrect = clickedLetter === respostaCorreta;
    setFeedback({
      [clickedLetter]: isCorrect ? 'correct-choice' : 'incorrect-choice',
    });
  };

  const handleShowAnswerClick = () => {
    if (answered) return;
    setAnswered(true);
    setFeedback({});
    setShowDropdown(false);
  };

  const handleSaveToggle = (e) => {
    e.stopPropagation();
    if (isCurrentlySaved) {
      removeSavedQuestion(id.toString());
    } else {
      addSavedQuestion(id.toString());
    }
    setShowDropdown(false);
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  const sourceTag = ano
    ? (<span key="src" className="question-tag pave-tag">PAVE {ano}</span>)
    : (corpo_questao.some(b => b.conteudo_markdown?.toLowerCase().includes("ia")) || !ano ?
      <span key="src" className="question-tag generated-ai-tag">Gerada por IA✨</span>
      : <span key="src" className="question-tag">Outra Fonte</span>);

  const tags = [sourceTag, etapa ? <span key="etapa" className="question-tag">Etapa {etapa}</span> : null, materia ? <span key="materia" className="question-tag">{materia}</span> : null, topico ? <span key="topico" className="question-tag">{topico}</span> : null].filter(Boolean);

  const menuComponent = !isInsideCarousel && (
    <div className="question-menu-container" ref={dropdownRef}>
      <button 
        className="question-menu-button" 
        onClick={toggleDropdown}
        aria-label="Menu de opções"
      >
        <IconEllipsisHorizontal />
      </button>
      {showDropdown && (
        <div className="question-dropdown">
          {!answered && (
            <button className="dropdown-item" onClick={handleShowAnswerClick}>
              <span>Mostrar Resposta</span>
            </button>
          )}
          <button className="dropdown-item" onClick={handleSaveToggle}>
            {isCurrentlySaved ? <IconBookmarkFilled /> : <IconBookmark />}
            <span>{isCurrentlySaved ? 'Remover dos Salvos' : 'Salvar Questão'}</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className={`question-layout ${answered ? 'answered' : ''} ${isInsideCarousel ? 'carousel-item-mode' : ''}`} id={questionId} data-correct-answer={respostaCorreta}>
      
      <div className="question-header">
        <div className="question-tags">
          {tags.length > 0 ? tags : <span className="question-tag">Informações Gerais</span>}
        </div>
      </div>
      
      {menuComponent}

      <div className="question-body">
        {corpo_questao && corpo_questao.length > 0 && corpo_questao.map((bloco, index) => (
          <CorpoBloco key={index} bloco={bloco} />
        ))}
      </div>

      <div className="alternatives-container">
        {(alternativas || []).map(alt => {
          const altLetter = alt.letra;
          const choiceStatus = feedback[altLetter];
          const isCorrectAnswer = altLetter === respostaCorreta;
          let icon = altLetter;
          let letterBoxClass = 'alternative-letter';
          let itemClass = 'alternative-item';

          if (answered) {
            if (isCorrectAnswer) {
              icon = '✓';
              letterBoxClass += ' feedback-correct';
              itemClass += ' correct-answer';
            } else if (choiceStatus === 'incorrect-choice') {
              icon = '✕';
              letterBoxClass += ' feedback-incorrect';
              itemClass += ' incorrect-choice';
            } else if (answered && !choiceStatus) {
              itemClass += ' neutral-answer';
            }
          }

          return (
            <div key={altLetter} className={itemClass} data-letter={altLetter} role="button" tabIndex={answered ? -1 : 0} onClick={() => handleAlternativeClick(altLetter)} onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleAlternativeClick(altLetter); }}>
              <span className={letterBoxClass}>{icon}</span>
              <div className="alternative-text">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={markdownComponents}
                >
                  {typeof alt.texto === 'string' ? alt.texto : String(alt.texto || '')}
                </ReactMarkdown>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const QuestionLayout = React.memo(QuestionLayoutInternal);
export default QuestionLayout;

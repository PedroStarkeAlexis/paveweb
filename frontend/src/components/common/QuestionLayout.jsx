import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import './QuestionLayout.css';
import { useSavedQuestions } from '../../hooks/useSavedQuestions';
import IconBookmark from '../icons/IconBookmark';
import IconBookmarkFilled from '../icons/IconBookmarkFilled';
import IconEllipsisHorizontal from '../icons/IconEllipsisHorizontal';

// Configura o ReactMarkdown para tratar blockquotes como referências de questão.
const markdownComponents = {
  blockquote: ({ ...props }) => <div className="question-reference" {...props} />
};

/**
 * Componente para renderizar um bloco de conteúdo do corpo da questão,
 * que pode ser texto (Markdown) ou uma imagem com legenda.
 */
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

/**
 * Layout principal para exibir uma questão completa.
 * Este componente gerencia a exibição do enunciado, alternativas, feedback de resposta
 * e ações como salvar a questão.
 * @param {object} props
 * @param {object} props.itemProva - O objeto contendo todos os dados da questão.
 * @param {boolean} [props.isInsideCarousel=false] - Aplica estilos simplificados se a questão estiver em um carrossel.
 */
function QuestionLayoutInternal({ itemProva: questionData, isInsideCarousel = false }) {
  const questionId = questionData?.id ?? null;

  // Estados para controlar a interatividade da questão
  const [answered, setAnswered] = useState(false); // Se o usuário já respondeu
  const [feedback, setFeedback] = useState({});   // Qual alternativa foi clicada
  const [showDropdown, setShowDropdown] = useState(false); // Visibilidade do menu de opções
  
  const dropdownRef = useRef(null); // Referência para o menu, para detectar cliques fora dele
  
  // Hook para interagir com o sistema de questões salvas
  const { addSavedQuestion, removeSavedQuestion, isQuestionSaved } = useSavedQuestions();

  // Desestruturação segura dos dados da questão com valores padrão
  const { ano, etapa, materia, topico, corpo_questao = [], alternativas = [], gabarito, resposta_letra } = questionData ?? {};
  const respostaCorreta = gabarito || resposta_letra || null;
  const isCurrentlySaved = questionId ? isQuestionSaved(questionId.toString()) : false;

  // Reseta o estado da questão quando o ID da questão muda
  useEffect(() => {
    setAnswered(false);
    setFeedback({});
    setShowDropdown(false);
  }, [questionId]);

  // Efeito para fechar o menu de opções se o usuário clicar fora dele
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

  // Manipula o clique em uma alternativa, dando feedback visual
  const handleAlternativeClick = (clickedLetter) => {
    if (answered) return;
    setAnswered(true);
    const isCorrect = clickedLetter === respostaCorreta;
    setFeedback({ [clickedLetter]: isCorrect ? 'correct-choice' : 'incorrect-choice' });
  };

  // Permite ao usuário revelar a resposta correta sem tentar responder
  const handleShowAnswerClick = () => {
    if (answered) return;
    setAnswered(true);
    setFeedback({});
    setShowDropdown(false);
  };

  // Salva ou remove a questão da lista de salvos
  const handleSaveToggle = (e) => {
    e.stopPropagation(); // Evita que o clique feche o menu imediatamente
    if (!questionId) return;
    if (isCurrentlySaved) {
      removeSavedQuestion(questionId.toString());
    } else {
      addSavedQuestion(questionId.toString());
    }
    setShowDropdown(false);
  };

  // Alterna a visibilidade do menu de opções
  const toggleDropdown = (e) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  // Cria as tags de informação da questão (Ano, Matéria, etc.)
  const sourceTag = ano ? (<span key="src" className="question-tag pave-tag">PAVE {ano}</span>) : (<span key="src" className="question-tag generated-ai-tag">Gerada por IA✨</span>);
  const tags = [sourceTag, etapa && <span key="etapa" className="question-tag">Etapa {etapa}</span>, materia && <span key="materia" className="question-tag">{materia}</span>, topico && <span key="topico" className="question-tag">{topico}</span>].filter(Boolean);

  // Componente do menu de opções (salvar, mostrar resposta)
  const menuComponent = !isInsideCarousel && (
    <div className="question-menu-container" ref={dropdownRef}>
      <button className="question-menu-button" onClick={toggleDropdown} aria-label="Menu de opções">
        <IconEllipsisHorizontal />
      </button>
      {showDropdown && (
        <div className="question-dropdown">
          {!answered && <button className="dropdown-item" onClick={handleShowAnswerClick}>Mostrar Resposta</button>}
          <button className="dropdown-item" onClick={handleSaveToggle}>
            {isCurrentlySaved ? <IconBookmarkFilled /> : <IconBookmark />}
            <span>{isCurrentlySaved ? 'Remover dos Salvos' : 'Salvar Questão'}</span>
          </button>
        </div>
      )}
    </div>
  );

  if (!questionData) return null;

  return (
    <div className={`question-layout ${answered ? 'answered' : ''} ${isInsideCarousel ? 'carousel-item-mode' : ''}`} id={questionId} data-correct-answer={respostaCorreta}>
      <div className="question-header">
        <div className="question-tags">{tags.length > 0 ? tags : <span className="question-tag">Informações Gerais</span>}</div>
      </div>
      
      {menuComponent}

      <div className="question-body">
        {corpo_questao.map((bloco, index) => <CorpoBloco key={index} bloco={bloco} />)}
      </div>

      <div className="alternatives-container">
        {alternativas.map(alt => {
          const altLetter = alt.letra;
          const isCorrectAnswer = altLetter === respostaCorreta;
          let icon = altLetter;
          let letterBoxClass = 'alternative-letter';
          let itemClass = 'alternative-item';

          // Aplica estilos de feedback se a questão foi respondida
          if (answered) {
            if (isCorrectAnswer) {
              icon = '✓';
              letterBoxClass += ' feedback-correct';
              itemClass += ' correct-answer';
            } else if (feedback[altLetter] === 'incorrect-choice') {
              icon = '✕';
              letterBoxClass += ' feedback-incorrect';
              itemClass += ' incorrect-choice';
            } else {
              itemClass += ' neutral-answer';
            }
          }

          return (
            <div key={altLetter} className={itemClass} data-letter={altLetter} role="button" tabIndex={answered ? -1 : 0} onClick={() => handleAlternativeClick(altLetter)}>
              <span className={letterBoxClass}>{icon}</span>
              <div className="alternative-text">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={markdownComponents}>
                  {String(alt.texto || '')}
                </ReactMarkdown>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// React.memo otimiza o componente, evitando que ele seja renderizado novamente se as props não mudarem.
const QuestionLayout = React.memo(QuestionLayoutInternal);
export default QuestionLayout;

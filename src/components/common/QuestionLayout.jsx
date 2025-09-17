import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSavedQuestions } from '../../hooks/useSavedQuestions';
import IconBookmark from '../icons/IconBookmark';
import IconBookmarkFilled from '../icons/IconBookmarkFilled';

function QuestionLayoutInternal({ questionData, isInsideCarousel = false }) {
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState({});
  const { addSavedQuestion, removeSavedQuestion, isQuestionSaved } = useSavedQuestions();

  const safeQuestionData = questionData || {};
  const {
    ano = null, etapa = null, materia = "Indefinida", topico = "Indefinido",
    texto_questao = '', referencia = null, alternativas = [], resposta_letra = null,
    id = safeQuestionData.id || `question-fallback-${Math.random().toString(36).substring(2, 9)}`
  } = safeQuestionData;

  const isCurrentlySaved = isQuestionSaved(id.toString());

  useEffect(() => {
    setAnswered(false);
    setFeedback({});
  }, [safeQuestionData]);

  const handleAlternativeClick = (clickedLetter) => {
    if (answered) return;
    setAnswered(true);
    const isCorrect = clickedLetter === resposta_letra;
    setFeedback({
      [clickedLetter]: isCorrect ? 'correct-choice' : 'incorrect-choice',
    });
  };

  const handleShowAnswerClick = () => {
    if (answered) return;
    setAnswered(true);
    setFeedback({});
  };

  const handleSaveToggle = (e) => {
    e.stopPropagation();
    if (isCurrentlySaved) {
      removeSavedQuestion(id.toString());
    } else {
      addSavedQuestion(id.toString());
    }
  };

  const sourceTag = ano
    ? (<span key="src" className="question-tag pave-tag">PAVE {ano}</span>)
    : (safeQuestionData.referencia?.toLowerCase().includes("ia") || !ano ?
      <span key="src" className="question-tag generated-ai-tag">Gerada por IA✨</span>
      : <span key="src" className="question-tag">Outra Fonte</span>);

  const tags = [sourceTag, etapa ? <span key="etapa" className="question-tag">Etapa {etapa}</span> : null, materia ? <span key="materia" className="question-tag">{materia}</span> : null, topico ? <span key="topico" className="question-tag">{topico}</span> : null].filter(Boolean);

  return (
    <div className={`question-layout ${answered ? 'answered' : ''} ${isInsideCarousel ? 'carousel-item-mode' : ''}`} id={id.toString()} data-correct-answer={resposta_letra}>
      <div className="question-header">{tags.length > 0 ? tags : <span className="question-tag">Informações Gerais</span>}</div>
      <div className="question-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{typeof texto_questao === 'string' ? texto_questao : String(texto_questao || '')}</ReactMarkdown>
        {referencia && <div className="question-reference"><ReactMarkdown remarkPlugins={[remarkGfm]}>{referencia}</ReactMarkdown></div>}
      </div>
      <div className="alternatives-container">
        {(alternativas || []).map(alt => {
          const altLetter = alt.letra;
          const choiceStatus = feedback[altLetter];
          const isCorrectAnswer = altLetter === resposta_letra;
          let icon = altLetter;
          let letterBoxClass = 'alternative-letter';
          let itemClass = 'alternative-item';

          if (answered) {
            if (isCorrectAnswer) {
              icon = '✔';
              letterBoxClass += ' feedback-correct';
              itemClass += ' correct-answer';
            } else if (choiceStatus === 'incorrect-choice') {
              icon = '✗';
              letterBoxClass += ' feedback-incorrect';
              itemClass += ' incorrect-choice';
            }
          }

          return (
            <div key={altLetter} className={itemClass} data-letter={altLetter} role="button" tabIndex={answered ? -1 : 0} onClick={() => handleAlternativeClick(altLetter)} onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleAlternativeClick(altLetter); }}>
              <span className={letterBoxClass}>{icon}</span>
              <div className="alternative-text"><ReactMarkdown remarkPlugins={[remarkGfm]}>{typeof alt.texto === 'string' ? alt.texto : String(alt.texto || '')}</ReactMarkdown></div>
            </div>
          );
        })}
      </div>
      <div className="question-footer">
        {!isInsideCarousel && (
          <button className={`q-footer-btn q-footer-btn-secondary ${isCurrentlySaved ? 'saved' : ''}`} onClick={handleSaveToggle} aria-label={isCurrentlySaved ? 'Remover questão' : 'Salvar questão'}>
            {isCurrentlySaved ? <IconBookmarkFilled /> : <IconBookmark />}
            <span>{isCurrentlySaved ? 'Salvo' : 'Salvar'}</span>
          </button>
        )}
        <div className="footer-answer-section">
          {!answered && <button className="q-footer-btn q-footer-btn-primary" onClick={handleShowAnswerClick}>Mostrar Resposta</button>}
          {answered && <span className="correct-answer-text">Correta: {resposta_letra || 'N/D'}) {(alternativas || []).find(a => a.letra === resposta_letra)?.texto || ''}</span>}
        </div>
      </div>
    </div>
  );
}

const QuestionLayout = React.memo(QuestionLayoutInternal);
export default QuestionLayout;

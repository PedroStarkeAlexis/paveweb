import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSavedQuestions } from '../../hooks/useSavedQuestions'; // Importar o hook
import IconBookmark from '../icons/IconBookmark'; // Ícone para salvar
import IconBookmarkFilled from '../icons/IconBookmarkFilled'; // Ícone para salvo

function QuestionLayoutInternal({ questionData, isInsideCarousel = false, onRequestExplanation }) { // <<< NOVA PROP
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState({});
  const { savedQuestionIds, addSavedQuestion, removeSavedQuestion, isQuestionSaved } = useSavedQuestions();
  const [isExplanationLoading, setIsExplanationLoading] = useState(false);
  const [explanationRequested, setExplanationRequested] = useState(false);

  const safeQuestionData = questionData || {};

  const {
    ano = null, etapa = null, materia = "Indefinida", topico = "Indefinido",
    texto_questao = '',
    referencia = null,
    alternativas = [],
    resposta_letra = null,
    id = safeQuestionData.id || `question-fallback-${Math.random().toString(36).substring(2, 9)}`
  } = safeQuestionData;

  const isCurrentlySaved = isQuestionSaved(id.toString());

  useEffect(() => {
    setAnswered(false);
    setFeedback({});
    setIsExplanationLoading(false);
  }, [safeQuestionData]);

  const handleAlternativeClick = (clickedLetter) => {
    // Permite clicar mesmo se 'answered' for true, para o caso de querer pedir explicação após já ter visto a resposta.
    // A principal mudança de estado é 'answered' e 'feedback.choice'.
    setAnswered(true);
    setFeedback({ choice: clickedLetter }); // Guarda apenas a letra que o usuário clicou
  };

  const handleExplainOrShowAnswerClick = async () => {
    if (isExplanationLoading) return; // Evita múltiplos cliques enquanto carrega

    // Sempre marca como respondido e revela a resposta na UI
    setAnswered(true);
    // Se feedback.choice não está definido, significa que o usuário clicou direto em "Explicar/Mostrar"
    // sem antes selecionar uma alternativa.
    if (feedback.choice === undefined) {
      setFeedback({ choice: null }); // Indica que a resposta foi revelada sem escolha prévia.
    }

    if (onRequestExplanation) {
      setIsExplanationLoading(true);
      setExplanationRequested(true); // Marca que a explicação foi solicitada
      await onRequestExplanation(safeQuestionData, feedback.choice); // feedback.choice é a letra que o usuário clicou
      setIsExplanationLoading(false);
    }
  };

  const handleSaveToggle = (e) => {
    e.stopPropagation(); // Evitar que o clique se propague para outros elementos
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

  const etapaTag = etapa ? (<span key="etapa" className="question-tag">Etapa {etapa}</span>) : null;
  const materiaTag = materia ? (<span key="materia" className="question-tag">{materia}</span>) : null;
  const topicoTag = topico ? (<span key="topico" className="question-tag">{topico}</span>) : null;
  const tags = [sourceTag, etapaTag, materiaTag, topicoTag].filter(Boolean);

  const textoQuestaoString = typeof texto_questao === 'string' ? texto_questao : React.isValidElement(texto_questao) ? '' : String(texto_questao || '');
  const referenciaString = typeof referencia === 'string' ? referencia : null;

  const layoutClassName = `question-layout ${answered ? 'answered' : ''} ${isInsideCarousel ? 'carousel-item-mode' : ''}`;

  return (
    <div className={layoutClassName} id={id.toString()} data-correct-answer={resposta_letra}>
      <div className="question-header">
        {tags.length > 0 ? tags : <span className="question-tag">Questão Genérica</span>}
      </div>

      <div className="question-body">
        {React.isValidElement(texto_questao) ? texto_questao : <ReactMarkdown remarkPlugins={[remarkGfm]}>{textoQuestaoString}</ReactMarkdown>}
        {referenciaString && (
          <div className="question-reference">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{`Referência: ${referenciaString}`}</ReactMarkdown>
          </div>
        )}
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
            const userClickedThisAlternative = altLetter === feedback.choice;
            if (isCorrectAnswer) { // Se esta alternativa é a correta
              icon = '✔';
              letterBoxClass += ' feedback-correct';
              itemClass += ' correct-answer';
            } else if (userClickedThisAlternative) { // Se esta não é a correta, mas foi a clicada
              icon = '✗';
              letterBoxClass += ' feedback-incorrect';
              itemClass += ' incorrect-choice';
            }
          }

          const altTextoString = typeof alt.texto === 'string' ? alt.texto : String(alt.texto || '');

          return (
            <div
              key={altLetter} className={itemClass} data-letter={altLetter}
              role="button" tabIndex={answered ? -1 : 0}
              onClick={() => handleAlternativeClick(altLetter)}
              onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleAlternativeClick(altLetter); }}>
              <span className={letterBoxClass}>{icon}</span>
              <div className="alternative-text">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {altTextoString}
                </ReactMarkdown>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`question-footer ${!isInsideCarousel ? 'with-save-btn' : ''}`}>
        {!isInsideCarousel && ( // Não mostrar botão de salvar dentro do carrossel do chat por enquanto
          <button
            className={`save-question-btn ${isCurrentlySaved ? 'saved' : ''}`}
            onClick={handleSaveToggle}
            aria-label={isCurrentlySaved ? 'Remover questão dos salvos' : 'Salvar questão'}
            title={isCurrentlySaved ? 'Remover dos Salvos' : 'Salvar Questão'}
          >
            {isCurrentlySaved ? <IconBookmarkFilled /> : <IconBookmark />}
          </button>
        )}
        {/* Container para o botão e/ou texto da resposta correta */}
        <div style={{
          marginLeft: isInsideCarousel || (!isInsideCarousel && !isCurrentlySaved) ? 'auto' : '0',
          display: 'flex',
          alignItems: 'center',
          gap: '10px' // Espaço entre o botão (se visível) e o texto da resposta
        }}>
          {/* Botão Explicar/Mostrar Resposta */}
          {(!answered || onRequestExplanation) && (
            <button
              className="show-answer-btn"
              onClick={handleExplainOrShowAnswerClick}
              disabled={isExplanationLoading}
            >
              {isExplanationLoading
                ? "Explicando..."
                : onRequestExplanation
                ? "Explicar Resposta"
                : "Mostrar Resposta"}
            </button>
          )}
          {/* Texto da Resposta Correta */}
          {answered && (
            <span className="correct-answer-text">
              Correta: {resposta_letra || 'N/D'}) {(alternativas || []).find(a => a.letra === resposta_letra)?.texto || ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const QuestionLayout = React.memo(QuestionLayoutInternal);
export default QuestionLayout;
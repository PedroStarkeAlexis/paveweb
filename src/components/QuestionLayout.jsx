import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown'; // Importa
import remarkGfm from 'remark-gfm';       // Importa

function QuestionLayout({ questionData }) {
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState({});

  // Desestruturação segura com valores padrão
  const {
    ano = null, etapa = null, materia = "Indefinida", topico = "Indefinido",
    texto_questao = '', // Padrão string vazia
    referencia = null,
    alternativas = [],
    resposta_letra = null,
    id = `question-${Math.random().toString(36).substring(2, 9)}`
  } = questionData || {};

  const questionId = id;

  useEffect(() => {
    setAnswered(false);
    setFeedback({});
  }, [questionData]);

  const handleAlternativeClick = (clickedLetter) => {
    if (answered) return;
    setAnswered(true);
    const isCorrect = clickedLetter === resposta_letra;
    const newFeedback = {
      [clickedLetter]: isCorrect ? 'correct-choice' : 'incorrect-choice',
      [resposta_letra]: 'correct-answer'
    };
    setFeedback(newFeedback);
  };

  const handleShowAnswerClick = () => {
     if (answered) return;
     setAnswered(true);
     const newFeedback = { [resposta_letra]: 'correct-answer' };
     setFeedback(newFeedback);
  };

  // Geração das Tags como componentes React
  const sourceTag = ano
        ? (<span key="src" className="question-tag pave-tag">PAVE {ano}</span>)
        : (<span key="src" className="question-tag generated-ai-tag">Gerada por IA</span>);
  const etapaTag = etapa ? (<span key="etapa" className="question-tag">Etapa {etapa}</span>) : null;
  const materiaTag = materia ? (<span key="materia" className="question-tag">{materia}</span>) : null;
  const topicoTag = topico ? (<span key="topico" className="question-tag">{topico}</span>) : null;
  const tags = [sourceTag, etapaTag, materiaTag, topicoTag].filter(Boolean);

  // Garante que texto_questao e referencia sejam strings para ReactMarkdown
  const textoQuestaoString = typeof texto_questao === 'string' ? texto_questao : '';
  const referenciaString = typeof referencia === 'string' ? referencia : null;


  return (
    <div className={`question-layout ${answered ? 'answered' : ''}`} id={questionId} data-correct-answer={resposta_letra}>
      <div className="question-header">
          {tags.length > 0 ? tags : <span className="question-tag">Informações Gerais</span>}
      </div>

      {/* Corpo e Referência usando ReactMarkdown */}
      <div className="question-body">
         {/* Passa a string como filho */}
         <ReactMarkdown remarkPlugins={[remarkGfm]}>{textoQuestaoString}</ReactMarkdown>
         {referenciaString && (
            <div className="question-reference">
                {/* Passa a string como filho */}
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{referenciaString}</ReactMarkdown>
            </div>
         )}
      </div>

      {/* Container das Alternativas */}
      <div className="alternatives-container">
        {alternativas.map(alt => {
          const altLetter = alt.letra;
          const altFeedback = feedback[altLetter];
          let icon = altLetter;
          let letterBoxClass = 'alternative-letter';
          let itemClass = 'alternative-item';

          if (answered) { /* ... lógica de feedback como antes ... */
            if (altFeedback === 'correct-choice' || altFeedback === 'correct-answer') {
              icon = '✔'; letterBoxClass += ' feedback-correct'; itemClass += ' correct-answer';
              if (altFeedback === 'correct-choice') { itemClass += ' correct-choice'; }
            } else if (altFeedback === 'incorrect-choice') {
              icon = '✖'; letterBoxClass += ' feedback-incorrect'; itemClass += ' incorrect-choice';
            }
          }

          // Garante que o texto da alternativa seja string
          const altTextoString = typeof alt.texto === 'string' ? alt.texto : '';

          return (
            <div
              key={altLetter} className={itemClass} data-letter={altLetter}
              role="button" tabIndex={answered ? -1 : 0}
              onClick={() => handleAlternativeClick(altLetter)}
              onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleAlternativeClick(altLetter)}}>
              <span className={letterBoxClass}>{icon}</span>
              <div className="alternative-text">
                  {/* Passa a string como filho */}
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {altTextoString}
                  </ReactMarkdown>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rodapé */}
      <div className="question-footer">
        {!answered && <button className="show-answer-btn" onClick={handleShowAnswerClick}>Mostrar Resposta</button>}
        {answered && (
          <span className="correct-answer-text">
            Correta: {resposta_letra}) {alternativas.find(a => a.letra === resposta_letra)?.texto || ''}
          </span>
        )}
      </div>
    </div>
  );
}

export default QuestionLayout;
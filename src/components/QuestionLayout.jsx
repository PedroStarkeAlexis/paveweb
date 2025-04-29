import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown'; // Importa
import remarkGfm from 'remark-gfm';       // Importa

function QuestionLayout({ questionData }) {
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState({});

  const { /* ...desestruturação como antes... */
    ano = null, etapa = null, materia = "Indefinida", topico = "Indefinido",
    texto_questao = 'Texto da questão não disponível.', referencia = null,
    alternativas = [], resposta_letra = null,
    id = `question-${Math.random().toString(36).substring(2, 9)}`
  } = questionData || {};

  const questionId = id;

  useEffect(() => { /* ... como antes ... */
    setAnswered(false);
    setFeedback({});
  }, [questionData]);

  const handleAlternativeClick = (clickedLetter) => { /* ... como antes ... */
    if (answered) return;
    setAnswered(true);
    const isCorrect = clickedLetter === resposta_letra;
    const newFeedback = {
      [clickedLetter]: isCorrect ? 'correct-choice' : 'incorrect-choice',
      [resposta_letra]: 'correct-answer'
    };
    setFeedback(newFeedback);
  };

  const handleShowAnswerClick = () => { /* ... como antes ... */
     if (answered) return;
     setAnswered(true);
     const newFeedback = { [resposta_letra]: 'correct-answer' };
     setFeedback(newFeedback);
  };

  // Geração das Tags (Atualizada para não usar dangerouslySetInnerHTML)
  const sourceTag = ano
        ? (<span key="src" className="question-tag pave-tag">PAVE {ano}</span>)
        : (<span key="src" className="question-tag generated-ai-tag">Gerada por IA</span>);
  const etapaTag = etapa ? (<span key="etapa" className="question-tag">Etapa {etapa}</span>) : null;
  const materiaTag = materia ? (<span key="materia" className="question-tag">{materia}</span>) : null;
  const topicoTag = topico ? (<span key="topico" className="question-tag">{topico}</span>) : null;
  const tags = [sourceTag, etapaTag, materiaTag, topicoTag].filter(Boolean); // Filtra nulos

  return (
    <div className={`question-layout ${answered ? 'answered' : ''}`} id={questionId} data-correct-answer={resposta_letra}>
      {/* Cabeçalho com as Tags */}
      <div className="question-header">
          {tags.length > 0 ? tags : <span className="question-tag">Informações Gerais</span>}
      </div>

      {/* Corpo da Questão e Referência com ReactMarkdown */}
      <div className="question-body">
         <ReactMarkdown remarkPlugins={[remarkGfm]}>{texto_questao}</ReactMarkdown>
         {referencia && (
            <div className="question-reference"> {/* Mantém a div para estilo */}
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{referencia}</ReactMarkdown>
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

          return (
            <div
              key={altLetter} className={itemClass} data-letter={altLetter}
              role="button" tabIndex={answered ? -1 : 0}
              onClick={() => handleAlternativeClick(altLetter)}
              onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleAlternativeClick(altLetter)}}>
              <span className={letterBoxClass}>{icon}</span>
              {/* Usa ReactMarkdown para o texto da alternativa */}
              <div className="alternative-text"> {/* Usa div para block elements */}
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {alt.texto || ''}
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
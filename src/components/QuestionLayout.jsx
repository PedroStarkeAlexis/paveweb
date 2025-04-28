import React, { useState, useEffect } from 'react';

function QuestionLayout({ questionData }) {
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState({}); // { A: 'correct', B: 'incorrect', ... }

  const {
    ano,
    etapa,
    materia,
    topico,
    texto_questao,
    referencia,
    alternativas = [], // Garante que seja um array
    resposta_letra,
  } = questionData || {}; // Desestrutura com segurança

  const questionId = `question-${Math.random().toString(36).substring(2, 9)}`; // ID único simples

  // Resetar estado quando a questão mudar (se o componente for reutilizado)
  useEffect(() => {
    setAnswered(false);
    setFeedback({});
  }, [questionData]);


  const handleAlternativeClick = (clickedLetter) => {
    if (answered) return;

    setAnswered(true);
    const isCorrect = clickedLetter === resposta_letra;
    const newFeedback = {
      ...feedback,
      [clickedLetter]: isCorrect ? 'correct-choice' : 'incorrect-choice',
      [resposta_letra]: 'correct-answer' // Sempre marca a correta
    };
    setFeedback(newFeedback);
  };

  const handleShowAnswerClick = () => {
    if (answered) return;
    setAnswered(true);
    const newFeedback = {
        ...feedback,
        [resposta_letra]: 'correct-answer' // Apenas marca a correta
    };
    setFeedback(newFeedback);
  };

  // Gera as tags de metadados
  const paveTag = ano ? `<span class="question-tag pave-tag">PAVE ${ano}</span>` : '';
  const etapaTag = etapa ? `<span class="question-tag">Etapa ${etapa}</span>` : '';
  const materiaTag = materia ? `<span class="question-tag">${materia}</span>` : '';
  const topicoTag = topico ? `<span class="question-tag">${topico}</span>` : '';
  const tags = [paveTag, etapaTag, materiaTag, topicoTag].filter(tag => tag).join('');

  // Corpo e Referência
  const mainBodyHTML = `<p>${texto_questao || 'Texto da questão não disponível.'}</p>`;
  const referenceHTML = referencia ? `<p class="question-reference">${referencia}</p>` : '';

  return (
    <div className={`question-layout ${answered ? 'answered' : ''}`} id={questionId} data-correct-answer={resposta_letra}>
      <div className="question-header" dangerouslySetInnerHTML={{ __html: tags || '<span class="question-tag">Informações Gerais</span>' }} />
      <div className="question-body" dangerouslySetInnerHTML={{ __html: mainBodyHTML + referenceHTML }} />
      <div className="alternatives-container">
        {alternativas.map(alt => (
          <div
            key={alt.letra}
            className={`alternative-item ${feedback[alt.letra] || ''} ${feedback[alt.letra] === 'correct-answer' ? 'correct-answer' : ''}`} // Aplica classes de feedback
            data-letter={alt.letra}
            role="button"
            tabIndex={answered ? -1 : 0} // Remove do tab order se respondido
            onClick={() => handleAlternativeClick(alt.letra)}
            onKeyPress={(e) => e.key === 'Enter' && handleAlternativeClick(alt.letra)} // Acessibilidade
          >
            <span className={`alternative-letter ${feedback[alt.letra]?.includes('correct') ? 'feedback-correct' : ''} ${feedback[alt.letra]?.includes('incorrect') ? 'feedback-incorrect' : ''}`}>
              {/* Mostra V ou X se respondido, senão a letra */}
              {answered && feedback[alt.letra]?.includes('correct') ? '✔' : (answered && feedback[alt.letra]?.includes('incorrect') ? '✖' : alt.letra)}
            </span>
            <span className="alternative-text">{alt.texto || ''}</span>
          </div>
        ))}
      </div>
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
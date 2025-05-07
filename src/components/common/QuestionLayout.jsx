// src/components/common/QuestionLayout.jsx
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function QuestionLayoutInternal({ questionData }) {
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState({}); // Guarda o estado da escolha: 'correct-choice', 'incorrect-choice'

  const {
    ano = null, etapa = null, materia = "Indefinida", topico = "Indefinido",
    texto_questao = '',
    referencia = null,
    alternativas = [],
    resposta_letra = null,
    id = questionData?.id || `question-fallback-${Math.random().toString(36).substring(2, 9)}`
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
    // Atualiza o feedback para a alternativa clicada
    setFeedback({
      [clickedLetter]: isCorrect ? 'correct-choice' : 'incorrect-choice',
    });
  };

  const handleShowAnswerClick = () => {
     if (answered) return;
     setAnswered(true);
     // Não define feedback de escolha, apenas permite que a correta seja destacada
     // A lógica de exibição da alternativa correta já vai cuidar disso
     setFeedback({}); // Pode limpar ou não definir nada específico para a escolha
  };

  // ... (tags, textoQuestaoString, referenciaString - permanecem iguais) ...
  const sourceTag = ano
        ? (<span key="src" className="question-tag pave-tag">PAVE {ano}</span>)
        : (questaoData?.referencia?.toLowerCase().includes("ia") || !ano ?
           <span key="src" className="question-tag generated-ai-tag">Gerada por IA✨</span>
           : <span key="src" className="question-tag">Outra Fonte</span>);

  const etapaTag = etapa ? (<span key="etapa" className="question-tag">Etapa {etapa}</span>) : null;
  const materiaTag = materia ? (<span key="materia" className="question-tag">{materia}</span>) : null;
  const topicoTag = topico ? (<span key="topico" className="question-tag">{topico}</span>) : null;
  const tags = [sourceTag, etapaTag, materiaTag, topicoTag].filter(Boolean);

  const textoQuestaoString = typeof texto_questao === 'string' ? texto_questao : React.isValidElement(texto_questao) ? '' : String(texto_questao || '');
  const referenciaString = typeof referencia === 'string' ? referencia : null;


  return (
    <div className={`question-layout ${answered ? 'answered' : ''}`} id={questionId.toString()} data-correct-answer={resposta_letra}>
      <div className="question-header">
          {tags.length > 0 ? tags : <span className="question-tag">Informações Gerais</span>}
      </div>

      <div className="question-body">
         {React.isValidElement(texto_questao) ? texto_questao : <ReactMarkdown remarkPlugins={[remarkGfm]}>{textoQuestaoString}</ReactMarkdown>}
         {referenciaString && (
            <div className="question-reference">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{referenciaString}</ReactMarkdown>
            </div>
         )}
      </div>

      <div className="alternatives-container">
        {(alternativas || []).map(alt => {
          const altLetter = alt.letra;
          // Verifica o feedback específico para esta alternativa
          const choiceStatus = feedback[altLetter]; // 'correct-choice' ou 'incorrect-choice'
          const isCorrectAnswer = altLetter === resposta_letra;

          let icon = altLetter; // Padrão é a letra
          let letterBoxClass = 'alternative-letter';
          let itemClass = 'alternative-item';

          if (answered) {
            if (isCorrectAnswer) { // Se esta é a alternativa correta
              icon = '✔';
              letterBoxClass += ' feedback-correct';
              itemClass += ' correct-answer'; // Sempre destaca a correta
              if (choiceStatus === 'correct-choice') {
                itemClass += ' correct-choice'; // Adicional se foi a escolhida E correta
              }
            } else if (choiceStatus === 'incorrect-choice') { // Se esta foi a escolhida E é incorreta
              icon = '✖';
              letterBoxClass += ' feedback-incorrect';
              itemClass += ' incorrect-choice';
            }
            // Nenhuma classe de ícone especial para alternativas não escolhidas e não corretas
          }

          const altTextoString = typeof alt.texto === 'string' ? alt.texto : String(alt.texto || '');

          return (
            <div
              key={altLetter} className={itemClass} data-letter={altLetter}
              role="button" tabIndex={answered ? -1 : 0}
              onClick={() => handleAlternativeClick(altLetter)}
              onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleAlternativeClick(altLetter)}}>
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

      <div className="question-footer">
        {!answered && <button className="show-answer-btn" onClick={handleShowAnswerClick}>Mostrar Resposta</button>}
        {answered && (
          <span className="correct-answer-text">
            Correta: {resposta_letra || 'N/D'}) {(alternativas || []).find(a => a.letra === resposta_letra)?.texto || ''}
          </span>
        )}
      </div>
    </div>
  );
}

const QuestionLayout = React.memo(QuestionLayoutInternal);
export default QuestionLayout;
import React, { useState, useEffect } from 'react';

function QuestionLayout({ questionData }) {
  // Estado para controlar se a questão já foi respondida/revelada
  const [answered, setAnswered] = useState(false);
  // Estado para armazenar o feedback por alternativa (ex: { A: 'incorrect-choice', B: 'correct-answer' })
  const [feedback, setFeedback] = useState({});

  // Desestruturação segura dos dados da questão
  const {
    ano,
    etapa,
    materia,
    topico,
    texto_questao,
    referencia,
    alternativas = [], // Garante que seja um array
    resposta_letra,
  } = questionData || {}; // Usa objeto vazio como fallback

  // Gera um ID único simples para acessibilidade ou chaves (se necessário)
  const questionId = `question-${Math.random().toString(36).substring(2, 9)}`;

  // Efeito para resetar o estado se os dados da questão mudarem
  // Útil se o mesmo componente for reutilizado para mostrar questões diferentes sequencialmente
  useEffect(() => {
    setAnswered(false);
    setFeedback({});
  }, [questionData]); // Roda sempre que questionData mudar


  // Handler para clique em uma alternativa
  const handleAlternativeClick = (clickedLetter) => {
    if (answered) return; // Ignora cliques se já respondido

    setAnswered(true); // Marca como respondido
    const isCorrect = clickedLetter === resposta_letra; // Verifica se acertou

    // Atualiza o estado de feedback
    const newFeedback = {
      // Mantém feedback de outras questões (se houvesse, mas aqui reseta a cada questão)
      // ...feedback, // Não necessário aqui pois o estado é por questão
      // Define o feedback para a letra CLICADA
      [clickedLetter]: isCorrect ? 'correct-choice' : 'incorrect-choice',
      // SEMPRE define o feedback para a letra CORRETA (para destacá-la)
      [resposta_letra]: 'correct-answer'
    };
    setFeedback(newFeedback);
  };

  // Handler para clique no botão "Mostrar Resposta"
  const handleShowAnswerClick = () => {
    if (answered) return; // Ignora cliques se já respondido/revelado

    setAnswered(true); // Marca como revelado
    // Atualiza o estado de feedback APENAS para a letra CORRETA
    const newFeedback = {
        // ...feedback, // Não necessário
        [resposta_letra]: 'correct-answer'
    };
    setFeedback(newFeedback);
  };

  // --- Geração do JSX ---

  // Gera as tags de metadados para o cabeçalho
  const paveTag = ano ? `<span class="question-tag pave-tag">PAVE ${ano}</span>` : '';
  const etapaTag = etapa ? `<span class="question-tag">Etapa ${etapa}</span>` : '';
  const materiaTag = materia ? `<span class="question-tag">${materia}</span>` : '';
  const topicoTag = topico ? `<span class="question-tag">${topico}</span>` : '';
  const tags = [paveTag, etapaTag, materiaTag, topicoTag].filter(tag => tag).join('');

  // Corpo principal e referência (já corrigido para usar campo dedicado)
  const mainBodyHTML = `<p>${texto_questao || 'Texto da questão não disponível.'}</p>`;
  const referenceHTML = referencia ? `<p class="question-reference">${referencia}</p>` : '';

  return (
    <div className={`question-layout ${answered ? 'answered' : ''}`} id={questionId} data-correct-answer={resposta_letra}>
      {/* Cabeçalho com as Tags */}
      <div className="question-header" dangerouslySetInnerHTML={{ __html: tags || '<span class="question-tag">Informações Gerais</span>' }} />

      {/* Corpo da Questão e Referência */}
      <div className="question-body" dangerouslySetInnerHTML={{ __html: mainBodyHTML + referenceHTML }} />

      {/* Container das Alternativas */}
      <div className="alternatives-container">
        {alternativas.map(alt => {
          // --- LÓGICA CORRIGIDA PARA ÍCONE E CLASSES ---
          const altLetter = alt.letra;
          const altFeedback = feedback[altLetter]; // Feedback específico para esta alternativa
          let icon = altLetter; // Ícone padrão é a própria letra
          let letterBoxClass = 'alternative-letter'; // Classe CSS padrão do box da letra
          let itemClass = 'alternative-item'; // Classe CSS padrão da linha da alternativa

          if (answered) { // Só mostra feedback se a questão foi respondida/revelada
            if (altFeedback === 'correct-choice' || altFeedback === 'correct-answer') {
              icon = '✔'; // Mostra Check para a correta ou a escolhida correta
              letterBoxClass += ' feedback-correct'; // Estilo verde no box da letra
              itemClass += ' correct-answer';      // Estilo verde claro na linha
              // Se foi a escolha correta, adiciona a classe específica também
              if (altFeedback === 'correct-choice') {
                 itemClass += ' correct-choice';
              }
            } else if (altFeedback === 'incorrect-choice') {
              icon = '✖'; // Mostra X para a escolhida incorreta
              letterBoxClass += ' feedback-incorrect'; // Estilo vermelho no box da letra
              itemClass += ' incorrect-choice';   // Estilo vermelho claro na linha
            }
            // Se altFeedback for undefined (alternativa não escolhida e não correta), mantém a letra e classes padrão.
          }
          // --- FIM DA LÓGICA CORRIGIDA ---

          return (
            <div
              key={altLetter}
              className={itemClass} // Aplica as classes de linha calculadas
              data-letter={altLetter}
              role="button"
              tabIndex={answered ? -1 : 0}
              onClick={() => handleAlternativeClick(altLetter)}
              onKeyPress={(e) => e.key === 'Enter' && handleAlternativeClick(altLetter)}
            >
              <span className={letterBoxClass}> {/* Aplica as classes de box da letra calculadas */}
                {icon} {/* Renderiza o ícone ou a letra */}
              </span>
              <span className="alternative-text">{alt.texto || ''}</span>
            </div>
          );
        })}
      </div>

      {/* Rodapé com Botão ou Resposta */}
      <div className="question-footer">
        {/* Mostra o botão apenas se ainda não foi respondida */}
        {!answered && <button className="show-answer-btn" onClick={handleShowAnswerClick}>Mostrar Resposta</button>}
        {/* Mostra o texto da resposta correta apenas se foi respondida */}
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
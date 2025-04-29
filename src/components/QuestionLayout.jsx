import React, { useState, useEffect } from 'react';

function QuestionLayout({ questionData }) {
  // Estado para controlar se a questão já foi respondida/revelada
  const [answered, setAnswered] = useState(false);
  // Estado para armazenar o feedback por alternativa (ex: { A: 'incorrect-choice', B: 'correct-answer' })
  const [feedback, setFeedback] = useState({});

  // Desestruturação segura dos dados da questão recebidos via props
  // Define valores padrão (null ou array vazio) caso questionData ou seus campos sejam undefined
  const {
    ano = null,             // Ano da questão (pode ser null para geradas por IA)
    etapa = null,           // Etapa da questão (pode ser null para geradas por IA)
    materia = "Indefinida", // Matéria (com valor padrão)
    topico = "Indefinido",  // Tópico (com valor padrão)
    texto_questao = 'Texto da questão não disponível.', // Enunciado
    referencia = null,      // Referência (pode ser null)
    alternativas = [],      // Garante que seja sempre um array
    resposta_letra = null,  // Letra da resposta correta
    id = `question-${Math.random().toString(36).substring(2, 9)}` // Usa ID passado ou gera um aleatório
  } = questionData || {}; // Usa objeto vazio como fallback se questionData for null/undefined

  // Gera um ID único para o elemento DOM (útil para acessibilidade, etc.)
  // Se um id já vem no questionData, ele será usado.
  const questionId = id;

  // Efeito para resetar o estado interno (respondido, feedback) se os dados da questão mudarem
  // Isso é importante se o componente for reutilizado em uma lista para mostrar questões diferentes.
  useEffect(() => {
    setAnswered(false); // Reseta para não respondido
    setFeedback({});    // Limpa o feedback das alternativas
  }, [questionData]); // Roda sempre que o objeto questionData mudar

  // --- Handlers de Interação ---

  // Chamado quando o usuário clica em uma alternativa
  const handleAlternativeClick = (clickedLetter) => {
    if (answered) return; // Ignora cliques se já respondido

    setAnswered(true); // Marca a questão como respondida
    const isCorrect = clickedLetter === resposta_letra; // Verifica se a escolha está correta

    // Atualiza o estado de feedback para mostrar certo/errado e destacar a correta
    const newFeedback = {
      [clickedLetter]: isCorrect ? 'correct-choice' : 'incorrect-choice', // Marca a clicada
      [resposta_letra]: 'correct-answer'                               // Sempre marca a correta
    };
    setFeedback(newFeedback);
  };

  // Chamado quando o usuário clica no botão "Mostrar Resposta"
  const handleShowAnswerClick = () => {
    if (answered) return; // Ignora cliques se já respondido/revelado

    setAnswered(true); // Marca como revelado
    // Atualiza o estado de feedback APENAS para a letra CORRETA
    const newFeedback = {
        [resposta_letra]: 'correct-answer'
    };
    setFeedback(newFeedback);
  };

  // --- Geração do JSX para Renderização ---

  // Gera as tags de metadados para o cabeçalho do card
  // Decide entre mostrar "PAVE + Ano" ou "Gerada por IA"
  const sourceTag = ano
        ? `<span class="question-tag pave-tag">PAVE ${ano}</span>`
        : `<span class="question-tag generated-ai-tag">Gerada por IA</span>`; // Tag para IA

  const etapaTag = etapa ? `<span class="question-tag">Etapa ${etapa}</span>` : ''; // Só mostra se etapa existir
  const materiaTag = materia ? `<span class="question-tag">${materia}</span>` : ''; // Usa a matéria extraída/padrão
  const topicoTag = topico ? `<span class="question-tag">${topico}</span>` : '';     // Usa o tópico extraído/padrão

  // Junta as tags HTML, filtrando as vazias
  const tags = [sourceTag, etapaTag, materiaTag, topicoTag]
      .filter(tag => tag) // Remove strings vazias do array
      .join('');         // Junta as tags restantes com espaço implícito (controlado por CSS gap)

  // Corpo principal e referência (referência só aparece se existir no JSON)
  const mainBodyHTML = `<p>${texto_questao}</p>`; // CSS cuida do white-space
  const referenceHTML = referencia ? `<p class="question-reference">${referencia}</p>` : '';

  return (
    // Container principal do card da questão. Adiciona classe 'answered' quando respondida.
    <div className={`question-layout ${answered ? 'answered' : ''}`} id={questionId} data-correct-answer={resposta_letra}>

      {/* Cabeçalho com as Tags de metadados */}
      {/* dangerouslySetInnerHTML é usado aqui porque 'tags' é uma string HTML */}
      <div className="question-header" dangerouslySetInnerHTML={{ __html: tags || '<span class="question-tag">Informações Gerais</span>' }} />

      {/* Corpo da Questão e Referência */}
      {/* dangerouslySetInnerHTML para renderizar <p> e <br> (se o CSS não usar white-space) */}
      {/* Nota: Se o CSS usa white-space: pre-wrap para .question-body p, não precisa do innerHTML aqui */}
      <div className="question-body" dangerouslySetInnerHTML={{ __html: mainBodyHTML + referenceHTML }} />

      {/* Container das Alternativas */}
      <div className="alternatives-container">
        {/* Mapeia o array de alternativas para criar os elementos clicáveis */}
        {alternativas.map(alt => {
          // Lógica para determinar o ícone e as classes de feedback para ESTA alternativa
          const altLetter = alt.letra;
          const altFeedback = feedback[altLetter]; // Pega o feedback ('correct-choice', 'incorrect-choice', 'correct-answer', ou undefined)
          let icon = altLetter; // Ícone padrão é a letra
          let letterBoxClass = 'alternative-letter'; // Classe padrão do box da letra
          let itemClass = 'alternative-item'; // Classe padrão da linha

          if (answered) { // Aplica feedback visual apenas se a questão foi respondida/revelada
            if (altFeedback === 'correct-choice' || altFeedback === 'correct-answer') {
              icon = '✔';
              letterBoxClass += ' feedback-correct'; // Adiciona classe para fundo/cor verde
              itemClass += ' correct-answer';      // Adiciona classe para fundo/borda verde claro na linha
              if (altFeedback === 'correct-choice') {
                 itemClass += ' correct-choice'; // Classe extra se foi a escolha correta
              }
            } else if (altFeedback === 'incorrect-choice') {
              icon = '✖';
              letterBoxClass += ' feedback-incorrect'; // Adiciona classe para fundo/cor vermelha
              itemClass += ' incorrect-choice';   // Adiciona classe para fundo/borda vermelha clara na linha
            }
            // Se não for nenhuma das condições acima, as classes e o ícone permanecem os padrões (letra)
          }

          // Renderiza o elemento da alternativa
          return (
            <div
              key={altLetter} // Chave única para o React
              className={itemClass} // Aplica as classes calculadas para a linha
              data-letter={altLetter} // Armazena a letra para fácil acesso no JS
              role="button" // Semântica para acessibilidade
              tabIndex={answered ? -1 : 0} // Remove do Tab se respondido
              onClick={() => handleAlternativeClick(altLetter)} // Chama handler ao clicar
              onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleAlternativeClick(altLetter)}} // Permite selecionar com Enter/Espaço
            >
              <span className={letterBoxClass}> {/* Aplica classes calculadas para o box da letra */}
                {icon} {/* Exibe a letra ou o ícone de feedback */}
              </span>
              <span className="alternative-text">{alt.texto || ''}</span> {/* Exibe o texto da alternativa */}
            </div>
          );
        })}
      </div>

      {/* Rodapé com Botão ou Resposta Correta */}
      <div className="question-footer">
        {/* Mostra o botão "Mostrar Resposta" APENAS se a questão NÃO foi respondida */}
        {!answered && <button className="show-answer-btn" onClick={handleShowAnswerClick}>Mostrar Resposta</button>}
        {/* Mostra o texto da resposta correta APENAS se a questão FOI respondida */}
        {answered && (
          <span className="correct-answer-text">
            Correta: {resposta_letra}) {alternativas.find(a => a.letra === resposta_letra)?.texto || ''}
          </span>
        )}
      </div>
    </div>
  );
}

export default QuestionLayout; // Exporta o componente
import React from 'react';
import QuestionLayout from '../../../components/common/QuestionLayout'; // Caminho para pasta comum

function QuestionList({ questions }) { // Recebe a lista filtrada
    if (!questions || questions.length === 0) {
        return <p className="no-results-message">Nenhuma questão encontrada com os filtros selecionados.</p>;
    }

    return (
        // Pode voltar a usar um container simples ou o ID que tinha antes
        <div className="question-list-container">
            {questions.map((question, index) => (
                // Renderiza QuestionLayout para cada questão na lista filtrada
                <QuestionLayout key={question.id || `q-${index}`} questionData={question} />
            ))}
        </div>
    );
}

export default QuestionList;
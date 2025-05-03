import React from 'react';
// --- Import Atualizado ---
import QuestionLayout from '../../../components/common/QuestionLayout'; // Caminho para pasta comum

function QuestionList({ questions }) {
    if (!questions || questions.length === 0) {
        return <p className="no-results-message">Nenhuma questão encontrada com os filtros selecionados.</p>;
    }

    return (
        <div className="question-list-container">
            {questions.map((question, index) => (
                <QuestionLayout key={question.id || `q-${index}`} questionData={question} /> // Adicionado prefixo ao index key
            ))}
        </div>
    );
}

export default QuestionList;
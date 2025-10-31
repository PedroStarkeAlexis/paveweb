import React from 'react';
import QuestionLayout from '../../../components/common/QuestionLayout';

/**
 * Componente reutilizável para renderizar uma lista de questões
 * Centraliza a lógica de iteração e renderização de questões
 * 
 * @param {Object} props
 * @param {Array} props.questions - Array de questões a serem renderizadas
 * @param {string} [props.emptyMessage] - Mensagem customizada quando não há questões
 * @param {string} [props.containerClassName] - Classe CSS customizada para o container
 */
function QuestionList({ questions, emptyMessage = 'Nenhuma questão encontrada.', containerClassName = 'question-list-container' }) {
    if (!questions || questions.length === 0) {
        return <p className="no-results-message">{emptyMessage}</p>;
    }

    return (
        <div className={containerClassName}>
            {questions.map((question, index) => (
                <QuestionLayout 
                    key={question.id || `question-${index}`} 
                    questionData={question} 
                    itemProva={question} 
                />
            ))}
        </div>
    );
}

export default QuestionList;
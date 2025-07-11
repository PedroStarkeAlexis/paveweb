import React, { useState, useEffect } from 'react';
import './CreateQuestionPage.css';

function CreateQuestionPage() {
  // O estado controlará a exibição do formulário, loading ou resultados
  const [pageState, setPageState] = useState('FORM'); // 'FORM', 'LOADING', 'RESULT'

  return (
    <div className="create-question-page-container">
      <h1 className="create-question-title">Gerador de Questões</h1>
      <p className="create-question-subtitle">
        Descreva o que você precisa e a IA criará questões no estilo do PAVE para você.
      </p>
      {/* O conteúdo do formulário, loading e resultados será adicionado na próxima etapa. */}
      <div style={{ marginTop: '2rem', textAlign: 'center', fontStyle: 'italic', color: 'var(--text-muted)' }}>
        [Área do formulário de criação de questões será implementada aqui]
      </div>
    </div>
  );
}

export default CreateQuestionPage;
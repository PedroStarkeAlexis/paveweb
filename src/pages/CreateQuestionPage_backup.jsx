import React, { useState, useEffect } from 'react';
import QuestionLayout from '../components/common/QuestionLayout';
import QuestionCarousel from '../features/chat/components/QuestionCarousel';
import './CreateQuestionPage.css';

// Componente para o indicador de carregamento aprimorado
const LoadingIndicator = () => (
  <div className="loading-indicator-container">
    <div className="loading-animation">
      <div className="loading-spinner"></div>
      <div className="loading-pulse"></div>
    </div>
    <div className="loading-content">
      <h3 className="loading-title">Gerando questões personalizadas</h3>
      <p className="loading-text">Nossa IA está criando questões específicas para o seu tópico...</p>
      <div className="loading-steps">
        <div className="step active">📝 Analisando conteúdo</div>
        <div className="step">🧠 Processando com IA</div>
        <div className="step">✨ Finalizando questões</div>
      </div>
    </div>
  </div>
);

// Componente para ícones SVG
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
  </svg>
);

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V11H13V17ZM13 9H11V7H13V9Z" fill="currentColor"/>
  </svg>
);

function CreateQuestionPage() {
  const [pageState, setPageState] = useState('FORM'); // 'FORM', 'LOADING', 'RESULT'
  const [formData, setFormData] = useState({
    subject: '',
    topic: '',
    customTopic: '',
    count: 1,
  });
  const [paveContent, setPaveContent] = useState({ materias: [] });
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [error, setError] = useState(null);

  // Carrega as matérias e tópicos do arquivo JSON
  useEffect(() => {
    const fetchPaveContent = async () => {
      try {
        const response = await fetch('/data/pave-content.json');
        if (!response.ok) throw new Error('Falha ao carregar conteúdo do PAVE.');
        const data = await response.json();
        setPaveContent(data);
      } catch (err) {
        setError('Não foi possível carregar as opções de matéria e tópico.');
        console.error(err);
      }
    };
    fetchPaveContent();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };

    // Se a matéria mudou, reseta o tópico
    if (name === 'subject') {
      newFormData.topic = '';
    }
    setFormData(newFormData);
  };

  const handleGenerateClick = async (e) => {
    e.preventDefault();
    setError(null);
    setPageState('LOADING');

    try {
      const requestBody = {
        subject: formData.subject,
        topic: formData.topic,
        customTopic: formData.customTopic,
        count: Number(formData.count),
        // Opcional: enviar o modelName se tiver o seletor de dev ativo
        // modelName: localStorage.getItem('dev_selected_gemini_model') || undefined,
      };

      const response = await fetch('/api/create-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Erro ${response.status}`);
      }

      setGeneratedQuestions(data.questions || []);
      setPageState('RESULT');

    } catch (err) {
      console.error("Erro ao gerar questão:", err);
      setError(err.message);
      setPageState('RESULT'); // Vai para a tela de resultado para mostrar o erro
      setGeneratedQuestions([]); // Limpa questões anteriores
    }
  };

  const handleReset = () => {
    setPageState('FORM');
    setGeneratedQuestions([]);
    setError(null);
    // Opcional: resetar os dados do formulário
    // setFormData({ subject: '', topic: '', customTopic: '', count: 1 });
  };

  const availableTopics = paveContent.materias.find(m => m.nome === formData.subject)?.topicos || [];
  const isFormValid = formData.subject && (formData.topic || formData.customTopic.trim() !== '');

  return (
    <div className="create-question-page-container question-bank-container">
      {pageState === 'FORM' && (
        <>
          <h1 className="create-question-title">Gerador de Questões ✨</h1>
          <p className="create-question-subtitle">Selecione uma matéria, um tópico (ou descreva o seu) e a quantidade de questões que deseja gerar.</p>
          <form className="generation-form" onSubmit={handleGenerateClick}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="subject">Matéria</label>
                <select id="subject" name="subject" value={formData.subject} onChange={handleInputChange} required>
                  <option value="" disabled>Selecione uma matéria...</option>
                  {paveContent.materias.map(m => <option key={m.nome} value={m.nome}>{m.nome}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="topic">Tópico (Pré-definido)</label>
                <select id="topic" name="topic" value={formData.topic} onChange={handleInputChange} disabled={!formData.subject}>
                  <option value="" disabled>Selecione um tópico...</option>
                  {availableTopics.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group form-group-full">
                <label htmlFor="customTopic">...ou descreva um Tópico Personalizado</label>
                <textarea id="customTopic" name="customTopic" value={formData.customTopic} onChange={handleInputChange} placeholder="Ex: A participa��ão do Brasil na Segunda Guerra Mundial" rows="3"></textarea>
              </div>
              <div className="form-group">
                <label htmlFor="count">Quantidade</label>
                <input type="number" id="count" name="count" value={formData.count} onChange={handleInputChange} min="1" max="5" required />
              </div>
            </div>
            <button type="submit" className="generate-button" disabled={!isFormValid}>Gerar Questão</button>
          </form>
        </>
      )}
      {pageState === 'LOADING' && <LoadingIndicator />}
      {pageState === 'RESULT' && (
        <div className="results-container">
          <button onClick={handleReset} className="back-to-form-button">← Gerar Outra Questão</button>
          {error && <div className="error-message-box">{error}</div>}
          {generatedQuestions.length > 0 && (
            <QuestionCarousel questionsData={generatedQuestions} />
          )}
        </div>
      )}
    </div>
  );
}

export default CreateQuestionPage;
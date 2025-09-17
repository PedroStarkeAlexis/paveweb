import React, { useState, useEffect } from 'react';
import QuestionLayout from '../components/common/QuestionLayout';
import QuestionCarousel from '../features/chat/components/QuestionCarousel';
import './CreateQuestionPage.css';

// Componente para o indicador de carregamento aprimorado
const LoadingIndicator = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    { emoji: '📝', text: 'Analisando conteúdo' },
    { emoji: '🧠', text: 'Processando com IA' },
    { emoji: '✨', text: 'Finalizando questões' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="loading-indicator-container" 
      role="status" 
      aria-live="polite"
      aria-label="Carregamento em andamento"
    >
      <div className="loading-animation">
        <div className="loading-spinner" aria-hidden="true"></div>
        <div className="loading-pulse" aria-hidden="true"></div>
      </div>
      <div className="loading-content">
        <h3 className="loading-title">Gerando questões personalizadas</h3>
        <p className="loading-text">Nossa IA está criando questões específicas para o seu tópico...</p>
        <div className="loading-steps" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemax={steps.length}>
          {steps.map((step, index) => (
            <div 
              key={index}
              className={`step ${index === currentStep ? 'active' : index < currentStep ? 'completed' : ''}`}
              aria-current={index === currentStep ? 'step' : undefined}
            >
              <span aria-hidden="true">{step.emoji}</span> {step.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

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
    <div className="create-question-page-container">
      {pageState === 'FORM' && (
        <div className="form-section">
          <div className="page-title-area">
            <h1 className="create-question-title">
              <span className="title-emoji">✨</span>
              Gerador de Questões
            </h1>
            <p className="create-question-subtitle">
              Selecione uma matéria, escolha um tópico e deixe nossa IA gerar questões para você.
            </p>
          </div>

          <div className="form-container">
            <form className="generation-form" onSubmit={handleGenerateClick} noValidate>
              <fieldset className="form-grid">
                <legend className="sr-only">Configuração da geração de questões</legend>
                <div className="form-group">
                  <label htmlFor="subject" className="form-label">
                    <span>Matéria</span>
                    <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <select 
                      id="subject" 
                      name="subject" 
                      value={formData.subject} 
                      onChange={handleInputChange} 
                      required
                      className="form-select"
                    >
                      <option value="" disabled>Selecione uma matéria...</option>
                      {paveContent.materias.map(m => (
                        <option key={m.nome} value={m.nome}>{m.nome}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="topic" className="form-label">
                    <span>Tópico</span>
                  </label>
                  <div className="input-wrapper">
                    <select 
                      id="topic" 
                      name="topic" 
                      value={formData.topic} 
                      onChange={handleInputChange} 
                      disabled={!formData.subject}
                      className="form-select"
                    >
                      <option value="" disabled>
                        {formData.subject ? 'Selecione um tópico...' : 'Primeiro selecione uma matéria'}
                      </option>
                      {availableTopics.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group form-group-full">
                  <label htmlFor="customTopic" className="form-label">
                    <span>Tópico Personalizado</span>
                    <span className="optional">(opcional)</span>
                  </label>
                  <div className="input-wrapper">
                    <textarea 
                      id="customTopic" 
                      name="customTopic" 
                      value={formData.customTopic} 
                      onChange={handleInputChange} 
                      placeholder="Ou descreva um tópico específico..."
                      rows="3"
                      className="form-textarea"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="count" className="form-label">
                    <span>Quantidade</span>
                    <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <input 
                      type="number" 
                      id="count" 
                      name="count" 
                      value={formData.count} 
                      onChange={handleInputChange} 
                      min="1" 
                      max="5" 
                      required
                      className="form-input"
                    />
                  </div>
                  <div className="field-hint">Máximo de 5 questões</div>
                </div>
              </fieldset>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className={`generate-button ${!isFormValid ? 'disabled' : ''}`}
                  disabled={!isFormValid}
                >
                  <span className="button-text">Gerar Questões</span>
                  <span className="button-icon">🚀</span>
                </button>
                {!isFormValid && (
                  <p className="validation-message" role="alert" aria-live="polite">
                    Preencha a matéria e escolha um tópico para continuar
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {pageState === 'LOADING' && <LoadingIndicator />}

      {pageState === 'RESULT' && (
        <div className="results-section">
          <div className="results-header">
            <button onClick={handleReset} className="back-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12L15.41 7.41Z" fill="currentColor"/>
              </svg>
              Nova Geração
            </button>
            {generatedQuestions.length > 0 && (
              <div className="success-badge">
                <CheckIcon />
                <span>{generatedQuestions.length} questão(ões) gerada(s)!</span>
              </div>
            )}
          </div>
          
          {error && (
            <div className="error-container">
              <div className="error-message-box">
                <div className="error-icon">⚠️</div>
                <div className="error-content">
                  <h4>Algo deu errado</h4>
                  <p>{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {generatedQuestions.length > 0 && (
            <div className="carousel-container">
              <QuestionCarousel questionsData={generatedQuestions} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CreateQuestionPage;
import React, { useState, useEffect } from 'react';
import QuestionLayout from '../components/common/QuestionLayout';
import QuestionCarousel from '../features/chat/components/QuestionCarousel';
import './CreateQuestionPage.css';

// Componente para o indicador de carregamento
const LoadingIndicator = () => (
  <div className="flex flex-col items-center justify-center gap-5 py-12 flex-grow">
    <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-b-emerald-600 rounded-full animate-spin"></div>
    <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">Gerando suas questões... Por favor, aguarde.</p>
  </div>
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
    <div className="p-4 sm:p-6 max-w-4xl mx-auto flex flex-col gap-5">
      {pageState === 'FORM' && (
        <>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-4 mb-2">
            Gerador de Questões ✨
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed -mt-4 mb-6">
            Selecione uma matéria, um tópico (ou descreva o seu) e a quantidade de questões que deseja gerar.
          </p>
          <form className="flex flex-col gap-6" onSubmit={handleGenerateClick}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="subject" className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                  Matéria
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                >
                  <option value="" disabled>Selecione uma matéria...</option>
                  {paveContent.materias.map(m => <option key={m.nome} value={m.nome}>{m.nome}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="topic" className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                  Tópico (Pré-definido)
                </label>
                <select
                  id="topic"
                  name="topic"
                  value={formData.topic}
                  onChange={handleInputChange}
                  disabled={!formData.subject}
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition disabled:bg-gray-100 dark:disabled:bg-gray-700/50 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>Selecione um tópico...</option>
                  {availableTopics.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="md:col-span-2 flex flex-col gap-2">
                <label htmlFor="customTopic" className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                  ...ou descreva um Tópico Personalizado
                </label>
                <textarea
                  id="customTopic"
                  name="customTopic"
                  value={formData.customTopic}
                  onChange={handleInputChange}
                  placeholder="Ex: A participação do Brasil na Segunda Guerra Mundial"
                  rows="3"
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition min-h-[80px] resize-y"
                ></textarea>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="count" className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                  Quantidade
                </label>
                <input
                  type="number"
                  id="count"
                  name="count"
                  value={formData.count}
                  onChange={handleInputChange}
                  min="1"
                  max="5"
                  required
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>
            </div>
            <button
              type="submit"
              className="self-start py-2 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-base font-medium cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isFormValid}
            >
              Gerar Questão
            </button>
          </form>
        </>
      )}
      {pageState === 'LOADING' && <LoadingIndicator />}
      {pageState === 'RESULT' && (
        <div className="flex flex-col gap-5">
          <button onClick={handleReset} className="self-start bg-transparent border-none text-emerald-600 hover:text-emerald-700 font-medium text-sm cursor-pointer p-1">
            ← Gerar Outra Questão
          </button>
          {error && <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-400 dark:border-red-600 p-4 rounded-lg font-medium">{error}</div>}
          {generatedQuestions.length > 0 && (
            <QuestionCarousel questionsData={generatedQuestions} />
          )}
        </div>
      )}
    </div>
  );
}

export default CreateQuestionPage;
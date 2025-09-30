import React, { useState } from 'react';
import QuickAccessTab from '../features/bancoQuestoes/components/QuickAccessTab';
import AllQuestionsPage from '../features/bancoQuestoes/components/AllQuestionsPage';
import './QuestionHubPage.css';

function QuestionHubPage() {
  const [activeTab, setActiveTab] = useState('quick-access');
  const [searchFilters, setSearchFilters] = useState({});

  const handleSelectFilter = (filter) => {
    setSearchFilters(filter);
    setActiveTab('search');
  };

  return (
    <div className="question-hub-container">
      <header className="question-hub-header">
        <h1>Banco de Questões</h1>
        <p>Explore as questões do PAVE da maneira que preferir.</p>
      </header>

      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'quick-access' ? 'active' : ''}`}
          onClick={() => setActiveTab('quick-access')}
        >
          Acesso Rápido
        </button>
        <button
          className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          Busca de Questões
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'quick-access' && (
          <QuickAccessTab onSelectFilter={handleSelectFilter} />
        )}
        {activeTab === 'search' && (
          <AllQuestionsPage initialFilters={searchFilters} />
        )}
      </div>
    </div>
  );
}

export default QuestionHubPage;

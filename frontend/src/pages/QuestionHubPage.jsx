import React, { useState } from 'react';
import QuickAccessTab from '../features/questions/components/QuickAccessTab';
import AllQuestionsPage from '../features/questions/components/AllQuestionsPage';
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

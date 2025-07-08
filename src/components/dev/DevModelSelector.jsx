import React, { useState, useEffect } from 'react';
import './DevModelSelector.css';

function DevModelSelector({ isOpen, onClose, currentModel, onSelectModel }) {
  const [models, setModels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only fetch models if the modal is open and we haven't fetched them yet.
    if (isOpen && models.length === 0 && !isLoading) {
      const fetchModels = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch('/api/get-models');
          if (!response.ok) {
            throw new Error(`Falha ao buscar modelos: ${response.statusText}`);
          }
          const data = await response.json();
          setModels(data);
        } catch (err) {
          setError(err.message);
          console.error("Erro ao buscar modelos:", err);
        } finally {
          setIsLoading(false);
        }
      };

      fetchModels();
    }
    // Dependency array: runs when `isOpen` changes.
  }, [isOpen, models.length, isLoading]);

  if (!isOpen) {
    return null;
  }

  const handleModelChange = (event) => onSelectModel(event.target.value);

  const renderContent = () => {
    if (isLoading) {
      return <p>Carregando modelos...</p>;
    }
    if (error) {
      return <p style={{ color: 'var(--error-primary)' }}>Erro: {error}</p>;
    }
    if (models.length === 0) {
      return <p>Nenhum modelo disponível encontrado.</p>;
    }
    return models.map((model) => (
      <label key={model.id} className="dev-model-option">
        <input
          type="radio"
          name="gemini-model"
          value={model.id}
          checked={currentModel === model.id}
          onChange={handleModelChange}
        />
        <span className="dev-model-name">{model.name}</span>
        {model.id === currentModel && <span className="dev-model-current-tag">(Atual)</span>}
      </label>
    ));
  };

  return (
    <div className="dev-model-selector-overlay" onClick={onClose}>
      <div className="dev-model-selector-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Selecionar Modelo Gemini (Dev)</h2>
        <p>O modelo selecionado será usado para as próximas chamadas à API.</p>
        <div className="dev-model-list">
          {renderContent()}
        </div>
        <button onClick={onClose} className="dev-model-close-btn">
          Fechar
        </button>
        <p className="dev-model-shortcut-info">
          Atalho: <strong>Ctrl/Cmd + Shift + M</strong>
        </p>
      </div>
    </div>
  );
}

export default DevModelSelector;
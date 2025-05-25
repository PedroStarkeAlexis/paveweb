import React from 'react';
import './DevModelSelector.css';

// ATUALIZADO: Lista de modelos baseada na imagem
const AVAILABLE_MODELS = [
  { id: 'gemini-2.5-flash-preview-05-20', name: 'Gemini 2.5 Flash Preview 05-20 (Padrão)' },
  { id: 'gemini-2.5-pro-preview-05-06', name: 'Gemini 2.5 Pro Preview 05-06' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
  { id: 'gemini-2.0-flash-lite-latest', name: 'Gemini 2.0 Flash-Lite' },
  { id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash' },
  { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash-8B' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
  // Adicionar aqui modelos legados que estavam antes, se ainda quiser testá-los
  // { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro (Legado)' },
];

function DevModelSelector({ isOpen, onClose, currentModel, onSelectModel }) {
  if (!isOpen) {
    return null;
  }

  const handleModelChange = (event) => {
    onSelectModel(event.target.value);
  };

  return (
    <div className="dev-model-selector-overlay" onClick={onClose}>
      <div className="dev-model-selector-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Selecionar Modelo Gemini (Dev)</h2>
        <p>O modelo selecionado será usado para as próximas chamadas à API.</p>
        <div className="dev-model-list">
          {AVAILABLE_MODELS.map((model) => (
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
          ))}
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
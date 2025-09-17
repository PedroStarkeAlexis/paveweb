
import React, { useState } from 'react';
import './FlashcardGeneratorPage.css';
import Flashcard from './components/Flashcard'; // Supondo que o componente Flashcard seja criado

const FlashcardGeneratorPage = () => {
    const [topic, setTopic] = useState('');
    const [flashcards, setFlashcards] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError('Por favor, insira um tópico.');
            return;
        }

        setIsLoading(true);
        setError('');
        setFlashcards([]);

        try {
            const response = await fetch('/api/generate-flashcards', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ topic }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Falha ao gerar flashcards.');
            }

            const data = await response.json();
            setFlashcards(data.flashcards || []);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flashcard-generator-page">
            <div className="generator-header">
                <h1 className="title">Gerador de Flashcards</h1>
                <p className="subtitle">Insira um tópico para gerar flashcards de estudo com a ajuda da IA.</p>
            </div>

            <div className="input-container">
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Ex: Revolução Francesa, Capitais da Europa, Funções em JavaScript..."
                    className="topic-input"
                    onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
                    disabled={isLoading}
                />
                <button onClick={handleGenerate} disabled={isLoading} className="generate-button">
                    {isLoading ? 'Gerando...' : 'Gerar Flashcards'}
                </button>
            </div>

            {error && <p className="error-message">{error}</p>}

            {isLoading && (
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Criando flashcards sobre "{topic}"...</p>
                </div>
            )}

            {flashcards.length > 0 && (
                <div className="flashcards-grid">
                    {flashcards.map((card, index) => (
                        <Flashcard key={index} term={card.term} definition={card.definition} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default FlashcardGeneratorPage;

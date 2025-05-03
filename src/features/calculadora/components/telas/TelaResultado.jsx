// src/features/calculadora/components/telas/TelaResultado.jsx
import React from 'react';

// Componentes
import TabelaDetalhadaResultado from '../TabelaDetalhadaResultado';
import ShareButton from '../ShareButton';
import ScoreGauge from '../visuals/ScoreGauge';
import CourseInfoCard from '../visuals/CourseInfoCard';

// CSS
import './TelaResultadoRenovado.css'; // <<< NOVO NOME PARA O CSS

// Função auxiliar (sem alterações)
const getFeedbackMessage = (chances, cursoNome) => {
    if (!cursoNome || !chances) return "Simule novamente para ver suas chances!";
    switch (chances) {
        case 'Altas': return `Parabéns! Você tem ótimas chances de passar em ${cursoNome}! 🎉`;
        case 'Médias': return `Boas notícias! Suas chances são consideráveis para ${cursoNome}. Continue se esforçando! 👍`;
        case 'Baixas': return `A disputa é acirrada para ${cursoNome}. Você precisará de um ótimo desempenho! 💪`;
        default: return `Não foi possível determinar suas chances para ${cursoNome}.`;
    }
};

function TelaResultado({ resultados, onSimularNovamente }) {
    const {
        notaFinal,
        cursoSelecionadoInfo,
        chances,
        notasEtapas,
        incluirRedacao,
        notaRedacao
    } = resultados || {};

    const feedbackMessage = getFeedbackMessage(chances, cursoSelecionadoInfo?.nome);

    return (
        // Container principal com novo nome de classe
        <div className="calc-tela-resultado-renovado">

            {/* 1. Mensagem de Feedback */}
            <p className="calc-resultado-feedback-msg">{feedbackMessage}</p>

            {/* 2. Seção Hero (Gauge + Card Curso) */}
            <div className="calc-resultado-hero-section">
                {/* Gauge */}
                <div className="calc-resultado-gauge-area">
                    <ScoreGauge
                        score={notaFinal}
                        maxScore={100}
                        size={180}
                        strokeWidth={14}
                        chances={chances} // <<< PASSA A PROP 'chances'
                    />
                </div>
                {/* Card Curso */}
                <div className="calc-resultado-course-area">
                     {cursoSelecionadoInfo ? (
                          <CourseInfoCard curso={cursoSelecionadoInfo} chances={chances} />
                     ) : (
                          <p className="calc-curso-nao-selecionado">Nenhum curso selecionado para comparação.</p>
                     )}
                </div>
            </div>

            {/* 3. Seção de Detalhes (Tabela + Share) */}
            <div className="calc-resultado-details-section">
                <h3 className="calc-details-titulo">Detalhes do Cálculo</h3>
                {/* Tabela */}
                <div className="calc-resultado-tabela-wrapper">
                    {notasEtapas && (
                         <TabelaDetalhadaResultado
                             notasEtapas={notasEtapas}
                             notaRedacao={notaRedacao}
                             incluirRedacao={incluirRedacao}
                             notaFinal={notaFinal}
                         />
                    )}
                </div>
                {/* Botão Share */}
                 <div className="calc-resultado-share-wrapper">
                     <ShareButton resultadoCompleto={resultados} />
                 </div>
            </div>

             {/* Botão Simular Novamente fica no footer do Wizard */}

        </div> // Fim calc-tela-resultado-renovado
    );
}

export default TelaResultado;
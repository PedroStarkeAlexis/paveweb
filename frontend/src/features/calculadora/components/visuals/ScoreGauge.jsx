// src/features/calculadora/components/visuals/ScoreGauge.jsx
import React from 'react';
import './ScoreGauge.css';

const chanceToClassMap = {
    'Altas': 'progress-altas',
    'Médias': 'progress-medias',
    'Baixas': 'progress-baixas',
    'Indeterminadas': 'progress-indeterminadas',
};

function ScoreGauge({
    score,
    maxScore = 100,
    size = 180,
    strokeWidth = 14,
    chances
}) {

    const validScore = Math.max(0, Math.min(maxScore, parseFloat(score) || 0));
    const validMaxScore = Math.max(1, parseFloat(maxScore) || 1);

    const radius = (size / 2) - (strokeWidth);
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (validScore / validMaxScore) * circumference;
    const formattedScore = validScore.toFixed(1);

    const progressClass = chanceToClassMap[chances] || 'progress-indeterminadas';

    return (
        <div className="calc-score-gauge" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Círculo de Fundo */}
                <circle
                    className="calc-gauge-background"
                    cx={size / 2} cy={size / 2} r={radius}
                    strokeWidth={strokeWidth * 0.8}
                />
                {/* Círculo Tracejado Interno */}
                <circle
                    className="calc-gauge-dashed-circle"
                    cx={size / 2} cy={size / 2} r={radius * 0.85}
                    strokeWidth="1"
                    strokeDasharray="4 4"
                />
                {/* Círculo de Progresso */}
                <circle
                    className={`calc-gauge-progress ${progressClass}`}
                    cx={size / 2} cy={size / 2} r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    // <<< MUDANÇA: Rotação para começar em baixo (90 graus) >>>
                    transform={`rotate(90 ${size / 2} ${size / 2})`}
                />
                {/* Texto */}
                <text className="calc-gauge-text" x="50%" y="50%" textAnchor="middle">
                     {/* Ajuste leve no dy para a fonte maior */}
                    <tspan className="calc-gauge-text-label" x="50%" dy="-0.5em">Sua nota final:</tspan>
                    {/* Ajuste dy da nota para melhor centralização vertical */}
                    <tspan className="calc-gauge-text-score" x="50%" dy="1.15em">{formattedScore}</tspan>
                </text>
            </svg>
        </div>
    );
}

export default ScoreGauge;
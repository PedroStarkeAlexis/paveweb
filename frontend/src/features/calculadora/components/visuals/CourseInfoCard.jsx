// src/features/calculadora/components/visuals/CourseInfoCard.jsx
import React from 'react';
import './CourseInfoCard.css';

// Ícones SVG simples (podem ser movidos para um arquivo separado depois)
const IconCalendar = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="1em" height="1em">
        <path fillRule="evenodd" d="M5.75 3a.75.75 0 0 1 .75.75V4h7V3.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V3.75A.75.75 0 0 1 5.75 3Zm-1 5.5h10.5a.75.75 0 0 0 0-1.5H4.75a.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
    </svg>
);
const IconClock = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="1em" height="1em">
        <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" />
    </svg>
);
const IconArrowUp = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="1em" height="1em">
        <path fillRule="evenodd" d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.28 9.78a.75.75 0 0 1-1.06-1.06l5.25-5.25a.75.75 0 0 1 1.06 0l5.25 5.25a.75.75 0 1 1-1.06 1.06L10.75 5.612V16.25a.75.75 0 0 1-.75.75Z" clipRule="evenodd" />
    </svg>
);
const IconArrowDown = () => (
     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="1em" height="1em">
         <path fillRule="evenodd" d="M10 3a.75.75 0 0 1 .75.75v10.638l3.97-3.968a.75.75 0 1 1 1.06 1.06l-5.25 5.25a.75.75 0 0 1-1.06 0l-5.25-5.25a.75.75 0 1 1 1.06-1.06l3.97 3.968V3.75A.75.75 0 0 1 10 3Z" clipRule="evenodd" />
     </svg>
);


function CourseInfoCard({ curso, chances }) {

    if (!curso) {
        return <div className="calc-course-card error"><p>Informações do curso não disponíveis.</p></div>;
    }

    const { nome = 'Curso não informado', notaCorte = null } = curso;
    const chancesFormatadas = chances || 'Indeterminadas';
    const chancesClass = `chances-${chancesFormatadas.toLowerCase()}`;

    // Define qual ícone usar para as chances
    let ChanceIcon = null;
    if (chances === 'Altas' || chances === 'Médias') ChanceIcon = IconArrowUp;
    if (chances === 'Baixas') ChanceIcon = IconArrowDown;

    return (
        // Adiciona classe de chance para a borda esquerda
        <div className={`calc-course-card ${chancesClass}`}>
            {/* Título com fundo sutil */}
            <div className="calc-course-card-title-wrapper">
                <h3 className="calc-course-card-title">{nome}</h3>
            </div>

            {/* Detalhes com ícones */}
            <div className="calc-course-card-details">
                <div className="calc-course-detail-item">
                    <span className="calc-detail-label"><IconCalendar /> Nota de Corte</span>
                    <span className="calc-detail-value">{notaCorte !== null ? notaCorte.toFixed(1) : 'N/D'}</span> {/* 1 decimal */}
                </div>
                <div className="calc-course-detail-item">
                    <span className="calc-detail-label">Suas Chances</span>
                    {/* Indicador de chance com ícone e cor */}
                    <span className={`calc-detail-value calc-chance-indicator ${chancesClass}`}>
                        {ChanceIcon && <ChanceIcon />} {/* Renderiza ícone se existir */}
                        {chancesFormatadas}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default CourseInfoCard;
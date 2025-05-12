// src/components/icons/IconCalculator.jsx
import React from 'react';

const IconCalculator = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24" // Tamanho base, CSS pode sobrescrever
    height="24" // Tamanho base, CSS pode sobrescrever
    viewBox="0 0 24 24"
    strokeWidth="1.5" // Consistente com Heroicons e Tabler padrão
    stroke="currentColor"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" /> {/* Path de reset/bounding box comum em Tabler Icons */}
    {/* Corpo da Calculadora */}
    <path d="M4 3m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
    {/* Visor */}
    <path d="M8 7m0 1a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1v1a1 1 0 0 1 -1 1h-6a1 1 0 0 1 -1 -1z" />
    {/* Botões como pontos (minimalista) */}
    <path d="M8 14l0 .01" />
    <path d="M12 14l0 .01" />
    <path d="M16 14l0 .01" />
    <path d="M8 17l0 .01" />
    <path d="M12 17l0 .01" />
    <path d="M16 17l0 .01" />
  </svg>
);

export default IconCalculator;
// src/features/calculadora/components/ShareButton.jsx
import React, { useState, useCallback } from 'react';

// Importar Constantes se necessário para formatar texto (Ex: Etapas)
import { ETAPA_VIEW_1, ETAPA_VIEW_2, ETAPA_VIEW_3, NOTA_MIN_REDAÇÃO, NOTA_MAX_REDAÇÃO } from '../constants';

// Importar o CSS
import './ShareButton.css';

function ShareButton({ resultadoCompleto }) {
    const [copyStatus, setCopyStatus] = useState(''); // '', 'copied', 'error'

    // Desestrutura os dados necessários do objeto recebido
    const {
        notasEtapas,
        notaRedacao,
        incluirRedacao,
        notaFinal,
        cursoSelecionadoInfo,
        chances
    } = resultadoCompleto || {}; // Usa fallback

    // Função para formatar o texto a ser compartilhado/copiado
    const formatShareText = useCallback(() => {
        // Fallback para valores caso 'resultadoCompleto' seja nulo ou incompleto
        const safeNotasEtapas = notasEtapas || {};
        const nf = notaFinal !== null ? notaFinal.toFixed(2) : 'N/A';
        const notaE1 = (safeNotasEtapas[ETAPA_VIEW_1] || 0).toFixed(2);
        const notaE2 = (safeNotasEtapas[ETAPA_VIEW_2] || 0).toFixed(2);
        const notaE3Obj = (safeNotasEtapas[ETAPA_VIEW_3] || 0).toFixed(2);
        // Usa a nota da redação já validada passada em resultadoCompleto
        const redacaoValida = incluirRedacao ? (notaRedacao || 0).toFixed(2) : null;
        const cursoNome = cursoSelecionadoInfo?.nome || "Curso não selecionado";
        const chanceTexto = chances ? `(${chances})` : '';

        // Monta o texto
        let text = `📊 Simulação PAVE UFPel:\n\n`;
        text += `🎯 Curso: ${cursoNome} ${chanceTexto}\n`;
        text += `🏆 Nota Final Calculada: ${nf}\n`;
        text += `----------\n`;
        text += `Etapa 1: ${notaE1}\n`;
        text += `Etapa 2: ${notaE2}\n`;
        text += `Etapa 3 (Obj): ${notaE3Obj}\n`;
        if (incluirRedacao && redacaoValida !== null) {
            text += `✍️ Redação: ${redacaoValida}\n`;
        }
        text += `----------\n`;
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        text += `🔗 Simule a sua: ${baseUrl}/calculadora`; // Assume rota

        return text;
    }, [notasEtapas, notaRedacao, incluirRedacao, notaFinal, cursoSelecionadoInfo, chances]); // Dependências

    // Handler para o clique no botão de compartilhar/copiar
    const handleShare = useCallback(async () => {
        const shareText = formatShareText();
        const shareData = { title: 'Simulação PAVE UFPel', text: shareText };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                setCopyStatus(''); // Limpa status após sucesso do share
            } else if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(shareText);
                setCopyStatus('copied');
                setTimeout(() => setCopyStatus(''), 2500);
            } else {
                setCopyStatus('error');
                setTimeout(() => setCopyStatus(''), 2500);
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Erro ao compartilhar/copiar:', error);
                setCopyStatus('error');
                setTimeout(() => setCopyStatus(''), 2500);
            } else {
                setCopyStatus(''); // Limpa se usuário cancelar
            }
        }
    }, [formatShareText]); // Depende da função de formatação

    // Renderiza o botão e a mensagem de feedback
    return (
        <div className="calc-share-button-container">
            <button onClick={handleShare} className="calc-botao-share">
                Compartilhar Resultado
                {/* Ícone SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="24" height="24" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M 15.990234 1.9902344 A 1.0001 1.0001 0 0 0 15.292969 3.7070312 L 17.585938 6 L 17 6 C 10.936593 6 6 10.936593 6 17 A 1.0001 1.0001 0 1 0 8 17 C 8 12.017407 12.017407 8 17 8 L 17.585938 8 L 15.292969 10.292969 A 1.0001 1.0001 0 1 0 16.707031 11.707031 L 20.707031 7.7070312 A 1.0001 1.0001 0 0 0 20.707031 6.2929688 L 16.707031 2.2929688 A 1.0001 1.0001 0 0 0 15.990234 1.9902344 z M 2.984375 7.9863281 A 1.0001 1.0001 0 0 0 2 9 L 2 19 C 2 20.64497 3.3550302 22 5 22 L 19 22 C 20.64497 22 22 20.64497 22 19 L 22 18 A 1.0001 1.0001 0 1 0 20 18 L 20 19 C 20 19.56503 19.56503 20 19 20 L 5 20 C 4.4349698 20 4 19.56503 4 19 L 4 9 A 1.0001 1.0001 0 0 0 2.984375 7.9863281 z"></path>
                </svg>
            </button>
            {/* Mensagem de Feedback */}
            {copyStatus === 'copied' && <span className="calc-copy-feedback success">Copiado!</span>}
            {copyStatus === 'error' && <span className="calc-copy-feedback error">Falha ao copiar/compartilhar.</span>}
        </div>
    );
}

export default ShareButton;
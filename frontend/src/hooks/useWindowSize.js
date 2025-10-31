import { useState, useEffect } from 'react';

// Hook customizado para obter as dimensões da janela do navegador
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    // Só executa no lado do cliente (navegador)
    if (typeof window !== 'undefined') {
      // Função para atualizar o estado com as dimensões da janela
      function handleResize() {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }
    
      // Adiciona um ouvinte de evento para 'resize'
      window.addEventListener("resize", handleResize);
     
      // Chama a função imediatamente para definir o tamanho inicial
      handleResize();
    
      // Remove o ouvinte de evento quando o componente é desmontado
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []); // O array vazio garante que o efeito só rode na montagem e desmontagem

  return windowSize;
}

export default useWindowSize;
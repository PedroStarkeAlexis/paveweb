// src/useDarkModeToggle.js
import { useEffect, useCallback } from 'react';

function useDarkModeToggle(darkMode, setDarkMode) {

  // useCallback para a função de toggle
  const toggleDarkMode = useCallback(() => {
    setDarkMode(prevMode => !prevMode);
  }, [setDarkMode]);

  // Efeito para adicionar/remover a classe e o atributo data-theme
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      document.documentElement.setAttribute('data-theme', 'dark'); // Adiciona para o <html>
    } else {
      document.body.classList.remove('dark-mode');
      document.documentElement.setAttribute('data-theme', 'light'); // Adiciona para o <html>
    }
  }, [darkMode]); // Executa sempre que darkMode mudar

  // Efeito para o atalho de teclado (opcional, pode manter ou remover)
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Exemplo: Ctrl+Shift+D (ou Cmd+Shift+D no Mac)
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toUpperCase() === 'D') {
         toggleDarkMode();
         event.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleDarkMode]); // Depende da função de toggle

  // Poderia adicionar aqui a lógica de localStorage e sync com sistema se desejado
  // Ex: Ler localStorage no início, usar matchMedia para atualizar, etc.
  // Por ora, mantemos sincronizado apenas com o estado do React.
}

export default useDarkModeToggle;
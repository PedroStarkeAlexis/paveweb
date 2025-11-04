import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';

/**
 * Arquivo de configuração do Vite.
 * O Vite é a ferramenta que "constrói" nosso projeto React, transformando
 * o código de desenvolvimento em arquivos otimizados para o navegador.
 */
export default defineConfig({
  // Adiciona o plugin do React para que o Vite entenda JSX.
  plugins: [react()],
  
  // Define a pasta raiz do nosso código frontend.
  root: resolve(__dirname, '../frontend'),
  
  // Configurações do processo de build.
  build: {
    // Define a pasta de saída para os arquivos finais (geralmente 'dist').
    outDir: resolve(__dirname, '../dist'),
    // Garante que a pasta de saída seja limpa antes de cada build.
    emptyOutDir: true
  },
  
  // Configura apelidos (aliases) para facilitar a importação de arquivos.
  resolve: {
    alias: {
      // Permite usar '@/' em vez de caminhos longos como '../../src/'.
      '@': resolve(__dirname, '../frontend/src')
    }
  },
  
  // Define qual pasta contém arquivos públicos (como imagens e fontes).
  publicDir: resolve(__dirname, '../frontend/public')
});

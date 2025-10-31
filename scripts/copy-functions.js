/**
 * Script legado mantido apenas por compatibilidade.
 *
 * As Cloudflare Pages Functions agora vivem diretamente em `functions/`,
 * então não é mais necessário copiar arquivos de `backend/`.
 *
 * Caso alguém execute este script por engano, registramos uma mensagem
 * orientando a usar a nova estrutura.
 */

console.warn('[copy-functions] Script legado: nenhuma ação necessária. As funções já residem em `functions/`.');

// functions/api/get-all-questions.js

// Handler para requisições GET nesta rota
export async function onRequestGet(context) {
    try {
      // -- Obtém acesso ao binding do R2 configurado no dashboard --
      const { env } = context;
      const r2Bucket = env.QUESTOES_PAVE_BUCKET; // Nome do binding R2
  
      // Verifica se o binding foi configurado corretamente
      if (!r2Bucket) {
        console.error('Erro: Binding R2 QUESTOES_PAVE_BUCKET não configurado nas definições do Pages.');
        return new Response(JSON.stringify({ error: 'Configuração interna do servidor incompleta (R2 Binding).' }), {
          status: 500, // Erro interno do servidor
          headers: { 'Content-Type': 'application/json' },
        });
      }
  
      // -- Busca o objeto JSON no R2 --
      const r2Object = await r2Bucket.get('questoes.json'); // Busca o arquivo pelo nome
  
      // Verifica se o arquivo foi encontrado no bucket
      if (r2Object === null) {
        console.error('Erro: Arquivo questoes.json não encontrado no bucket R2.');
        return new Response(JSON.stringify({ error: 'Base de dados de questões não encontrada.' }), {
          status: 404, // Not Found
          headers: { 'Content-Type': 'application/json' },
        });
      }
  
      // -- Retorna o conteúdo JSON diretamente --
      // Define o cabeçalho Content-Type para indicar que é JSON
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
  
      // Retorna o corpo do objeto R2 (que deve ser o JSON) como resposta
      // Isso é eficiente pois transmite os dados diretamente
      return new Response(r2Object.body, {
        headers: headers,
        status: 200 // OK
      });
  
    } catch (error) {
      // Captura qualquer erro inesperado durante o processo
      console.error('Worker /api/get-all-questions: Erro GERAL:', error);
      return new Response(JSON.stringify({ error: `Erro interno ao processar a solicitação: ${error.message}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  
  // Handler genérico para outros métodos HTTP (POST, PUT, etc.)
  // Retorna 405 Method Not Allowed para indicar que apenas GET é suportado nesta rota
  export async function onRequest(context) {
      if (context.request.method === 'GET') {
          return await onRequestGet(context);
      }
      // Para qualquer outro método, retorna erro
      return new Response(`Método ${context.request.method} não permitido nesta rota.`, { status: 405 });
  }
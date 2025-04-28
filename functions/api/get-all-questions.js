// functions/api/get-all-questions.js

export async function onRequestGet(context) {
    console.log("[LOG] Iniciando /api/get-all-questions (GET)"); // Log 1: Função Iniciada
    try {
      const { env } = context;
      const r2Bucket = env.QUESTOES_PAVE_BUCKET;
  
      if (!r2Bucket) {
        console.error("[ERRO] Binding R2 'QUESTOES_PAVE_BUCKET' não encontrado!");
        return new Response(JSON.stringify({ error: 'Configuração interna do servidor incompleta (R2 Binding).' }), {
          status: 500, headers: { 'Content-Type': 'application/json' },
        });
      }
      console.log("[LOG] Binding R2 encontrado."); // Log 2: Binding OK
  
      const objectName = 'questoes.json';
      console.log(`[LOG] Tentando buscar objeto: ${objectName}`); // Log 3: Tentando buscar
      const r2Object = await r2Bucket.get(objectName);
  
      if (r2Object === null) {
        console.error(`[ERRO] Objeto '${objectName}' não encontrado no bucket R2.`);
        return new Response(JSON.stringify({ error: 'Base de dados de questões não encontrada.' }), {
          status: 404, headers: { 'Content-Type': 'application/json' },
        });
      }
      console.log(`[LOG] Objeto '${objectName}' encontrado. Tamanho: ${r2Object.size} bytes.`); // Log 4: Objeto Encontrado
  
      // Verificação extra: Tenta ler uma pequena parte como texto para ver se parece JSON
      try {
          const head = await r2Object.text();
          console.log(`[LOG] Início do conteúdo do objeto: ${head.substring(0,50)}...`); // Log 5: Início do conteúdo
          // Tenta parsear para garantir que é JSON válido (opcional, pode consumir memória)
          // JSON.parse(head);
          // console.log("[LOG] Conteúdo parece ser JSON válido (parse test).");
      } catch(e) {
           console.error("[ERRO] Falha ao ler/verificar conteúdo do objeto R2:", e);
           // Não retorna erro aqui ainda, tenta retornar o body mesmo assim
      }
  
  
      console.log("[LOG] Preparando resposta com conteúdo JSON."); // Log 6: Preparando resposta
      const headers = new Headers();
      headers.set('Content-Type', 'application/json'); // Define o tipo de conteúdo
  
      // Retorna o corpo do objeto R2
      return new Response(r2Object.body, {
        headers: headers,
        status: 200
      });
  
    } catch (error) {
      console.error('[ERRO] Erro GERAL no catch da função:', error); // Log 7: Erro inesperado
      return new Response(JSON.stringify({ error: `Erro interno ao processar a solicitação: ${error.message}` }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  
  export async function onRequest(context) {
      // Log para qualquer request que chegue aqui
      console.log(`[LOG] Recebido request: ${context.request.method} ${context.request.url}`);
      if (context.request.method === 'GET') {
          return await onRequestGet(context);
      }
      // Para outros métodos, retorna 405
      console.warn(`[WARN] Método ${context.request.method} não permitido.`);
      return new Response(`Método ${context.request.method} não permitido nesta rota.`, { status: 405 });
  }
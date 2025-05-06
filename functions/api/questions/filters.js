export async function onRequestGet(context) {
  const { env } = context;
  const r2Bucket = env.QUESTOES_PAVE_BUCKET;

  if (!r2Bucket) {
    return new Response(
      JSON.stringify({ error: "Configuração interna do R2 faltando." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const r2Object = await r2Bucket.get("questoes.json");
    if (r2Object === null) {
      return new Response(
        JSON.stringify({ error: "Arquivo de questões não encontrado." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    const allQuestionsData = await r2Object.json();

    if (!Array.isArray(allQuestionsData)) {
      return new Response(
        JSON.stringify({ error: "Formato de dados inválido." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const anos = new Set();
    const materias = new Set();
    const etapas = new Set();

    allQuestionsData.forEach((q) => {
      if (q) {
        if (q.ano) anos.add(q.ano);
        if (q.materia) materias.add(q.materia);
        if (q.etapa) etapas.add(q.etapa);
      }
    });

    const responseBody = {
      anos: Array.from(anos).sort((a, b) => b - a),
      materias: Array.from(materias).sort(),
      etapas: Array.from(etapas).sort((a, b) => a - b),
    };

    return new Response(JSON.stringify(responseBody), {
      headers: {
        "Content-Type": "application/json",
        // Pode permitir cache mais longo para os filtros
        "Cache-Control": "public, max-age=3600", // Cache por 1 hora
      },
      status: 200,
    });
  } catch (error) {
    console.error(`[ERRO] /api/questions/filters:`, error);
    return new Response(
      JSON.stringify({
        error: `Erro ao obter opções de filtro: ${error.message}`,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Handler genérico
export async function onRequest(context) {
  if (context.request.method === "GET") {
    return await onRequestGet(context);
  }
  return new Response(
    `Método ${context.request.method} não permitido. Use GET.`,
    { status: 405 }
  );
}

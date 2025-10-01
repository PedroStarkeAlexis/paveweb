import { removeAccents } from "./filter"; // Reutilizar função existente
import { fetchAllQuestions } from "./utils/uploader.js"; // API externa

const DEFAULT_LIMIT = 20; // Número de questões por página

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const params = url.searchParams;

    // Parsear parâmetros de filtro e paginação
    const materia = params.get("materia");
    const anoStr = params.get("ano");
    const etapaStr = params.get("etapa");
    const page = parseInt(params.get("page") || "1", 10);
    const limit = parseInt(params.get("limit") || `${DEFAULT_LIMIT}`, 10);

    const ano = anoStr ? parseInt(anoStr, 10) : null;
    const etapa = etapaStr ? parseInt(etapaStr, 10) : null;

    if (page < 1 || limit < 1) {
      return new Response(
        JSON.stringify({ error: "Parâmetros de paginação inválidos." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Buscar todas as questões da API externa
    console.log('[DEBUG] Buscando questões via fetchAllQuestions...');
    const allQuestionsData = await fetchAllQuestions(env);
    
    if (!Array.isArray(allQuestionsData)) {
      console.error('[ERROR] fetchAllQuestions não retornou array:', allQuestionsData);
      return new Response(
        JSON.stringify({ error: "Formato de dados inválido." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    console.log(`[DEBUG] Total de questões recebidas: ${allQuestionsData.length}`);

    // Filtrar no backend
    const filteredQuestions = allQuestionsData.filter((q) => {
      if (!q || typeof q !== "object") return false;
      let match = true;
      if (
        materia &&
        q.materia &&
        removeAccents(q.materia.toLowerCase()) !==
          removeAccents(materia.toLowerCase())
      ) {
        match = false;
      }
      if (ano && q.ano && q.ano !== ano) {
        match = false;
      }
      if (etapa && q.etapa && q.etapa !== etapa) {
        match = false;
      }
      return match;
    });

    // Paginar
    const totalItems = filteredQuestions.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const questionsForPage = filteredQuestions.slice(startIndex, endIndex);

    // Montar resposta
    const responseBody = {
      questions: questionsForPage,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
        limit: limit,
      },
    };

    return new Response(JSON.stringify(responseBody), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      }, // Evitar cache na API
      status: 200,
    });
  } catch (error) {
    console.error(`[ERRO] /api/questions:`, error);
    return new Response(
      JSON.stringify({ error: `Erro ao processar questões: ${error.message}` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Handler genérico (permite apenas GET por enquanto)
export async function onRequest(context) {
  if (context.request.method === "GET") {
    return await onRequestGet(context);
  }
  return new Response(
    `Método ${context.request.method} não permitido. Use GET.`,
    { status: 405 }
  );
}

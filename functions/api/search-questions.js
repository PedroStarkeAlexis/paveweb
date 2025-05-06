// import { removeAccents } from './filter'; // Não é mais necessário aqui se os metadados já estão normalizados ou se o filtro é exato

const EMBEDDING_MODEL = "@cf/baai/bge-base-en-v1.5";
const DEFAULT_SEARCH_LIMIT = 10; // Resultados por página da busca vetorial
const DEFAULT_TOP_K = 50; // Quantos vetores mais próximos buscar inicialmente no Vectorize

export async function onRequestGet(context) {
  const { request, env } = context;
  const r2Bucket = env.QUESTOES_PAVE_BUCKET;
  const vectorIndex = env.QUESTIONS_INDEX;
  const ai = env.AI;

  if (!r2Bucket || !vectorIndex || !ai) {
    return new Response(
      JSON.stringify({
        error: "Bindings R2, Vectorize ou AI não configurados.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const url = new URL(request.url);
    const params = url.searchParams;

    const searchQuery = params.get("query");
    const materia = params.get("materia");
    const anoStr = params.get("ano");
    const etapaStr = params.get("etapa");
    const page = parseInt(params.get("page") || "1", 10);
    const limit = parseInt(
      params.get("limit") || `${DEFAULT_SEARCH_LIMIT}`,
      10
    );

    if (
      (!searchQuery || searchQuery.trim() === "") &&
      !materia &&
      !anoStr &&
      !etapaStr
    ) {
      // Se não houver query E nenhum filtro, não há o que buscar/filtrar de forma inteligente.
      // Poderia retornar erro ou redirecionar para uma listagem paginada genérica (se essa API ainda existir).
      // Por ora, retornamos uma lista vazia se não houver query para a busca vetorial.
      console.log(
        "Nenhuma query de busca ou filtro fornecido para search-questions. Retornando vazio."
      );
      return new Response(
        JSON.stringify({
          questions: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalItems: 0,
            limit: limit,
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    let matchedQuestionIds = [];
    let allQuestionsData = null; // Para carregar apenas uma vez se necessário

    if (searchQuery && searchQuery.trim() !== "") {
      // 1. Gerar embedding para a query do usuário
      const embeddingResponse = await ai.run(EMBEDDING_MODEL, {
        text: [searchQuery.trim()],
      });
      if (!embeddingResponse.data || !embeddingResponse.data[0]) {
        throw new Error(
          "Não foi possível gerar embedding para a query de busca."
        );
      }
      const queryVector = embeddingResponse.data[0];

      // 2. Construir opções de filtro para Vectorize (se houver filtros tradicionais junto com a busca)
      const vectorizeFilter = {};
      if (materia) vectorizeFilter.materia = materia;
      if (anoStr) vectorizeFilter.ano = parseInt(anoStr);
      if (etapaStr) vectorizeFilter.etapa = parseInt(etapaStr);

      const searchOptions = { topK: DEFAULT_TOP_K };
      if (Object.keys(vectorizeFilter).length > 0) {
        searchOptions.filter = vectorizeFilter;
      }
      console.log(
        "Consultando Vectorize com query:",
        searchQuery,
        "e filtro:",
        vectorizeFilter
      );
      const vectorMatches = await vectorIndex.query(queryVector, searchOptions);
      console.log(
        `Vectorize retornou ${vectorMatches.matches.length} correspondências para a query: "${searchQuery}".`
      );

      if (!vectorMatches.matches || vectorMatches.matches.length === 0) {
        return new Response(
          JSON.stringify({
            questions: [],
            pagination: {
              currentPage: 1,
              totalPages: 0,
              totalItems: 0,
              limit: limit,
            },
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            },
          }
        );
      }
      matchedQuestionIds = vectorMatches.matches.map((match) => match.id);
    } else {
      // Se não houver searchQuery, mas houver filtros, faremos uma filtragem tradicional no R2
      // (Esta parte é um fallback se você quiser que esta API também lide com apenas filtros)
      console.log(
        "Nenhuma query de busca, aplicando apenas filtros tradicionais:",
        { materia, anoStr, etapaStr }
      );
      const r2ObjectFallback = await r2Bucket.get("questoes.json");
      if (r2ObjectFallback === null)
        throw new Error(
          "questoes.json não encontrado no R2 para fallback de filtro."
        );
      allQuestionsData = await r2ObjectFallback.json();
      if (!Array.isArray(allQuestionsData))
        throw new Error(
          "Formato de questoes.json inválido para fallback de filtro."
        );

      const anoNum = anoStr ? parseInt(anoStr) : null;
      const etapaNum = etapaStr ? parseInt(etapaStr) : null;

      const filteredFallback = allQuestionsData.filter((q) => {
        let match = true;
        if (materia && q.materia?.toLowerCase() !== materia.toLowerCase())
          match = false;
        if (anoNum && q.ano !== anoNum) match = false;
        if (etapaNum && q.etapa !== etapaNum) match = false;
        return match;
      });
      matchedQuestionIds = filteredFallback.map((q) => q.id.toString());
      console.log(
        `Filtragem tradicional encontrou ${matchedQuestionIds.length} IDs.`
      );
    }

    // 4. Buscar detalhes das questões do R2 (carrega allQuestionsData se ainda não carregado)
    if (!allQuestionsData) {
      const r2Object = await r2Bucket.get("questoes.json");
      if (r2Object === null)
        throw new Error("questoes.json não encontrado no R2.");
      allQuestionsData = await r2Object.json();
      if (!Array.isArray(allQuestionsData))
        throw new Error("Formato de questoes.json inválido.");
    }

    const relevantQuestionsFull = matchedQuestionIds
      .map((id) => allQuestionsData.find((q) => q.id && q.id.toString() === id))
      .filter(Boolean);

    // 5. Paginar os resultados finais
    const totalItems = relevantQuestionsFull.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const questionsForPage = relevantQuestionsFull.slice(startIndex, endIndex);

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
      },
      status: 200,
    });
  } catch (error) {
    console.error(`[ERRO] /api/search-questions:`, error.message, error.stack);
    return new Response(
      JSON.stringify({ error: `Erro na busca: ${error.message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function onRequest(context) {
  if (context.request.method === "GET") {
    return await onRequestGet(context);
  }
  return new Response(`Método ${context.request.method} não permitido.`, {
    status: 405,
  });
}

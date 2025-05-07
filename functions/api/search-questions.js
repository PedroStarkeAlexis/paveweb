const EMBEDDING_MODEL = "@cf/baai/bge-base-en-v1.5";
const DEFAULT_SEARCH_LIMIT = 10;
const DEFAULT_TOP_K = 25;

export async function onRequestGet(context) {
  const { request, env } = context;
  const r2Bucket = env.QUESTOES_PAVE_BUCKET;
  const vectorIndex = env.QUESTIONS_INDEX;
  const ai = env.AI;

  // Log de início da requisição
  console.log(`[search-questions] Recebida requisição: ${request.url}`);

  if (!r2Bucket || !vectorIndex || !ai) {
    console.error(
      "[search-questions] ERRO: Bindings R2, Vectorize ou AI não configurados."
    );
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
    let materia = params.get("materia");
    const anoStr = params.get("ano");
    const etapaStr = params.get("etapa");
    const page = parseInt(params.get("page") || "1", 10);
    const limit = parseInt(
      params.get("limit") || `${DEFAULT_SEARCH_LIMIT}`,
      10
    );

    // Log dos parâmetros recebidos
    console.log(
      `[search-questions] Parâmetros: query="${searchQuery}", materia="${materia}", ano="${anoStr}", etapa="${etapaStr}", page=${page}, limit=${limit}`
    );

    let matchedQuestionIds = [];
    let allQuestionsData = null;
    let isFallbackSearch = false;

    if (materia) {
      materia = materia.toLowerCase();
      console.log(`[search-questions] Matéria normalizada para: "${materia}"`);
    }

    // Caso 1: Sem query de busca e sem filtros (carga inicial da página)
    if (
      (!searchQuery || searchQuery.trim() === "") &&
      !materia &&
      !anoStr &&
      !etapaStr
    ) {
      console.log(
        "[search-questions] Modo: Carga Inicial (sem query, sem filtros). Usando fallback R2."
      );
      isFallbackSearch = true;
    }
    // Caso 2: Query de busca vetorial (com ou sem filtros)
    else if (searchQuery && searchQuery.trim() !== "") {
      console.log(
        `[search-questions] Modo: Busca Vetorial. Query: "${searchQuery.trim()}"`
      );
      const embeddingResponse = await ai.run(EMBEDDING_MODEL, {
        text: [searchQuery.trim()],
      });

      if (!embeddingResponse.data || !embeddingResponse.data[0]) {
        console.error(
          "[search-questions] ERRO: Falha ao gerar embedding para a query."
        );
        throw new Error(
          "Não foi possível gerar embedding para a query de busca."
        );
      }
      const queryVector = embeddingResponse.data[0];
      console.log(
        `[search-questions] Embedding da query gerado (tamanho: ${queryVector.length}).`
      );

      const vectorizeFilter = {};
      if (materia) vectorizeFilter.materia = materia;
      if (anoStr) vectorizeFilter.ano = parseInt(anoStr);
      if (etapaStr) vectorizeFilter.etapa = parseInt(etapaStr);

      const searchOptions = { topK: DEFAULT_TOP_K };
      if (Object.keys(vectorizeFilter).length > 0) {
        searchOptions.filter = vectorizeFilter;
      }

      // Log crucial antes da chamada ao Vectorize
      console.log(
        `[search-questions] Opções da consulta Vectorize: ${JSON.stringify(
          searchOptions
        )}`
      );

      const vectorMatches = await vectorIndex.query(queryVector, searchOptions);

      // Log crucial da resposta do Vectorize
      console.log(
        `[search-questions] Vectorize retornou ${vectorMatches.matches.length} correspondências.`
      );
      if (vectorMatches.matches.length > 0) {
        console.log(
          `[search-questions] Exemplo da primeira correspondência do Vectorize: id=${
            vectorMatches.matches[0].id
          }, score=${vectorMatches.matches[0].score}, metadata=${JSON.stringify(
            vectorMatches.matches[0].metadata
          )}`
        );
      }

      if (!vectorMatches.matches || vectorMatches.matches.length === 0) {
        console.log(
          "[search-questions] Nenhuma correspondência do Vectorize. Retornando vazio."
        );
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
      console.log(
        `[search-questions] IDs das questões correspondentes do Vectorize: ${JSON.stringify(
          matchedQuestionIds
        )}`
      );
    }
    // Caso 3: Sem query de busca, MAS COM filtros (filtragem tradicional no R2)
    else {
      console.log(
        "[search-questions] Modo: Apenas Filtros (sem query). Usando fallback R2."
      );
      isFallbackSearch = true;
    }

    console.log("[search-questions] Carregando questoes.json do R2...");
    const r2Object = await r2Bucket.get("questoes.json");
    if (r2Object === null) {
      console.error(
        "[search-questions] ERRO: questoes.json não encontrado no R2."
      );
      throw new Error("questoes.json não encontrado no R2.");
    }
    allQuestionsData = await r2Object.json();
    if (!Array.isArray(allQuestionsData)) {
      console.error(
        "[search-questions] ERRO: Formato de questoes.json inválido."
      );
      throw new Error("Formato de questoes.json inválido.");
    }
    console.log(
      `[search-questions] ${allQuestionsData.length} questões carregadas do R2.`
    );

    let relevantQuestionsFull;

    if (isFallbackSearch) {
      console.log(
        "[search-questions] Aplicando filtros R2 (fallback/inicial)..."
      );
      const anoNum = anoStr ? parseInt(anoStr) : null;
      const etapaNum = etapaStr ? parseInt(etapaStr) : null;

      relevantQuestionsFull = allQuestionsData.filter((q) => {
        if (!q || typeof q !== "object") return false;
        let match = true;
        if (materia && (!q.materia || q.materia.toLowerCase() !== materia))
          match = false;
        if (anoNum && q.ano !== anoNum) match = false;
        if (etapaNum && q.etapa !== etapaNum) match = false;
        return match;
      });
      console.log(
        `[search-questions] Filtragem R2 encontrou ${relevantQuestionsFull.length} questões.`
      );
    } else {
      console.log(
        "[search-questions] Mapeando IDs do Vectorize para dados completos das questões..."
      );
      relevantQuestionsFull = matchedQuestionIds
        .map((id) =>
          allQuestionsData.find((q) => q.id && q.id.toString() === id)
        )
        .filter(Boolean);
      console.log(
        `[search-questions] ${relevantQuestionsFull.length} questões completas encontradas após mapeamento de IDs.`
      );
    }

    const totalItems = relevantQuestionsFull.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const questionsForPage = relevantQuestionsFull.slice(startIndex, endIndex);

    console.log(
      `[search-questions] Paginação: totalItems=${totalItems}, totalPages=${totalPages}, currentPage=${page}, limit=${limit}. Retornando ${questionsForPage.length} questões.`
    );

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
    console.error(
      `[search-questions] ERRO GERAL: ${error.message}`,
      error.stack
    );
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

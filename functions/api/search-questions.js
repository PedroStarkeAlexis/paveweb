const EMBEDDING_MODEL = "@cf/baai/bge-base-en-v1.5";
const DEFAULT_SEARCH_LIMIT = 10;
const DEFAULT_TOP_K_VECTOR_SEARCH = 10; // Quantos resultados semânticos buscar do Vectorize. Pode ser um pouco maior.

export async function onRequestGet(context) {
  const { request, env } = context;
  const r2Bucket = env.QUESTOES_PAVE_BUCKET;
  const vectorIndex = env.QUESTIONS_INDEX;
  const ai = env.AI;

  console.log(`[search-questions V2] Recebida requisição: ${request.url}`);

  if (!r2Bucket || !vectorIndex || !ai) {
    console.error(
      "[search-questions V2] ERRO: Bindings R2, Vectorize ou AI não configurados."
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
    let materiaFilter = params.get("materia"); // Filtro de matéria
    const anoFilterStr = params.get("ano"); // Filtro de ano
    const etapaFilterStr = params.get("etapa"); // Filtro de etapa
    const page = parseInt(params.get("page") || "1", 10);
    const limit = parseInt(
      params.get("limit") || `${DEFAULT_SEARCH_LIMIT}`,
      10
    );

    console.log(
      `[search-questions V2] Parâmetros: query="${searchQuery}", materiaFiltro="${materiaFilter}", anoFiltro="${anoFilterStr}", etapaFiltro="${etapaFilterStr}", page=${page}, limit=${limit}`
    );

    if (materiaFilter) {
      materiaFilter = materiaFilter.toLowerCase();
      console.log(
        `[search-questions V2] Filtro de matéria normalizado para: "${materiaFilter}"`
      );
    }
    const anoFilter = anoFilterStr ? parseInt(anoFilterStr) : null;
    const etapaFilter = etapaFilterStr ? parseInt(etapaFilterStr) : null;

    let questionIdsToFetchDetails = null; // Array de IDs se a busca vetorial for usada

    // --- Etapa 1: Busca Vetorial (se houver query) ---
    if (searchQuery && searchQuery.trim() !== "") {
      console.log(
        `[search-questions V2] Modo: Busca Vetorial para query: "${searchQuery.trim()}"`
      );
      const embeddingResponse = await ai.run(EMBEDDING_MODEL, {
        text: [searchQuery.trim()],
      });
      if (!embeddingResponse.data || !embeddingResponse.data[0]) {
        console.error(
          "[search-questions V2] ERRO: Falha ao gerar embedding para a query."
        );
        throw new Error(
          "Não foi possível gerar embedding para a query de busca."
        );
      }
      const queryVector = embeddingResponse.data[0];

      // IMPORTANTE: NENHUM FILTRO DE METADADOS É PASSADO PARA O VECTORIZE.QUERY() AQUI
      const searchOptions = { topK: DEFAULT_TOP_K_VECTOR_SEARCH };
      console.log(
        `[search-questions V2] Opções da consulta Vectorize (sem filtro de metadados): ${JSON.stringify(
          searchOptions
        )}`
      );

      const vectorMatches = await vectorIndex.query(queryVector, searchOptions);
      console.log(
        `[search-questions V2] Vectorize (sem filtro de metadados) retornou ${vectorMatches.matches.length} correspondências.`
      );

      if (vectorMatches.matches && vectorMatches.matches.length > 0) {
        questionIdsToFetchDetails = vectorMatches.matches.map(
          (match) => match.id
        );
        console.log(
          `[search-questions V2] IDs das questões do Vectorize: ${JSON.stringify(
            questionIdsToFetchDetails
          )}`
        );
      } else {
        // Se a busca vetorial não encontrou nada, não há o que filtrar depois.
        console.log(
          "[search-questions V2] Nenhuma correspondência do Vectorize. Retornando vazio."
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
    } else {
      console.log(
        "[search-questions V2] Modo: Sem query de busca. Todos os IDs do R2 serão considerados para filtragem."
      );
      // Se não há query, todos os IDs do R2 são candidatos (questionIdsToFetchDetails permanece null, indicando para usar tudo do R2)
    }

    // --- Etapa 2: Carregar Dados do R2 e Aplicar Filtros de Metadados Manualmente ---
    console.log("[search-questions V2] Carregando questoes.json do R2...");
    const r2Object = await r2Bucket.get("questoes.json");
    if (r2Object === null)
      throw new Error("questoes.json não encontrado no R2.");
    const allQuestionsData = await r2Object.json();
    if (!Array.isArray(allQuestionsData))
      throw new Error("Formato de questoes.json inválido.");
    console.log(
      `[search-questions V2] ${allQuestionsData.length} questões carregadas do R2.`
    );

    let candidateQuestions;
    if (questionIdsToFetchDetails) {
      // Se tivemos resultados da busca vetorial, pegamos apenas essas questões
      candidateQuestions = allQuestionsData.filter(
        (q) => q.id && questionIdsToFetchDetails.includes(q.id.toString())
      );
      console.log(
        `[search-questions V2] ${candidateQuestions.length} questões candidatas após seleção por IDs do Vectorize.`
      );
    } else {
      // Se não houve busca vetorial (sem query), todas as questões do R2 são candidatas
      candidateQuestions = allQuestionsData;
      console.log(
        `[search-questions V2] Todas as ${candidateQuestions.length} questões do R2 são candidatas para filtragem.`
      );
    }

    // Aplicar filtros de metadados (materia, ano, etapa)
    const filteredQuestions = candidateQuestions.filter((q) => {
      if (!q || typeof q !== "object") return false;
      let match = true;
      if (
        materiaFilter &&
        (!q.materia || q.materia.toLowerCase() !== materiaFilter)
      )
        match = false;
      if (anoFilter && q.ano !== anoFilter) match = false;
      if (etapaFilter && q.etapa !== etapaFilter) match = false;
      return match;
    });
    console.log(
      `[search-questions V2] ${filteredQuestions.length} questões após aplicação manual dos filtros de metadados.`
    );

    // Paginar os resultados finais
    const totalItems = filteredQuestions.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const questionsForPage = filteredQuestions.slice(startIndex, endIndex);

    console.log(
      `[search-questions V2] Paginação: totalItems=${totalItems}, totalPages=${totalPages}, currentPage=${page}, limit=${limit}. Retornando ${questionsForPage.length} questões.`
    );

    return new Response(
      JSON.stringify({
        questions: questionsForPage,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalItems: totalItems,
          limit: limit,
        },
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      `[search-questions V2] ERRO GERAL: ${error.message}`,
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

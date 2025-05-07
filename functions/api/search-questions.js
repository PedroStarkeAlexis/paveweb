// import { removeAccents } from './filter'; // Não é mais necessário aqui se os metadados já estão normalizados ou se o filtro é exato

const EMBEDDING_MODEL = "@cf/baai/bge-base-en-v1.5";
const DEFAULT_SEARCH_LIMIT = 10; // Resultados por página da busca vetorial
const DEFAULT_TOP_K = 25; // Reduzido de 50. Quantos vetores mais próximos buscar inicialmente no Vectorize

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
    let materia = params.get("materia"); // Modificado para let para normalização
    const anoStr = params.get("ano");
    const etapaStr = params.get("etapa");
    const page = parseInt(params.get("page") || "1", 10);
    const limit = parseInt(
      params.get("limit") || `${DEFAULT_SEARCH_LIMIT}`,
      10
    );

    let matchedQuestionIds = [];
    let allQuestionsData = null; // Para carregar apenas uma vez se necessário
    let isFallbackSearch = false;

    // Normalizar 'materia' para minúsculas se existir, para consistência com o índice
    if (materia) {
      materia = materia.toLowerCase();
    }

    // Caso 1: Sem query de busca e sem filtros (carga inicial da página)
    if (
      (!searchQuery || searchQuery.trim() === "") &&
      !materia &&
      !anoStr &&
      !etapaStr
    ) {
      console.log(
        "[search-questions] Nenhuma query ou filtro. Carregando primeira página de todas as questões do R2."
      );
      isFallbackSearch = true; // Indica que estamos usando fallback R2
      // Não precisamos de IDs específicos, vamos paginar todas as questões do R2
    }
    // Caso 2: Query de busca vetorial (com ou sem filtros)
    else if (searchQuery && searchQuery.trim() !== "") {
      console.log(
        `[search-questions] Iniciando busca vetorial para query: "${searchQuery}"`
      );
      const embeddingResponse = await ai.run(EMBEDDING_MODEL, {
        text: [searchQuery.trim()],
      });
      if (!embeddingResponse.data || !embeddingResponse.data[0]) {
        throw new Error(
          "Não foi possível gerar embedding para a query de busca."
        );
      }
      const queryVector = embeddingResponse.data[0];

      const vectorizeFilter = {};
      if (materia) vectorizeFilter.materia = materia; // Já está em minúsculas
      if (anoStr) vectorizeFilter.ano = parseInt(anoStr);
      if (etapaStr) vectorizeFilter.etapa = parseInt(etapaStr);

      const searchOptions = { topK: DEFAULT_TOP_K };
      if (Object.keys(vectorizeFilter).length > 0) {
        searchOptions.filter = vectorizeFilter;
      }
      console.log(
        "[search-questions] Consultando Vectorize com query:",
        searchQuery,
        "e filtro:",
        vectorizeFilter
      );
      const vectorMatches = await vectorIndex.query(queryVector, searchOptions);
      console.log(
        `[search-questions] Vectorize retornou ${vectorMatches.matches.length} correspondências para a query: "${searchQuery}".`
      );

      if (!vectorMatches.matches || vectorMatches.matches.length === 0) {
        // Se a busca vetorial não encontrou nada, retorna vazio
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
    }
    // Caso 3: Sem query de busca, MAS COM filtros (filtragem tradicional no R2)
    else {
      console.log(
        "[search-questions] Nenhuma query de busca, aplicando apenas filtros tradicionais:",
        { materia, anoStr, etapaStr }
      );
      isFallbackSearch = true; // Indica que estamos usando fallback R2
      // Não precisamos de IDs específicos aqui, vamos filtrar todas as questões do R2
    }

    // Carregar todas as questões do R2 (necessário para todos os casos agora)
    const r2Object = await r2Bucket.get("questoes.json");
    if (r2Object === null)
      throw new Error("questoes.json não encontrado no R2.");
    allQuestionsData = await r2Object.json();
    if (!Array.isArray(allQuestionsData))
      throw new Error("Formato de questoes.json inválido.");

    let relevantQuestionsFull;

    if (isFallbackSearch) {
      // Filtra todas as questões do R2 se for carga inicial ou apenas filtros
      const anoNum = anoStr ? parseInt(anoStr) : null;
      const etapaNum = etapaStr ? parseInt(etapaStr) : null;

      relevantQuestionsFull = allQuestionsData.filter((q) => {
        if (!q || typeof q !== "object") return false;
        let match = true;
        // Para 'materia', comparar com a versão minúscula do R2
        if (materia && (!q.materia || q.materia.toLowerCase() !== materia)) {
          // 'materia' já está em minúsculas
          match = false;
        }
        if (anoNum && q.ano !== anoNum) match = false;
        if (etapaNum && q.etapa !== etapaNum) match = false;
        return match;
      });
      console.log(
        `[search-questions] Filtragem R2 (fallback/inicial) encontrou ${relevantQuestionsFull.length} questões.`
      );
    } else {
      // Se foi busca vetorial, mapeia os IDs para os dados completos das questões
      relevantQuestionsFull = matchedQuestionIds
        .map((id) =>
          allQuestionsData.find((q) => q.id && q.id.toString() === id)
        )
        .filter(Boolean); // Remove nulos caso algum ID não seja encontrado
    }

    // Paginar os resultados finais
    const totalItems = relevantQuestionsFull.length;
    const totalPages = Math.ceil(totalItems / limit) || 1; // Evita 0 páginas
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

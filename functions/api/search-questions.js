import { fetchAllQuestions } from './utils/uploader';

const EMBEDDING_MODEL = "@cf/baai/bge-m3"; // Modelo multilíngue com 1024 dimensões
const DEFAULT_SEARCH_LIMIT = 100;
const DEFAULT_TOP_K = 25; // Quantidade de resultados a pedir ao Vectorize
const MIN_SCORE_THRESHOLD = 0.70;

export async function onRequestGet(context) {
  const { request, env } = context;
  const vectorIndex = env.QUESTIONS_INDEX;
  const ai = env.AI;

  console.log(`[search-questions] Recebida requisição: ${request.url}`);

  if (!vectorIndex || !ai) {
    console.error(
      "[search-questions] ERRO: Bindings Vectorize ou AI não configurados."
    );
    return new Response(
      JSON.stringify({
        error: "Bindings Vectorize ou AI não configurados.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const url = new URL(request.url);
    const params = url.searchParams;

    const searchQuery = params.get("query");
    let filterMateria = params.get("materia");
    const filterAnoStr = params.get("ano");
    const filterEtapaStr = params.get("etapa");
    const page = parseInt(params.get("page") || "1", 10);
    const limit = parseInt(
      params.get("limit") || `${DEFAULT_SEARCH_LIMIT}`,
      10
    );

    console.log(
      `[search-questions] Parâmetros: query="${searchQuery}", materia="${filterMateria}", ano="${filterAnoStr}", etapa="${filterEtapaStr}", page=${page}, limit=${limit}`
    );

    let allQuestionsData = null;
    let initialRelevantQuestions = [];

    console.log("[search-questions] Carregando todas as questões do uploader...");
    allQuestionsData = await fetchAllQuestions(env);
    
    if (!Array.isArray(allQuestionsData) || allQuestionsData.length === 0) {
      console.error(
        "[search-questions] ERRO: Nenhuma questão foi carregada do uploader."
      );
      throw new Error("Nenhuma questão encontrada no repositório de provas.");
    }
    console.log(
      `[search-questions] ${allQuestionsData.length} questões carregadas no total.`
    );

    if (searchQuery && searchQuery.trim() !== "") {
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

      const searchOptions = { topK: DEFAULT_TOP_K };
      console.log(
        `[search-questions] Opções da consulta Vectorize: ${JSON.stringify(
          searchOptions
        )}`
      );
      const vectorQueryResult = await vectorIndex.query(
        queryVector,
        searchOptions
      );
      console.log(
        `[search-questions] Vectorize retornou ${vectorQueryResult.matches.length} correspondências.`
      );

      if (vectorQueryResult.matches && vectorQueryResult.matches.length > 0) {
        const highConfidenceMatches = vectorQueryResult.matches.filter(
          (match) => match.score >= MIN_SCORE_THRESHOLD
        );
        console.log(
          `[search-questions] ${highConfidenceMatches.length} correspondências com score >= ${MIN_SCORE_THRESHOLD} (de ${vectorQueryResult.matches.length} iniciais).`
        );

        if (highConfidenceMatches.length > 0) {
          const matchedQuestionIds = highConfidenceMatches.map(
            (match) => match.id
          );

          console.log(
            `[search-questions] IDs das questões de alta confiança: ${JSON.stringify(
              matchedQuestionIds
            )}`
          );
          initialRelevantQuestions = matchedQuestionIds
            .map((id) =>
              allQuestionsData.find((q) => q.id && q.id.toString() === id)
            )
            .filter(Boolean);
          console.log(
            `[search-questions] ${initialRelevantQuestions.length} questões completas (alta confiança) encontradas após mapeamento.`
          );
        } else {
          console.log(
            `[search-questions] Nenhuma correspondência do Vectorize atingiu o score mínimo de ${MIN_SCORE_THRESHOLD}.`
          );
          initialRelevantQuestions = [];
        }
      } else {
        console.log("[search-questions] Nenhuma correspondência do Vectorize.");
        initialRelevantQuestions = [];
      }
    } else {
      console.log(
        "[search-questions] Modo: Sem query de busca. Usando todas as questões do R2 como base para filtros."
      );
      initialRelevantQuestions = [...allQuestionsData];
    }

    let filteredQuestions = initialRelevantQuestions;
    const filterAnoNum = filterAnoStr ? parseInt(filterAnoStr) : null;
    const filterEtapaNum = filterEtapaStr ? parseInt(filterEtapaStr) : null;

    if (filterMateria || filterAnoNum || filterEtapaNum) {
      console.log(
        "[search-questions] Aplicando filtros manuais (materia/ano/etapa)..."
      );
      filteredQuestions = initialRelevantQuestions.filter((q) => {
        if (!q || typeof q !== "object") return false;
        let match = true;

        if (filterMateria && q.materia) {
          if (
            q.materia.trim().toLowerCase() !==
            filterMateria.trim().toLowerCase()
          ) {
            match = false;
          }
        } else if (filterMateria && !q.materia) {
          match = false;
        }

        if (match && filterAnoNum && q.ano) {
          if (q.ano !== filterAnoNum) {
            match = false;
          }
        } else if (match && filterAnoNum && !q.ano) {
          match = false;
        }

        if (match && filterEtapaNum && q.etapa) {
          if (q.etapa !== filterEtapaNum) {
            match = false;
          }
        } else if (match && filterEtapaNum && !q.etapa) {
          match = false;
        }
        return match;
      });
      console.log(
        `[search-questions] ${filteredQuestions.length} questões após filtros manuais.`
      );
    } else {
      console.log(
        "[search-questions] Nenhum filtro manual (materia/ano/etapa) aplicado."
      );
    }

    const totalItems = filteredQuestions.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const startIndex = (page - 1) * limit;
    const questionsForPage = filteredQuestions.slice(
      startIndex,
      startIndex + limit
    );

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
      error.cause ? JSON.stringify(error.cause) : "",
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

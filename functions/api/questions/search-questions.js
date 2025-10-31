import { fetchAllQuestions } from '../utils/uploader';

const DEFAULT_SEARCH_LIMIT = 100;

export async function onRequestGet(context) {
  const { request, env } = context;

  console.log(`[search-questions] Recebida requisição: ${request.url}`);

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

    console.log("[search-questions] Carregando todas as questões do uploader...");
    const allQuestionsData = await fetchAllQuestions(env);
    
    if (!Array.isArray(allQuestionsData) || allQuestionsData.length === 0) {
      console.error(
        "[search-questions] ERRO: Nenhuma questão foi carregada do uploader."
      );
      throw new Error("Nenhuma questão encontrada no repositório de provas.");
    }
    console.log(
      `[search-questions] ${allQuestionsData.length} questões carregadas no total.`
    );

    let filteredQuestions = allQuestionsData;

    // Busca textual simples (case-insensitive)
    if (searchQuery && searchQuery.trim() !== "") {
      console.log(
        `[search-questions] Aplicando busca textual para: "${searchQuery.trim()}"`
      );
      const queryLower = searchQuery.trim().toLowerCase();
      filteredQuestions = filteredQuestions.filter((q) => {
        if (!q || typeof q !== "object") return false;
        
        // Busca no corpo da questão
        if (Array.isArray(q.corpo_questao)) {
          const corpoText = q.corpo_questao.join(' ').toLowerCase();
          if (corpoText.includes(queryLower)) return true;
        }
        
        // Busca no texto da questão (formato antigo)
        if (q.texto_questao && typeof q.texto_questao === 'string') {
          if (q.texto_questao.toLowerCase().includes(queryLower)) return true;
        }
        
        // Busca nas alternativas
        if (q.alternativas && typeof q.alternativas === 'object') {
          const alternativasText = Object.values(q.alternativas).join(' ').toLowerCase();
          if (alternativasText.includes(queryLower)) return true;
        }
        
        // Busca na matéria
        if (q.materia && q.materia.toLowerCase().includes(queryLower)) return true;
        
        // Busca no tópico
        if (q.topico && q.topico.toLowerCase().includes(queryLower)) return true;
        
        return false;
      });
      console.log(
        `[search-questions] ${filteredQuestions.length} questões encontradas após busca textual.`
      );
    }

    // Aplicar filtros de matéria, ano e etapa
    const filterAnoNum = filterAnoStr ? parseInt(filterAnoStr) : null;
    const filterEtapaNum = filterEtapaStr ? parseInt(filterEtapaStr) : null;

    if (filterMateria || filterAnoNum || filterEtapaNum) {
      console.log(
        "[search-questions] Aplicando filtros (materia/ano/etapa)..."
      );
      filteredQuestions = filteredQuestions.filter((q) => {
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
        `[search-questions] ${filteredQuestions.length} questões após filtros.`
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

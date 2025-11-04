import { fetchAllQuestions } from '../utils/uploader';

const DEFAULT_SEARCH_LIMIT = 100;

/**
 * Função da API para buscar e filtrar questões.
 * Acessada via GET /api/search-questions.
 * Suporta filtros por query, matéria, ano e etapa.
 */
export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const params = url.searchParams;

    // Extrai os parâmetros de filtro da URL.
    const searchQuery = params.get("query");
    const filterMateria = params.get("materia");
    const filterAnoStr = params.get("ano");
    const filterEtapaStr = params.get("etapa");
    const limit = parseInt(params.get("limit") || `${DEFAULT_SEARCH_LIMIT}`, 10);

    // Busca todas as questões do repositório central (uploader worker).
    const allQuestionsData = await fetchAllQuestions(env);
    
    if (!Array.isArray(allQuestionsData) || allQuestionsData.length === 0) {
      throw new Error("Nenhuma questão foi encontrada no repositório.");
    }

    let filteredQuestions = allQuestionsData;

    // 1. Aplica o filtro de busca textual, se houver.
    if (searchQuery && searchQuery.trim() !== "") {
      const queryLower = searchQuery.trim().toLowerCase();
      filteredQuestions = filteredQuestions.filter((q) => {
        if (!q) return false;
        // Concatena todos os textos relevantes da questão em uma única string para busca.
        const searchableText = [
          ...(Array.isArray(q.corpo_questao) ? q.corpo_questao.map(b => b.conteudo || '') : []),
          q.texto_questao || '',
          ...(Array.isArray(q.alternativas) ? q.alternativas.map(a => a.texto || '') : []),
          q.materia || '',
          q.topico || ''
        ].join(' ').toLowerCase();
        
        return searchableText.includes(queryLower);
      });
    }

    // 2. Aplica os filtros de metadados (matéria, ano, etapa).
    const filterAnoNum = filterAnoStr ? parseInt(filterAnoStr) : null;
    const filterEtapaNum = filterEtapaStr ? parseInt(filterEtapaStr) : null;

    if (filterMateria || filterAnoNum || filterEtapaNum) {
      filteredQuestions = filteredQuestions.filter((q) => {
        if (!q) return false;
        const materiaMatch = !filterMateria || (q.materia && q.materia.toLowerCase() === filterMateria.toLowerCase());
        const anoMatch = !filterAnoNum || q.ano === filterAnoNum;
        const etapaMatch = !filterEtapaNum || q.etapa === filterEtapaNum;
        return materiaMatch && anoMatch && etapaMatch;
      });
    }

    // Limita o número de resultados.
    const paginatedQuestions = filteredQuestions.slice(0, limit);

    const responseBody = {
      questions: paginatedQuestions,
      pagination: { totalItems: filteredQuestions.length, limit },
    };
    
    return new Response(JSON.stringify(responseBody), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      status: 200,
    });
  } catch (error) {
    console.error(`[search-questions] ERRO: ${error.message}`, error.stack);
    return new Response(
      JSON.stringify({ error: `Erro na busca: ${error.message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Roteia a requisição para a função correta com base no método HTTP.
export async function onRequest(context) {
  if (context.request.method === "GET") {
    return await onRequestGet(context);
  }
  return new Response(`Método não permitido.`, { status: 405 });
}

// functions/api/questions/filters.js
import { fetchAllQuestions } from './utils/uploader';

export async function onRequestGet(context) {
    const { env } = context;

    try {
        console.log("[get-filter-options] Carregando todas as questões do uploader...");
        const allQuestions = await fetchAllQuestions(env);

        if (!allQuestions || allQuestions.length === 0) {
            console.error("[get-filter-options] Nenhuma questão encontrada no uploader.");
            return new Response(JSON.stringify({ anos: [], materias: [], etapas: [] }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        console.log(`[get-filter-options] ${allQuestions.length} questões carregadas.`);

        const anos = [...new Set(allQuestions.map(q => q.ano).filter(Boolean))].sort((a, b) => b - a);
        const materias = [...new Set(allQuestions.map(q => q.materia).filter(Boolean))].sort();
        const etapas = [...new Set(allQuestions.map(q => q.etapa).filter(Boolean))].sort();

        return new Response(JSON.stringify({ anos, materias, etapas }), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 's-maxage=3600' // Cache por 1 hora
            },
        });
    } catch (err) {
        console.error("Erro ao buscar opções de filtro:", err);
        return new Response(JSON.stringify({ error: 'Falha ao carregar opções de filtro.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequest(context) {
    if (context.request.method === 'GET') {
        return await onRequestGet(context);
    }
    return new Response('Método não permitido', { status: 405 });
}
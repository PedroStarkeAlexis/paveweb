export async function onRequestGet(context) {
    const { env } = context;
    const results = {
        hasR2: !!env.QUESTOES_PAVE_BUCKET,
        hasVectorize: !!env.QUESTIONS_INDEX,
        hasAI: !!env.AI,
        r2BindingType: typeof env.QUESTOES_PAVE_BUCKET,
        vectorizeBindingType: typeof env.QUESTIONS_INDEX,
        aiBindingType: typeof env.AI,
    };
    if (env.QUESTOES_PAVE_BUCKET) {
        try {
            // Tenta uma operação simples, como listar os primeiros itens (não faça em produção sem necessidade)
            // ou apenas verificar se o método 'get' existe.
            results.r2GetMethodExists = typeof env.QUESTOES_PAVE_BUCKET.get === 'function';
        } catch (e) {
            results.r2Error = e.message;
        }
    }
    return new Response(JSON.stringify(results), {
        headers: { 'Content-Type': 'application/json' }
    });
}
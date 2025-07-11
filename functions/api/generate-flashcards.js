
// functions/api/generate-flashcards.js

// Lida com as requisições para a API
export async function onRequestPost(context) {
    try {
        // Extrai o corpo da requisição e o tópico
        const { request, env } = context;
        const { topic } = await request.json();

        // Validação básica do tópico
        if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
            return new Response(JSON.stringify({ error: 'O tópico é inválido ou não foi fornecido.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Constrói o prompt para a IA
        const prompt = `Crie exatamente 5 flashcards concisos sobre o tópico "${topic}". Para cada flashcard, forneça um "term" (o conceito principal em poucas palavras) e uma "definition" (uma explicação clara e direta em no máximo 2-3 frases). Retorne os resultados como um array JSON dentro de um objeto, com a chave "flashcards". Exemplo de formato: {"flashcards":[{"term":"Exemplo","definition":"Este é um exemplo."}]}`;


        // Monta o corpo da requisição para a API do Gemini
        const geminiRequestBody = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                response_mime_type: "application/json", // Força a saída em JSON
            },
        };

        // Define a URL da API do Gemini
        const modelName = 'gemini-1.5-flash-latest'; // Usando um modelo mais recente
        const apiKey = env.GEMINI_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        // Faz a chamada para a API do Gemini
        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiRequestBody),
        });

        // Verifica se a resposta da API do Gemini foi bem-sucedida
        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.text();
            console.error('Erro na API do Gemini:', errorBody);
            return new Response(JSON.stringify({ error: 'Falha ao comunicar com o serviço de IA.' }), {
                status: geminiResponse.status,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Extrai e processa a resposta
        const geminiData = await geminiResponse.json();
        const candidate = geminiData.candidates?.[0];
        const content = candidate?.content?.parts?.[0]?.text;

        if (!content) {
            console.error('Resposta da IA em formato inesperado:', JSON.stringify(geminiData, null, 2));
            return new Response(JSON.stringify({ error: 'A resposta da IA estava vazia ou em formato incorreto.' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Retorna o conteúdo JSON diretamente para o cliente
        return new Response(content, {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Erro interno no servidor:', error);
        return new Response(JSON.stringify({ error: 'Ocorreu um erro interno no servidor.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

/**
 * Fetches the list of available Gemini models from the Google Generative AI API.
 * This function acts as a secure proxy, using the API key from server-side
 * environment variables without exposing it to the client.
 */
export async function onRequestGet(context) {
  const { env } = context;
  const geminiApiKey = env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    console.error(
      "[get-models] Erro: GEMINI_API_KEY não está configurada no ambiente."
    );
    return new Response(
      JSON.stringify({ error: "Configuração do servidor incompleta." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // The pageSize is set high to try and fetch all models in one request.
  const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000&key=${geminiApiKey}`;

  try {
    console.log("[get-models] Buscando modelos da API do Google...");
    const response = await fetch(googleApiUrl);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `[get-models] Erro da API do Google: ${response.status}`,
        errorBody
      );
      throw new Error(
        `Falha ao buscar modelos da API do Google (Status: ${response.status})`
      );
    }

    const data = await response.json();

    if (!data || !Array.isArray(data.models)) {
      throw new Error("Formato de resposta inesperado da API de modelos.");
    }

    // Filter models to include only those that support 'generateContent',
    // are not legacy, and are suitable for chat/text generation.
    const filteredModels = data.models
      .filter(
        (model) =>
          model.supportedGenerationMethods &&
          model.supportedGenerationMethods.includes("generateContent") &&
          // Optional: Add other filters if needed, e.g., excluding specific models
          !model.name.includes("embedding") &&
          !model.name.includes("aqa")
      )
      .map((model) => ({
        id: model.name.replace("models/", ""), // 'models/gemini-pro' -> 'gemini-pro'
        name: model.displayName,
        description: model.description,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

    console.log(
      `[get-models] Retornando ${filteredModels.length} modelos filtrados.`
    );

    return new Response(JSON.stringify(filteredModels), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Cache the response for 1 hour to reduce API calls
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error(`[get-models] Erro inesperado:`, error);
    return new Response(
      JSON.stringify({
        error: `Erro ao processar a requisição: ${error.message}`,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Generic request handler
export async function onRequest(context) {
  if (context.request.method === "GET") {
    return await onRequestGet(context);
  }
  return new Response(
    `Método ${context.request.method} não permitido. Use GET.`,
    {
      status: 405,
      headers: { Allow: "GET" },
    }
  );
}

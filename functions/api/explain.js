import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { createExplanationPrompt } from "./prompt"; // Importa o novo prompt
import { createTextPreview } from "./filter";

async function callGeminiAPIForExplanation(
  promptText,
  genAIInstance,
  modelName,
  safetySettings
) {
  console.log(
    `[EXPLAIN_API] Enviando prompt de EXPLICAÇÃO para Gemini (${createTextPreview(
      promptText,
      100
    )}...).`
  );
  const model = genAIInstance.getGenerativeModel({ model: modelName });
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: promptText }] }],
    safetySettings,
  });
  const response = result.response;
  if (!response) {
    throw new Error("Resposta da API Gemini (explicação) inválida.");
  }
  if (response.promptFeedback?.blockReason) {
    throw new Error(
      `Bloqueado pela IA (explicação): ${response.promptFeedback.blockReason}`
    );
  }
  const responseText = response.text
    ? response.text()
    : response.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (!responseText) {
    throw new Error("A IA (explicação) retornou texto vazio.");
  }
  console.log(
    `[EXPLAIN_API] Resposta IA (explicação): ${createTextPreview(
      responseText,
      150
    )}`
  );
  return responseText;
}

export async function onRequestPost(context) {
  const functionName = "/api/explain (v1)";
  console.log(`[LOG] ${functionName}: Iniciando POST request`);

  try {
    const { request, env } = context;
    const geminiApiKey = env.GEMINI_API_KEY;
    const modelName = env.MODEL_NAME || "gemini-1.5-flash-latest"; // Ou outro modelo que você prefira

    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY não configurado.");
    }
    console.log(
      `[LOG] ${functionName}: Configs OK. Modelo a ser usado: ${modelName}`
    );

    let requestData;
    try {
      requestData = await request.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Requisição JSON inválida." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { question, userAnswerLetter, preferredModel } = requestData;

    if (
      !question ||
      !question.texto_questao ||
      !question.alternativas ||
      !question.resposta_letra
    ) {
      return new Response(
        JSON.stringify({ error: "Dados da questão incompletos." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const effectiveModelName = preferredModel || modelName;

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ];

    const explanationPromptText = createExplanationPrompt(
      question,
      userAnswerLetter
    );

    let explanationText;
    try {
      explanationText = await callGeminiAPIForExplanation(
        explanationPromptText,
        genAI,
        effectiveModelName,
        safetySettings
      );
    } catch (error) {
      console.error(
        `[ERRO] ${functionName}: Falha na API Gemini (explicação):`,
        error
      );
      return new Response(
        JSON.stringify({
          error: `Desculpe, tive um problema ao gerar a explicação: ${error.message}. Usando modelo: ${effectiveModelName}.`,
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[LOG] ${functionName}: Retornando explicação.`);
    return new Response(JSON.stringify({ explanation: explanationText }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error(
      `[ERRO] ${functionName}: Erro GERAL INESPERADO:`,
      error,
      error.stack
    );
    const currentModelName =
      context.env.MODEL_NAME || "gemini-1.5-flash-latest";
    return new Response(
      JSON.stringify({
        error: `Ocorreu um erro inesperado no servidor de explicações (modelo: ${currentModelName}): ${error.message}`,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function onRequest(context) {
  if (context.request.method === "POST") {
    return await onRequestPost(context);
  }
  return new Response(
    `Método ${context.request.method} não permitido. Use POST.`,
    {
      status: 405,
      headers: { Allow: "POST" },
    }
  );
}

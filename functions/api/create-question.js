import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { createQuestionGenerationPrompt } from "./prompt";
import { createTextPreview } from "./filter";

// Helper function para chamar a API Gemini (inspirada em /api/ask)
async function callGeminiAPI(
  promptText,
  genAIInstance,
  modelName,
  safetySettings
) {
  console.log(
    `[LOG] Enviando prompt CRIAÇÃO DE QUESTÃO para Gemini (${createTextPreview(
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
    throw new Error("Resposta da API Gemini inválida.");
  }
  if (response.promptFeedback?.blockReason) {
    throw new Error(
      `Bloqueado pela IA: ${response.promptFeedback.blockReason}`
    );
  }
  const responseText = response.text
    ? response.text()
    : response.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (!responseText) {
    throw new Error("A IA retornou texto vazio.");
  }
  console.log(
    `[LOG] Resposta IA (Criação): ${createTextPreview(responseText, 150)}`
  );
  return responseText;
}

/**
 * Endpoint dedicado para a criação de questões pela IA.
 * Recebe: { topic: string, subject: string, customTopic?: string, count: number }
 * Retorna: { questions: Array }
 */
export async function onRequestPost(context) {
  const functionName = "/api/create-question";
  try {
    const { request, env } = context;
    const {
      topic,
      subject,
      customTopic,
      count,
      modelName: userModel,
    } = await request.json();

    const geminiApiKey = env.GEMINI_API_KEY;
    const modelName =
      userModel || env.MODEL_NAME || "gemini-2.5-flash-preview-05-20";

    if (!geminiApiKey) {
      throw new Error("Variável de ambiente GEMINI_API_KEY não configurada.");
    }
    if (!topic || !subject || !count) {
      return new Response(
        JSON.stringify({
          error:
            "Dados insuficientes (matéria, tópico e quantidade são obrigatórios).",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

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

    // 1. Criar o prompt
    const generationPrompt = createQuestionGenerationPrompt(
      subject,
      topic,
      customTopic,
      count
    );

    // 2. Chamar a API da IA
    const aiResponseText = await callGeminiAPI(
      generationPrompt,
      genAI,
      modelName,
      safetySettings
    );

    // 3. Processar a resposta
    const cleanedJsonString = aiResponseText
      .replace(/^```json\s*|```$/g, "")
      .trim();
    const aiResult = JSON.parse(cleanedJsonString);

    if (
      !aiResult ||
      !Array.isArray(aiResult.questions) ||
      aiResult.questions.length === 0
    ) {
      throw new Error("A IA não retornou um array de questões válido.");
    }

    // 4. Validar e formatar as questões
    const validatedQuestions = aiResult.questions
      .map((qData, index) => {
        if (
          !qData ||
          typeof qData !== "object" ||
          !qData.texto_questao ||
          !qData.alternativas ||
          !qData.resposta_letra
        ) {
          console.warn(
            `${functionName}: Objeto de questão gerado pela IA inválido no índice ${index}:`,
            qData
          );
          return null;
        }
        return {
          ...qData,
          id: `gen-${Date.now()}-${index}`, // Garante um ID único e rastreável
          materia: qData.materia || subject,
          topico: qData.topico || topic,
        };
      })
      .filter(Boolean); // Remove nulos

    if (validatedQuestions.length === 0) {
      throw new Error("Formato das questões recebidas da IA é inválido.");
    }

    const responseBody = {
      questions: validatedQuestions,
    };

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`[ERRO] ${functionName}:`, error);
    const errorMessage = error.message || "Ocorreu um erro desconhecido.";
    // Tenta fornecer um erro mais útil para o frontend
    const userFriendlyError = errorMessage.includes("JSON")
      ? "Tive um problema ao processar a resposta da IA. O formato não era o esperado."
      : `A IA encontrou um problema: ${errorMessage}`;

    return new Response(JSON.stringify({ error: userFriendlyError }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
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

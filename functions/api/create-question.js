/**
 * Endpoint dedicado para a criação de questões pela IA.
 * Recebe: { topic: string, subject: string, count: number }
 * Retorna: { questions: Array, feedback?: string }
 */
export async function onRequestPost(context) {
  // Placeholder: A lógica completa será implementada na próxima etapa.
  try {
    const { request, env } = context;
    const requestData = await request.json();

    console.log("[create-question] Received data:", requestData);

    const { topic, subject, count } = requestData;

    // Validação básica
    if (!topic || !subject || !count) {
      return new Response(
        JSON.stringify({ error: "Dados insuficientes para gerar a questão." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // SIMULAÇÃO DE RESPOSTA DA IA (será substituído pela chamada real)
    const mockQuestions = Array.from({ length: count }, (_, i) => ({
      id: `gen-mock-${Date.now()}-${i}`,
      materia: subject,
      topico: topic,
      texto_questao: `Esta é uma questão mock ${
        i + 1
      } sobre "${topic}" em ${subject}. A IA irá gerar o conteúdo real aqui.`,
      alternativas: [
        { letra: "A", texto: "Alternativa A" },
        { letra: "B", texto: "Alternativa B" },
        { letra: "C", texto: "Alternativa C (Correta)" },
        { letra: "D", texto: "Alternativa D" },
        { letra: "E", texto: "Alternativa E" },
      ],
      resposta_letra: "C",
      referencia: "Gerado por IA (Mock)",
    }));

    const responseBody = {
      questions: mockQuestions,
      feedback: `Ok! Criei ${count} questão(ões) sobre ${topic} para você. (Esta é uma resposta de placeholder).`,
    };

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[create-question] Erro:", error);
    return new Response(
      JSON.stringify({
        error: "Erro interno ao processar a criação da questão.",
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

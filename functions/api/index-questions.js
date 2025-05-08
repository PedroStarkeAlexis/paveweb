// Modelo de embedding que usaremos (consistente com o índice e a busca)
const EMBEDDING_MODEL = "@cf/baai/bge-base-en-v1.5";

async function generateEmbeddingsBatch(ai, texts) {
  if (!texts || texts.length === 0) return [];
  try {
    const response = await ai.run(EMBEDDING_MODEL, { text: texts });
    return response.data || [];
  } catch (e) {
    console.error(
      `Erro ao gerar embeddings para lote: ${e.message}`,
      texts.slice(0, 2)
    );
    return texts.map(() => null);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const adminSecret = request.headers.get("X-Admin-Secret");
  if (adminSecret !== env.INDEXING_SECRET && env.CF_ENV !== "development") {
    return new Response("Acesso não autorizado.", { status: 403 });
  }

  const r2Bucket = env.QUESTOES_PAVE_BUCKET;
  const vectorIndex = env.QUESTIONS_INDEX;
  const ai = env.AI;

  if (!r2Bucket || !vectorIndex || !ai) {
    return new Response(
      JSON.stringify({
        error: "Bindings R2, Vectorize ou AI não configurados.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    console.log("Iniciando processo de indexação...");
    const r2Object = await r2Bucket.get("questoes.json");
    if (r2Object === null) {
      return new Response(
        JSON.stringify({ error: "questoes.json não encontrado no R2." }),
        { status: 404 }
      );
    }
    const allQuestionsData = await r2Object.json();
    if (!Array.isArray(allQuestionsData)) {
      return new Response(
        JSON.stringify({ error: "Formato de questoes.json inválido." }),
        { status: 500 }
      );
    }
    console.log(`Total de ${allQuestionsData.length} questões para processar.`);

    const textsForEmbedding = [];
    const processedQuestionMetadatas = [];

    for (const questao of allQuestionsData) {
      if (!questao || !questao.id || !questao.texto_questao) {
        console.warn("Questão inválida ou sem ID/texto:", questao);
        continue;
      }

      let textToEmbed = `${questao.materia || ""} ${questao.topico || ""} ${
        questao.texto_questao
      }`;
      textToEmbed = textToEmbed.replace(/\s+/g, " ").trim();

      if (textToEmbed) {
        textsForEmbedding.push(textToEmbed);

        const metadataPayload = {};

        if (questao.materia) {
          metadataPayload.materia = questao.materia.trim().toLowerCase();
        } else {
          metadataPayload.materia = "indefinida";
        }

        if (questao.topico) {
          metadataPayload.topico = questao.topico.trim().toLowerCase();
        } else {
          metadataPayload.topico = "indefinido";
        }

        if (questao.ano) {
          const anoNum = parseInt(questao.ano, 10);
          if (!isNaN(anoNum)) {
            metadataPayload.ano = anoNum;
          }
        }
        if (questao.etapa) {
          const etapaNum = parseInt(questao.etapa, 10);
          if (!isNaN(etapaNum)) {
            metadataPayload.etapa = etapaNum;
          }
        }
        processedQuestionMetadatas.push({
          questionId: questao.id.toString(),
          payload: metadataPayload,
        });
      }
    }

    const batchSize = 50;
    let processedCount = 0;

    console.log(
      `Iniciando geração de embeddings para ${textsForEmbedding.length} textos em lotes de ${batchSize}.`
    );

    for (let i = 0; i < textsForEmbedding.length; i += batchSize) {
      const textBatch = textsForEmbedding.slice(i, i + batchSize);
      const metadataBatch = processedQuestionMetadatas.slice(i, i + batchSize);
      console.log(
        `Processando lote ${Math.floor(i / batchSize) + 1} de ${Math.ceil(
          textsForEmbedding.length / batchSize
        )}... (${textBatch.length} textos)`
      );

      const embeddingVectors = await generateEmbeddingsBatch(ai, textBatch);
      const batchVectorsToInsert = [];

      for (let j = 0; j < embeddingVectors.length; j++) {
        if (embeddingVectors[j] && embeddingVectors[j].length > 0) {
          batchVectorsToInsert.push({
            id: metadataBatch[j].questionId,
            values: embeddingVectors[j],
            metadata: metadataBatch[j].payload,
          });
        } else {
          console.warn(
            `Embedding não gerado para questão ID: ${
              metadataBatch[j].questionId
            } (texto: "${
              textBatch[j] ? textBatch[j].substring(0, 50) + "..." : "VAZIO"
            }")`
          );
        }
      }

      if (batchVectorsToInsert.length > 0) {
        if (batchVectorsToInsert[0]) {
          console.log(
            "DEBUG: Exemplo de vetor para upsert (primeiro do lote):",
            JSON.stringify(batchVectorsToInsert[0], null, 2)
          );
        }
        try {
          await vectorIndex.upsert(batchVectorsToInsert);
          processedCount += batchVectorsToInsert.length;
          console.log(
            `${batchVectorsToInsert.length} vetores inseridos/atualizados no índice. Total processado: ${processedCount}`
          );
        } catch (upsertError) {
          console.error(
            `Erro ao fazer upsert no lote ${Math.floor(i / batchSize) + 1}:`,
            upsertError.message,
            upsertError.cause
              ? JSON.stringify(
                  upsertError.cause,
                  Object.getOwnPropertyNames(upsertError.cause)
                )
              : ""
          );
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: `Indexação concluída. ${processedCount} vetores processados e inseridos/atualizados.`,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Erro GERAL durante a indexação:",
      error.message,
      error.cause
        ? JSON.stringify(error.cause, Object.getOwnPropertyNames(error.cause))
        : "",
      error.stack ? error.stack : ""
    );
    return new Response(
      JSON.stringify({ error: `Erro na indexação: ${error.message}` }),
      { status: 500 }
    );
  }
}

export async function onRequest(context) {
  if (context.request.method === "POST") {
    return await onRequestPost(context);
  }
  return new Response(
    `Método ${context.request.method} não permitido. Use POST para indexar.`,
    { status: 405 }
  );
}

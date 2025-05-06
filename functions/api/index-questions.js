// Modelo de embedding que usaremos (consistente com o índice e a busca)
const EMBEDDING_MODEL = "@cf/baai/bge-base-en-v1.5";
// Adapte se usar outro modelo. Verifique a documentação do modelo para a dimensão correta.
// const EMBEDDING_DIMENSION = 768; // Já definido no índice

// Função para gerar embeddings em lotes
async function generateEmbeddingsBatch(ai, texts) {
  if (!texts || texts.length === 0) return [];
  try {
    const response = await ai.run(EMBEDDING_MODEL, { text: texts });
    return response.data || []; // Retorna um array de arrays (vetores)
  } catch (e) {
    console.error(
      `Erro ao gerar embeddings para lote: ${e.message}`,
      texts.slice(0, 2)
    );
    // Retorna um array de vetores nulos ou vazios do mesmo tamanho para manter o mapeamento
    return texts.map(() => null);
  }
}

export async function onRequestPost(context) {
  // Usaremos POST para acionar
  const { request, env } = context;

  // Simples proteção por header (melhorar em produção se necessário)
  const adminSecret = request.headers.get("X-Admin-Secret");
  if (adminSecret !== env.INDEXING_SECRET && env.CF_ENV !== "development") {
    // INDEXING_SECRET deve ser uma variável de ambiente
    return new Response("Acesso não autorizado.", { status: 403 });
  }

  const r2Bucket = env.QUESTOES_PAVE_BUCKET;
  const vectorIndex = env.QUESTIONS_INDEX;
  const ai = env.AI; // Binding para Workers AI

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

    // Limpar o índice antes de reindexar (OPCIONAL, mas útil para evitar duplicatas se IDs mudarem)
    // CUIDADO: Isso apaga tudo! Comente se não quiser.
    // const existingIds = (await vectorIndex.list()).ids.map(idMeta => idMeta.name);
    // if (existingIds.length > 0) {
    //   console.log(`Removendo ${existingIds.length} vetores existentes...`);
    //   await vectorIndex.deleteByIds(existingIds);
    // }

    const vectorsToInsert = [];
    const textsForEmbedding = [];
    const questionMetadatas = [];

    for (const questao of allQuestionsData) {
      if (!questao || !questao.id || !questao.texto_questao) {
        console.warn("Questão inválida ou sem ID/texto:", questao);
        continue;
      }

      // Construir o texto para embedding (experimente com diferentes combinações)
      let textToEmbed = `${questao.materia || ""} ${questao.topico || ""} ${
        questao.texto_questao
      }`;
      textToEmbed = textToEmbed.replace(/\s+/g, " ").trim(); // Normaliza espaços

      if (textToEmbed) {
        textsForEmbedding.push(textToEmbed);
        questionMetadatas.push({
          id: questao.id.toString(), // ID da questão original (precisa ser string)
          // Metadados para filtragem. Vectorize aceita string, number, boolean.
          ano: questao.ano ? parseInt(questao.ano) : null,
          materia: questao.materia || "Indefinida",
          etapa: questao.etapa ? parseInt(questao.etapa) : null,
          topico: questao.topico || "Indefinido",
        });
      }
    }

    // Gerar embeddings em lotes para não sobrecarregar a API de AI
    const batchSize = 50; // Ajuste conforme necessário (limites da API Workers AI)
    let processedCount = 0;

    for (let i = 0; i < textsForEmbedding.length; i += batchSize) {
      const textBatch = textsForEmbedding.slice(i, i + batchSize);
      const metadataBatch = questionMetadatas.slice(i, i + batchSize);
      console.log(
        `Processando lote ${Math.floor(i / batchSize) + 1}... (${
          textBatch.length
        } textos)`
      );

      const embeddingVectors = await generateEmbeddingsBatch(ai, textBatch);

      const batchVectorsToInsert = [];
      for (let j = 0; j < embeddingVectors.length; j++) {
        if (embeddingVectors[j] && embeddingVectors[j].length > 0) {
          // Verifica se o embedding foi gerado
          batchVectorsToInsert.push({
            id: metadataBatch[j].id, // ID original da questão
            values: embeddingVectors[j], // O vetor de embedding
            metadata: {
              // Metadados para filtragem
              ano: metadataBatch[j].ano,
              materia: metadataBatch[j].materia,
              etapa: metadataBatch[j].etapa,
              topico: metadataBatch[j].topico,
            },
          });
        } else {
          console.warn(
            `Embedding não gerado para questão ID: ${metadataBatch[j].id}`
          );
        }
      }

      if (batchVectorsToInsert.length > 0) {
        await vectorIndex.upsert(batchVectorsToInsert); // Usar upsert para inserir ou atualizar
        processedCount += batchVectorsToInsert.length;
        console.log(
          `${batchVectorsToInsert.length} vetores inseridos/atualizados no índice.`
        );
      }
      // Pequena pausa para não exceder limites de rate, se necessário
      // await new Promise(resolve => setTimeout(resolve, 200));
    }

    return new Response(
      JSON.stringify({
        message: `Indexação concluída. ${processedCount} vetores processados e inseridos/atualizados.`,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro durante a indexação:", error);
    return new Response(
      JSON.stringify({ error: `Erro na indexação: ${error.message}` }),
      { status: 500 }
    );
  }
}

// Handler genérico - permite POST para iniciar a indexação
export async function onRequest(context) {
  if (context.request.method === "POST") {
    return await onRequestPost(context);
  }
  return new Response(
    `Método ${context.request.method} não permitido. Use POST para indexar.`,
    { status: 405 }
  );
}

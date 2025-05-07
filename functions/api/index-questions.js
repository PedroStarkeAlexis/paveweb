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
    // try {
    //   console.log("Tentando listar IDs existentes para limpeza...");
    //   const existingIdsResponse = await vectorIndex.list();
    //   if (existingIdsResponse && existingIdsResponse.ids && existingIdsResponse.ids.length > 0) {
    //       const existingIds = existingIdsResponse.ids.map(idMeta => idMeta.name);
    //       console.log(`Removendo ${existingIds.length} vetores existentes...`);
    //       await vectorIndex.deleteByIds(existingIds);
    //   } else {
    //       console.log("Nenhum vetor existente encontrado para remover ou falha ao listar.");
    //   }
    // } catch (listError) {
    //     console.warn("Aviso ao tentar listar/deletar vetores (pode ser normal se o índice estiver vazio ou novo):", listError.message);
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
          // Normaliza 'materia' para minúsculas para consistência no filtro
          materia: questao.materia
            ? questao.materia.toLowerCase()
            : "indefinida",
          etapa: questao.etapa ? parseInt(questao.etapa) : null,
          topico: questao.topico ? questao.topico.toLowerCase() : "indefinido", // Opcional: normalizar tópico também
        });
      }
    }

    // Gerar embeddings em lotes para não sobrecarregar a API de AI
    const batchSize = 50; // Ajuste conforme necessário (limites da API Workers AI)
    let processedCount = 0;

    console.log(
      `Iniciando geração de embeddings para ${textsForEmbedding.length} textos em lotes de ${batchSize}.`
    );

    for (let i = 0; i < textsForEmbedding.length; i += batchSize) {
      const textBatch = textsForEmbedding.slice(i, i + batchSize);
      const metadataBatch = questionMetadatas.slice(i, i + batchSize);
      console.log(
        `Processando lote ${Math.floor(i / batchSize) + 1} de ${Math.ceil(
          textsForEmbedding.length / batchSize
        )}... (${textBatch.length} textos)`
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
              materia: metadataBatch[j].materia, // Já está em minúsculas
              etapa: metadataBatch[j].etapa,
              topico: metadataBatch[j].topico, // Já está em minúsculas (se normalizado acima)
            },
          });
        } else {
          console.warn(
            `Embedding não gerado para questão ID: ${
              metadataBatch[j].id
            } (texto: "${
              textBatch[j] ? textBatch[j].substring(0, 50) + "..." : "VAZIO"
            }")`
          );
        }
      }

      if (batchVectorsToInsert.length > 0) {
        try {
          await vectorIndex.upsert(batchVectorsToInsert); // Usar upsert para inserir ou atualizar
          processedCount += batchVectorsToInsert.length;
          console.log(
            `${batchVectorsToInsert.length} vetores inseridos/atualizados no índice. Total processado: ${processedCount}`
          );
        } catch (upsertError) {
          console.error(
            `Erro ao fazer upsert no lote ${Math.floor(i / batchSize) + 1}:`,
            upsertError.message
          );
          // Tentar inserir um por um em caso de erro no lote (mais lento, mas pode salvar alguns)
          // console.log("Tentando inserir vetores individualmente após erro no lote...");
          // for (const vector of batchVectorsToInsert) {
          //   try {
          //     await vectorIndex.upsert([vector]);
          //     processedCount++;
          //   } catch (individualError) {
          //     console.error(`Falha ao inserir vetor individual ID ${vector.id}:`, individualError.message);
          //   }
          // }
        }
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
    console.error(
      "Erro durante a indexação:",
      error.message,
      error.stack ? error.stack : ""
    );
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

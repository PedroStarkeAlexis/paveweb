import { fetchAllQuestions } from "./utils/uploader";

// Modelo de embedding multilingual (suporta português e outros idiomas)
const EMBEDDING_MODEL = "@cf/baai/bge-m3";

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

  const vectorIndex = env.QUESTIONS_INDEX;
  const ai = env.AI;

  if (!vectorIndex || !ai) {
    return new Response(
      JSON.stringify({
        error: "Bindings Vectorize ou AI não configurados.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    console.log("Iniciando processo de indexação...");
    
    // Buscar questões via API do uploader (fonte unificada de dados)
    console.log("[DEBUG] Chamando fetchAllQuestions...");
    const allQuestionsData = await fetchAllQuestions(env);
    console.log(`[DEBUG] fetchAllQuestions retornou: ${allQuestionsData ? allQuestionsData.length : 'null/undefined'} questões`);
    
    if (!Array.isArray(allQuestionsData) || allQuestionsData.length === 0) {
      console.error("[ERROR] Nenhuma questão retornada. Array?", Array.isArray(allQuestionsData), "Length:", allQuestionsData?.length);
      return new Response(
        JSON.stringify({ error: "Nenhuma questão encontrada via API do uploader." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    console.log(`Total de ${allQuestionsData.length} questões para processar.`);

    const textsForEmbedding = [];
    const processedQuestionMetadatas = [];

    for (const questao of allQuestionsData) {
      if (!questao || !questao.id) {
        console.warn("Questão inválida ou sem ID:", questao);
        continue;
      }

      // Processar corpo_questao (novo formato: array de objetos)
      let corpoTexto = "";
      if (Array.isArray(questao.corpo_questao)) {
        console.log(`[DEBUG] Questão ${questao.id}: corpo_questao é array com ${questao.corpo_questao.length} itens`);
        corpoTexto = questao.corpo_questao
          .filter(item => item.tipo === "texto")
          .map(item => item.conteudo)
          .join(" ");
        console.log(`[DEBUG] Questão ${questao.id}: texto extraído (primeiros 100 chars): "${corpoTexto.substring(0, 100)}..."`);
      } else if (questao.texto_questao) {
        // Fallback para formato antigo
        console.log(`[DEBUG] Questão ${questao.id}: usando formato legado (texto_questao)`);
        corpoTexto = questao.texto_questao;
      } else {
        console.warn(`[WARN] Questão ${questao.id}: sem corpo_questao nem texto_questao`);
      }

      if (!corpoTexto.trim()) {
        console.warn("Questão sem corpo de texto:", questao.id);
        continue;
      }

      // Incluir alternativas para enriquecer o contexto semântico
      let alternativasTexto = "";
      if (Array.isArray(questao.alternativas)) {
        alternativasTexto = questao.alternativas
          .map(alt => `${alt.letra}: ${alt.texto}`)
          .join(" ");
      }

      // Incluir gabarito para melhor contexto
      const gabarito = questao.gabarito || questao.resposta_letra || "";
      const alternativaCorreta = questao.alternativas?.find(alt => alt.letra === gabarito);
      const respostaCorreta = alternativaCorreta ? `Resposta correta: ${alternativaCorreta.texto}` : "";

      let textToEmbed = `${questao.materia || ""} ${questao.topico || ""} ${corpoTexto} ${alternativasTexto} ${respostaCorreta}`;
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

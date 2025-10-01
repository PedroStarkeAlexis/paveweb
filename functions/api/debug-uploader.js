import { fetchAllQuestions } from "./utils/uploader";

export async function onRequestGet(context) {
  const { env } = context;
  
  const debugInfo = {
    timestamp: new Date().toISOString(),
    step1_calling_fetch: "Iniciando...",
  };

  try {
    debugInfo.step2_before_fetch = "Chamando fetchAllQuestions...";
    const questions = await fetchAllQuestions(env);
    
    debugInfo.step3_after_fetch = {
      isArray: Array.isArray(questions),
      length: questions?.length || 0,
      type: typeof questions,
    };

    if (questions && questions.length > 0) {
      const firstQuestion = questions[0];
      debugInfo.step4_first_question = {
        id: firstQuestion.id,
        hasCorpoQuestao: Array.isArray(firstQuestion.corpo_questao),
        corpoQuestaoLength: firstQuestion.corpo_questao?.length || 0,
        hasTextoQuestao: !!firstQuestion.texto_questao,
        corpoQuestaoItems: firstQuestion.corpo_questao?.map(item => ({
          tipo: item.tipo,
          hasConteudo: !!item.conteudo,
          conteudoLength: item.conteudo?.length || 0,
        })) || [],
      };
    } else {
      debugInfo.step4_no_questions = "Array vazio ou null";
    }

    debugInfo.success = true;
    
  } catch (error) {
    debugInfo.error = {
      message: error.message,
      stack: error.stack,
      name: error.name,
    };
  }

  return new Response(JSON.stringify(debugInfo, null, 2), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}

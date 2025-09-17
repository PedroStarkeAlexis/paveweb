const HISTORY_LENGTH = 8;

/**
 * Builds the history array for the AI API call from the message list.
 * @param {Array} messages - The current list of message objects.
 * @returns {Array} The formatted history for the API.
 */
function buildApiHistory(messages) {
    return messages.slice(-HISTORY_LENGTH).map(msg => {
        if (!msg) return null;

        const role = msg.sender === 'user' ? 'user' : 'model';

        if (msg.type === 'flashcard_display' && msg.flashcardsData && msg.flashcardsData.length > 0) {
            let flashcardsText = "Flashcards Gerados (Termos):\n";
            msg.flashcardsData.forEach(fc => {
                flashcardsText += `  - ${fc.term}\n`;
            });
            return { role: 'model', parts: [{ text: flashcardsText.trim() }] };
        }
        else if (typeof msg.content === 'string' && msg.content.trim() !== '') {
            return { role, parts: [{ text: msg.content }] };
        }
        return null;
    }).filter(Boolean);
}

/**
 * Processes the API response and creates message objects for the chat UI.
 * @param {object} data - The JSON data from the API response.
 * @returns {Array} An array of new message objects to be added to the state.
 */
function processApiResponse(data) {
    const botResponses = [];
    const botMessageIdBase = `bot-${Date.now()}`;

    // 1. Add commentary
    if (data?.commentary?.trim()) {
        botResponses.push({
            type: 'text',
            sender: 'bot',
            content: data.commentary,
            id: `${botMessageIdBase}-comment`
        });
    }

    // 2. Add PAVE info card
    if (data?.displayCard === "pave_info_recommendation") {
        botResponses.push({
            type: 'pave_info_card',
            sender: 'bot',
            id: `${botMessageIdBase}-paveinfocard`
        });
    }

    // 3. Add Flashcards
    if (data?.flashcards?.length > 0) {
        const validFlashcards = data.flashcards.filter(fc => fc && fc.term && fc.definition);
        if (validFlashcards.length > 0) {
            botResponses.push({
                type: 'flashcard_display',
                sender: 'bot',
                flashcardsData: validFlashcards,
                id: `${botMessageIdBase}-flashcards`
            });
        }
    }

    // 4. Add Questions
    if (data?.questions?.length > 0) {
        const validQuestions = data.questions.filter(q => q && q.alternativas && q.resposta_letra);
        if (validQuestions.length > 1) {
            botResponses.push({
                type: 'question_carousel',
                sender: 'bot',
                questionsData: validQuestions,
                id: `${botMessageIdBase}-carousel`
            });
        } else if (validQuestions.length === 1) {
            botResponses.push({ type: 'question', sender: 'bot', questionData: validQuestions[0], id: `${botMessageIdBase}-q0` });
        }
    }
    
    // Fallback if API returned OK but no content was processed
    if (botResponses.length === 0 && data?.displayCard !== "pave_info_recommendation") {
        botResponses.push({ type: 'text', sender: 'bot', content: 'Não tenho uma resposta específica para isso no momento.', id: `${botMessageIdBase}-fallback` });
    }

    return botResponses;
}


/**
 * Sends the chat history to the AI backend and returns the bot's responses.
 * @param {Array} messagesWithUserQuery - The current list of messages in the chat, including the latest user message.
 * @param {string} modelName - The AI model to be used for the request.
 * @returns {Promise<Array>} A promise that resolves to an array of bot message objects.
 * @throws {Error} Throws an error if the API call fails.
 */
export async function getAIResponse(messagesWithUserQuery, modelName) {
    const historyForAPI = buildApiHistory(messagesWithUserQuery);

    if (historyForAPI.length === 0) {
        return [];
    }

    const requestBody = {
        history: historyForAPI,
        modelName: modelName,
    };

    const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
    });

    const responseBody = await response.text();

    if (!response.ok) {
        let errorMsg = `Erro ${response.status}`;
        try {
            errorMsg = JSON.parse(responseBody).error || errorMsg;
        } catch (e) {
            // Ignore parse error, use status text
        }
        throw new Error(errorMsg);
    }
    
    try {
        const data = JSON.parse(responseBody);
        return processApiResponse(data);
    } catch (e) {
        throw new Error("Resposta inesperada do servidor.");
    }
}
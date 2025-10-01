// Teste simples da API Google GenAI
import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "your-api-key-here";

const genAI = new GoogleGenAI({ apiKey });

async function testSimple() {
  console.log("Test 1: Simple text generation");
  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Say hello in Portuguese",
    });
    
    console.log("Response:", response);
    console.log("Text:", response.text);
  } catch (error) {
    console.error("Error:", error);
  }
}

async function testStructuredOutput() {
  console.log("\nTest 2: Structured output");
  try {
    const schema = {
      type: Type.OBJECT,
      properties: {
        greeting: {
          type: Type.STRING,
          description: "A greeting in Portuguese",
        },
        language: {
          type: Type.STRING,
          description: "The language name",
        },
      },
      required: ["greeting", "language"],
    };

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Say hello",
      config: {
        responseSchema: schema,
        responseMimeType: "application/json",
      },
    });
    
    console.log("Response:", response);
    console.log("Text:", response.text);
    const data = JSON.parse(response.text);
    console.log("Parsed:", data);
  } catch (error) {
    console.error("Error:", error);
  }
}

testSimple().then(testStructuredOutput);

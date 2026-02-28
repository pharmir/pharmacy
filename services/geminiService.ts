
import { GoogleGenAI, Type } from "@google/genai";
import { MedicationInfo } from "../types";

export const getMedicationInsights = async (medName: string): Promise<MedicationInfo | null> => {
  if (!medName || medName.length < 3) return null;

  try {
    // Initialize GoogleGenAI inside the function to ensure the correct API key is used for the request context.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // pharmacology information falls under Complex Text Tasks (STEM), so using gemini-3-pro-preview.
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Provide pharmacological details for the medication: ${medName}. Return strictly JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            classification: { type: Type.STRING },
            commonUsage: { type: Type.STRING },
            sideEffects: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            interactionWarning: { type: Type.STRING }
          },
          required: ["name", "classification", "commonUsage", "sideEffects", "interactionWarning"]
        }
      }
    });

    // Access .text directly as a property from the response object.
    const text = response.text;
    if (!text) {
      console.warn("Gemini returned an empty response.");
      return null;
    }

    return JSON.parse(text.trim()) as MedicationInfo;
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return null;
  }
};

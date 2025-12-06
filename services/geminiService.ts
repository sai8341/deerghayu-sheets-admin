import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || ''; // In a real app, ensure this is set securely

const ai = new GoogleGenAI({ apiKey });

export const generateDiagnosisSuggestion = async (clinicalHistory: string, age: number, sex: string): Promise<string> => {
  if (!apiKey) {
    console.warn("API Key missing for Gemini");
    return "AI Service Unavailable: Missing API Key.";
  }

  try {
    const prompt = `
      Act as an expert Ayurvedic Doctor.
      Patient Details: Age ${age}, Sex ${sex}.
      Clinical History: ${clinicalHistory}.
      
      Please provide a brief suggested diagnosis (Nidana) and a suggested treatment plan (Chikitsa) in Ayurveda.
      Format it as:
      **Diagnosis:** [Diagnosis Name]
      **Plan:** [Treatment Plan]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Could not generate suggestion.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating suggestion. Please try again.";
  }
};
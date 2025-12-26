import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || ''; 

const ai = new GoogleGenAI({ apiKey });

export const generateDiagnosisSuggestion = async (clinicalHistory: string, age: number, sex: string): Promise<{ diagnosis: string; treatmentPlan: string }> => {
  if (!apiKey) {
    console.warn("API Key missing for Gemini");
    return { diagnosis: "Error: Missing API Key", treatmentPlan: "Please check configuration." };
  }

  try {
    const prompt = `
      Act as an expert Ayurvedic Doctor.
      Patient Details: Age ${age}, Sex ${sex}.
      Clinical History: ${clinicalHistory}.
      
      Please provide a brief suggested diagnosis (Nidana) and a suggested treatment plan (Chikitsa) in Ayurveda based on the clinical history.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diagnosis: {
              type: Type.STRING,
              description: 'The Ayurvedic diagnosis (Nidana)',
            },
            treatmentPlan: {
              type: Type.STRING,
              description: 'The Ayurvedic treatment plan (Chikitsa)',
            },
          },
          required: ['diagnosis', 'treatmentPlan'],
        },
      },
    });

    const text = response.text;
    if (text) {
        return JSON.parse(text);
    }
    return { diagnosis: "Could not generate diagnosis", treatmentPlan: "Could not generate plan" };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { diagnosis: "Error generating suggestion", treatmentPlan: "Please try again." };
  }
};
// FIX: Removed unused 'Type' import and ensured content generation follows the latest SDK best practices.
import { GoogleGenAI } from "@google/genai";
import { Person } from "../types";

const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateBio = async (person: Person, familyContext?: string): Promise<string> => {
  const ai = getAI();
  const prompt = `Write a beautiful, emotional, and concise family heritage biography (about 100 words) for the following person:
  Name: ${person.firstName} ${person.lastName}
  Gender: ${person.gender}
  Birth Date: ${person.birthDate}
  Place of Birth: ${person.placeOfBirth || 'Unknown'}
  Occupation: ${person.occupation || 'Unknown'}
  ${person.deathDate ? `Death Date: ${person.deathDate}` : ''}
  
  Family Context: ${familyContext || 'Part of a cherished family tree.'}
  
  Make it sound like a legacy record. Include a poetic touch about their contribution to the family line.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });
    // Property access .text is correct according to @google/genai guidelines.
    return response.text || "Could not generate biography at this time.";
  } catch (error) {
    console.error("Gemini AI error:", error);
    return "The stars are silent today. Please try again later.";
  }
};

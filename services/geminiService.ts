import { GoogleGenAI, Type } from "@google/genai";
import { Person, Gender } from "../types";

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
    return response.text || "Could not generate biography at this time.";
  } catch (error) {
    console.error("Gemini AI error:", error);
    return "The stars are silent today. Please try again later.";
  }
};

export const parseFamilyText = async (text: string): Promise<Person[]> => {
  const ai = getAI();
  const prompt = `Extract all family members and their relationships from the following text. 
  Assign unique string IDs to each person. 
  Crucially, identify parents and link them using 'fatherId' and 'motherId' fields corresponding to the IDs you generate.
  Output birth dates in YYYY-MM-DD format (estimate year if only age is given).
  Text: ${text}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              firstName: { type: Type.STRING },
              lastName: { type: Type.STRING },
              gender: { type: Type.STRING, enum: ['Male', 'Female', 'Other'] },
              birthDate: { type: Type.STRING },
              deathDate: { type: Type.STRING },
              fatherId: { type: Type.STRING },
              motherId: { type: Type.STRING },
              occupation: { type: Type.STRING },
              bio: { type: Type.STRING }
            },
            required: ['id', 'firstName', 'lastName', 'gender', 'birthDate']
          }
        }
      }
    });
    
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    throw new Error("Failed to parse family data. Please ensure the text is clear.");
  }
};
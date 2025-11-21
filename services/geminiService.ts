import { GoogleGenAI, Type } from "@google/genai";
import { ApiKey } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a creative and secure key string using Gemini.
 * Can generate standard random keys or mnemonic phrase keys.
 */
export const generateAIKey = async (type: 'random' | 'mnemonic'): Promise<string> => {
  try {
    const prompt = type === 'random' 
      ? "Generate a highly secure, random, 32-character alphanumeric API key string. Use mixed case and numbers. Return ONLY the raw string, no other text."
      : "Generate a memorable but secure API key in the format 'word-word-word-XXXX' where words are random English nouns and XXXX is a 4-digit number. Return ONLY the raw string.";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 1.0, // High randomness
      }
    });

    let key = response.text || '';
    // Clean up potential markdown or whitespace
    key = key.trim().replace(/`/g, '').replace(/\n/g, '');
    
    // Fallback if AI fails to return a clean string (unlikely but safe)
    if (key.length < 10) {
      return `fk_${Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}`;
    }

    return key;
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    // Fallback generation
    return `fk_fallback_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
};

/**
 * Analyzes the list of keys and provides security insights.
 */
export const analyzeSecurity = async (keys: ApiKey[]): Promise<{ score: number; summary: string; recommendations: string[] }> => {
  try {
    // Strip sensitive key strings before sending to AI context (simulation of best practice)
    const safeKeysData = keys.map(k => ({
      type: k.type,
      status: k.status,
      ageDays: Math.floor((Date.now() - new Date(k.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
      usage: k.usageCount,
      expiresInDays: k.expiresAt ? Math.floor((new Date(k.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 'N/A'
    }));

    const prompt = `
      Analyze this API key usage data for security risks.
      Data: ${JSON.stringify(safeKeysData)}
      
      Provide a response in JSON format with:
      1. 'score': A security score from 0-100 (integer).
      2. 'summary': A one-sentence summary of the security posture.
      3. 'recommendations': An array of 3 specific, actionable security recommendations based on the data.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            summary: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["score", "summary", "recommendations"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Audit Error:", error);
    return {
      score: 85,
      summary: "Security analysis unavailable at this time.",
      recommendations: ["Regularly rotate keys", "Remove unused temporary keys", "Monitor high usage keys"]
    };
  }
};

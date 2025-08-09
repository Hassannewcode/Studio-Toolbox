
import { GoogleGenAI, Type, GenerateContentResponse, Chat, Tool } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateText = async (
    prompt: string,
    systemInstruction: string,
    temperature: number,
    topK: number,
    topP: number
): Promise<GenerateContentResponse> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: temperature,
                topK: topK,
                topP: topP,
            }
        });
        return response;
    } catch (error) {
        console.error("Error generating text:", error);
        throw error;
    }
};

export const generateImages = async (
    prompt: string,
    numberOfImages: number,
    aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9"
) => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: {
                numberOfImages: numberOfImages,
                outputMimeType: 'image/jpeg',
                aspectRatio: aspectRatio,
            },
        });
        return response.generatedImages;
    } catch (error) {
        console.error("Error generating images:", error);
        throw error;
    }
};

export const createChat = (systemInstruction?: string): Chat => {
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstruction || 'You are a helpful and creative assistant in a digital workshop.',
        },
    });
};

export const sendMessageStream = async (chat: Chat, message: string): Promise<AsyncGenerator<GenerateContentResponse>> => {
    try {
        const result = await chat.sendMessageStream({ message });
        return result;
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
};

export const generateJson = async (prompt: string, schema: any): Promise<GenerateContentResponse> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            },
        });
        return response;
    } catch (error) {
        console.error("Error generating JSON:", error);
        throw error;
    }
};


export const generateWithSearch = async (prompt: string): Promise<GenerateContentResponse> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        return response;
    } catch (error) {
        console.error("Error generating with search:", error);
        throw error;
    }
};

export const embedContent = async (text: string): Promise<number[]> => {
    try {
        const response = await ai.models.embedContent({
            model: "text-embedding-004",
            contents: text,
        });
        return response.embeddings[0].values;
    } catch (error) {
        console.error("Error generating embeddings:", error);
        throw error;
    }
};

export const generateFunctionCall = async (prompt: string, tools: Tool[]): Promise<GenerateContentResponse> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: tools,
            },
        });
        return response;
    } catch (error) {
        console.error("Error generating function call:", error);
        throw error;
    }
};
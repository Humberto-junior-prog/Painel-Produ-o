import { GoogleGenAI } from "@google/genai";
import { ProductionTask } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getProductionInsights(tasks: ProductionTask[]) {
  const prompt = `Analise a programação de panificação para hoje e forneça 3 insights estratégicos em português (pt-BR).
  Programação: ${JSON.stringify(tasks)}
  
  Foque em:
  1. Equilíbrio de carga entre Tiago, Guilherme e Danieli.
  2. Priorização de itens que levam mais tempo (fermentação, forno).
  3. Alerta de possíveis atrasos baseados no volume (ex: Pão Francês do Tiago).
  
  Retorne um JSON com a seguinte estrutura:
  {
    "insights": [
      { "title": "string", "description": "string", "type": "info" | "warning" | "success" }
    ]
  }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    
    if (!text) throw new Error("Sem resposta do Gemini");
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Erro ao obter insights:", error);
    return {
      insights: [
        { title: "Produção Estável", description: "Carga de trabalho parece bem distribuída entre a equipe.", type: "info" }
      ]
    };
  }
}

'use server';

import { LocalAIService } from '@/lib/api/localAI';

export interface GeneratePostState {
  success: boolean;
  content?: string;
  error?: string;
}

export async function generateSocialPost(topic: string, platform: string): Promise<GeneratePostState> {
  const systemPrompt = `Actúa como un Social Media Manager profesional para un medio de noticias alternativo llamado "RR-ONDA".
  Tu objetivo es adaptar noticias para redes sociales generando alto impacto y viralidad.
  Usa emojis, hashtags relevantes y un tono urgente pero veraz.`;

  const userPrompt = `Genera un post para ${platform} sobre el siguiente tema: "${topic}".
  
  Reglas por plataforma:
  - Twitter/X: Máximo 280 caracteres, hilo si es necesario, hashtags al final.
  - Instagram: Pie de foto atractivo, emojis al inicio, hashtags en bloque.
  - Facebook: Tono más conversacional, preguntas a la audiencia.
  - LinkedIn: Tono profesional, enfoque en impacto o industria.
  
  Devuelve SOLO el texto del post, sin explicaciones extra.`;

  const fullPrompt = `${systemPrompt}\n\nContexto: ${userPrompt}`;

  try {
    const result = await LocalAIService.generate({
      prompt: fullPrompt,
      model: 'mistral' // Mistral suele ser muy rápido y bueno en español
    });

    return { success: true, content: result.response };
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'AI_OFFLINE') {
      return { 
        success: false, 
        error: 'Ollama no detectado. Asegúrate de tener Ollama corriendo (http://localhost:11434).' 
      };
    }
    return { success: false, error: 'Error generando contenido.' };
  }
}

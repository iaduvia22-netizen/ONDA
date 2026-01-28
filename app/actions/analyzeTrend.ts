'use server';

import { LocalAIService } from '@/lib/api/localAI';

export async function analyzeTrendAction(titles: string[]): Promise<string> {
  const prompt = `Analiza los siguientes titulares y detecta los temas con MAYOR POTENCIAL VIRAL y de conversación social en Colombia.
  
  Tu objetivo es responder: "¿De qué está hablando la gente hoy?"
  
  Titulares:
  ${titles.join('\n')}
  
  Instrucciones:
  1. Identifica el tema #1 más polémico o emocional.
  2. Resume brevemente por qué es viral (ej: "Indignación por...", "Celebración tras...").
  3. Usa un tono dinámico, como de rrss. Max 50 palabras.
  
  Resumen de Viralidad:`;

  try {
    const result = await LocalAIService.generate({
        prompt,
        model: 'mistral'
    });
    return result.response;
  } catch (error) {
    return "No se pudo generar el análisis de tendencias en este momento.";
  }
}

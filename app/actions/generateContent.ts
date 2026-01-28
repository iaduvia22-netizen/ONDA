"use server"

import { runInvestigation, InvestigationResult, generateTransmediaPack } from "@/lib/api/ai-service"

/**
 * Acción del servidor para iniciar la investigación profunda de una noticia.
 */
export async function startInvestigationAction(title: string, context: string): Promise<InvestigationResult> {
  if (!title) throw new Error("Título de la noticia es requerido para la investigación.");
  
  try {
    const result = await runInvestigation(title, context || "Sin contexto adicional disponible.");
    return result;
  } catch (error: any) {
    console.error("Error en Acción de Investigación:", error);
    throw new Error(error.message || "Fallo crítico en el motor de investigación.");
  }
}

/**
 * Acción para ejecutar el protocolo "CREAR ONDA" (Kit de Redes Sociales).
 */
export async function generateTransmediaAction(report: string, title: string): Promise<string> {
  if (!report) throw new Error("Se requiere el reporte de investigación para crear el kit transmedia.");
  
  try {
    const pack = await generateTransmediaPack(report, title);
    return pack;
  } catch (error: any) {
    console.error("Error en Acción Transmedia:", error);
    throw new Error("No se pudo generar el ecosistema de contenidos.");
  }
}

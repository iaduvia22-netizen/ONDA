import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { systemSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * NÚCLEO DE INTELIGENCIA ONDA V-FINAL (GEMINI CASCADE + SEARCH ENGINE)
 * Integración con Tavily AI para investigación y Gemini (Multi-Modelo Fallback) para redacción.
 */

export interface InvestigationResult {
  report: string;
  sourcesFound: number;
  entitiesMatched: string[];
}

import { getActiveKey } from "@/lib/vault";

const TAVILY_API_KEY = getActiveKey('TAVILY');
const DEFAULT_GEMINI_API_KEY = getActiveKey('GEMINI');
const OLLAMA_HOST = 'http://localhost:11434';

const MODELS_TO_TRY = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
];



/**
 * Función Maestra de Cascada: Prueba múltiples llaves de la Bóveda y múltiples modelos.
 */
async function generateWithVaultRotation(prompt: string, contextName: string): Promise<{text: string | null, lastError: string | null}> {
  // 1. Obtener llaves de la Bóveda
  let vaultKeys: string[] = [];
  try {
    const settings = await db.query.systemSettings.findMany();
    vaultKeys = settings
      .filter(s => s.key.startsWith('key') && s.value.trim().length > 0)
      .map(s => s.value);
  } catch (e: any) {
    console.warn(`[${contextName}] No se pudo acceder a la Bóveda DB.`);
  }

  // Combinar con la llave por defecto al principio
  let allKeys = [...(DEFAULT_GEMINI_API_KEY ? [DEFAULT_GEMINI_API_KEY] : []), ...vaultKeys];
  
  if (allKeys.length === 0) {
    return { text: null, lastError: "No hay configurada ninguna llave de API de Gemini." };
  }

  // Priorizar la llave por defecto (ya está primera), solo mezclar las de la bóveda
  if (allKeys.length > 1) {
    const [defaultKey, ...rest] = allKeys;
    allKeys = [defaultKey, ...rest.sort(() => Math.random() - 0.5)];
  }

  let lastError = null;

  // LOOP 1: Rotación de Llaves (API Keys)
  for (const [keyIdx, apiKey] of allKeys.entries()) {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // LOOP 2: Rotación de Modelos para esta llave
    for (const modelName of MODELS_TO_TRY) {
      try {
        console.log(`[${contextName}] (Key ${keyIdx+1}/${allKeys.length}) Intentando modelo: ${modelName}...`);
        
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096, // Limitar output para evitar generación desbordada
          },
        });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        if (text && text.trim().length > 0) {
           return { text, lastError: null };
        }

      } catch (error: any) {
        lastError = error.message || "Error desconocido";
        console.warn(`[${contextName}] (Key ${keyIdx+1}) Fallo ${modelName}: ${lastError.split('[')[0]}`);
        
        // CATCH-ALL: Si la llave tiene problemas (403, 404, 400 Bad Request por Leaked Key, 429 quota)
        // Saltamos de inmediato a la siguiente llave.
        if (
            lastError.includes("429") || 
            lastError.includes("403") || 
            lastError.includes("404") || 
            lastError.includes("400") || 
            lastError.toLowerCase().includes("not found") ||
            lastError.toLowerCase().includes("leaked") ||
            lastError.toLowerCase().includes("invalid")
        ) {
          console.warn(`[${contextName}] Llave ${keyIdx+1} DESCARTADA (${lastError.split(' ')[0]}). Saltando...`);
          break; // Rompe el loop de modelos y va a la siguiente llave
        }
      }
    }
  }
  
  return { text: null, lastError };
}

export class InvestigationEngine {
  static async start(title: string, context: string): Promise<InvestigationResult> {
    console.log(`[ONDA-INTEL] Iniciando investigación de Alto Nivel para: ${title}`);

    if (!TAVILY_API_KEY) {
      return {
        report: "# ERROR DE RED\n\nFalta la clave de investigación (Tavily).",
        sourcesFound: 0,
        entitiesMatched: []
      };
    }

    try {
      // 1. ESCANEO OSINT DE NIVEL RADICAL
      const searchResponse = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: TAVILY_API_KEY,
          query: `${title} ${context}`,
          search_depth: "advanced",
          include_images: true, 
          include_answer: false,
          max_results: 7 // 7 fuentes son suficientes para un reporte sólido (ahorro ~30% tokens)
        })
      });

      const searchData = await searchResponse.json();
      const safeResults = (searchData.results && Array.isArray(searchData.results)) ? searchData.results : [];
      
      interface TavilyImage {
        url: string;
        [key: string]: unknown;
      }
      
      const rawImages: (string | TavilyImage)[] = searchData.images || [];
      const images = rawImages.map((img) => {
        const url = typeof img === 'string' ? img : img.url;
        return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&default=${encodeURIComponent(url)}&n=-1`;
      });
      
      // Construir Bloque de Evidencia (optimizado: truncar contenido largo, sin URLs en prompt)
      const evidenceBlock = safeResults.map((r: any, i: number) => {
         const truncatedContent = r.content?.substring(0, 500) || ''; // Truncar a 500 chars max por fuente
         return `[F${i+1}] ${r.title}\n${truncatedContent}`;
      }).join('\n---\n');

      // Bloque separado de URLs para incluir solo en el reporte final
      const sourcesBlock = safeResults.map((r: any, i: number) => `- [Fuente ${i+1}](${r.url})`).join('\n');

// PROMPT: Periodismo responsable y especializado
      const prompt = `Actúa como Director de Inteligencia de Onda Radio. Analiza estas fuentes para detectar la VERDAD central, el impacto CIUDADANO y los datos DUROS.
No hagas un resumen genérico. Encuentra el "ángulo humano" y las consecuencias reales.

FUENTES DE INTELIGENCIA:
${evidenceBlock}

ESTRUCTURA DEL REPORTE (Markdown):
# 📡 REPORTE DE INTELIGENCIA: [TÍTULO IMPACTANTE]
### 🔍 HALLAZGOS CLAVE
- [Dato 1 con cifra]
- [Dato 2 con implicación]
...

### 📝 ANÁLISIS DE IMPACTO
- **Contexto:** (Qué está pasando realmente detrás de los titulares)
- **Impacto Local:** (Cómo afecta al ciudadano de a pie)
- **Prospección:** (Qué podemos esperar en las próximas 72 horas)

### 📚 FUENTES VERIFICADAS
${sourcesBlock}`;

      let reportText = "";

      // INTENTO DE IA (GEMINI CASCADE CON ROTACIÓN)
      // 3. GENERACIÓN DE REPORTE NARRATIVO (Con Cascada de Bóveda)
      const { text, lastError } = await generateWithVaultRotation(prompt, "ONDA-INTEL");
      if (text) reportText = text;
      else console.error("[ONDA-INTEL] Fallo total de IA (Bóveda + Local):", lastError);
      
      if (!reportText) {
         // Fallback Local (OLLAMA) si todo lo anterior falla
         try {
           console.log("[ONDA-INTEL] Gemini falló, intentando Ollama Local...");
           const aiResponse = await fetch(`${OLLAMA_HOST}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                model: process.env.MODEL_NAME || 'llama3', // Usa variable de entorno
                prompt: prompt, 
                stream: false 
            }),
            signal: AbortSignal.timeout(90000)
          });
          if (aiResponse.ok) {
            const data = await aiResponse.json();
            reportText = data.response;
          }
        } catch(e) { console.warn("Fallo IA Local también."); }
      }

      if (reportText) {
        return {
          report: reportText,
          sourcesFound: safeResults.length,
          entitiesMatched: [...images, "---SPLIT---", ...rawImages.map((img: any) => typeof img === 'string' ? img : img.url)]
        };
      }

      // 4. FALLBACK FINAL: REPORTE DE "DATOS CRUDOS"
      console.warn("[ONDA-INTEL] Fallo total de IA (Cloud+Local). Mostrando Datos Crudos...");
      
      const rawReport = `
# EXPEDIENTE DE ACCESO DIRECTO (RAW INTEL)

**NOTA DEL SISTEMA:** El motor de redacción neuronal no está disponible, pero la investigación OSINT fue exitosa. A continuación se presentan los datos crudos recuperados.

---

## 🔍 HALLAZGOS CONFIRMADOS (${safeResults.length} Fuentes)

${safeResults.map((r: any, i: number) => `
### ${i+1}. ${r.title}
> "${r.content}"
*   **Fuente:** [Ver Enlace Original](${r.url})
`).join('\n')}

---
*Reporte generado automáticamente por Onda Radio Intelligence.*
`;

      return {
        report: rawReport,
        sourcesFound: safeResults.length,
        entitiesMatched: [...images, "---SPLIT---", ...rawImages.map((img: any) => typeof img === 'string' ? img : img.url)]
      };

    } catch (error: unknown) {
      console.error("[ONDA-INTEL] Error Crítico:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      return {
        report: `# ERROR DE SISTEMA\n\nNo se pudo completar la investigación.\nError: ${errorMessage}`,
        sourcesFound: 0,
        entitiesMatched: []
      };
    }
  }
}

export async function runInvestigation(title: string, context: string): Promise<InvestigationResult> {
  return await InvestigationEngine.start(title, context);
}

// 🚀 PROTOCOLO DE ESTRATEGIA DIGITAL "ONDA" V-FINAL 
export async function generateTransmediaPack(reportContent: string, title: string): Promise<string> {
  const prompt = `Actúa como Estratega Digital Senior para Onda Radio. Tu misión es transformar este reporte técnico en una narrativa transmedia HUMANA, COHERENTE y VIRAL. 
EVITA los clichés de IA ("¿Sabías que...?", "Descubre aquí..."). Habla como un periodista real que le cuenta algo importante a su comunidad.

REPORTE BASE: "${reportContent.substring(0, 5000)}"
TEMA: "${title}"

Responde en este formato exacto (markdown):

### A. EL TITULAR MAESTRO
**H1:** (Un titular que atrape pero sea 100% veraz)
**Meta-Descripción:** (Resumen SEO humano)

### B. NOTA WEB (ONDA BLOG)
(Escribe una crónica periodística de 500 palabras. Usa subtítulos. Céntrate en por qué esto es noticia HOY).

### C. FACEBOOK (COMUNIDAD)
(Post informativo pero cálido. Genera debate respetuoso sobre el tema).

### D. CARRUSEL DE INSTAGRAM (4 ACTOS)
(IMPORTANTE: Cada slide debe contar una parte de la historia. Usa **negritas dobles** para las palabras que quieras destacar en VERDE ONDA).
- **SLIDE 1 (GANCHO):** (Un gancho visual disruptivo pero relacionado al tema. Ejemplo: "La verdad sobre el **[Tema]** en nuestra ciudad").
- **SLIDE 2 (EL HECHO):** (El dato más fuerte extraído del reporte).
- **SLIDE 3 (EL CONTEXTO):** (Por qué esto te afecta a TI, el lector).
- **SLIDE 4 (ACCION):** (Un llamado a la acción real o reflexión final).

### E. X / TWITTER (HILO)
(3 posts concatenados con la esencia de la noticia).

### F. TIKTOK / REELS (GUIÓN)
**Gancho:** (Frase potente para 3s)
**Desarrollo:** (3 puntos clave)
**Cierre:** (Reflexión final)

### G. FLYER UNIFICADO
**TEXTO GIGANTE:** (Máximo 3 palabras clave)
**SUBTÍTULO:** (Frase de contexto)

### H. CENTRAL DE HASHTAGS
(Hashtags estratégicos)`;

  try {
     // 1. INTENTO CON GEMINI CASCADE Y BÓVEDA DE LLAVES
    const { text, lastError } = await generateWithVaultRotation(prompt, "ONDA-TRANS");
    if (text) return text;
    console.warn("[ONDA-TRANS] Bóveda de IA falló por completo:", lastError);
    
    // 2. INTENTO CON OLLAMA (Local) - Solo si Gemini falla
    try {
      console.log(`[ONDA-TRANS] Intentando IA Local...`);
      const aiResponse = await fetch(`${OLLAMA_HOST}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
              model: 'llama3', 
              prompt: prompt, 
              stream: false 
          }), 
          signal: AbortSignal.timeout(120000) 
      });
        
      if (aiResponse.ok) {
          const data = await aiResponse.json();
          if (data.response) return data.response;
      }
    } catch (e) {
      console.warn("[ONDA-TRANS] IA Local no disponible.");
    }

    // 3. SUPER FALLBACK: GENERACIÓN POR REGLAS
    return `
### A. EL TITULAR MAESTRO
**H1:** ${title}
**Meta-Descripción:** Reporte especial de Onda Radio sobre ${title}.

### B. NOTA WEB
${reportContent}

### D. CARRUSEL DE INSTAGRAM
- **SLIDE 1 (GANCHO):** La verdad sobre **${title}**.
- **SLIDE 2 (EL HECHO):** Datos verificados sobre la situación actual.
- **SLIDE 3 (EL CONTEXTO):** Así nos afecta a todos como comunidad.
- **SLIDE 4 (ACCION):** Mantente informado con Onda Radio.
    `;
  } catch (error: any) {
    console.error("[ONDA-TRANS] Fallo Crítico:", error);
    return `# ERROR DE GENERACIÓN\n\nEl estratega digital no pudo procesar la solicitud.\nMotivo: ${error.message}.`;
  }
}

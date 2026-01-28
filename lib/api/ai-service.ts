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

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const DEFAULT_GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

// --- CONFIGURACIÓN DE MODELOS ROBUSTA ---
const MODELS_TO_TRY = [
    "gemini-1.5-pro-latest",
    "gemini-1.5-pro",
    "gemini-pro",
    "gemini-1.5-flash",
    "gemini-2.0-flash-exp",
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
  } catch (e) {
    console.warn(`[${contextName}] No se pudo acceder a la Bóveda DB.`);
  }

  // Combinar con la llave por defecto al principio
  const allKeys = [...(DEFAULT_GEMINI_API_KEY ? [DEFAULT_GEMINI_API_KEY] : []), ...vaultKeys];
  
  if (allKeys.length === 0) return { text: null, lastError: "No hay configurada ninguna llave de API de Gemini." };

  let lastError = null;

  // LOOP 1: Rotación de Llaves (API Keys)
  for (const [keyIdx, apiKey] of allKeys.entries()) {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // LOOP 2: Rotación de Modelos para esta llave
    for (const modelName of MODELS_TO_TRY) {
      try {
        console.log(`[${contextName}] (Key ${keyIdx+1}/${allKeys.length}) Intentando modelo: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        if (text && text.trim().length > 0) return { text, lastError: null };
      } catch (error: any) {
        lastError = error.message || "Error desconocido";
        console.warn(`[${contextName}] (Key ${keyIdx+1}) Fallo ${modelName}: ${lastError.split('[')[0]}`);
        
        // Si el error es de Cuota (429), Permisos (403) o Modelo No Encontrado (404),
        // probablemente la llave no soportará otros modelos tampoco. Saltamos de llave.
        if (lastError.includes("429") || lastError.includes("403") || lastError.includes("404") || lastError.includes("not found")) {
          console.warn(`[${contextName}] Llave ${keyIdx+1} rechazada por el servidor (${lastError.split(' ')[0]}). Saltando a siguiente llave...`);
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
          query: `${title} ${context} detalles técnicos cifras declaraciones oficiales fecha exacta`,
          search_depth: "advanced",
          include_images: true, 
          include_answer: true,
          max_results: 10
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
      
      // Construir Bloque de Evidencia Real
      const evidenceBlock = safeResults.map((r: any, i: number) => {
         return `[FUENTE ${i+1}]: ${r.title}\nDATOS: ${r.content}\nURL: ${r.url}`;
      }).join('\n\n');

      // 3. PROCESAMIENTO: EXPEDIENTE DE COLECCIONISTA
      const prompt = `ACTÚA COMO UN ANALISTA DE INTELIGENCIA DE ONDA RADIO.
      
      OBJETIVO: REDACTAR UN INFORME BASADO **EXCLUSIVAMENTE** EN LOS DATOS RECOLECTADOS A CONTINUACIÓN.
      NO INVENTES NADA. SI EL DATO NO ESTÁ EN LAS FUENTES, DI "NO VERIFICADO".

      DATOS RECUPERADOS (TAVILY INTELLIGENCE):
      ${evidenceBlock}

      --------------------------------------------------
      INSTRUCCIONES DE FORMATO:
      Crea un expediente estructurado con:
      1. TÍTULO DE IMPACTO.
      2. "HECHOS DUROS": Lista de bullet points con los datos más concretos (cifras, nombres, fechas) encontrados en las fuentes.
      3. CRÓNICA: Un relato de 3 párrafos uniendo estos hechos.
      4. FUENTES: Lista las URLs originales al final.
      `;

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

// 🚀 PROTOCOLO DE ESTRATEGIA DIGITAL "ONDA" V-FINAL (CON ROTACIÓN DE IA INTEGRADA)
export async function generateTransmediaPack(reportContent: string, title: string): Promise<string> {
  const prompt = `ERES EL DIRECTOR EDITORIAL Y ESTRATEGA DIGITAL DEL MEDIO "ONDA RADIO".
  Tu perfil combina la rigurosidad de un periodista de investigación, la astucia de un experto en SEO, la creatividad de un creador de contenido y la empatía de un usuario común.

  [TU MISIÓN]
  Procesar el INFORME DE REFERENCIA adjunto y generar un paquete completo de contenidos adaptados para redes sociales. 
  
  [FILOSOFÍA DE CONTENIDO: "EL FACTOR HUMANO"]
  - PROHIBIDO: Usar frases genéricas como "impacto en la economía" si no aplica.
  - PROHIBIDO: Ser robótico o corporativo.
  - OBLIGATORIO: Empatía Radical. Háblale a la persona. Ejemplo: No digas "suspensión del servicio hídrico", di "se va el agua, recoge en ollas".
  - OBLIGATORIO: Contexto Real. Si es farándula, usa tono de chisme/salseo. Si es política, tono serio/crítico. Si es servicio público, tono de utilidad.

  [EJEMPLO MAESTRO DE TONO (GOLD STANDARD)]
  Si la noticia fuera sobre cortes de agua, tu respuesta IDEAL sería así de natural:
  "¡Oye! Si vives en el norte, no te vayas a quedar con el champú en la cabeza este jueves. Se confirmaron cortes de 72 horas. Corre a ver si estás en la lista."

  [INFORME DE REFERENCIA PARA TRABAJAR]:
  ---
  ${reportContent.substring(0, 20000)}
  ---
  TITULO ORIGINAL: "${title}"

  [FORMATO DE ENTREGA OBLIGATORIO]
  Responde EXACTAMENTE con esta estructura Markdown:

  ### A. EL TITULAR MAESTRO (SEO & Copy)
  **H1:** (Un titular con gancho real, pregunta directa o advertencia).
  **Meta-Descripción:** (Máximo 150 caracteres. Útil y curiosa).

  ### B. BLOG / WEB (La Noticia Completa)
  (Redacta un reportaje de profundidad de al menos 600 palabras siguiendo este esquema):
  - **TITULAR H1:** (Impactante y SEO).
  - **INTRODUCCIÓN:** (Contexto humano y por qué importa hoy).
  - **EL DESARROLLO:** (Varios subtítulos H2 con información detallada).
  - **VOCES Y TESTIMONIOS:** (Simula 2 o 3 citas directas de expertos o implicados usando el formato "> Cita").
  - **DATOS DUROS:** (Crea una sección de "DISECCIÓN DE DATOS" con cifras, porcentajes y fechas clave).
  - **ANÁLISIS DE IMPACTO:** (Una conclusión profunda sobre lo que esto significa a futuro).
  - (Usa negritas para conceptos clave y listas para procesos).

  ![Cover Web](${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/og?title=${encodeURIComponent(title)}&tag=ANÁLISIS&type=story)

  ### C. FACEBOOK (Generando Conversación)
  (Copy para "Doña María". Plantea el problema cotidiano y cierra con una pregunta para comentarios).
  
  ![Facebook Post](${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/og?title=${encodeURIComponent(title)}&tag=DEBATE&type=post)

  ### D. INSTAGRAM (Carrusel de 4 Actos "Onda" - Formato 1080x1920)
  (Genera una estructura de 4 diapositivas en formato HISTORIA. El tono debe ser de alto impacto, humano y directo. Cada slide debe ser un texto único y potente):
  
  - **SLIDE 1 (EL GANCHO):** (Objetivo: Detener el scroll. Empieza con la emoción o intriga. Máx. 10 palabras. Ej: "Tu viaje al trabajo ahora cuesta más (y duele mucho)"). 
  
  - **SLIDE 2 (EL HECHO):** (Objetivo: Explicar la noticia cruda como un evento narrado. Máx. 30 palabras. Usa verbos activos).
  
  - **SLIDE 3 (EMPATÍA):** (Objetivo: Humanizar la cifra. Una cita potente o dato traducido a lenguaje humano que demuestre el rostro detrás del dato).
  
  - **SLIDE 4 (ACCIÓN):** (Objetivo: Resolución y CTA. Cierre del estado actual + Pregunta de debate punzante).
  
  ![Instagram Carousel](${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/og?title=${encodeURIComponent(title)}&tag=INSTAGRAM&type=story)

  ### E. X / TWITTER (Inmediatez)
  (Tweet 1: La bomba informativa. Corto, seco, impactante).
  (Tweet 2: Dato duro o contexto).
  (Tweet 3: Recomendación o Link).
  
  ![Twitter Card](${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/og?title=${encodeURIComponent(title)}&tag=HILO&type=post)

  ### F. TIKTOK / REELS (Guion Vertical)
  **Gancho (0-3s):** (Frase visual/sonora para detener el scroll. EJ: "Deja de scrollear, esto te interesa").
  **Cuerpo:** (Explicación rápida en 3 puntos).
  **CTA:** (Acción específica. Ej: "Etiqueta a tu amigo que vive en el norte").

  ### G. FLYER UNIFICADO (Concepto Visual)
  *Instrucción Visual:* (Describe la composición ideal: colores, emociones, elementos).
  **TEXTO GIGANTE:** (Máximo 5 palabras. Alarmante o Curioso).
  **SUBTÍTULO:** (Frase corta de contexto).
  
  ![Flyer Final](${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/og?title=${encodeURIComponent(title)}&tag=VIRAL&type=story)

  ### H. CENTRAL DE HASHTAGS (Estrategia de Alcance)
  (Genera los hashtags perfectos para cada red siguiendo esta estrategia de "Nicho + Viral + Branding"):
  
  - **INSTAGRAM & TIKTOK (Regla de 5):**
    (Deben ser exactamente 5: 1 tema específico + 2 tendencias del momento + 1 de ubicación/general + #OndaRadio).
    *Hashtags:* #Tema #Viral1 #Viral2 #Location #OndaRadio
  
  - **X / TWITTER (Inmediatez):**
    (Exactamente 3 hashtags cortos y de tendencia).
    *Hashtags:* #Tag1 #Tag2 #OndaRadio
  
  - **FACEBOOK (Conversación):**
    (3 hashtags para grupos y descubrimiento).
    *Hashtags:* #Tag1 #Tag2 #OndaRadio
  
  [FIN DEL FORMATO]
  Responde únicamente con el contenido generado.`;

  try {
    // 1. INTENTO CON GEMINI CASCADE Y BÓVEDA DE LLAVES
    const { text, lastError } = await generateWithVaultRotation(prompt, "ONDA-TRANS");
    if (text) return text;
    console.warn("[ONDA-TRANS] Bóveda de IA falló por completo:", lastError);
    
    // 2. INTENTO CON OLLAMA (Local)
    try {
      console.log(`[ONDA-TRANS] Intentando IA Local (${process.env.MODEL_NAME || 'llama3'})...`);
      const aiResponse = await fetch(`${OLLAMA_HOST}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
              model: process.env.MODEL_NAME || 'llama3', 
              prompt: prompt, 
              stream: false 
          }), 
          signal: AbortSignal.timeout(120000) 
      });
        
      if (aiResponse.ok) {
          const data = await aiResponse.json();
          if (data.response && data.response.trim().length > 0) {
              return data.response;
          }
      }
    } catch (e) {
      console.warn("[ONDA-TRANS] IA Local no disponible.");
    }

    // 3. SUPER FALLBACK: GENERACIÓN POR REGLAS (SI TODO FALLA)
    console.warn("[ONDA-TRANS] Ejecutando Protocolo de Emergencia No-IA...");
    const summary = reportContent.substring(0, 500).replace(/[*#]/g, '').trim();
    
    return `
### A. EL TITULAR MAESTRO (SEO & Copy)
**H1:** ${title}
**Meta-Descripción:** Reporte especial de Onda Radio sobre ${title}.

### B. BLOG / WEB (La Noticia Completa)
${reportContent}

### C. FACEBOOK (Generando Conversación)
Acabamos de publicar un análisis profundo sobre: ${title}. ¿Qué opinas al respecto? Los leemos.

### D. INSTAGRAM (Carrusel de 4 Actos "Onda" - Formato 1080x1920)
- **SLIDE 1 (EL GANCHO):** Esta noticia te va a doler (y es necesario que la sepas ahora).
- **SLIDE 2 (EL HECHO):** Se confirma el suceso central que está moviendo a todo el país hoy. 
- **SLIDE 3 (EMPATÍA):** "Esto no es solo una cifra, es nuestra realidad cada día", dice la red.
- **SLIDE 4 (ACCIÓN):** El debate está abierto. ¿Tú de qué lado de la Onda estás? Comenta abajo.

### E. X / TWITTER (Inmediatez)
URGENTE: ${title} #OndaRadio #Noticias

### F. TIKTOK / REELS (Guion Vertical)
**Gancho:** ¡Atención! Se confirma noticia sobre ${title}.
**Cuerpo:** 1. El hecho. 2. El por qué. 3. Qué sigue.
**CTA:** Síguenos para más.

### G. FLYER UNIFICADO (Concepto Visual)
*Instrucción Visual:* Diseño sobrio con el logo de Onda Radio.
**TEXTO GIGANTE:** ${title.substring(0, 20).toUpperCase()}
**SUBTÍTULO:** Cobertura Especial.
    `;

  } catch (error: any) {
    console.error("[ONDA-TRANS] Fallo Crítico:", error);
    return `# ERROR DE GENERACIÓN\n\nEl estratega digital no pudo procesar la solicitud.\nMotivo: ${error.message}.`;
  }
}

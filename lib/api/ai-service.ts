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
const DEFAULT_GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_1 || "";
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

const MODELS_TO_TRY = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
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

      // PROMPT: Periodismo responsable y constructivo
      const prompt = `Periodista de Onda Radio. Redacta informe verificado SOLO con datos de las fuentes. No inventes. Si falta dato: "NO VERIFICADO".
Tono: Profesional, claro, equilibrado. NO amarillismo. NO polarizar. NO especular.

FUENTES:
${evidenceBlock}

FORMATO:
1. TÍTULO INFORMATIVO (claro, preciso, sin exagerar)
2. HECHOS VERIFICADOS (bullets: cifras, nombres, fechas)
3. CONTEXTO (3 párrafos: qué pasó, por qué importa, qué sigue)
4. FUENTES:
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

// 🚀 PROTOCOLO DE ESTRATEGIA DIGITAL "ONDA" V-FINAL (CON ROTACIÓN DE IA INTEGRADA)
export async function generateTransmediaPack(reportContent: string, title: string): Promise<string> {
  // PROMPT: Periodismo constructivo y responsable
  const prompt = `Estratega de contenido digital de Onda Radio.
TONO: Claro, cercano, humano, propositivo. Lenguaje accesible para la comunidad.
REGLAS EDITORIALES:
- NO amarillismo, NO clickbait engañoso, NO polarizar.
- NO usar palabras como "URGENTE", "BOMBA", "ESCÁNDALO" salvo que sea estrictamente factual.
- NO especular ni generar miedo. Priorizar la información útil para el ciudadano.
- Incluir contexto y soluciones cuando sea posible.
- Ser empático sin ser manipulador.

MISIÓN: Transformar este informe en contenido social que informe, eduque y genere conversación constructiva.

INFORME: "${reportContent.substring(0, 6000)}"
TITULO: "${title}"

Responde en este formato exacto (markdown, sin preámbulos):

  ### A. EL TITULAR MAESTRO
  **H1:** (Titular claro e informativo que resuma el hecho central. Sin exaggerar).
  **Meta-Descripción:** (Resumen SEO <140 chars, preciso y honesto).

  ### B. BLOG / WEB
  (Reportaje 500 palabras. Estructura: H1, Contexto, Desarrollo con datos, Voces/Citas, Impacto ciudadano, Perspectiva a futuro).

  ### C. FACEBOOK
  (Copy conversacional e informativo. Presenta el hecho -> Explica por qué importa -> Invita a opinar con respeto).

  ### D. INSTAGRAM
  (Carrusel Story 4 Actos. Texto claro y directo).
  - SLIDE 1 (EL GANCHO): (Pregunta informativa o dato relevante que MENCIONE el tema concreto. Ejemplo: "¿Sabías que [dato real]?" o "Esto es lo que debes saber sobre [tema]". Máx 15 palabras. Sin clickbait).
  - SLIDE 2 (EL HECHO): (El dato central verificado, con cifras si las hay. Máx 20 palabras).
  - SLIDE 3 (EL CONTEXTO): (Por qué importa esto para la comunidad. Dato humano o cita. Máx 20 palabras).
  - SLIDE 4 (CONVERSACIÓN): (Invitación respetuosa a opinar + compartir para informar. Máx 15 palabras).

  ### E. X / TWITTER
  (3 Tweets informativos: 1. Hecho principal 2. Dato de contexto 3. Invitación a leer más).

  ### F. TIKTOK / REELS
  **Gancho:** (Frase informativa que enganche en 3s, sin alarma falsa).
  **Cuerpo:** (Explicación clara en 3 puntos).
  **CTA:** (Invitación a informarse y compartir).

  ### G. FLYER UNIFICADO
  *Instrucción Visual:* (Composición limpia y profesional).
  **TEXTO GIGANTE:** (Máx 4 palabras, informativo).
  **SUBTÍTULO:** (Contexto breve).

  ### H. CENTRAL DE HASHTAGS
  - **INSTAGRAM & TIKTOK:** #Tema #Información #Ciudad #OndaRadio #Comunidad
  - **X / TWITTER:** #Tag1 #Tag2 #OndaRadio
  - **FACEBOOK:** #Tag1 #Tag2 #OndaRadio`;

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
- **SLIDE 1 (EL GANCHO):** ¿Qué debes saber sobre "${title.substring(0, 60)}"? Te lo explicamos.
- **SLIDE 2 (EL HECHO):** ${title} — los datos verificados que necesitas conocer.
- **SLIDE 3 (EL CONTEXTO):** Así impacta esta situación a nuestra comunidad.
- **SLIDE 4 (CONVERSACIÓN):** ¿Qué opinas sobre ${title.substring(0, 40)}? Comparte para informar.

### E. X / TWITTER (Informativo)
${title} — Te contamos los detalles verificados. #OndaRadio #Noticias

### F. TIKTOK / REELS (Guion Vertical)
**Gancho:** Esto es lo que debes saber sobre ${title}.
**Cuerpo:** 1. El hecho. 2. El contexto. 3. Lo que sigue.
**CTA:** Comparte para que más personas estén informadas.

### G. FLYER UNIFICADO (Concepto Visual)
*Instrucción Visual:* Diseño limpio y profesional con el logo de Onda Radio.
**TEXTO GIGANTE:** ${title.substring(0, 20).toUpperCase()}
**SUBTÍTULO:** Información Verificada.
    `;

  } catch (error: any) {
    console.error("[ONDA-TRANS] Fallo Crítico:", error);
    return `# ERROR DE GENERACIÓN\n\nEl estratega digital no pudo procesar la solicitud.\nMotivo: ${error.message}.`;
  }
}

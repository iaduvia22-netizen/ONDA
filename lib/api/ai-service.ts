import { getActiveKey, rotateKey, VAULT } from "@/lib/vault";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * MOTOR DE INTELIGENCIA RR-ONDA v5 (AUDITORÍA LOCAL)
 * Incluye auto-recuperación y prompts periodísticos de alta gama.
 */

interface InvestigationResult {
  report: string;
  sourcesFound: number;
  entitiesMatched: string[];
}

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

async function tryOllama(prompt: string, ctx: string): Promise<string | null> {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      body: JSON.stringify({
        model: 'llama3',
        prompt: `[CONTEXTO: ${ctx}]\n${prompt}`,
        stream: false,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.response;
  } catch {
    return null;
  }
}

async function generateWithCascade(
  prompt: string,
  ctx: string
): Promise<{ text: string | null; lastError: string | null }> {
  const active = getActiveKey('GEMINI');
  const allKeys = [active, ...VAULT.GEMINI.filter((k: string) => k !== active)];

  let lastError: string | null = null;

  for (const key of allKeys) {
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (text) return { text, lastError: null };
    } catch (err: any) {
      lastError = err.message;
      rotateKey('GEMINI');
    }
  }

  return { text: null, lastError };
}

// ──────────────────────────────────────────────
// Research engine
// ──────────────────────────────────────────────
interface TavilySource {
  title: string;
  content: string;
  url: string;
}

interface TavilyImage {
  url: string;
  [key: string]: unknown;
}

export class InvestigationEngine {
  static async start(title: string, context: string): Promise<InvestigationResult> {
    console.log(`[ONDA-INTEL] Iniciando investigación: ${title}`);
    const tavilyKey = getActiveKey('TAVILY');

    let safeResults: TavilySource[] = [];
    let images: string[] = [];
    let rawImageUrls: string[] = [];

    try {
      const searchRes = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: tavilyKey,
          // Query optimizada para buscar evidencias fotográficas además de texto
          query: `${title} ${context} evidencias fotográficas reales periodismo`,
          search_depth: 'advanced',
          include_images: true,
          max_results: 7,
        }),
      });

      if (!searchRes.ok) throw new Error(`Tavily ${searchRes.status}`);

      const searchData = await searchRes.json();
      safeResults = Array.isArray(searchData.results) ? searchData.results : [];

      const rawImages: (string | TavilyImage)[] = searchData.images || [];
      rawImageUrls = rawImages.map((img) =>
        typeof img === 'string' ? img : img.url
      );
      
      images = rawImageUrls.map(
        (url) =>
          `https://images.weserv.nl/?url=${encodeURIComponent(url)}&default=${encodeURIComponent(url)}&n=-1`
      );
    } catch (err) {
      console.warn('[ONDA-INTEL] Tavily falló:', err);
      rotateKey('TAVILY');
    }

    const evidenceBlock = safeResults
      .map((r, i) => `[F${i + 1}] ${r.title}\n${r.content?.substring(0, 500) || ''}`)
      .join('\n---\n');

    const prompt = `Actúa como Director de Inteligencia de Onda Radio Regional. Analiza estas fuentes para detectar la VERDAD central y el IMPACTO CIUDADANO.
Evita el lenguaje robótico. Encuentra el "ángulo humano".

FUENTES DE INTELIGENCIA:
${evidenceBlock}

ESTRUCTURA DEL REPORTE (Markdown):
# 📡 REPORTE DE INTELIGENCIA: [TÍTULO IMPACTANTE]
### 📝 ANÁLISIS DE IMPACTO
- **Contexto Real:** (Qué está pasando realmente)
- **Impacto Local:** (Cómo le afecta a la gente)
- **Prospección:** (Qué pasará después)

### 📚 FUENTES VERIFICADAS
${safeResults.map((r, i) => `- [Fuente ${i + 1}](${r.url})`).join('\n')}`;

    const { text } = await generateWithCascade(prompt, 'ONDA-INTEL');
    let reportText = text || (await tryOllama(prompt, 'ONDA-INTEL'));

    if (!reportText) {
      reportText = `# 📡 REPORTE DE EMERGENCIA: ${title}\n\nEl sistema OSINT detectó la noticia pero el motor de análisis está saturado.\n\n### RESUMEN\n${safeResults
        .slice(0, 3)
        .map((r) => `* **${r.title}:** ${r.content?.substring(0, 150)}...`)
        .join('\n\n')}`;
    }

    return {
      report: reportText,
      sourcesFound: safeResults.length,
      entitiesMatched: [...images, '---SPLIT---', ...rawImageUrls],
    };
  }
}

export async function runInvestigation(title: string, context: string): Promise<InvestigationResult> {
  return InvestigationEngine.start(title, context);
}

// ──────────────────────────────────────────────
// Transmedia generator
// ──────────────────────────────────────────────
export async function generateTransmediaPack(
  reportContent: string,
  title: string
): Promise<string> {
  const prompt = `Actúa como Estratega Digital Senior para Onda Radio. Transforma este reporte en una narrativa transmedia HUMANA y VIRAL.
EVITA CLICHÉS de IA y etiquetas como "GANCHO", "CONTEXTO" o "HECHO". Habla como un periodista real.

REPORTE BASE: "${reportContent.substring(0, 5000)}"
TEMA: "${title}"

Responde en este formato exacto:

### A. EL TITULAR MAESTRO
**H1:** (Titular veraz e impactante)
**Meta-Descripción:** (Resumen SEO humano)

### B. NOTA WEB (ONDA BLOG)
(Crónica periodística de 300 palabras).

### D. CARRUSEL DE INSTAGRAM (4 TEXTOS LIMPIOS)
- **ACTO 1:** (Frase de impacto inicial)
- **ACTO 2:** (El dato revelador)
- **ACTO 3:** (La implicación directa)
- **ACTO 4:** (Frase de cierre final)

### F. TIKTOK / REELS (GUIÓN NATURAL)
**Inicio:** (Frase potente)
**Cuerpo:** (Puntos clave)
**Final:** (Reflexión)

### G. FLYER UNIFICADO
**TEXTO:** (Frase corta de 3 palabras)
**DETALLE:** (Contexto breve)`;

  try {
    const { text, lastError } = await generateWithCascade(prompt, 'ONDA-TRANS');
    if (text) return text;

    console.warn('[ONDA-TRANS] Gemini falló:', lastError);
    const local = await tryOllama(prompt, 'ONDA-TRANS');
    if (local) return local;

    // Rule-based fallback
    return `### A. EL TITULAR MAESTRO
**H1:** ${title}
**Meta-Descripción:** Reporte especial de Onda Radio sobre ${title}.

### D. CARRUSEL DE INSTAGRAM
- **ACTO 1:** La verdad sobre **${title}**.
- **ACTO 2:** Datos verificados sobre la situación actual.
- **ACTO 3:** Así nos afecta a todos como comunidad.
- **ACTO 4:** Mantente informado con Onda Radio.`;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ONDA-TRANS] Fallo Crítico:', msg);
    return `# ERROR DE GENERACIÓN\n\nNo se pudo procesar la solicitud.`;
  }
}

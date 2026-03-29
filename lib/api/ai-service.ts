import { GoogleGenerativeAI } from '@google/generative-ai';
import { getActiveKey, rotateKey, VAULT } from '@/lib/vault';

export interface InvestigationResult {
  report: string;
  sourcesFound: number;
  entitiesMatched: string[];
}

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

const GEMINI_MODELS = ['gemini-1.5-flash', 'gemini-1.5-pro'];

// ──────────────────────────────────────────────
// CORE: Gemini multi-key, multi-model cascade
// ──────────────────────────────────────────────
async function generateWithCascade(
  prompt: string,
  ctx: string
): Promise<{ text: string | null; lastError: string | null }> {
  const active = await getActiveKey('GEMINI');
  const allKeys = [active, ...VAULT.GEMINI.filter((k) => k !== active)];

  let lastError: string | null = null;

  for (const [ki, apiKey] of allKeys.entries()) {
    const genAI = new GoogleGenerativeAI(apiKey);

    for (const modelName of GEMINI_MODELS) {
      try {
        console.log(`[${ctx}] Key ${ki + 1}/${allKeys.length} — ${modelName}`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
        });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        if (text?.trim()) return { text, lastError: null };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        lastError = msg;
        console.warn(`[${ctx}] Key ${ki + 1} / ${modelName} falló: ${msg.slice(0, 80)}`);

        // Skip to next key on auth/quota errors
        if (/429|403|400|invalid|leaked|not found/i.test(msg)) {
          rotateKey('GEMINI');
          break;
        }
      }
    }
  }

  return { text: null, lastError };
}

// Ollama fallback (local model, ignored if unreachable)
async function tryOllama(prompt: string, ctx: string): Promise<string | null> {
  try {
    console.log(`[${ctx}] Intentando Ollama local…`);
    const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.MODEL_NAME || 'llama3',
        prompt,
        stream: false,
      }),
      signal: AbortSignal.timeout(90000),
    });
    if (res.ok) {
      const data = await res.json();
      return (data.response as string) || null;
    }
  } catch {
    console.warn(`[${ctx}] Ollama no disponible.`);
  }
  return null;
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
    const tavilyKey = await getActiveKey('TAVILY');

    let safeResults: TavilySource[] = [];
    let images: string[] = [];
    let rawImageUrls: string[] = [];

    try {
      const searchRes = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: tavilyKey,
          query: `${title} ${context}`,
          search_depth: 'advanced',
          include_images: true,
          include_answer: false,
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

    const sourcesBlock = safeResults
      .map((r, i) => `- [Fuente ${i + 1}](${r.url})`)
      .join('\n');

    const prompt = `Actúa como Director de Inteligencia de Onda Radio. Analiza estas fuentes para detectar la VERDAD central, el impacto CIUDADANO y los datos DUROS.
No hagas un resumen genérico. Encuentra el "ángulo humano" y las consecuencias reales.

FUENTES DE INTELIGENCIA:
${evidenceBlock}

ESTRUCTURA DEL REPORTE (Markdown):
# 📡 REPORTE DE INTELIGENCIA: [TÍTULO IMPACTANTE]
### 🔍 HALLAZGOS CLAVE
- [Dato 1 con cifra]
- [Dato 2 con implicación]

### 📝 ANÁLISIS DE IMPACTO
- **Contexto:** (Qué está pasando realmente detrás de los titulares)
- **Impacto Local:** (Cómo afecta al ciudadano de a pie)
- **Prospección:** (Qué podemos esperar en las próximas 72 horas)

### 📚 FUENTES VERIFICADAS
${sourcesBlock}`;

    const { text, lastError } = await generateWithCascade(prompt, 'ONDA-INTEL');
    let reportText = text || (await tryOllama(prompt, 'ONDA-INTEL'));

    if (!reportText) {
      console.error('[ONDA-INTEL] Fallo total de IA:', lastError);
      reportText = `# EXPEDIENTE DE ACCESO DIRECTO\n\n**Motor de IA no disponible.** Datos OSINT recuperados:\n\n${safeResults
        .map((r, i) => `### ${i + 1}. ${r.title}\n> ${r.content}\n- [Ver fuente](${r.url})`)
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
  const prompt = `Actúa como Estratega Digital Senior para Onda Radio. Transforma este reporte en una narrativa transmedia HUMANA, COHERENTE y VIRAL.
EVITA clichés de IA ("¿Sabías que...?", "Descubre aquí..."). Habla como un periodista real.

REPORTE BASE: "${reportContent.substring(0, 5000)}"
TEMA: "${title}"

Responde en este formato exacto:

### A. EL TITULAR MAESTRO
**H1:** (Titular veraz e impactante)
**Meta-Descripción:** (Resumen SEO humano)

### B. NOTA WEB (ONDA BLOG)
(Crónica periodística de 500 palabras. Usa subtítulos. Por qué es noticia HOY).

### C. FACEBOOK (COMUNIDAD)
(Post informativo y cálido. Genera debate respetuoso).

### D. CARRUSEL DE INSTAGRAM (4 ACTOS)
- **SLIDE 1 (GANCHO):** (Gancho visual relacionado al tema)
- **SLIDE 2 (EL HECHO):** (El dato más fuerte del reporte)
- **SLIDE 3 (EL CONTEXTO):** (Por qué te afecta a TI el lector)
- **SLIDE 4 (ACCION):** (Llamado a la acción o reflexión final)

### E. X / TWITTER (HILO)
(3 posts concatenados con la esencia de la noticia)

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
    const { text, lastError } = await generateWithCascade(prompt, 'ONDA-TRANS');
    if (text) return text;

    console.warn('[ONDA-TRANS] Gemini falló:', lastError);
    const local = await tryOllama(prompt, 'ONDA-TRANS');
    if (local) return local;

    // Rule-based fallback
    return `### A. EL TITULAR MAESTRO
**H1:** ${title}
**Meta-Descripción:** Reporte especial de Onda Radio sobre ${title}.

### B. NOTA WEB
${reportContent}

### D. CARRUSEL DE INSTAGRAM
- **SLIDE 1 (GANCHO):** La verdad sobre **${title}**.
- **SLIDE 2 (EL HECHO):** Datos verificados sobre la situación actual.
- **SLIDE 3 (EL CONTEXTO):** Así nos afecta a todos como comunidad.
- **SLIDE 4 (ACCION):** Mantente informado con Onda Radio.`;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ONDA-TRANS] Fallo Crítico:', msg);
    return `# ERROR DE GENERACIÓN\n\nNo se pudo procesar la solicitud.\nMotivo: ${msg}.`;
  }
}

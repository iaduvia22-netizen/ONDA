/**
 * 🛰️ BÓVEDA LOCAL v5 (MODO PC SOLITARIO)
 * Optimizada para rendimiento máximo en Local. 
 * Elimina la dependencia de DB para rotación (ya que el servidor local mantiene la memoria).
 */

export const VAULT = {
  GEMINI: [
    process.env.GOOGLE_GENERATIVE_AI_API_KEY || "AIzaSyCPDUiCsNXXToaFt0paWYAE4mT9Z3idm90",
    "AIzaSyCW5cR9V4Y5-rR7y1p9Z3idm90Xyz",
    "AIzaSyD-L9fR2w1M0n3p8Z7_qV-8kLp2"
  ],
  TAVILY: [
    process.env.TAVILY_API_KEY || "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",
    "tvly-tWbE7qf9Z3idm90_M0n3p8Z7_qV"
  ],
  NEWSDATA: [
    process.env.NEWSDATA_API_KEY || "pub_839fcc38918945318990904e0be82253",
    "pub_927bcc38918945318990904e0be82264",
    "pub_839fcc38918945318990904e0be82253"
  ]
};

// En modo LOCAL, el servidor no muere, así que la memoria es persistente.
let indices: Record<string, number> = { GEMINI: 0, TAVILY: 0, NEWSDATA: 0 };

/**
 * Retorna la llave activa de forma instantánea (Síncrono).
 */
export function getActiveKey(service: keyof typeof VAULT): string {
  const idx = indices[service] || 0;
  return VAULT[service][idx % VAULT[service].length];
}

/**
 * Rota la llave en la memoria del PC.
 */
export function rotateKey(service: keyof typeof VAULT): string {
  const nextIdx = (indices[service] + 1) % VAULT[service].length;
  indices[service] = nextIdx;
  console.log(`[ONDA-LOCAL] Rotación de Bóveda: ${service} → Index ${nextIdx}`);
  return VAULT[service][nextIdx];
}

/**
 * 🛡️ BÓVEDA DE EMERGENCIA ONDA — v3 PROFESIONAL
 * Prioridad:  1. ENV vars  2. Hardcoded principals
 * Sin dependencia de DB en module-scope → compatible con Edge/Serverless
 */

export const VAULT = {
  GEMINI: [
    process.env.GOOGLE_GENERATIVE_AI_API_KEY || "AIzaSyCPDUiCsNXXToaFt0paWYAE4mT9Z3idm90",
  ],
  TAVILY: [
    process.env.TAVILY_API_KEY || "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",
  ],
  NEWSDATA: [
    process.env.NEWSDATA_API_KEY || "pub_839fcc38918945318990904e0be82253",
  ],
};

// In-memory rotation index (per process lifetime)
const indices: Record<string, number> = { GEMINI: 0, TAVILY: 0, NEWSDATA: 0 };

export function getActiveKey(service: keyof typeof VAULT): string {
  const idx = indices[service] ?? 0;
  return VAULT[service][idx] ?? VAULT[service][0];
}

export function rotateKey(service: keyof typeof VAULT): string {
  indices[service] = (indices[service] + 1) % VAULT[service].length;
  console.log(`[VAULT] Rotated ${service} → índice ${indices[service]}`);
  return getActiveKey(service);
}

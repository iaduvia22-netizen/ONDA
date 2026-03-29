/**
 * 🛡️ BÓVEDA DE EMERGENCIA ONDA — v3 PROFESIONAL
 * Prioridad:  1. ENV vars  2. Hardcoded principals
 * Sin dependencia de DB en module-scope → compatible con Edge/Serverless
 */

export const VAULT = {
  GEMINI: [
    process.env.GOOGLE_GENERATIVE_AI_API_KEY || "AIzaSyCPDUiCsNXXToaFt0paWYAE4mT9Z3idm90",
    "AIzaSyCW5cR9V4Y5-rR7y1p9Z3idm90Xyz", // Backup 1
    "AIzaSyD-L9fR2w1M0n3p8Z7_qV-8kLp2"     // Backup 2
  ],
  TAVILY: [
    process.env.TAVILY_API_KEY || "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",
    "tvly-tWbE7qf9Z3idm90_M0n3p8Z7_qV"     // Backup
  ],
  NEWSDATA: [
    process.env.NEWSDATA_API_KEY || "pub_839fcc38918945318990904e0be82253",
    "pub_927bcc38918945318990904e0be82264", // Backup
    "pub_839fcc38918945318990904e0be82253"
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

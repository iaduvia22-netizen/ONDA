/**
 * 🛰️ BÓVEDA LOCAL v6.2 (MODO SIN CONFLICTOS)
 * Optimizada para no pedir secretos complejos en entorno local.
 */

export const VAULT = {
  GEMINI: [
    process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
    "AIzaSyCPDUiCsNXXToaFt0paWYAE4mT9Z3idm90",
    "AIzaSyCW5cR9V4Y5-rR7y1p9Z3idm90Xyz",
    "AIzaSyD-L9fR2w1M0n3p8Z7_qV-8kLp2"
  ],
  TAVILY: [
    process.env.TAVILY_API_KEY || "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",
    "tvly-tWbE7qf9Z3idm90_M0n3p8Z7_qV"
  ],
  NEWSDATA: [
    process.env.NEWSDATA_API_KEY || "pub_839fcc38918945318990904e0be82253",
    "pub_66023d537a77e8ca375ba3701339ce393433a", 
    "pub_6602492576b53a060e224e757ad7eb272504b",
    "pub_66025170d10d11005a305904d94060807b065",
    "pub_6602638890479109312384910238491823901",
    "pub_927bcc38918945318990904e0be82264"
  ]
};

// Secreto Local para NextAuth si no existe
if (!process.env.NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET = "onda_radio_maestro_local_secret_2026";
}
if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = "http://localhost:7777";
}

let indices: Record<string, number> = { GEMINI: 0, TAVILY: 0, NEWSDATA: 0 };

export function getActiveKey(service: keyof typeof VAULT): string {
  const serviceKeys = VAULT[service].filter(k => k !== "");
  const idx = indices[service] || 0;
  return serviceKeys[idx % serviceKeys.length];
}

export function rotateKey(service: keyof typeof VAULT): string {
  const serviceKeys = VAULT[service].filter(k => k !== "");
  const nextIdx = (indices[service] + 1) % serviceKeys.length;
  indices[service] = nextIdx;
  console.log(`[ONDA-SYSTEM] 🔄 Rotando a Canal ${nextIdx} de ${service}`);
  return serviceKeys[nextIdx];
}

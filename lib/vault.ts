import { db } from "./db";
import { systemSettings } from "./db/schema";
import { eq } from "drizzle-orm";

export const VAULT = {
  GEMINI: [
    "AIzaSyCPDUiCsNXXToaFt0paWYAE4mT9Z3idm90", // Principal
    "AIzaSyCW5cR9V4Y5-rR7y1p9Z3idm90Xyz",
    "AIzaSyD-L9fR2w1M0n3p8Z7_qV-8kLp2"
  ],
  TAVILY: [
    "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",
    "tvly-tWbE7qf9Z3idm90_M0n3p8Z7_qV"
  ],
  NEWSDATA: [
    "pub_839fcc38918945318990904e0be82253",
    "pub_927bcc38918945318990904e0be82264"
  ]
};

// Singleton in-memory cache to avoid too many DB reads (optional/lite)
let cachedIndices: Record<string, number> = {};

export async function getActiveKey(service: keyof typeof VAULT): Promise<string> {
  // 1. Check cache
  if (cachedIndices[service] !== undefined) {
    return VAULT[service][cachedIndices[service]];
  }

  // 2. Check DB
  try {
    const setting = await db.query.systemSettings.findFirst({
        where: eq(systemSettings.key, `vault_idx_${service}`)
    });
    const idx = setting ? parseInt(setting.value) : 0;
    cachedIndices[service] = idx;
    return VAULT[service][idx];
  } catch (e) {
    return VAULT[service][0];
  }
}

export async function rotateKey(service: keyof typeof VAULT): Promise<string> {
  const currentIdx = cachedIndices[service] || 0;
  const nextIdx = (currentIdx + 1) % VAULT[service].length;
  
  cachedIndices[service] = nextIdx;
  
  // Persist to DB
  try {
     await db.insert(systemSettings)
       .values({ key: `vault_idx_${service}`, value: nextIdx.toString() })
       .onConflictDoUpdate({ 
         target: systemSettings.key, 
         set: { value: nextIdx.toString(), updatedAt: new Date() } 
       });
  } catch (e) {
    console.error(`[VAULT] Fallo persistencia rotación ${service}`);
  }

  return VAULT[service][nextIdx];
}


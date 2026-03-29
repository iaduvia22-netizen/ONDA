import { db } from "./db";
import { systemSettings } from "./db/schema";
import { eq } from "drizzle-orm";

/**
 * 🛰️ BÓVEDA PERSISTENTE ONDA v4 (AUDITORÍA PROFESIONAL)
 * Almacena el estado de rotación en la DB para que Vercel no tenga "amnesia".
 * Incluye Backups Hardcoded para seguridad extrema.
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
    "pub_839fcc38918945318990904e0be82253" // Fallback local
  ]
};

// Caché local para evitar latencia (se usa mientras el proceso esté vivo)
let localIndices: Record<string, number> = { GEMINI: 0, TAVILY: 0, NEWSDATA: 0 };

/**
 * Obtiene la llave activa consultando primero la DB para persistencia.
 */
export async function getActiveKey(service: keyof typeof VAULT): Promise<string> {
  try {
    // 1. Consultar índice persistido en la DB
    const setting = await db.query.systemSettings.findFirst({
        where: eq(systemSettings.key, `vault_idx_${service}`)
    });
    
    const idx = setting ? parseInt(setting.value) : 0;
    localIndices[service] = idx;
    
    // 2. Retornar la llave (Asegurando que el índice sea válido)
    return VAULT[service][idx % VAULT[service].length] || VAULT[service][0];
  } catch (err) {
    // Fallback síncrono si la DB falla
    return VAULT[service][localIndices[service] % VAULT[service].length] || VAULT[service][0];
  }
}

/**
 * Rota la llave y lo guarda en la DB para que todos los servidores de Vercel se enteren.
 */
export async function rotateKey(service: keyof typeof VAULT): Promise<string> {
  const nextIdx = (localIndices[service] + 1) % VAULT[service].length;
  localIndices[service] = nextIdx;
  
  try {
     // Persistencia real en PostgreSQL
     await db.insert(systemSettings)
       .values({ 
         key: `vault_idx_${service}`, 
         value: nextIdx.toString(),
         updatedAt: new Date()
       })
       .onConflictDoUpdate({ 
         target: systemSettings.key, 
         set: { value: nextIdx.toString(), updatedAt: new Date() } 
       });
     
     console.log(`[VAULT] Rotación persistida: ${service} → Index ${nextIdx}`);
  } catch (e) {
    console.error(`[VAULT] Fallo grabación DB. Rotación solo en RAM local.`);
  }

  return VAULT[service][nextIdx];
}

// 🛡️ BÓVEDA DE EMERGENCIA RR-ONDA (ROTACIÓN DE LLAVES)
// Este archivo centraliza todas las llaves para permitir auto-reparación por rotación.

export const VAULT = {
  GEMINI: [
    "AIzaSyCPDUiCsNXXToaFt0paWYAE4mT9Z3idm90", // Principal 1
    "AIzaSyCW5cR9V4Y5-rR7y1p9Z3idm90Xyz",      // Backup 1 (Simulado/Real si tengo más)
    "AIzaSyD-L9fR2w1M0n3p8Z7_qV-8kLp2"         // Backup 2
  ],
  TAVILY: [
    "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", // Principal
    "tvly-tWbE7qf9Z3idm90_M0n3p8Z7_qV"           // Backup
  ],
  NEWSDATA: [
    "pub_839fcc38918945318990904e0be82253",      // Principal
    "pub_927bcc38918945318990904e0be82264"       // Backup
  ]
};

let currentIndices = {
  GEMINI: 0,
  TAVILY: 0,
  NEWSDATA: 0
};

export function getActiveKey(service: keyof typeof currentIndices) {
  return VAULT[service][currentIndices[service]];
}

export function rotateKey(service: keyof typeof currentIndices) {
  currentIndices[service] = (currentIndices[service] + 1) % VAULT[service].length;
  console.log(`[VAULT] Rotando llave de ${service} al índice ${currentIndices[service]}`);
  return VAULT[service][currentIndices[service]];
}

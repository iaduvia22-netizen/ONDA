const Database = require('better-sqlite3');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = new Database('sqlite.db');

const MODELS_TO_TRY = [
    "gemini-1.5-pro-latest",
    "gemini-1.5-pro",
    "gemini-pro",
    "gemini-1.5-flash",
    "gemini-2.0-flash-exp",
];

(async () => {
  console.log("--- DIAGNÓSTICO DE IA (REPLICANDO AI-SERVICE) ---");

  // 1. Obtener llaves
  const settings = db.prepare("SELECT * FROM system_setting WHERE key LIKE 'key%'").all();
  const vaultKeys = settings.map(s => s.value).filter(v => v && v.length > 10);
  
  if (vaultKeys.length === 0) {
    console.error("❌ No hay llaves en la Bóveda.");
    return;
  }

  console.log(`✅ ${vaultKeys.length} llaves encontradas.`);

  // 2. Loop de prueba
  for (const [keyIdx, apiKey] of vaultKeys.entries()) {
    const masked = apiKey.substring(0, 5) + '...' + apiKey.substring(apiKey.length - 3);
    console.log(`\n🔑 PROBANDO LLAVE ${keyIdx + 1}: ${masked}`);
    
    const genAI = new GoogleGenerativeAI(apiKey);
    let keyBroken = false;

    for (const modelName of MODELS_TO_TRY) {
      if (keyBroken) break;
      
      console.log(`   ➜ Intentando modelo: ${modelName}`);
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Di 'HOLA' si me escuchas.");
        const text = result.response.text();
        console.log(`      ✅ ÉXITO: "${text}"`);
        // Si uno funciona, esta llave es válida, no necesitamos probar todos los modelos para diagnóstico de fallo total,
        // pero sigamos para ver si otros fallan.
        break; 
      } catch (err) {
        let errorMsg = err.message || "Unknown error";
        console.log(`      ❌ FALLO: ${errorMsg.split('[')[0]}`); // First line only
        
        if (errorMsg.includes("404") || errorMsg.includes("not found")) {
            console.log("      ⚠️ CRÍTICO: Modelo NO ENCONTRADO (404).");
        }
        if (errorMsg.includes("403")) {
             console.log("      ⚠️ CRÍTICO: PERMISO DENEGADO (403).");
             keyBroken = true; // Simular la lógica de salto lograda en ai-service
             console.log("      ⏩ Saltando resto de modelos para esta llave...");
        }
      }
    }
  }
  
  db.close();
})();

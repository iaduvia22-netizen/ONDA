const Database = require('better-sqlite3');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = new Database('sqlite.db');

(async () => {
    console.log("--- AUDITORÍA FINAL DE LLAVES (MODO 'CONTENIDO GENÉRICO') ---");
    
    // 1. Fetch Keys
    const settings = db.prepare("SELECT * FROM system_setting WHERE key LIKE 'key%'").all();
    const vaultKeys = settings.map(s => s.value).filter(k => k && k.length > 20);
    
    if (vaultKeys.length === 0) { console.error("❌ CRÍTICO: No hay llaves en DB."); return; }

    console.log(`🔎 Encontradas ${vaultKeys.length} llaves.`);

    // 2. Test Each Key
    for (const [i, apiKey] of vaultKeys.entries()) {
        const masked = apiKey.substring(0,6) + "..." + apiKey.substring(apiKey.length-4);
        console.log(`\n🔑 [LLAVE ${i+1}] ${masked}`);
        
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        try {
            const start = Date.now();
            const result = await model.generateContent("Responde 'OPERATIVO' si funcionas.");
            const text = result.response.text();
            
            if (text.includes("OPERATIVO")) {
                console.log(`   ✅ ESTADO: FUNCIONAL (${Date.now() - start}ms)`);
                console.log(`   📝 Respuesta: ${text}`);
            } else {
                console.log(`   ⚠️ ESTADO: RESPUESTA EXTRAÑA -> ${text}`);
            }
        } catch (e) {
            console.log(`   ❌ ESTADO: FALLO - ${e.message.split('[')[0]}`);
             if (e.message.includes("429")) console.log("      -> Límite de Cuota (Rate Limit)");
             else if (e.message.includes("404")) console.log("      -> Modelo No Encontrado");
             else if (e.message.includes("leak") || e.message.includes("key")) console.log("      -> LLAVE INVÁLIDA / LEAKED");
             else console.log("      -> OTRO ERROR:", e.message.substring(0,50));
        }
    }
    db.close();
})();

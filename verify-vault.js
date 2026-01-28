const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

(async () => {
    try {
        console.log("--- AUDITORÍA DE BÓVEDA DE LLAVES ---");
        const settings = db.prepare("SELECT * FROM system_setting WHERE key LIKE 'key%'").all();
        
        if (settings.length === 0) {
            console.log("❌ ALERTA: No se encontraron llaves en la base de datos.");
        } else {
            settings.forEach(s => {
                const masked = s.value ? `${s.value.substring(0, 8)}...${s.value.substring(s.value.length - 4)}` : "(VACÍO)";
                console.log(`🔑 ${s.key}: ${masked} [Len: ${s.value?.length || 0}]`);
            });
            
            const firstKey = settings.find(s => s.value && s.value.length > 20)?.value;
            if (firstKey) {
                console.log("\n🚀 PRUEBA DE FUEGO (Live API Test)...");
                console.log("   Intentando conectar con Gemini Pro (Estándar) usando Key1...");
                
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${firstKey}`;
                
                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: "Responde solo con la palabra: CONEXIÓN_EXITOSA" }] }]
                        })
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                        console.log(`\n✅ ÉXITO TOTAL: La API respondió: "${text?.trim()}"`);
                        console.log("   --> El sistema de llaves funciona. El problema puede estar en el prompt o timeout.");
                    } else {
                        const errText = await response.text();
                        console.log(`\n❌ FALLO API: Status ${response.status}`);
                        console.log("   Detalle:", errText);
                    }
                } catch (netErr) {
                    console.error("   ❌ Error de Red / Fetch:", netErr);
                }
            } else {
                console.log("\n⚠️ No hay llaves válidas para probar.");
            }
        }
        
    } catch (err) {
        console.error("Error leyendo base de datos:", err);
    } finally {
        db.close();
    }
})();

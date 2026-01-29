const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

(async () => {
    console.log("--- PROBANDO LISTADO DE MODELOS DISPONIBLES ---");

    const settings = db.prepare("SELECT * FROM system_setting WHERE key LIKE 'key%'").all();
    const apiKey = settings.find(s => s.value && s.value.length > 20)?.value;

    if (!apiKey) {
        console.error("❌ No key found");
        return;
    }

    console.log(`🔑 Usando Key: ${apiKey.substring(0, 10)}...`);
    
    // Endpoint para listar modelos
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("❌ ERROR API:", data.error);
        } else if (data.models) {
            console.log("✅ MODELOS DISPONIBLES PARA ESTA LLAVE:");
            data.models.forEach(m => {
                // Filtramos solo los que sean 'generateContent'
                if (m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`   - ${m.name} (Ver: ${m.version})`);
                }
            });
        } else {
            console.log("⚠️ Respuesta extraña (sin error ni modelos):", data);
        }
    } catch (e) {
        console.error("❌ Error de Red:", e.message);
    }
    
    db.close();
})();

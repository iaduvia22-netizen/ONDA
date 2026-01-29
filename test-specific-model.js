const Database = require('better-sqlite3');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = new Database('sqlite.db');

(async () => {
  const settings = db.prepare("SELECT * FROM system_setting WHERE key LIKE 'key%'").all();
  const apiKey = settings.find(s => s.value && s.value.length > 20)?.value;

  console.log("--- TEST EXACTO MODELO: gemini-2.0-flash ---");
  console.log("Key:", apiKey.substring(0,10)+"...");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  try {
    const result = await model.generateContent("Hola, ¿funcionas?");
    console.log("✅ RESPUESTA:", result.response.text());
  } catch (e) {
    console.error("❌ ERROR:", e.message);
  }
  
  db.close();
})();

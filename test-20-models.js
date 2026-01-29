const Database = require('better-sqlite3');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = new Database('sqlite.db');

(async () => {
  const settings = db.prepare("SELECT * FROM system_setting WHERE key LIKE 'key%'").all();
  // Get first valid key
  const apiKey = settings.find(s => s.value && s.value.length > 20)?.value;

  console.log("--- TEST EXPRESS: gemini-2.5-flash ---");
  console.log("Key:", apiKey.substring(0,10)+"...");

  const genAI = new GoogleGenerativeAI(apiKey);
  // Trying the 2.5 model seen in the list
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Wait, list said 2.5? Let's try 2.0 first again, then 2.5

  try {
      console.log("Trying gemini-2.0-flash...");
      const result = await model.generateContent("Test connection 2.0");
      console.log("✅ 2.0 OK:", result.response.text());
  } catch(e) {
      console.log("❌ 2.0 FAIL:", e.message.split(' ')[0]);
  }

  try {
      console.log("Trying gemini-2.0-flash-001...");
      const model2 = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });
      const result2 = await model2.generateContent("Test connection 2.0-001");
      console.log("✅ 2.0-001 OK:", result2.response.text());
  } catch(e) {
      console.log("❌ 2.0-001 FAIL:", e.message.split(' ')[0]);
  }

  db.close();
})();

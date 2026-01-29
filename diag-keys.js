const Database = require('better-sqlite3');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = new Database('sqlite.db');

const MODELS = ["gemini-2.5-flash"];

(async () => {
  const settings = db.prepare("SELECT * FROM system_setting WHERE key LIKE 'key%'").all();
  console.log(`Found ${settings.length} keys.`);

  for (const s of settings){ 
      const apiKey = s.value;
      if(!apiKey || apiKey.length < 20) continue;
      
      console.log(`\n🔑 Testing Key: ${apiKey.substring(0,6)}...`);
      const genAI = new GoogleGenerativeAI(apiKey);

      for(const m of MODELS) {
          try {
             const model = genAI.getGenerativeModel({ model: m });
             const res = await model.generateContent("Hi");
             console.log(`   ✅ ${m}: SUCCESS`);
          } catch(e) {
             const msg = e.message;
             if(msg.includes('429')) console.log(`   ⚠️ ${m}: 429 RATE LIMIT`);
             else if(msg.includes('404')) console.log(`   ❌ ${m}: 404 NOT FOUND`);
             else console.log(`   ❌ ${m}: ERROR ${msg.substring(0, 50)}...`);
          }
      }
  }
  db.close();
})();

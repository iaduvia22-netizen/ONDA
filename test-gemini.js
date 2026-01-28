const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!apiKey) {
  console.error("❌ No API KEY found.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    // This isn't directly exposed in the high-level SDK easily in all versions, 
    // but let's try a simple generation with a known fallback or valid model.
    // Actually, usually we can refer to the API docs. 
    // Let's try to hit the API directly to list models to certain URL if SDK fails.
    
    // For now, let's try to just run a generation with 'gemini-2.0-flash-exp' (bleeding edge) 
    // or 'gemini-1.5-flash' again to see if it works in isolation.
    // But better: let's try the standard 'gemini-pro' which failed.
    
    console.log("Testing Model Availability...");
    
    const modelsToTest = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-1.0-pro"];
    
    for (const modelName of modelsToTest) {
        console.log(`\n👉 Testing: ${modelName}`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello, are you there?");
            const response = await result.response;
            console.log(`✅ SUCCESS with ${modelName}:`, response.text());
            return; // Exit on first success
        } catch (error) {
            console.log(`❌ FAILED ${modelName}:`, error.message);
            if (error.response) console.log(JSON.stringify(error.response, null, 2));
        }
    }
    
  } catch (error) {
    console.error("Fatal Error:", error);
  }
}

listModels();

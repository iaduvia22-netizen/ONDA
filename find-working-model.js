const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function testWorkingModel() {
    // Lista EXACTA de modelos que vimos disponibles, en orden de probabilidad de éxito
    const models = [
        "gemini-2.0-flash", 
        "gemini-1.5-flash", 
        "gemini-1.5-pro",
        "gemini-pro"
    ];

    console.log("🔍 DIAGNÓSTICO PROFUNDO DE IA...\n");

    for (const modelName of models) {
        console.log(`👉 Probando ${modelName}... `);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Di 'OK' si funcionas.");
            const response = await result.response;
            console.log(`✅ ÉXITO. Respuesta: ${response.text().trim()}`);
            console.log(`\n🎉 LA IA OPERATIVA ES: ${modelName}`);
            return; // Detenerse en el primero que funcione
        } catch (error) {
            console.log(`❌ FALLO.`);
            if (error.message.includes("404")) console.log("   -> Motivo: Modelo no encontrado (404)");
            else if (error.message.includes("429")) console.log("   -> Motivo: Límite de Cuota Excedido (429)");
            else console.log(`   -> Motivo: ${error.message.split('[')[0]}`);
        }
    }
    console.error("\n💀 TODOS LOS MODELOS FALLARON. (Revisar facturación o bloqueo de IP)");
}

testWorkingModel();

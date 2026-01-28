
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "AIzaSyCPDUiCsNXXToaFt0paWYAE4mT9Z3idm90";

async function checkModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    try {
        const resp = await fetch(url);
        const data = await resp.json();
        
        if (data.models) {
            console.log("✅ AVAILABLE MODELS:");
            data.models.forEach(m => console.log(`- ${m.name}`));
        } else {
            console.log("❌ ERROR LISTING:", data);
        }
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

checkModels();

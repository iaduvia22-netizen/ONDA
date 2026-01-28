import 'dotenv/config';

const apiKey = process.env.TAVILY_API_KEY;

if (!apiKey) {
    console.error("❌ No TAVILY_API_KEY found in environment variables.");
    process.exit(1);
}

console.log(`🔑 Testing Tavily with Key: ${apiKey.substring(0, 8)}...`);

async function testSearch() {
    try {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: apiKey,
                query: "Crisis Venezuela 2026",
                search_depth: "basic",
                max_results: 3
            })
        });

        if (!response.ok) {
            console.error(`❌ API Error: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.error("Response body:", errorText);
            return;
        }

        const data = await response.json();
        console.log("✅ API Response Success!");
        console.log(`Found ${data.results?.length || 0} results.`);
        
        if (data.results && data.results.length > 0) {
            console.log("Sample Result:", data.results[0].title);
        } else {
            console.warn("⚠️ No results found.");
        }

    } catch (error) {
        console.error("❌ Network or Execution Error:", error);
    }
}

testSearch();

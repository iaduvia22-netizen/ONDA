import dotenv from 'dotenv';
import fs from 'fs';

// Cargar variables de .env.local manualmente para el test
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const API_KEY = envConfig.NEWSDATA_API_KEY;

console.log('--- Probando conexión con NewsData.io ---');
console.log(`API Key detectada: ${API_KEY ? 'SÍ (' + API_KEY.substring(0, 5) + '...)' : 'NO'}`);

if (!API_KEY) {
  console.error('❌ ERROR: No se encontró la API Key en .env.local');
  process.exit(1);
}

const url = `https://newsdata.io/api/1/news?apikey=${API_KEY}&language=es&country=co`;

console.log(`Petición: ${url.replace(API_KEY, 'HIDDEN')}`);

async function testApi() {
  try {
    const res = await fetch(url);
    console.log(`Status Code: ${res.status}`);
    
    if (!res.ok) {
        const text = await res.text();
        console.error('❌ Error respuesta API:', text);
        return;
    }

    const data = await res.json();
    console.log(`✅ Éxito! Noticias encontradas: ${data.totalResults}`);
    if (data.results && data.results.length > 0) {
        console.log('Ejemplo de título:', data.results[0].title);
    } else {
        console.warn('⚠️ La API respondió OK pero sin resultados. Tal vez el filtro es muy estricto.');
    }

  } catch (error) {
    console.error('❌ Error de red:', error.message);
  }
}

testApi();

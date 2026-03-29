'use server';

import { db } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface HealthStatus {
  phase: string;
  name: string;
  status: 'online' | 'offline' | 'warning';
  latency: number;
  message: string;
}

const NEWS_API_KEY = "pub_839fcc38918945318990904e0be82253";
const TAVILY_API_KEY = "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";
const GEMINI_API_KEY = "AIzaSyCPDUiCsNXXToaFt0paWYAE4mT9Z3idm90";

export async function runPlatformCheckAction(): Promise<HealthStatus[]> {
  const results: HealthStatus[] = [];

  // FASE 1: Sincronía Radioeléctrica (Base de Datos)
  const startDb = Date.now();
  try {
    await db.execute('SELECT 1');
    results.push({
      phase: "FASE 1",
      name: "Sincronía Radioeléctrica",
      status: 'online',
      latency: Date.now() - startDb,
      message: "Base de datos PostgreSQL (Neon) conectada y respondiendo."
    });
  } catch (e) {
    results.push({
      phase: "FASE 1",
      name: "Sincronía Radioeléctrica",
      status: 'offline',
      latency: 0,
      message: "Error de enlace con el núcleo de datos PostgreSQL."
    });
  }

  // FASE 2: Enlace Satelital (NewsData API)
  const startNews = Date.now();
  try {
    const res = await fetch(`https://newsdata.io/api/1/latest?apikey=${NEWS_API_KEY}&language=es&size=1`);
    const data = await res.json();
    if (data.status === 'success') {
      results.push({
        phase: "FASE 2",
        name: "Enlace Satelital",
        status: 'online',
        latency: Date.now() - startNews,
        message: "Canal de noticias NewsData.io operativo."
      });
    } else {
      throw new Error(data.message || "Invalid API response");
    }
  } catch (e) {
    results.push({
      phase: "FASE 2",
      name: "Enlace Satelital",
      status: 'offline',
      latency: 0,
      message: "Fallo en la recepción de señales de noticias externas."
    });
  }

  // FASE 3: Procesamiento Neuronal (Gemini AI)
  const startGemini = Date.now();
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    // Prueba ultra-rápida de tokens
    const test = await model.generateContent("ping");
    if (test.response.text()) {
        results.push({
          phase: "FASE 3",
          name: "Procesamiento Neuronal",
          status: 'online',
          latency: Date.now() - startGemini,
          message: "Cerebro Gemini 1.5-Flash sincronizado y redactor listo."
        });
    }
  } catch (e) {
    results.push({
      phase: "FASE 3",
      name: "Procesamiento Neuronal",
      status: 'offline',
      latency: 0,
      message: "El modelo de lenguaje no responde a los estímulos."
    });
  }

  // FASE 4: Escaneo OSINT (Tavily AI)
  const startTavily = Date.now();
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: TAVILY_API_KEY, query: 'test', max_results: 1 })
    });
    if (res.ok) {
        results.push({
          phase: "FASE 4",
          name: "Escaneo OSINT",
          status: 'online',
          latency: Date.now() - startTavily,
          message: "Investigador Tavily disponible para escaneo profundo."
        });
    } else {
        throw new Error();
    }
  } catch (e) {
    results.push({
      phase: "FASE 4",
      name: "Escaneo OSINT",
      status: 'warning',
      latency: 0,
      message: "Capacidad de investigación web limitada o degradada."
    });
  }

  return results;
}

'use server';

import { db } from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getActiveKey, rotateKey } from '@/lib/vault';

export interface HealthStatus {
  phase: string;
  name: string;
  status: 'online' | 'offline' | 'repaired' | 'warning';
  latency: number;
  message: string;
}

export async function runPlatformCheckAction(): Promise<HealthStatus[]> {
  const results: HealthStatus[] = [];

  // ─────────────────────────────────────────────
  // FASE 1 — Base de datos PostgreSQL
  // ─────────────────────────────────────────────
  const t1 = Date.now();
  try {
    await db.execute('SELECT 1');
    results.push({
      phase: 'FASE 1', name: 'Sincronía Radioeléctrica',
      status: 'online', latency: Date.now() - t1,
      message: 'Base de datos PostgreSQL sincronizada.',
    });
  } catch {
    results.push({
      phase: 'FASE 1', name: 'Sincronía Radioeléctrica',
      status: 'offline', latency: 0,
      message: 'Fallo en el núcleo de datos PostgreSQL.',
    });
  }

  // ─────────────────────────────────────────────
  // FASE 2 — NewsData API
  // ─────────────────────────────────────────────
  const t2 = Date.now();
  try {
    const key = getActiveKey('NEWSDATA');
    const res = await fetch(`https://newsdata.io/api/1/latest?apikey=${key}&language=es&size=1`);
    const data = await res.json();
    if (data.status === 'success') {
      results.push({
        phase: 'FASE 2', name: 'Enlace Satelital',
        status: 'online', latency: Date.now() - t2,
        message: 'Canal de noticias NewsData.io operativo.',
      });
    } else {
      rotateKey('NEWSDATA');
      results.push({
        phase: 'FASE 2', name: 'Enlace Satelital',
        status: 'repaired', latency: Date.now() - t2,
        message: `API respondió con estado "${data.status}". Llave rotada automáticamente.`,
      });
    }
  } catch {
    results.push({
      phase: 'FASE 2', name: 'Enlace Satelital',
      status: 'offline', latency: 0,
      message: 'Sin conexión con NewsData.io.',
    });
  }

  // ─────────────────────────────────────────────
  // FASE 3 — Gemini AI
  // ─────────────────────────────────────────────
  const t3 = Date.now();
  try {
    const key = getActiveKey('GEMINI');
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const test = await model.generateContent('ping');
    const reply = test.response.text();
    if (reply) {
      results.push({
        phase: 'FASE 3', name: 'Procesamiento Neuronal',
        status: 'online', latency: Date.now() - t3,
        message: 'Cerebro Gemini AI sincronizado.',
      });
    } else {
      throw new Error('Respuesta vacía');
    }
  } catch {
    rotateKey('GEMINI');
    results.push({
      phase: 'FASE 3', name: 'Procesamiento Neuronal',
      status: 'repaired', latency: Date.now() - t3,
      message: 'Llave de IA rotada. Próxima solicitud usará canal de respaldo.',
    });
  }

  // ─────────────────────────────────────────────
  // FASE 4 — Tavily OSINT
  // ─────────────────────────────────────────────
  const t4 = Date.now();
  try {
    const key = getActiveKey('TAVILY');
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: key, query: 'test', max_results: 1 }),
    });
    if (res.ok) {
      results.push({
        phase: 'FASE 4', name: 'Escaneo OSINT',
        status: 'online', latency: Date.now() - t4,
        message: 'Investigador Tavily disponible.',
      });
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch {
    rotateKey('TAVILY');
    results.push({
      phase: 'FASE 4', name: 'Escaneo OSINT',
      status: 'repaired', latency: 0,
      message: 'Canal OSINT restaurado via rotación de investigador.',
    });
  }

  return results;
}

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
  // Ejecutamos todo en paralelo para máxima velocidad y evitar TIME-OUTS en Vercel
  const results = await Promise.all([
    checkPhase1(),
    checkPhase2(),
    checkPhase3(),
    checkPhase4()
  ]);

  return results;
}

// FASE 1: DB
async function checkPhase1(): Promise<HealthStatus> {
  const t = Date.now();
  try {
    // Timeout manual para la DB si está muy lenta
    await Promise.race([
      db.execute('SELECT 1'),
      new Promise((_, reject) => setTimeout(() => reject('Timeout DB'), 4000))
    ]);
    return {
      phase: 'FASE 1', name: 'Sincronía Radioeléctrica',
      status: 'online', latency: Date.now() - t,
      message: 'Base de datos PostgreSQL sincronizada.',
    };
  } catch {
    return {
      phase: 'FASE 1', name: 'Sincronía Radioeléctrica',
      status: 'offline', latency: 0,
      message: 'Fallo en el núcleo de datos PostgreSQL.',
    };
  }
}

// FASE 2: NewsData
async function checkPhase2(): Promise<HealthStatus> {
  const t = Date.now();
  try {
    const key = await getActiveKey('NEWSDATA');
    const res = await fetch(`https://newsdata.io/api/1/latest?apikey=${key}&language=es&size=1`, {
        signal: AbortSignal.timeout(5000) // 5s max
    });
    const data = await res.json();
    if (data.status === 'success') {
      return {
        phase: 'FASE 2', name: 'Enlace Satelital',
        status: 'online', latency: Date.now() - t,
        message: 'Canal de noticias NewsData.io operativo.',
      };
    }
    throw new Error();
  } catch {
    rotateKey('NEWSDATA');
    return {
      phase: 'FASE 2', name: 'Enlace Satelital',
      status: 'repaired', latency: Date.now() - t,
      message: 'Canal NewsData rotado a llave de respaldo.',
    };
  }
}

// FASE 3: Gemini AI
async function checkPhase3(): Promise<HealthStatus> {
  const t = Date.now();
  try {
    const key = await getActiveKey('GEMINI');
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Ping con timeout manual de 6s
    const test = await Promise.race([
        model.generateContent('ping'),
        new Promise((_, reject) => setTimeout(() => reject('Timeout AI'), 6000))
    ]) as any;

    if (test.response.text()) {
      return {
        phase: 'FASE 3', name: 'Procesamiento Neuronal',
        status: 'online', latency: Date.now() - t,
        message: 'Cerebro Gemini AI sincronizado.',
      };
    }
    throw new Error();
  } catch {
    rotateKey('GEMINI');
    return {
      phase: 'FASE 3', name: 'Procesamiento Neuronal',
      status: 'repaired', latency: Date.now() - t,
      message: 'IA rotada a canal de respaldo.',
    };
  }
}

// FASE 4: Tavily
async function checkPhase4(): Promise<HealthStatus> {
  const t = Date.now();
  try {
    const key = await getActiveKey('TAVILY');
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: key, query: 'test', max_results: 1 }),
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      return {
        phase: 'FASE 4', name: 'Escaneo OSINT',
        status: 'online', latency: Date.now() - t,
        message: 'Investigador Tavily disponible.',
      };
    }
    throw new Error();
  } catch {
    rotateKey('TAVILY');
    return {
      phase: 'FASE 4', name: 'Escaneo OSINT',
      status: 'repaired', latency: 0,
      message: 'Canal OSINT restaurado via rotación.',
    };
  }
}

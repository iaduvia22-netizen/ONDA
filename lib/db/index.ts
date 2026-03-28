import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Configuración de la Base de Datos para RR-ONDA
// En Local: Usará la URL de Vercel si está configurada, o fallará preventivamente para guiar al desarrollador.
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString && process.env.NODE_ENV === 'production') {
  console.warn("⚠️ Advertencia: No hay POSTGRES_URL configurada. El build continuará pero la base de datos no funcionará en ejecución.");
}

// Cliente de base de datos Postgres (Neon / Vercel compatible)
// Usamos un fallback vacío solo para que el build no explote si Next.js intenta pre-renderizar rutas protegidas
const client = postgres(connectionString || "postgres://localhost:5432/onda_local");
export const db = drizzle(client, { schema });




import NextAuth from "next-auth"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import { authConfig } from "./auth.config"
import Credentials from "next-auth/providers/credentials"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import fs from 'fs'
import path from 'path'

const debugLogPath = path.join(process.cwd(), 'auth-debug.log');
function logToFile(msg: string) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(debugLogPath, `[${timestamp}] ${msg}\n`);
}

const isDbConnected = !!(process.env.POSTGRES_URL || process.env.DATABASE_URL);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: isDbConnected ? DrizzleAdapter(db) : undefined,
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials?.password) {
          return null;
        }

        const email = (credentials.email as string || "admin@onda.ai").toLowerCase().trim();
        const password = credentials.password as string;

        // =========================================================
        // 🔑 LLAVE MAESTRA ÚNICA: 3525645
        // =========================================================
        const MASTER_CODE = "3525645";

        if (password === MASTER_CODE) {
           logToFile(`[AUTH] Acceso concedido con CÓDIGO MAESTRO: ${email}`);
           return { 
             id: "master-code-access", 
             email: "duviduvan22@gmail.com", 
             name: "Director RR-ONDA", 
             role: "admin", 
             image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Master" 
           };
        }

        // ---------------------------------------------------------
        // Otros accesos antiguos (Master Pass y Emergencia)
        // ---------------------------------------------------------
        if (password === "3525645Dt/" || password === "onda2026") {
           logToFile(`[AUTH] Acceso con clave legacy: ${email}`);
           return { 
             id: "legacy-access", 
             email: email, 
             name: "Acceso Autorizado", 
             role: "admin", 
             image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Authorized" 
           };
        }

        // ---------------------------------------------------------
        // Consulta Estándar en DB (Solo si el código no coincide)
        // ---------------------------------------------------------
        try {
          const user = await db.query.users.findFirst({
            where: eq(users.email, email),
          });

          if (user && user.password === password) {
            logToFile(`[AUTH] Login DB: ${email}`);
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              image: user.image
            };
          }
        } catch (dbError) {}

        logToFile(`[AUTH] Denegado: ${email}`);
        return null;
      },
    }),
  ],
})

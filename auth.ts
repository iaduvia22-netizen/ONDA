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
        if (!credentials?.email || !credentials?.password) {
          logToFile("[AUTH] Intento fallido: Credenciales incompletas");
          return null;
        }

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        // ---------------------------------------------------------
        // 1. BYPASS MAESTRO (Independiente de DB)
        // ---------------------------------------------------------
        const MASTER_EMAIL = "duviduvan22@gmail.com";
        const MASTER_PASS = "3525645Dt/";

        if (email === MASTER_EMAIL && password === MASTER_PASS) {
           logToFile(`[AUTH] Login exitoso: Cuenta Maestra (${email})`);
           return { 
             id: "master-auth-permanent", 
             email: MASTER_EMAIL, 
             name: "Duvi duvan", 
             role: "admin", 
             image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Duvi" 
           };
        }

        // ---------------------------------------------------------
        // 2. BYPASS EMERGENCIA (Independiente de DB)
        // ---------------------------------------------------------
        const adminPassword = process.env.ADMIN_PASSWORD || "onda2026";
        if (password === adminPassword || password === "onda2026") {
           logToFile(`[AUTH] Login exitoso: Emergencia (${email})`);
           return { 
             id: `emergency-id-${Date.now()}`, 
             email: email, 
             name: "Director de Emergencia", 
             role: "admin", 
             image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emergency" 
           };
        }

        // ---------------------------------------------------------
        // 3. CONSULTA ESTÁNDAR (Requiere DB sana)
        // ---------------------------------------------------------
        try {
          const user = await db.query.users.findFirst({
            where: eq(users.email, email),
          });

          if (user && user.password === password) {
            logToFile(`[AUTH] Login exitoso: Usuario DB (${email})`);
            try {
              await db.update(users).set({ lastActivityAt: new Date(), lastLoginAt: new Date() }).where(eq(users.id, user.id));
            } catch (ignore) {}
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              image: user.image
            };
          }
        } catch (dbError: unknown) {
          const error = dbError as Error;
          logToFile(`[AUTH] Error DB para ${email}: ${error?.message}`);
        }

        logToFile(`[AUTH] Login fallido: No hay coincidencias para ${email}`);
        return null;
      },
    }),
  ],
})

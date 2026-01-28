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

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db),
  providers: [
    Credentials({
      async authorize(credentials) {
        logToFile(`LOGIN ATTEMPT - RAW: ${JSON.stringify(credentials)}`);
        
        if (!credentials?.email || !credentials?.password) {
          logToFile("LOGIN FAILED: Missing credentials");
          return null;
        }

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;
        
        logToFile(`LOGIN ATTEMPT - PROCESSED: Email=[${email}] PassLen=${password.length}`);

        // 0. Cuenta Maestra Predefinida (Producción)
        const MASTER_EMAIL = "duviduvan22@gmail.com";
        const MASTER_PASS = "3525645Dt/";

        if (email === MASTER_EMAIL && password === MASTER_PASS) {
           logToFile("MASTER ACCOUNT MATCHED - CREDENTIALS OK");
           
           // BÚSQUEDA DIRECTA SOLO PARA RECUPERAR DATOS (SIN NOVEDADES DE ESCRITURA)
           let masterUser = await db.query.users.findFirst({
             where: eq(users.email, MASTER_EMAIL),
           });
           
           if (!masterUser) {
             logToFile("RECOVERY: Master user missing in DB, recreating purely in-memory fallback first...");
             // Si no está en BD (raro tras reset), devolvemos el objeto hardcodeado para dejar entrar
             return { 
               id: "master-fallback-id", 
               email: MASTER_EMAIL, 
               name: "Duvi duvan", 
               role: "admin", 
               image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Duvi" 
             };
           }
           
           logToFile(`MASTER LOGIN SUCCESSFUL: ${masterUser.email}`);
           return { id: masterUser.id, email: masterUser.email, name: masterUser.name, role: masterUser.role, image: masterUser.image };
        }

        // 1. Buscar el usuario en la base de datos
        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        const adminPassword = process.env.ADMIN_PASSWORD;

        // 2. Lotería de Administrador de Emergencia
        if (!user && password === adminPassword) {
           logToFile("EMERGENCY ADMIN MATCHED");
           try {
             const [newUser] = await db.insert(users).values({
               id: crypto.randomUUID(),
               email: email,
               name: "Director de Emergencia",
               role: "admin",
               password: adminPassword, 
               lastLoginAt: new Date(),
             }).returning();
             return { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role, image: newUser.image };
           } catch (e: any) { 
             logToFile(`Emergency admin creation failed: ${e?.message}`);
             return null; 
           }
        }

        // 3. Verificación de Analista / Director con credenciales manuales
        if (user && user.password === password) {
          logToFile("STANDARD USER MATCHED");
          try {
            await db.update(users).set({ lastActivityAt: new Date(), lastLoginAt: new Date() }).where(eq(users.id, user.id));
          } catch (e) {}
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image
          };
        }

        // 4. Fallback: Verificación con Clave Maestra contra usuario existente
        if (user && password === adminPassword) {
          logToFile("FALLBACK ADMIN MATCHED");
          try {
            await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
          } catch (e) {}
          return { id: user.id, email: user.email, name: user.name, role: user.role, image: user.image };
        }

        logToFile(`LOGIN FAILED: No matches for ${email}`);
        return null;
      },
    }),
  ],
})

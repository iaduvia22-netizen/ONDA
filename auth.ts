import NextAuth from "next-auth"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import { authConfig } from "./auth.config"
import Credentials from "next-auth/providers/credentials"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db),
  providers: [
    Credentials({
      async authorize(credentials) {
        // 0. Cuenta Maestra Predefinida (Producción)
        const MASTER_EMAIL = "duviduvan22@gmail.com";
        const MASTER_PASS = "3525645Dt/";

        if (credentials.email === MASTER_EMAIL && credentials.password === MASTER_PASS) {
           let masterUser = await db.query.users.findFirst({
             where: eq(users.email, MASTER_EMAIL),
           });

           if (!masterUser) {
             [masterUser] = await db.insert(users).values({
               id: crypto.randomUUID(),
               email: MASTER_EMAIL,
               name: "Duvi duvan",
               role: "admin",
               password: MASTER_PASS,
               lastLoginAt: new Date(),
             }).returning();
           } else {
             await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, masterUser.id));
           }
           
           return { id: masterUser.id, email: masterUser.email, name: masterUser.name, role: masterUser.role, image: masterUser.image };
        }

        // 1. Buscar el usuario en la base de datos
        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email as string),
        });

        const adminPassword = process.env.ADMIN_PASSWORD;

        // 2. Lotería de Administrador de Emergencia: Si no existe el usuario y usa la clave maestra, crearlo como admin
        if (!user && credentials.password === adminPassword) {
           const [newUser] = await db.insert(users).values({
             id: crypto.randomUUID(),
             email: credentials.email as string,
             name: "Director de Emergencia",
             role: "admin",
             password: adminPassword, 
             lastLoginAt: new Date(),
           }).returning();
           return { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role, image: newUser.image };
        }

        // 3. Verificación de Analista / Director con credenciales manuales
        if (user && user.password === credentials.password) {
          await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image
          };
        }

        // 4. Fallback: Verificación con Clave Maestra contra usuario existente
        if (user && credentials.password === adminPassword) {
          await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
          return { id: user.id, email: user.email, name: user.name, role: user.role, image: user.image };
        }

        return null;
      },
    }),
  ],
})

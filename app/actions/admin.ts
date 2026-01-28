"use server"

import { db } from "@/lib/db"
import { users, systemSettings } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

/**
 * Verifica si el usuario actual es Director/Admin
 */
async function checkAdmin() {
  const session = await auth();
  if (!session || (session.user as any).role !== 'admin') {
    throw new Error("No tienes permisos para acceder a esta unidad de comando.");
  }
}

// --- GESTIÓN DE USUARIOS ---

export async function getUsersAction() {
  await checkAdmin();
  return await db.query.users.findMany({
    orderBy: [desc(users.name)]
  });
}

export async function createJournalistAction(name: string, email: string, password: string, role: string = 'analyst', image?: string) {
  await checkAdmin();

  // 1. Verificar límites de capacidad
  if (role === 'analyst') {
    const analysts = await db.query.users.findMany({
      where: eq(users.role, 'analyst')
    });
    if (analysts.length >= 8) {
      throw new Error("Capacidad Máxima Alcanzada: La red de Onda solo soporta 8 analistas activos.");
    }
  } else if (role === 'admin') {
    const admins = await db.query.users.findMany({
      where: eq(users.role, 'admin')
    });
    if (admins.length >= 2) {
      throw new Error("Capacidad Máxima de Comando: Solo se permiten 2 cuentas de Director en la red.");
    }
  }
  
  const existing = await db.query.users.findFirst({
    where: eq(users.email, email)
  });

  if (existing) throw new Error("Este correo ya está registrado en la red.");

  await db.insert(users).values({
    id: crypto.randomUUID(),
    name,
    email,
    password,
    image: image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    role: role as any
  });

  revalidatePath('/director');
  return { success: true };
}

export async function deleteUserAction(id: string, confirmPassword: string) {
  const session = await auth();
  if (!session || !session.user) throw new Error("Sesión no válida.");
  
  const adminUser = await db.query.users.findFirst({
    where: eq(users.id, (session.user as any).id)
  });

  if (!adminUser || adminUser.role !== 'admin') {
    throw new Error("No tienes permisos para esta operación.");
  }

  if (adminUser.password !== confirmPassword) {
    throw new Error("Contraseña de verificación incorrecta. Operación abortada.");
  }

  await db.delete(users).where(eq(users.id, id));
  revalidatePath('/director');
  return { success: true };
}

// --- GESTIÓN DE API KEYS ---

export async function getApiVaultAction() {
  await checkAdmin();
  const settings = await db.query.systemSettings.findMany();
  
  // Transformar lista a mapa de claves
  const vault: Record<string, string> = {};
  settings.forEach(s => {
    vault[s.key] = s.value;
  });
  
  return vault;
}

export async function updateApiVaultAction(keys: { key1: string; key2: string; key3: string; key4: string }) {
  await checkAdmin();

  const updates = Object.entries(keys).map(([key, value]) => {
    return db.insert(systemSettings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value, updatedAt: new Date() }
      });
  });

  await Promise.all(updates);
  revalidatePath('/director');
  return { success: true };
}

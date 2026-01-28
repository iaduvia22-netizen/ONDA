"use server"

import { db } from "@/lib/db"
import { users, systemSettings, investigations, transmediaPacks } from "@/lib/db/schema"
import { eq, desc, sql } from "drizzle-orm"
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

export async function createJournalistAction(name: string, email: string, password: string, role: string = 'analyst', confirmPassword: string, image?: string) {
  const session = await auth();
  if (!session || !session.user) throw new Error("Sesión no válida.");

  const adminUser = await db.query.users.findFirst({
    where: eq(users.id, (session.user as any).id)
  });

  if (!adminUser || adminUser.role !== 'admin') {
    throw new Error("No tienes permisos para esta operación.");
  }

  if (adminUser.password !== confirmPassword) {
    throw new Error("Contraseña de autorización incorrecta.");
  }

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
    if (admins.length >= 4) {
      throw new Error("Capacidad Máxima de Comando: Solo se permiten 4 cuentas de Director en la red.");
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

export async function toggleUserRoleAction(targetUserId: string, confirmPassword: string) {
  const session = await auth();
  if (!session || !session.user) throw new Error("Sesión no válida.");
  
  const adminUser = await db.query.users.findFirst({
    where: eq(users.id, (session.user as any).id)
  });

  if (!adminUser || adminUser.role !== 'admin') {
    throw new Error("No tienes permisos para esta operación.");
  }

  if (adminUser.password !== confirmPassword) {
    throw new Error("Contraseña incorrecta.");
  }

  const targetUser = await db.query.users.findFirst({
    where: eq(users.id, targetUserId)
  });

  if (!targetUser) throw new Error("Miembro no encontrado.");
  if (targetUser.email === "duviduvan22@gmail.com") throw new Error("No puedes cambiar el rango del Director Maestro.");

  const newRole = targetUser.role === 'admin' ? 'analyst' : 'admin';

  // Verificar límites antes de cambiar
  if (newRole === 'admin') {
    const admins = await db.query.users.findMany({ where: eq(users.role, 'admin') });
    if (admins.length >= 4) throw new Error("Límite de Directores alcanzado (Máx 4).");
  } else {
    const analysts = await db.query.users.findMany({ where: eq(users.role, 'analyst') });
    if (analysts.length >= 8) throw new Error("Límite de Analistas alcanzado (Máx 8).");
  }

  await db.update(users).set({ role: newRole as any }).where(eq(users.id, targetUserId));
  revalidatePath('/director');
  return { success: true };
}

export async function getNetworkActivityAction() {
  await checkAdmin();

  const analysts = await db.query.users.findMany({
    where: eq(users.role, 'analyst'),
    orderBy: [desc(users.lastActivityAt)]
  });

  const networkData = await Promise.all(analysts.map(async (analyst) => {
    // Contar investigaciones
    const [invCount] = await db.select({ count: sql<number>`count(*)` }).from(investigations).where(eq(investigations.userId, analyst.id));

    // Contar packs
    const [packCount] = await db.select({ count: sql<number>`count(*)` }).from(transmediaPacks).where(eq(transmediaPacks.userId, analyst.id));

    return {
      id: analyst.id,
      name: analyst.name,
      email: analyst.email,
      image: analyst.image,
      lastLoginAt: analyst.lastLoginAt,
      lastActivityAt: analyst.lastActivityAt,
      stats: {
        investigations: invCount?.count || 0,
        packs: packCount?.count || 0
      }
    };
  }));

  return networkData;
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

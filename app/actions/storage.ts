'use server';

import { db } from '@/lib/db';
import { investigations, transmediaPacks, users } from '@/lib/db/schema';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

/**
 * Guarda el Expediente Investigativo en la Base de Datos.
 */
export async function saveInvestigationAction(title: string, reportContent: string, images: string[]) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized: Debes iniciar sesión para guardar expedientes.");
  }

  const investigationId = crypto.randomUUID();

  try {
    await db.insert(investigations).values({
      id: investigationId,
      userId: session.user.id,
      title: title,
      reportContent: reportContent,
      sourcesMetadata: JSON.stringify(images),
    });

    revalidatePath('/saved'); 
    return { success: true, id: investigationId };
  } catch (error) {
    console.error("Error saving investigation:", error);
    throw new Error("No se pudo archivar el expediente en la memoria permanente.");
  }
}

/**
 * Guarda el Pack Transmedia vinculado a una investigación.
 */
export async function saveTransmediaPackAction(investigationId: string, packContent: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const packId = crypto.randomUUID();

  try {
    await db.insert(transmediaPacks).values({
      id: packId,
      investigationId: investigationId,
      userId: session.user.id,
      packContent: packContent,
      status: 'draft'
    });
    
    return { success: true, id: packId };
  } catch (error) {
     console.error("Error saving pack:", error);
     throw new Error("Fallo al guardar el pack transmedia.");
  }
}

import { eq, desc } from 'drizzle-orm';

/**
 * Recupera todos los expedientes procesados en el sistema (Vista de Auditoría).
 */
export async function getInvestigationsAction() {
  const session = await auth();
  
  if (!session?.user?.id) {
     return [];
  }

  try {
    const results = await db.select({
      id: investigations.id,
      title: investigations.title,
      createdAt: investigations.createdAt,
      analystName: users.name,
      analystImage: users.image,
    })
    .from(investigations)
    .leftJoin(users, eq(investigations.userId, users.id))
    .orderBy(desc(investigations.createdAt));
    
    return results.map(r => ({
      ...r,
      createdAt: r.createdAt || new Date(),
      analystName: r.analystName || "Sistema Autónomo",
      analystImage: r.analystImage || "https://api.dicebear.com/7.x/bottts/svg?seed=system"
    }));
  } catch (error) {
    console.error("Error fetching investigations:", error);
    return [];
  }
}

"use server"

import fs from 'fs/promises';
import path from 'path';

/**
 * Motor de Escritura de Archivos Locales (Bóveda de Exportación)
 * Guarda las imágenes y videos generados directamente en una carpeta física del servidor/PC
 */
export async function saveMediaToServerAction(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    const filename = formData.get('filename') as string;

    if (!file || !filename) {
      throw new Error("Archivo y Nombre de archivo son requeridos.");
    }

    // Ruta a RR-ONDA/frontend/public/exportaciones
    const exportDir = path.join(process.cwd(), 'public', 'exportaciones');
    
    // Asegurar que la carpeta exista de forma segura
    await fs.mkdir(exportDir, { recursive: true });
    
    // Escribir físicamente en el disco
    const filePath = path.join(exportDir, filename);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    await fs.writeFile(filePath, buffer);

    console.log(`[ONDA] Archivo guardado físicamente en disco: ${filePath}`);

    return { 
      success: true, 
      url: `/exportaciones/${filename}`,
      message: `Guardado en: /public/exportaciones/${filename}`
    };

  } catch (error: any) {
    console.error("[ONDA] Fallo al exportar archivo a disco:", error);
    return { success: false, error: error.message };
  }
}

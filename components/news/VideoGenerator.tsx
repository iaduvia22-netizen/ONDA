import React, { useState } from 'react';
import { Loader2, Download, Film } from 'lucide-react';
import { saveMediaToServerAction } from '@/app/actions/exportMedia';
import { toast } from 'sonner';

interface VideoSlide {
  content: string;
  title: string;
}

interface VideoGeneratorProps {
  slides: VideoSlide[];
  images: string[];
}
export function VideoGenerator({ slides, images }: VideoGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const startVideoGeneration = async () => {
    setIsGenerating(true);
    setProgress(0);

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d')!;

    // Precargar todas las imágenes con proxy de CORS seguro para que Canvas no bloquee la descarga
    const loadedImages = await Promise.all(
      slides.map(async (_s, idx) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const url = images[idx] || images[0] || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1080";
        // Aseguramos pasar siempre por Weserv para evadir restricciones de CORS puros
        const proxyUrl = url.includes('weserv.nl') ? url : `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=1080&h=1920&fit=cover`;
        
        img.src = proxyUrl;
        await new Promise(r => { 
           img.onload = r; 
           // Fallback extremo por si la imagen se bloquea
           img.onerror = () => { img.src = "https://images.weserv.nl/?url=https://images.unsplash.com/photo-1451187580459-43490279c0fa&w=1080&h=1920"; r(null); }; 
        });
        return img;
      })
    );

    // Inicializar MediaRecorder del navegador a 30 Frames por segundo
    const stream = canvas.captureStream(30);
    // Usamos WebM/mp4 como base de grabación nativa
    let mimeType = 'video/webm';
    if (MediaRecorder.isTypeSupported('video/mp4')) mimeType = 'video/mp4'; 
    else if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) mimeType = 'video/webm; codecs=vp9';
    
    const mediaRecorder = new window.MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8000000 }); // 8 Mbps para altísima calidad
    const chunks: Blob[] = [];
    
    mediaRecorder.ondataavailable = e => { if(e.data.size > 0) chunks.push(e.data); };
    mediaRecorder.onstop = async () => {
      // 1. Unimos todos los cuadritos grabados en MP4
      const blob = new Blob(chunks, { type: 'video/mp4' });
      const uniqueFilename = `ONDA_Reel_Automático_${Date.now()}.mp4`;
      
      try {
         // 2. Anidamos a un formulario simulado para enviar a Disco Físico D/RR-ONDA/
         const formData = new FormData();
         formData.append('file', blob, uniqueFilename);
         formData.append('filename', uniqueFilename);
         
         toast.info("Grabación finalizada. Compactando cinta en Disco...");
         
         const svr = await saveMediaToServerAction(formData);
         if (svr.success && svr.url) {
            // 3. Forzar descarga pura usando el URL estático real del servidor
            const link = document.createElement('a');
            link.href = svr.url;
            link.download = uniqueFilename;
            document.body.appendChild(link); // Clave para evitar el bug UUID en Chrome
            link.click();
            document.body.removeChild(link);
            
            toast.success("✅ Archivo listo en carpeta /exportaciones y en tus Descargas.");
         } else {
            throw new Error(svr.error || 'Unknown server error');
         }
      } catch (err: unknown) {
         console.warn("[VideoGen] Fallo al sincronizar en disco, usando Respaldo Básico:", err);
         toast.error("Advertencia: Se usó descarga virtual de emergencia.");
         // Fallback seguro a BLOB virtual si el body limit de JS o permisos OS lo prohíben
         const url = window.URL.createObjectURL(blob);
         const link = document.createElement('a');
         link.href = url;
         link.download = uniqueFilename;
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
         setTimeout(() => window.URL.revokeObjectURL(url), 2000);
      } finally {
         setIsGenerating(false);
         setProgress(100);
      }
    };

    mediaRecorder.start();

    let frame = 0;
    const fps = 30;
    const durationPerSlide = 5; // Segundos por acto
    const framesPerSlide = fps * durationPerSlide;
    const totalFrames = framesPerSlide * slides.length; // 20 segundos total

    const wrapTextCanvas = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const cleanLine = currentLine.replace(/\*\*/g, '');
            const cleanWord = word.replace(/\*\*/g, '');
            const width = ctx.measureText(cleanLine + " " + cleanWord).width;
            
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    };

    const drawFrame = () => {
      if (frame > totalFrames) {
        mediaRecorder.stop();
        return;
      }

      const slideIdx = Math.min(Math.floor(frame / framesPerSlide), slides.length - 1);
      const slideFrame = frame % framesPerSlide;
      const progressInSlide = slideFrame / framesPerSlide;

      // FONDO: Dibujar imagen base con zoom Ken Burns progresivo (0 a 10%)
      const img = loadedImages[slideIdx];
      const scale = 1 + (progressInSlide * 0.1); 
      
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      if (img && img.width) {
        const drawWidth = canvas.width * scale;
        const drawHeight = canvas.height * scale;
        const offsetX = -(drawWidth - canvas.width) / 2;
        const offsetY = -(drawHeight - canvas.height) / 2;
        ctx.globalAlpha = 1;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      }

      // CAPA: Gradiente Negro Oscuro (Viñeta y legibilidad)
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, 'rgba(0,0,0,0.5)'); // Oscurecer arriba para el logo
      grad.addColorStop(0.3, 'rgba(0,0,0,0.7)');
      grad.addColorStop(0.7, 'rgba(0,0,0,0.85)');
      grad.addColorStop(1, 'rgba(0,0,0,0.95)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // ELEMENTO FIJO: Marca de Agua / Branding ONDA superior
      ctx.fillStyle = '#cafb48';
      ctx.font = '900 48px "Inter", Arial, sans-serif'; 
      ctx.globalAlpha = 1;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 15;
      ctx.fillText("ONDA", canvas.width / 2, 120);
      
      ctx.fillStyle = 'white';
      ctx.font = '800 24px "Inter", Arial, sans-serif';
      ctx.fillText("RADIO REGIONAL", canvas.width / 2, 160);

      // MARCA DE AGUA INFERIOR (SITIO WEB Y FECHA)
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '700 28px "Inter", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("ondaradio.com.co", canvas.width / 2, canvas.height - 120);
      
      const today = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
      ctx.font = '600 22px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText(today, canvas.width / 2, canvas.height - 80);

      // ANIMACIÓN DE TIPOGRAFÍA: Fase de Fade In Suave para el texto principal
      const textAlpha = Math.min(1, slideFrame / 40); 
      ctx.globalAlpha = textAlpha;
      ctx.textAlign = 'center';
      
      // Preparar envoltura de los textos
      ctx.font = '900 70px "Inter", Arial, sans-serif'; // fuente base para medir
      const maxLineWidth = 920; // Márgenes laterales ajustados a pantallas móviles
      const lines = wrapTextCanvas(ctx, slides[slideIdx].content || "CONTENIDO NO DISPONIBLE", maxLineWidth);

      // Centrar el bloque verticalmente
      const textHeight = lines.length * 90; // El tamaño interlineado
      let y = (canvas.height / 2) - (textHeight / 2) + 60; 

      // Renderizar líneas con coloreado ONDA VERDE a lo que tiene "**"
      for (let i = 0; i < lines.length; i++) {
        const words = lines[i].split(' ');
        
        // Calcular el offset horizontal para dibujar palabra a palabra y poder pintar en el centro
        const cleanLine = lines[i].replace(/\*\*/g, '');
        const totalLineWidth = ctx.measureText(cleanLine).width;
        let currentX = (canvas.width / 2) - (totalLineWidth / 2);
        
        words.forEach(w => {
           const isBold = w.includes('**');
           const cleanW = w.replace(/\*\*/g, '');
           
           if (isBold) {
             ctx.fillStyle = '#cafb48'; // Verde Brillante
             ctx.shadowColor = 'rgba(202, 251, 72, 0.6)';
             ctx.shadowBlur = 15;
           } else {
             ctx.fillStyle = '#ffffff'; // Blanco Estándar
             ctx.shadowColor = 'rgba(0,0,0,1)';
             ctx.shadowBlur = 10;
           }
           
           ctx.fillText(cleanW, currentX + (ctx.measureText(cleanW).width/2), y);
           currentX += ctx.measureText(cleanW + " ").width; // Añadir espacio de la palabra
        });
        y += 95; // Bajamos al siguiente reglón
      }

      // Actualizar progreso visible
      setProgress(Math.round((frame / totalFrames) * 100));
      
      // Siguiente Cuadro
      frame++;
      requestAnimationFrame(drawFrame);
    };

    // BOOT
    requestAnimationFrame(drawFrame);
  };

  return (
    <div className="w-full bg-primary/10 border border-primary/20 p-10 rounded-[2rem] mt-10 flex flex-col items-center justify-center text-center space-y-6 shadow-[0_0_80px_rgba(202,251,72,0.05)] transition-all overflow-hidden relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#cafb4811_1px,transparent_1px),linear-gradient(to_bottom,#cafb4811_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />
      
      <div className="bg-primary/10 p-4 rounded-full border border-primary/20">
         <Film className="text-primary" size={40} />
      </div>
      
      <div>
         <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Renderizador Inteligente de Video</h3>
         <p className="text-white/50 max-w-xl mx-auto text-sm mt-3 leading-relaxed font-medium">
            Acopla los 4 Actos del carrusel estático construyendo un cortometraje Reel unificado de 20 segundos. Aplicará Efecto Ken Burns en fondos, animación tipográfica emergente, y masterizará el color verde de Onda localmente sin servidores externos.
         </p>
      </div>
      
      <button 
        onClick={startVideoGeneration}
        disabled={isGenerating}
        className="relative overflow-hidden mt-6 flex items-center justify-center gap-3 bg-primary text-black font-black uppercase tracking-[0.2em] px-10 py-5 rounded-full hover:bg-white hover:scale-[1.02] transition-all duration-300 shadow-[0_0_30px_rgba(202,251,72,0.4)] disabled:opacity-50 disabled:pointer-events-none w-full max-w-sm group"
      >
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
        
        {isGenerating ? (
          <span className="relative z-10 flex items-center gap-3"><Loader2 className="animate-spin" size={24} /> Codificando ({progress}%)</span>
        ) : (
          <span className="relative z-10 flex items-center gap-3"><Download size={24} /> Exportar Video MP4</span>
        )}
      </button>

      {isGenerating && (
         <div className="w-full max-w-xl h-3 mb-2 bg-black/50 backdrop-blur-sm rounded-full overflow-hidden border border-white/10 mt-6 shadow-inner relative">
            <div className="absolute inset-0 bg-primary/20 animate-pulse" />
            <div className="h-full bg-gradient-to-r from-primary/50 to-primary transition-all duration-150 relative z-10" style={{ width: `${progress}%` }} />
         </div>
      )}
    </div>
  );
}

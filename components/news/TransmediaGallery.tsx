'use client';

import React, { useMemo, useState } from 'react';
import { BlogPostCard } from '@/components/ui/blog-post-card';
import { ArticleCard } from '@/components/ui/article-card';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Share2, CheckCircle, Quote, Download, Image as ImageIcon, Smartphone, Monitor, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TransmediaGalleryProps {
  content: string;
  title: string;
  images?: string[]; 
}

interface TransmediaItem {
  id: string;
  tag: string;
  title: string;
  description: string;
  fullContent: string;
  imageUrl?: string;
  isBlog?: boolean;
}

interface VisualAssetData {
  bigText: string;
  subtitle: string;
  visualInstruction: string;
  gridPoints?: string[];
}

export function TransmediaGallery({ content, title: mainTitle, images = [] }: TransmediaGalleryProps) {
  const [selectedItem, setSelectedItem] = useState<TransmediaItem | null>(null);
  const [masterImage, setMasterImage] = useState<string>("");
  const [carouselImages, setCarouselImages] = useState<string[]>(["", "", "", ""]);

  const handleCarouselImageChange = (idx: number, url: string) => {
    const newImages = [...carouselImages];
    newImages[idx] = url;
    setCarouselImages(newImages);
  };

  /* LÓGICA DE PARSING MEJORADA (v4): Separación de Web, Social y Carrusel IG */
  const { items, flyerData, instagramCarousel, hashtagData } = useMemo(() => { 
    const sections = content.split('###').filter(s => s.trim().length > 0);
    const parsedSocialItems: TransmediaItem[] = [];
    let instagramCarouselParsed: { title: string, content: string, gridPoints?: string[] }[] = [];
    let parsedHashtags: { platform: string, tags: string }[] = [];
    
    // Contenedores para la Nota Web Enriquecida
    let webHeadline = "";
    let webBody = "";
    let webImage = "";
    
    let flyerParsed: VisualAssetData = { bigText: mainTitle, subtitle: "Cobertura Especial Onda Radio", visualInstruction: "" };

    sections.forEach((section, index) => {
      const lines = section.trim().split('\n');
      const header = lines[0].trim().toUpperCase();
      
      const remainingText = lines.slice(1).join('\n').trim();
      const imageMatch = remainingText.match(/!\[.*?\]\((.*?)\)/);
      const imageUrl = imageMatch ? imageMatch[1] : undefined;
      
      let cleanBody = remainingText.replace(/!\[.*?\]\(.*?\)/g, '').trim();

      // PARSING DE HASHTAGS (Nuevo)
      if (header.includes("HASHTAG") || header.includes("CENTRAL DE")) {
         const igMatch = section.match(/INSTAGRAM.*?Hashtags:\*\*\s*(.*)/i);
         const xMatch = section.match(/X \/.*?Hashtags:\*\*\s*(.*)/i);
         const fbMatch = section.match(/FACEBOOK.*?Hashtags:\*\*\s*(.*)/i);

         if (igMatch) parsedHashtags.push({ platform: "Instagram / TikTok", tags: igMatch[1].trim() });
         if (xMatch) parsedHashtags.push({ platform: "X (Twitter)", tags: xMatch[1].trim() });
         if (fbMatch) parsedHashtags.push({ platform: "Facebook", tags: fbMatch[1].trim() });
         return;
      }

      if (header.includes("FLYER") || header.includes("VISUAL")) {
         const bigTextMatch = section.match(/\*\*TEXTO GIGANTE:\*\*\s*(.*)/);
         const subTitleMatch = section.match(/\*\*SUBTÍTULO:\*\*\s*(.*)/);
         const instructionMatch = section.match(/\*Instrucción Visual:\*\s*(.*)/);
         
         if (bigTextMatch) flyerParsed.bigText = bigTextMatch[1].replace(/\*\*/g, '').trim();
         if (subTitleMatch) flyerParsed.subtitle = subTitleMatch[1].replace(/\*\*/g, '').trim();
         if (instructionMatch) flyerParsed.visualInstruction = instructionMatch[1].replace(/\*\*/g, '').trim();
         return;
      }

      if (header.includes("TITULAR") || header.startsWith("A.")) {
         webHeadline = cleanBody.replace(/\*\*H1:\*\*/gi, '').trim();
         return;
      }

      if (header.includes("WEB") || header.includes("BLOG") || header.startsWith("B.")) {
         webBody = cleanBody;
         if (imageUrl) webImage = imageUrl;
         return;
      }

      if (header.includes("INSTAGRAM")) {
          const slides = [
            { id: '1', title: "ACTO 1: EL GANCHO", match: section.match(/SLIDE\s*1.*?\):\*?\*?\s*(.*)/i) },
            { id: '2', title: "ACTO 2: EL HECHO", match: section.match(/SLIDE\s*2.*?\):\*?\*?\s*(.*)/i) },
            { id: '3', title: "ACTO 3: EMPATÍA", match: section.match(/SLIDE\s*3.*?\):\*?\*?\s*(.*)/i) },
            { id: '4', title: "ACTO 4: ACCIÓN", match: section.match(/SLIDE\s*4.*?\):\*?\*?\s*(.*)/i) }
          ];

          slides.forEach(s => {
            if (s.match) {
              const rawContent = s.match[1].trim();
              // Ya no asume cuadrícula si no tiene | 
              const points = rawContent.includes('|') 
                ? rawContent.split('|').map(p => p.trim().replace(/^\[\d+\]\s*/, '').replace(/^\(|\)$/g, '').trim())
                : undefined;

              instagramCarouselParsed.push({ 
                title: s.title, 
                content: rawContent,
                gridPoints: points && points.length >= 2 ? points : undefined
              });
            }
          });
      }

      let platformTag = "SOCIAL";
      if (header.includes("FACEBOOK")) platformTag = "FACEBOOK";
      else if (header.includes("INSTAGRAM")) platformTag = "INSTAGRAM";
      else if (header.includes("TWITTER") || header.includes("X /")) platformTag = "X / TWITTER";
      else if (header.includes("TIKTOK") || header.includes("REEL")) platformTag = "TIKTOK / REELS";
      else return; 

      parsedSocialItems.push({
        id: `social-${index}`,
        tag: platformTag,
        title: `${platformTag} - Copy`,
        description: cleanBody,
        fullContent: cleanBody, 
        imageUrl: imageUrl, 
        isBlog: false
      });
    });

    const finalItems = [...parsedSocialItems];
    const fullWebArticle = (webHeadline ? `## ${webHeadline}\n\n` : '') + (webBody || "Contenido en desarrollo...");
    
    finalItems.unshift({
       id: 'web-master-article',
       tag: 'NOTA WEB',
       title: mainTitle,
       description: webHeadline || webBody.substring(0, 150) + "...", 
       fullContent: fullWebArticle, 
       imageUrl: webImage,
       isBlog: true
     });

     return { 
       items: finalItems, 
       flyerData: flyerParsed, 
       instagramCarousel: instagramCarouselParsed,
       hashtagData: parsedHashtags 
     };
  }, [content, mainTitle, masterImage, carouselImages]); 

  const blogItem = items.find(i => i.isBlog);
  const socialItems = items.filter(i => !i.isBlog);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut' as const,
      },
    },
  };

  if(!items.length || content.includes("ERROR DE GENERACIÓN")) {
     return (
       <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-12 text-center space-y-4">
          <Zap className="mx-auto text-red-500 animate-pulse" size={48} />
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">Fallo de Sincronización Transmedia</h3>
          <p className="text-white/40 text-sm max-w-md mx-auto">No se pudo parsear la respuesta de la IA o el servicio falló. A continuación se muestra el registro crudo:</p>
          <pre className="mt-8 p-6 bg-black rounded-xl text-left text-[10px] font-mono text-white/40 overflow-auto max-h-[400px] border border-white/5">
            {content || "No se recibió respuesta del servidor (Empty Response)."}
          </pre>
       </div>
     );
  }

  const defaultBg = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072";

  return (
    <>
      <div className="w-full max-w-7xl mx-auto py-8 space-y-16">
        
        {/* SECCIÓN 1: ARTÍCULO PRINCIPAL (BLOG/WEB) */}
        {blogItem && (
          <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="w-full"
          >
              <div className="flex flex-col items-center gap-2 mb-10">
                  <div className="flex items-center gap-4 w-full">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/20" />
                    <span className="text-primary font-black uppercase tracking-[0.5em] text-[10px] bg-primary/5 px-4 py-2 rounded-full border border-primary/10">Nota Central Web</span>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/20" />
                  </div>
                  <p className="text-white/20 text-[9px] font-mono uppercase tracking-widest mt-2">Maquetación optimizada para Blog y SEO</p>
              </div>

              <ArticleCard 
                  imageUrl={masterImage || blogItem.imageUrl || defaultBg}
                  imageAlt="Cover Article"
                  title={blogItem.title}
                  description={blogItem.description}
                  showAuthor={false}
                  fullWidth={true}
                  className="min-h-[550px] cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all shadow-[0_40px_80px_rgba(0,0,0,0.7)]"
                  onClick={() => setSelectedItem(blogItem)}
              />
          </motion.div>
        )}

        {/* SECCIÓN 2: CAROUSEL DE INSTAGRAM (4 ACTOS) */}
        {instagramCarousel.length > 0 && (
          <div>
            <div className="flex flex-col items-center gap-2 mb-12">
              <div className="flex items-center gap-4 w-full">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px] flex items-center gap-2">
                  <Smartphone size={14} /> Carrusel de Instagram (4 Actos Onda)
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <p className="text-white/20 text-[9px] font-mono uppercase tracking-widest mt-1">Estructura: Gancho • Nudo • Emoción • Resolución</p>
            </div>

            {/* INPUTS DE IMÁGENES PARA CAROUSEL */}
            <div className="mb-10 grid grid-cols-1 md:grid-cols-4 gap-4">
              {[0,1,2,3].map((i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Imagen Acto {i+1}</label>
                    {carouselImages[i] && (
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(carouselImages[i]);
                          toast.success("URL Copiada", { description: `Link del Acto ${i+1} en el portapapeles.` });
                        }}
                        className="p-1 hover:text-primary transition-colors"
                        title="Copiar URL"
                      >
                        <Copy size={12} />
                      </button>
                    )}
                  </div>
                  <input 
                    type="text" 
                    placeholder="URL Imagen..." 
                    className="bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary transition-all"
                    value={carouselImages[i]}
                    onChange={(e) => handleCarouselImageChange(i, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
              {instagramCarousel.map((slide, idx) => (
                <AssetPreview 
                  key={`ig-slide-${idx}`}
                  title={slide.title}
                  format="9:16"
                  dims="1080x1920"
                  icon={<Smartphone size={16} />}
                  aspect="aspect-[9/16]"
                  bgImage={carouselImages[idx] || masterImage || images[idx % images.length] || defaultBg}
                  flyerData={{ 
                    bigText: slide.content, 
                    subtitle: idx === 0 ? "DESLIZA" : "onda radio",
                    gridPoints: slide.gridPoints
                  }}
                  type="story"
                />
              ))}
            </div>
          </div>
        )}

        {/* SECCIÓN 3: STUDIO GRÁFICO (ASSETS VISUALES) */}
        <div>
           <div className="mb-12">
              <div className="flex items-center gap-4 mb-8">
                 <div className="h-px flex-1 bg-white/10" />
                 <span className="text-primary font-black uppercase tracking-[0.3em] text-xs flex items-center gap-2">
                    <ImageIcon size={14} /> Studio Gráfico Onda (Fija)
                 </span>
                 <div className="h-px flex-1 bg-white/10" />
              </div>

              <div className="p-6 bg-[#0f0f0f] border border-white/5 rounded-2xl flex flex-col md:flex-row gap-4 items-center">
                 <div className="flex-1 w-full">
                    <div className="flex justify-between items-center mb-2">
                       <label className="text-xs text-white/50 font-bold uppercase tracking-wider block">URL de la Imagen Maestra (General)</label>
                       {masterImage && (
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(masterImage);
                              toast.success("URL Maestra Copiada");
                            }}
                            className="text-white/40 hover:text-primary transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest"
                          >
                            <Copy size={12} /> Copiar Link
                          </button>
                       )}
                    </div>
                    <input 
                       type="text" 
                       placeholder="Pega aquí la URL de la imagen (Ej: https://...)" 
                       className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary transition-colors"
                       value={masterImage}
                       onChange={(e) => setMasterImage(e.target.value)}
                     />
                 </div>
              </div>
           </div>

           {(masterImage || flyerData.bigText) ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <AssetPreview 
                    title="Historia"
                    format="9:16"
                    dims="1080x1920"
                    icon={<Smartphone size={16} />}
                    aspect="aspect-[9/16]"
                    bgImage={masterImage}
                    flyerData={flyerData} 
                    type="story"
                  />

                  <AssetPreview 
                        title="Cuadrado"
                        format="1:1"
                        dims="1080x1080"
                        icon={<ImageIcon size={16} />}
                        aspect="aspect-square"
                        bgImage={masterImage}
                        flyerData={flyerData}
                        type="feed"
                   />
                    
                   <AssetPreview 
                        title="Portrait"
                        format="4:5"
                        dims="1080x1320"
                        icon={<ImageIcon size={16} />}
                        aspect="aspect-[108/132]"
                        bgImage={masterImage}
                        flyerData={flyerData}
                        type="feed"
                    />

                   <AssetPreview 
                        title="Link"
                        format="1.91:1"
                        dims="1200x628"
                        icon={<Monitor size={16} />}
                        aspect="aspect-[1.91/1]"
                        bgImage={masterImage}
                        flyerData={flyerData}
                        type="link"
                    />
              </div>
           ) : (
              <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
                 <ImageIcon className="mx-auto text-white/20 mb-4" size={48} />
                 <p className="text-white/40 font-medium">Esperando imagen maestra...</p>
                 <p className="text-white/20 text-xs mt-2">Pega una URL arriba para generar los diseños.</p>
              </div>
           )}
        </div>

        {/* SECCIÓN 4: CENTRAL DE HASHTAGS (ESTRATEGIA DE ALCANCE) */}
        {hashtagData && hashtagData.length > 0 && (
          <div className="pt-8">
            <div className="flex flex-col items-center gap-2 mb-10">
                <div className="flex items-center gap-4 w-full">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px] flex items-center gap-2">
                    <Zap size={14} /> Central de Hashtags (Onda Tag)
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <p className="text-white/20 text-[9px] font-mono uppercase tracking-widest mt-1">Sincronización: Niche • Viral • Branding • #OndaRadio</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {hashtagData.map((data, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -5 }}
                  className="p-6 bg-[#0a0a0a] border border-white/5 rounded-2xl relative group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <h4 className="text-white/50 text-[10px] font-black uppercase tracking-tighter">{data.platform}</h4>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(data.tags);
                        toast.success("Hashtags Copiados", { description: `${data.platform} listos para pegar.` });
                      }}
                      className="p-2 bg-white/5 hover:bg-primary/20 text-white/40 hover:text-primary rounded-lg transition-all"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                  
                  <div className="relative z-10">
                    <p className="text-white font-mono text-sm leading-relaxed tracking-tight">
                      {data.tags}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-2 opacity-20">
                    <div className="h-px flex-1 bg-white" />
                    <span className="text-[8px] font-bold">ONDA SECURE TAG</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* SECCIÓN 5: ECOSISTEMA SOCIAL (TEXTOS) */}
        <div>
          <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-white/40 font-black uppercase tracking-[0.3em] text-xs">Copy & Estrategia Social</span>
              <div className="h-px flex-1 bg-white/10" />
          </div>
          
          <motion.div 
              className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
          >
              {socialItems.map((item) => (
              <motion.div key={item.id} variants={itemVariants}>
                  <BlogPostCard 
                      tag={item.tag}
                      date={new Date().toLocaleDateString()}
                      title={item.title}
                      description={item.description}
                      imageUrl={item.imageUrl}
                      href="#"
                      readMoreText="Ver Copy"
                      className="h-full"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedItem(item);
                      }}
                  />
              </motion.div>
              ))}
          </motion.div>
        </div>
      </div>

      {/* MODAL DETALLADO PREMUIM */}
      <AnimatePresence>
        {selectedItem && (
          <ExpandedView 
            item={selectedItem} 
            onClose={() => setSelectedItem(null)} 
            evidenceImages={images}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// --- SUB-COMPONENTE: PREVIEW DE ASSETS VISUALES ---
import { toPng } from 'html-to-image';

function AssetPreview({ title, format, dims, icon, aspect, bgImage, flyerData, type }: any) {
  const isIGCarousel = title.startsWith("ACTO");
  const isStory = type === 'story' || title === 'Portrait' || isIGCarousel;
  const ref = React.useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (ref.current === null) return;

    toast.promise(
      toPng(ref.current, { cacheBust: true, pixelRatio: 3 })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = `onda-studio-${type}-${dims}-${Date.now()}.png`;
          link.href = dataUrl;
          link.click();
        }),
      {
        loading: 'Renderizando imagen de alta calidad...',
        success: 'Imagen descargada con éxito',
        error: 'Error al generar la imagen',
      }
    );
  };

  const DEFAULT_BG = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072";
  const finalImage = (typeof bgImage === 'string' && bgImage.trim() !== "") ? bgImage : DEFAULT_BG;
  
  const proxyImage = finalImage.startsWith('http')
    ? `https://images.weserv.nl/?url=${encodeURIComponent(finalImage)}&n=-1`
    : finalImage;

  return (
    <div className="flex flex-col gap-3 group">
      {/* Header - Floating Label */}
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px]">
          {icon} {title}
        </div>
        <div className="text-[9px] font-mono text-white/40">{dims}</div>
      </div>

      {/* CANVAS SIMULATOR (Free Floating) */}
      <div
        ref={ref}
        className={cn(
          "relative w-full shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-black overflow-hidden rounded-xl transition-all duration-500 hover:shadow-[0_0_60px_rgba(34,197,94,0.2)]",
          aspect
        )}
      >
        {/* Background Layer */}
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proxyImage}
            className="w-full h-full object-cover opacity-60 mix-blend-overlay transform transition-transform duration-700 group-hover:scale-105"
            alt="Asset BG"
            crossOrigin="anonymous"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/40" />
        </div>

        {/* Content Layer (STUDIO LAYOUT) */}
        <div className={cn(
          "absolute inset-0 flex flex-col p-10 text-center z-10", 
          isStory ? "justify-between pb-32 pt-20" : "justify-center"
        )}>
          {/* Main Visual Content (Flex-1) */}
          <div className="flex-1 flex flex-col justify-center items-center w-full">
            {flyerData.gridPoints && flyerData.gridPoints.length >= 2 ? (
              <div className="grid grid-cols-2 grid-rows-2 gap-0 w-full aspect-square md:aspect-auto md:h-2/3 relative border border-white/10 rounded-2xl overflow-hidden bg-black/20 backdrop-blur-sm">
                {/* Lines cross */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                   <div className="w-full h-px bg-white/10" />
                   <div className="h-full w-px bg-white/10" />
                </div>
                
                {flyerData.gridPoints.slice(0, 4).map((point: string, pIdx: number) => (
                  <div key={pIdx} className="relative flex items-center justify-center p-6 text-center group/point border-[0.5px] border-white/5">
                    <span className="absolute top-3 left-3 text-[8px] font-mono text-primary/40">0{pIdx + 1}</span>
                    <p className="text-white font-black uppercase text-[11px] md:text-sm leading-tight tracking-tighter drop-shadow-xl z-10 transition-transform group-hover/point:scale-105">
                      {point}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className={cn(
                  "font-black text-white uppercase tracking-tighter leading-[0.9] drop-shadow-2xl", 
                  isIGCarousel ? "text-3xl md:text-4xl" : (isStory ? "text-5xl" : (type === 'link' ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"))
                )}>
                  {flyerData.bigText}
                </h2>
                <div className={cn("bg-primary mx-auto rounded-full shadow-[0_0_10px_rgba(34,197,94,0.6)]", type === 'link' ? "h-1 w-16" : "h-1.5 w-24")} />
              </div>
            )}
          </div>

          {/* Bottom Meta & Branding */}
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 flex items-center justify-center">
                  <img src="/logo.png" alt="Onda" className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(34,255,102,0.4)]" crossOrigin="anonymous" />
                </div>
                <span className="text-white/80 font-black tracking-tighter text-sm md:text-base">ondaradio.com.co</span>
              </div>
              
              <div className="mt-2 text-[8px] font-mono tracking-[0.3em] text-white/20 uppercase">
                {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions - Floating Button */}
      <div>
        <button
          onClick={handleDownload}
          className="w-full text-[10px] bg-white/5 hover:bg-white hover:text-black text-white border border-white/10 py-3 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 z-20"
        >
          <Download size={12} /> Descargar {format}
        </button>
      </div>
    </div>
  );
}

// --- COMPONENTE DE VISTA EXPANDIDA (MODAL) ---
function ExpandedView({ item, onClose, evidenceImages }: { item: TransmediaItem; onClose: () => void; evidenceImages: string[] }) {
  // Seleccionamos una imagen aleatoria de las evidencias si el item no tiene una propia, para enriquecer visualmente
  const visualSrc = (item.imageUrl && item.imageUrl.trim() !== "") 
    ? item.imageUrl 
    : (evidenceImages.length > 0 ? evidenceImages[Math.floor(Math.random() * evidenceImages.length)] : "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029");
  
  const handleCopy = () => {
    navigator.clipboard.writeText(item.fullContent);
    toast.success("Contenido Copiado", { description: `El copy para ${item.tag} está en tu portapapeles.` });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0a0a0a] w-full max-w-5xl max-h-[90vh] rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col md:flex-row shadow-[0_0_50px_rgba(0,0,0,0.5)]"
      >
        {/* COLUMNA IZQUIERDA: VISUAL DE ALTO IMPACTO */}
        <div className="w-full md:w-2/5 relative min-h-[300px] md:min-h-full overflow-hidden bg-black">
           <img 
             src={visualSrc} 
             alt="Visual Context" 
             className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
           
           <div className="absolute inset-0 p-8 flex flex-col justify-end">
             <div className="mb-6">
                <span className="bg-primary text-black px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4 inline-block">
                  {item.tag}
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-white leading-tight uppercase tracking-tighter line-clamp-4">
                  {item.title}
                </h2>
             </div>
             
             {/* Date Check */}
             <div className="flex items-center gap-2 text-white/50 text-xs font-mono uppercase">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
               Estrategia Verificada • {new Date().toLocaleDateString()}
             </div>
           </div>
        </div>

        {/* COLUMNA DERECHA: CONTENIDO DE LECTURA */}
        <div className="w-full md:w-3/5 flex flex-col bg-[#0f0f0f]">
           {/* Header */}
           <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Quote size={14} className="text-white/60" />
                 </div>
                 <div>
                   <h3 className="text-white font-bold text-sm">Contenido Generado</h3>
                   <p className="text-white/30 text-[10px] uppercase tracking-widest">Listo para publicar</p>
                 </div>
              </div>
              
              <div className="flex items-center gap-2">
                 <button 
                  onClick={handleCopy}
                  className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors flex items-center gap-2"
                  title="Copiar texto"
                 >
                   <Copy size={18} />
                   <span className="text-xs font-bold hidden md:inline">Copiar</span>
                 </button>
                 <div className="w-px h-6 bg-white/10 mx-2" />
                 <button onClick={onClose} className="p-2 hover:bg-red-500/10 rounded-lg text-white/40 hover:text-red-400 transition-colors">
                    <X size={20} />
                 </button>
              </div>
           </div>

            {/* Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.02),transparent)]">
               <div className="max-w-3xl mx-auto space-y-6">
                  {item.fullContent.split('\n').map((line, idx) => {
                    const cleanLine = line.trim();
                    if (!cleanLine) return <div key={idx} className="h-4" />;
                    
                    // 1. TITULARES DE ACCESO (H1, H2, H3)
                    if (cleanLine.startsWith('# ')) {
                       return <h2 key={idx} className="text-4xl md:text-5xl font-black text-white mt-12 mb-8 tracking-tighter border-l-8 border-primary pl-6 leading-tight uppercase">{cleanLine.replace('# ', '')}</h2>;
                    }
                    if (cleanLine.startsWith('## ') || (/^[A-Z\s]+$/.test(cleanLine) && cleanLine.length > 10)) {
                       return (
                         <div key={idx} className="mt-10 mb-6 group">
                            <h3 className="text-2xl font-black text-white/90 tracking-tight flex items-center gap-3">
                               <span className="w-2 h-8 bg-primary/20 group-hover:bg-primary transition-colors rounded-full" />
                               {cleanLine.replace('## ', '')}
                            </h3>
                            <div className="h-px w-20 bg-primary/30 mt-2" />
                         </div>
                       );
                    }

                    // 2. CITAS Y TESTIMONIOS (OPINIONES/ENTREVISTAS)
                    if (cleanLine.startsWith('>')) {
                       return (
                         <div key={idx} className="my-10 p-8 bg-white/5 border border-white/10 rounded-3xl relative overflow-hidden group">
                            <Quote className="absolute -top-4 -left-4 w-20 h-20 text-white/5 -rotate-12" />
                            <p className="text-xl md:text-2xl font-bold italic text-white/90 leading-relaxed relative z-10">
                               "{cleanLine.replace('>', '').trim()}"
                            </p>
                            <div className="mt-4 flex items-center gap-2">
                               <div className="w-6 h-0.5 bg-primary" />
                               <span className="text-[10px] text-primary font-black uppercase tracking-[0.3em]">Testimonio Verificado</span>
                            </div>
                         </div>
                       );
                    }

                    // 3. DATOS DUROS / BULLETS ESTILIZADOS
                    if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ') || /^\d+\./.test(cleanLine)) {
                       // Si detectamos números o fechas, resaltamos
                       const hasNumbers = /\d+/.test(cleanLine);
                       return (
                         <div key={idx} className={cn(
                           "flex gap-4 p-4 rounded-xl border transition-all mb-2",
                           hasNumbers 
                            ? "bg-primary/5 border-primary/20 text-white" 
                            : "bg-white/5 border-white/5 text-white/80"
                         )}>
                            <div className="mt-1.5 shrink-0">
                               {hasNumbers ? <Zap size={14} className="text-primary" /> : <div className="w-1.5 h-1.5 rounded-full bg-white/20 mt-1" />}
                            </div>
                            <span className={cn("text-lg", hasNumbers ? "font-bold" : "font-light")}>
                               {cleanLine.replace(/^[-*]|\d+\./, '').trim()}
                            </span>
                         </div>
                       );
                    }

                    // 4. PARRAFO ESTÁNDAR (Con dropcap opcional en el primero)
                    return (
                      <p key={idx} className="text-white/60 text-lg md:text-xl leading-relaxed font-light mb-6 transition-colors hover:text-white/80">
                         {cleanLine}
                      </p>
                    );
                  })}
               </div>
            </div>

           {/* Footer */}
           <div className="p-6 border-t border-white/5 bg-black/20 text-center md:text-left">
              <div className="flex items-center justify-between opacity-50">
                 <div className="flex items-center gap-2">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Onda" className="w-6 h-6 rounded-full grayscale" alt="AI" />
                    <span className="text-xs font-mono">Generado por Onda Redacción IA v2.5</span>
                 </div>
                 <div className="text-[10px] uppercase tracking-widest hidden md:block">
                    Confidencialidad: Alta
                 </div>
              </div>
           </div>
        </div>
      </motion.div>
    </motion.div>
  );
}


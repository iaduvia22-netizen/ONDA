import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Fuente Inter para un look periodístico moderno
const fontBold = fetch(new URL('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff', import.meta.url)).then((res) => res.arrayBuffer());

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title') || 'ALERT: NOTICIA EN DESARROLLO';
    const tag = searchParams.get('tag') || 'URGENTE';
    const imageUrl = searchParams.get('image');
    
    // Si no hay imagen, usamos un fondo abstracto oscuro
    const bgImage = imageUrl ? `url(${imageUrl})` : 'radial-gradient(circle at 100% 0%, rgba(202,251,72,0.15) 0%, transparent 40%)';

    const fontData = await fontBold;

    // Colores de Onda Radio
    const PRIMARY_COLOR = '#CAFB48'; 
    const BG_COLOR = '#0a0a0a';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: BG_COLOR,
            backgroundImage: bgImage,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            padding: '60px',
            fontFamily: '"Inter"',
          }}
        >
          {/* Overlay oscuro para legibilidad si hay imagen de fondo */}
          {imageUrl && (
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)' }} />
          )}

          {/* Header con Logo y Tag */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', zIndex: 10 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {/* Simulamos el Logo SVG con CSS Shapes para velocidad en Edge */}
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: PRIMARY_COLOR, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <div style={{ width: '15px', height: '15px', borderRadius: '50%', backgroundColor: '#000' }}></div>
                </div>
                <span style={{ fontSize: 30, color: 'white', fontWeight: 900, letterSpacing: '-1px' }}>ONDA RADIO INTELLIGENCE</span>
             </div>
             <div style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                padding: '10px 30px', 
                borderRadius: '50px', 
                color: PRIMARY_COLOR, 
                fontSize: 24, 
                fontWeight: 800, 
                textTransform: 'uppercase',
                letterSpacing: '2px',
                border: `1px solid ${PRIMARY_COLOR}40`
             }}>
               {tag}
             </div>
          </div>

          {/* Contenido Principal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, justifyContent: 'center', zIndex: 10 }}>
            <div style={{ 
              fontSize: 74, 
              color: 'white', 
              lineHeight: 1, 
              fontWeight: 900, 
              textTransform: 'uppercase',
              letterSpacing: '-2px',
              textShadow: '0 0 40px rgba(0,0,0,0.5)',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              marginTop: '40px'
            }}>
              {title}
            </div>
            <div style={{ width: '150px', height: '8px', backgroundColor: PRIMARY_COLOR, borderRadius: '4px' }}></div>
          </div>

          {/* Footer de Marca */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 10 }}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 20 }}>Expediente Generado por IA</span>
                <span style={{ color: 'white', fontSize: 24, fontWeight: 700 }}>ondaradio.com</span>
             </div>
             
             {/* Simulación de Huella Digital / Código */}
             <div style={{ display: 'flex', gap: '4px', opacity: 0.3 }}>
                {[...Array(12)].map((_, i) => (
                   <div key={i} style={{ 
                      width: '6px', 
                      height: `${Math.random() * 40 + 20}px`, 
                      backgroundColor: 'white',
                      borderRadius: '2px'
                   }} />
                ))}
             </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Inter',
            data: fontData,
            style: 'normal',
            weight: 700,
          },
        ],
      },
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}

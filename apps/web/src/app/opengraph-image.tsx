import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const OpengraphImage = () =>
  new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          backgroundColor: '#4f46e5',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: -1 }}>educar-se-ia</div>
        <div style={{ fontSize: 32, color: '#e0e7ff', textAlign: 'center', maxWidth: 800 }}>
          Sua ementa vira um plano de estudos personalizado com IA
        </div>
      </div>
    ),
    { ...size },
  )

export default OpengraphImage

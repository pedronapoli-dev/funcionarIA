import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

const Icon = () =>
  new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 6,
          backgroundColor: '#4f46e5',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        e
      </div>
    ),
    { ...size },
  )

export default Icon

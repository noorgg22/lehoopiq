import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

export default function handler(req) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') || 'LeHoopIQ';
  const subtitle = searchParams.get('subtitle') || 'NBA Analytics Dashboard';

  return new ImageResponse(
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: '#0E0F12',
          padding: '80px',
          fontFamily: 'system-ui, sans-serif',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                width: '100%',
                height: 6,
                background: '#E5322D',
                position: 'absolute',
                top: 0,
                left: 0,
              },
            },
          },
          {
            type: 'div',
            props: {
              style: {
                fontSize: 72,
                fontWeight: 800,
                color: '#F2EFE8',
                letterSpacing: -2,
              },
              children: title,
            },
          },
          {
            type: 'div',
            props: {
              style: {
                fontSize: 28,
                color: '#A7A39A',
                marginTop: 16,
              },
              children: subtitle,
            },
          },
          {
            type: 'div',
            props: {
              style: {
                fontSize: 24,
                fontWeight: 700,
                color: '#F2EFE8',
                position: 'absolute',
                bottom: 60,
                left: 80,
              },
              children: 'LeHoopIQ',
            },
          },
          {
            type: 'div',
            props: {
              style: {
                fontSize: 18,
                color: '#A7A39A',
                position: 'absolute',
                bottom: 64,
                right: 80,
              },
              children: 'lehoopiq.vercel.app',
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
    }
  );
}

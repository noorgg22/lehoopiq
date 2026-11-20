export const config = { runtime: 'edge' };

export default function handler(req) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') || 'LeHoopIQ';
  const subtitle = searchParams.get('subtitle') || 'NBA Analytics Dashboard';

  const html = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="#0E0F12"/>
      <rect x="0" y="0" width="1200" height="6" fill="#E5322D"/>
      <text x="80" y="280" font-family="system-ui, sans-serif" font-size="72" font-weight="800" fill="#F2EFE8" letter-spacing="-2">${escapeXml(title)}</text>
      <text x="80" y="340" font-family="system-ui, sans-serif" font-size="28" fill="#A7A39A">${escapeXml(subtitle)}</text>
      <text x="80" y="560" font-family="system-ui, sans-serif" font-size="24" font-weight="700" fill="#F2EFE8">LeHoop<tspan fill="#E5322D">IQ</tspan></text>
      <text x="1120" y="560" font-family="system-ui, sans-serif" font-size="18" fill="#A7A39A" text-anchor="end">lehoopiq.vercel.app</text>
    </svg>
  `;

  return new Response(html, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

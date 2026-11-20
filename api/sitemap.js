const TEAMS = [
  'ATL','BOS','BKN','CHA','CHI','CLE','DAL','DEN','DET','GSW',
  'HOU','IND','LAC','LAL','MEM','MIA','MIL','MIN','NOP','NYK',
  'OKC','ORL','PHI','PHX','POR','SAC','SAS','TOR','UTA','WAS',
];

const PAGES = ['', 'standings', 'leaders', 'teams', 'shameless-meter'];

export default function handler(req, res) {
  const base = 'https://lehoopiq.vercel.app';
  const now = new Date().toISOString().split('T')[0];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const page of PAGES) {
    xml += `  <url><loc>${base}/${page}</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq></url>\n`;
  }

  for (const abbr of TEAMS) {
    xml += `  <url><loc>${base}/teams/${abbr.toLowerCase()}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq></url>\n`;
  }

  xml += '</urlset>';

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).send(xml);
}

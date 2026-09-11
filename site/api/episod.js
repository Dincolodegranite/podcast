// Meta server-side pentru /episod/:slug — servita DOAR crawlerelor sociale
// (rewrite-ul din vercel.json trimite aici doar user-agents de tip bot).
const SUPA = 'https://fgwsmrwhuzkvrixcgovk.supabase.co';
const KEY = 'sb_publishable_6uORl4ZKPYpCU_cdcAfudw_YOmcbnDQ';
const SITE = 'https://www.dincolodegranite.com';

function esc(s){
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function ytId(url){
  const m = String(url || '').match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : null;
}
function page(title, desc, img, url, extraLd){
  const ld = extraLd ? '<script type="application/ld+json">' + JSON.stringify(extraLd) + '</scr' + 'ipt>' : '';
  return '<!DOCTYPE html><html lang="ro"><head><meta charset="utf-8">' +
    '<title>' + esc(title) + '</title>' +
    '<meta name="description" content="' + esc(desc) + '">' +
    '<link rel="canonical" href="' + esc(url) + '">' +
    '<meta property="og:type" content="video.episode">' +
    '<meta property="og:title" content="' + esc(title) + '">' +
    '<meta property="og:description" content="' + esc(desc) + '">' +
    '<meta property="og:image" content="' + esc(img) + '">' +
    '<meta property="og:url" content="' + esc(url) + '">' +
    '<meta property="og:site_name" content="Dincolo de Granițe">' +
    '<meta property="og:locale" content="ro_RO">' +
    '<meta name="twitter:card" content="summary_large_image">' +
    '<meta name="twitter:title" content="' + esc(title) + '">' +
    '<meta name="twitter:description" content="' + esc(desc) + '">' +
    '<meta name="twitter:image" content="' + esc(img) + '">' + ld +
    '</head><body><h1>' + esc(title) + '</h1><p>' + esc(desc) + '</p>' +
    '<p><a href="' + esc(url) + '">' + esc(url) + '</a></p></body></html>';
}

module.exports = async (req, res) => {
  const slug = String((req.query && req.query.slug) || '');
  const m = slug.match(/^(\d+)/);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
  const fallback = page(
    'Episod — Dincolo de Granițe',
    'Un episod din Dincolo de Granițe — conversații cu românii din întreaga lume.',
    SITE + '/assets/og-banner.jpg',
    SITE + '/episoade'
  );
  if(!m){ res.status(404).send(fallback); return; }
  try {
    const r = await fetch(SUPA + '/rest/v1/episodes?select=*&published=eq.true&episode_number=eq.' + m[1], {
      headers: { apikey: KEY }
    });
    const rows = r.ok ? await r.json() : [];
    const ep = rows && rows[0];
    if(!ep){ res.status(404).send(fallback); return; }
    const title = ep.title + ' — Dincolo de Granițe';
    const desc = (ep.description || 'Un episod din Dincolo de Granițe.').slice(0, 300);
    const yid = ytId(ep.youtube_url);
    const img = ep.cover_url || (yid ? 'https://i.ytimg.com/vi/' + yid + '/maxresdefault.jpg' : SITE + '/assets/og-banner.jpg');
    const cleanSlug = String(ep.title || '').toLowerCase()
      .replace(/ă/g,'a').replace(/â/g,'a').replace(/î/g,'i').replace(/[șş]/g,'s').replace(/[țţ]/g,'t')
      .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0, 60);
    const url = SITE + '/episod/' + ep.episode_number + (cleanSlug ? '-' + cleanSlug : '');
    const ld = {
      '@context':'https://schema.org', '@type':'PodcastEpisode',
      url, name: ep.title, episodeNumber: ep.episode_number,
      description: ep.description || undefined, image: img,
      partOfSeries: { '@type':'PodcastSeries', name:'Dincolo de Granițe', url: SITE + '/' },
      author: { '@type':'Person', name:'Peter Baghiu' }
    };
    if(ep.published_at) ld.datePublished = ep.published_at;
    if(yid) ld.associatedMedia = { '@type':'VideoObject', embedUrl:'https://www.youtube.com/embed/' + yid, name: ep.title, thumbnailUrl: img };
    res.status(200).send(page(title, desc, img, url, ld));
  } catch (e) {
    res.status(200).send(fallback);
  }
};

/* Dincolo de Granițe — hydrates social links sitewide from the
   site_settings table, so Peter can edit them from /admin without code.
   Skips episode links (data-ep-link) so real episode URLs are never
   overwritten with the channel URL. */
(function(){
'use strict';
var SUPA_URL = 'https://fgwsmrwhuzkvrixcgovk.supabase.co';
var SUPA_KEY = 'sb_publishable_6uORl4ZKPYpCU_cdcAfudw_YOmcbnDQ';
var PAIRS = [
  ['youtube.com',   'social_youtube'],
  ['instagram.com', 'social_instagram'],
  ['tiktok.com',    'social_tiktok'],
  ['facebook.com',  'social_facebook']
];

function apply(map){
  /* platform buttons hidden until Peter fills their URL in /admin */
  document.querySelectorAll('[data-social]').forEach(function(el){
    var v = map[el.getAttribute('data-social')];
    if(v && /^https?:\/\//.test(v)){
      el.setAttribute('href', v);
      el.style.display = '';
    }
  });
  /* plain-text fields Peter can edit from /admin (e.g. the DESPRE card spec sheet) */
  document.querySelectorAll('[data-set]').forEach(function(el){
    var v = map[el.getAttribute('data-set')];
    if(v) el.textContent = v;
  });
  /* multi-paragraph blocks (e.g. /despre bio, mission) — blank line = new paragraph */
  document.querySelectorAll('[data-set-html]').forEach(function(el){
    var v = map[el.getAttribute('data-set-html')];
    if(!v) return;
    el.innerHTML = '';
    v.split(/\n\s*\n/).forEach(function(para){
      para = para.trim();
      if(!para) return;
      var p = document.createElement('p');
      p.textContent = para;
      el.appendChild(p);
    });
    var ps = el.querySelectorAll('p');
    if(ps.length) ps[ps.length - 1].style.marginBottom = '0';
  });
  renderClips(map);
}

/* ── Short clips ────────────────────────────────────────────────
   Peter pastes up to four clip URLs in /admin. YouTube links get a
   free thumbnail; other platforms fall back to a labelled card.
   The whole section stays hidden while no clip is set.            */
function platformOf(url){
  var h = String(url || '');
  if(/youtube\.com|youtu\.be/.test(h)) return 'YOUTUBE';
  if(/tiktok\.com/.test(h)) return 'TIKTOK';
  if(/instagram\.com/.test(h)) return 'INSTAGRAM';
  if(/facebook\.com|fb\.watch/.test(h)) return 'FACEBOOK';
  return 'CLIP';
}
function youtubeThumb(url){
  var m = String(url || '').match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/);
  return m ? 'https://i.ytimg.com/vi/' + m[1] + '/hqdefault.jpg' : null;
}
function renderClips(map){
  var section = document.querySelector('[data-clips-section]');
  var grid = document.querySelector('[data-clips-grid]');
  if(!section || !grid) return;

  var urls = ['clip_1','clip_2','clip_3','clip_4']
    .map(function(k){ return map[k]; })
    .filter(function(v){ return v && /^https?:\/\//.test(v); });

  if(!urls.length) return;           /* nothing to show — leave it hidden */
  if(grid.childElementCount) return; /* already rendered on an earlier pass */

  urls.forEach(function(url){
    var a = document.createElement('a');
    a.className = 'clip';
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label', 'Vezi clipul pe ' + platformOf(url));

    var thumb = youtubeThumb(url);
    if(thumb){
      var img = document.createElement('img');
      img.src = thumb; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
      a.appendChild(img);
    }

    var shade = document.createElement('span');
    shade.className = 'clip-shade';
    var play = document.createElement('span');
    play.className = 'clip-play';
    play.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"></path></svg>';
    var tag = document.createElement('span');
    tag.className = 'clip-tag';
    tag.textContent = platformOf(url);

    a.appendChild(shade); a.appendChild(play); a.appendChild(tag);
    grid.appendChild(a);
  });

  section.style.display = '';
  document.querySelectorAll('a[href]').forEach(function(a){
    if(a.hasAttribute('data-ep-link') || a.hasAttribute('data-social')) return;
    var h = a.getAttribute('href') || '';
    for(var i = 0; i < PAIRS.length; i++){
      if(h.indexOf(PAIRS[i][0]) !== -1){
        var v = map[PAIRS[i][1]];
        if(v && /^https?:\/\//.test(v)){
          var nu = v;
          if(PAIRS[i][0] === 'youtube.com' && h.indexOf('sub_confirmation=1') !== -1){
            nu += (nu.indexOf('?') === -1 ? '?' : '&') + 'sub_confirmation=1';
          }
          a.setAttribute('href', nu);
        }
        return;
      }
    }
  });
}

fetch(SUPA_URL + '/rest/v1/site_settings?select=key,value', { headers: { 'apikey': SUPA_KEY } })
  .then(function(r){ return r.ok ? r.json() : []; })
  .then(function(rows){
    var map = {};
    (rows || []).forEach(function(r){ map[r.key] = r.value; });
    if(!Object.keys(map).length) return;
    apply(map);
    /* the homepage renders client-side — re-apply after the runtime mounts */
    setTimeout(function(){ apply(map); }, 1500);
    setTimeout(function(){ apply(map); }, 3200);
  })
  .catch(function(){});
})();

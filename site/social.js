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

/* ── Theme (accent colour, fonts, heading weight) ───────────────
   Peter can override these from /admin → Setări → Aspect. Leaving
   a field empty keeps the hand-tuned default (set in :root by
   pages.css / each page's own <style>), so this whole block is a
   no-op until he actually changes something.                     */
function hexToHsl(hex){
  var m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if(!m) return null;
  var n = parseInt(m[1], 16);
  var r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b), h, s, l = (max + min) / 2;
  if(max === min){ h = s = 0; }
  else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if(max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if(max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}
function hslToHex(h, s, l){
  h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(100, s)) / 100; l = Math.max(0, Math.min(100, l)) / 100;
  var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m2 = l - c / 2, r, g, b;
  if(h < 60){ r = c; g = x; b = 0; } else if(h < 120){ r = x; g = c; b = 0; } else if(h < 180){ r = 0; g = c; b = x; }
  else if(h < 240){ r = 0; g = x; b = c; } else if(h < 300){ r = x; g = 0; b = c; } else { r = c; g = 0; b = x; }
  var toHex = function(v){ var s2 = Math.round((v + m2) * 255).toString(16); return s2.length === 1 ? '0' + s2 : s2; };
  return '#' + toHex(r) + toHex(g) + toHex(b);
}
function shade(hex, dl, ds){
  var hsl = hexToHsl(hex);
  if(!hsl) return null;
  return hslToHex(hsl[0], hsl[1] + (ds || 0), hsl[2] + (dl || 0));
}
var loadedFonts = {};
function loadGoogleFont(name){
  if(!name || loadedFonts[name]) return;
  loadedFonts[name] = true;
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(name).replace(/%20/g, '+') + ':ital,wght@0,300;0,400;0,500;0,600;0,700;0,900;1,400;1,500;1,600&display=swap';
  document.head.appendChild(link);
}
function applyTheme(map){
  var root = document.documentElement.style;
  var accent = (map.theme_accent || '').trim();
  if(/^#[0-9a-f]{6}$/i.test(accent)){
    root.setProperty('--accent', accent);
    root.setProperty('--accent-light', shade(accent, 12, 14) || accent);
    root.setProperty('--accent-dark', shade(accent, -5, -9) || accent);
  }
  var headFont = (map.theme_heading_font || '').trim();
  var bodyFont = (map.theme_body_font || '').trim();
  if(headFont){ root.setProperty('--font-head', "'" + headFont + "'"); loadGoogleFont(headFont); }
  if(bodyFont){ root.setProperty('--font-body', "'" + bodyFont + "'"); loadGoogleFont(bodyFont); }
  var weight = parseInt(map.theme_head_weight, 10);
  if(weight >= 100 && weight <= 900) root.setProperty('--head-weight', String(weight));
}

/* ── Gold last word ─────────────────────────────────────────────
   Any element with data-gold-last gets its final word wrapped in
   span.gold-last (the shimmer gradient). Works on the last TEXT
   node only, so <br> structures survive, and it is idempotent —
   safe to re-run after admin hydration or a language switch.     */
function goldLast(){
  document.querySelectorAll('[data-gold-last]').forEach(function(el){
    var nodes = el.childNodes, i, n;
    for(i = nodes.length - 1; i >= 0; i--){
      n = nodes[i];
      if(n.nodeType === 3){
        if(!/\S/.test(n.nodeValue)) continue;
        var m = n.nodeValue.match(/^([\s\S]*?)(\S+)(\s*)$/);
        if(!m) return;
        var sp = document.createElement('span');
        sp.className = 'gold-last';
        sp.textContent = m[2];
        n.nodeValue = m[1];
        if(n.nextSibling) el.insertBefore(sp, n.nextSibling);
        else el.appendChild(sp);
        return;
      }
      if(n.nodeType === 1){
        if(n.classList && n.classList.contains('gold-last')) return;
        if(n.tagName === 'BR') continue;
        return; /* ends in some other element — leave it alone */
      }
    }
  });
}
window.__goldLast = goldLast;
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', goldLast);
} else {
  goldLast();
}

/* ── Newsletter sitewide ────────────────────────────────────────
   Same subscribers table as the homepage capsule. The hidden
   "website" field is a honeypot: humans never see it, bots fill
   it, and filled submissions are silently dropped.               */
function initNewsletterForms(){
  document.querySelectorAll('[data-nl-form]').forEach(function(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var hp = form.querySelector('input[name="website"]');
      var input = form.querySelector('input[type="email"]');
      var msg = form.querySelector('[data-nl-msg]');
      var btn = form.querySelector('button[type="submit"]');
      function show(t){ if(msg){ msg.textContent = t; msg.style.opacity = '1'; } }
      if(hp && hp.value){ input.value = ''; show('Ești pe listă. Îți trimitem un email imediat ce primul episod este publicat.'); return; }
      var email = (input.value || '').trim();
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ show('Introdu o adresă de email validă.'); return; }
      if(btn) btn.disabled = true;
      fetch(SUPA_URL + '/rest/v1/subscribers', {
        method: 'POST',
        headers: { 'apikey': SUPA_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ email: email })
      }).then(function(r){
        if(btn) btn.disabled = false;
        if(r.status === 409){ show('Ești deja pe listă. Te anunțăm imediat ce primul episod este publicat.'); return; }
        if(!r.ok) throw new Error('HTTP ' + r.status);
        input.value = '';
        show('Te-ai înscris cu succes. Te anunțăm imediat ce primul episod este publicat.');
      }).catch(function(){
        if(btn) btn.disabled = false;
        show('A apărut o eroare. Încearcă din nou.');
      });
    });
  });
}
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', initNewsletterForms);
} else {
  initNewsletterForms();
}

function apply(map){
  applyTheme(map);
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
  /* images Peter can swap from /admin (e.g. his portrait on /despre) */
  document.querySelectorAll('[data-set-img]').forEach(function(el){
    var v = map[el.getAttribute('data-set-img')];
    if(v && (/^https?:\/\//.test(v) || /^assets\//.test(v))) el.setAttribute('src', v);
  });
  /* placeholders that stop making sense once their setting is filled in */
  document.querySelectorAll('[data-hide-if]').forEach(function(el){
    if(map[el.getAttribute('data-hide-if')]) el.style.display = 'none';
  });
  /* sections that only appear once their setting is filled in (e.g. sponsor) */
  document.querySelectorAll('[data-show-if]').forEach(function(el){
    if(map[el.getAttribute('data-show-if')]) el.style.display = '';
  });
  /* links Peter can point wherever he wants from /admin */
  document.querySelectorAll('[data-set-href]').forEach(function(el){
    var v = map[el.getAttribute('data-set-href')];
    if(v && /^https?:\/\//.test(v)) el.setAttribute('href', v);
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
  goldLast(); /* hydration overwrites textContent, so re-wrap the last words */
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

/* ── bara de progres la scroll (toate paginile; homepage-ul are deja una proprie) ── */
(function(){
  function init(){
    if(document.querySelector('[data-scroll-bar]')) return;
    var bar = document.createElement('div');
    bar.setAttribute('data-scroll-bar', '');
    bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;width:0%;background:linear-gradient(90deg,#c9a25a,#e3c07d);z-index:100;transition:width .1s linear;pointer-events:none';
    document.body.appendChild(bar);
    var ticking = false;
    function upd(){
      ticking = false;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0) + '%';
    }
    window.addEventListener('scroll', function(){ if(!ticking){ ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    window.addEventListener('resize', upd, { passive: true });
    upd();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* ── motorul style-hover: aplica stilurile din atributul style-hover la mouseenter ── */
(function(){
  function init(){
    var els = document.querySelectorAll('[style-hover]');
    for(var k = 0; k < els.length; k++){
      (function(el){
        var hoverCss = el.getAttribute('style-hover');
        if(!hoverCss) return;
        var base = null;
        el.addEventListener('mouseenter', function(){
          base = el.getAttribute('style') || '';
          el.setAttribute('style', base + ';' + hoverCss);
        });
        el.addEventListener('mouseleave', function(){
          if(base !== null){ el.setAttribute('style', base); base = null; }
        });
      })(els[k]);
    }
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* ── sagetile CTA devin vii: aluneca spre dreapta la hover pe buton ── */
(function(){
  function wrap(){
    var els = document.querySelectorAll('a, button');
    for(var k = 0; k < els.length; k++){
      var el = els[k];
      var last = el.lastChild;
      if(last && last.nodeType === 3 && /→\s*$/.test(last.nodeValue)){
        last.nodeValue = last.nodeValue.replace(/\s*→\s*$/, '');
        var sp = document.createElement('span');
        sp.className = 'cta-arr';
        sp.textContent = '→';
        sp.setAttribute('aria-hidden', 'true');
        sp.style.cssText = 'display:inline-block;margin-left:8px;transform:translateY(-1px);transition:transform .35s cubic-bezier(.2,.8,.2,1)';
        el.appendChild(sp);
        el.setAttribute('data-arr', '1');
      }
    }
  }
  function init(){ [80, 400, 900, 1800, 3200].forEach(function(t){ setTimeout(wrap, t); }); window.addEventListener('load', function(){ setTimeout(wrap, 200); }); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

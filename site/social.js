/* Dincolo de Granițe — hydrates social links sitewide from the
   site_settings table, so Peter can edit them from /admin without code.
   Skips episode links (data-ep-link) so real episode URLs are never
   overwritten with the channel URL. */

/* ── i18n: motorul bilingv al paginilor-satelit ─────────────────
   Homepage-ul are propriul motor inline (window.__dgDict) — pe el
   blocul de mai jos nu face NIMIC. Pe sateliți rulează doar când
   pagina a definit window.DG_I18N = { en: { cheie: "English" } }
   într-un <script> inline pus chiar înaintea tag-ului
   <script defer src="/social.js">. Româna este DOM-ul (implicită);
   engleza vine din dicționarul comun de mai jos + dicționarul
   paginii (pagina câștigă la chei egale).
   Atribute înțelese (un element poate purta mai multe):
     data-i18n="k"          → textContent
     data-i18n-html="k"     → innerHTML (doar unde există <b>/<a>/<br>)
     data-i18n-ph="k"       → placeholder
     data-i18n-aria="k"     → aria-label
     data-i18n-alt="k"      → alt
     data-i18n-title="k"    → title
     data-i18n-value="k"    → value
     data-i18n-content="k"  → content (meta)
   Originalele românești sunt capturate O SINGURĂ DATĂ în el.__dgRo;
   applyLang('en') scrie engleza (cheie lipsă → rămâne româna, cheia
   intră în window.__dgI18nMissing), applyLang('ro') restaurează.
   Textele hidratate din /admin (data-set / data-set-html) primesc în
   engleză traducerea STATICĂ din dicționar: refresh(map), apelat la
   finalul lui apply(map), le recaptează româna proaspăt scrisă și
   rescrie engleza dacă limba curentă e 'en'.
   Expune: window.__dgT(key, ro), window.__dgApplyLang(lang),
   window.__dgLang, window.__dgI18nRefresh(map); evenimentul
   document 'dg:lang' ({detail:{lang}}) după fiecare comutare.     */
var DG_I18N_COMMON = { en: {
  nav_acasa: "HOME", nav_despre: "ABOUT", nav_episoade: "EPISODES", nav_oameni: "PEOPLE",
  nav_invitati: "BECOME A GUEST", nav_mediakit: "PARTNERSHIPS", nav_contact: "CONTACT",
  foot_mission_html: "We invite them for what they <b>know</b>. We listen for who they <b>are</b>.",
  foot_sub: "In-depth, well-prepared interviews with Romanians from diverse fields, in Romania or anywhere in the world.",
  foot_cta_yt: "SUBSCRIBE ON YOUTUBE", foot_cta_guest: "PROPOSE YOURSELF AS A GUEST",
  foot_l_acasa: "Home", foot_l_despre: "About", foot_l_episoade: "Episodes", foot_l_oameni: "People",
  foot_l_invitati: "Become a guest", foot_l_parteneriate: "Partnerships", foot_l_contact: "Contact",
  foot_l_termeni: "Terms", foot_l_privacy: "Privacy",
  foot_cr: "© 2026 Dincolo de Granițe. All rights reserved.",
  foot_credit_html: "Created and hosted by <a href=\"/despre\">Peter Baghiu</a>.",
  nl_ok: "Almost there — confirm your address. We've sent you a confirmation email.",
  nl_dup: "You're already on the list. If you haven't confirmed yet, we've re-sent the confirmation email.",
  nl_err: "Something went wrong. Please try again.",
  nl_invalid: "Please enter a valid email address.",
  lang_to_ro: "Schimbă în română", lang_to_en: "Switch to English"
} };
(function(){
  'use strict';
  var ATTRS = [
    ['data-i18n', 'text'], ['data-i18n-html', 'html'], ['data-i18n-ph', 'ph'], ['data-i18n-aria', 'aria'],
    ['data-i18n-alt', 'alt'], ['data-i18n-title', 'title'], ['data-i18n-value', 'value'], ['data-i18n-content', 'content']
  ];
  var ATTR_NAME = { ph: 'placeholder', aria: 'aria-label', alt: 'alt', title: 'title', value: 'value', content: 'content' };
  var SEL = ATTRS.map(function(a){ return '[' + a[0] + ']'; }).join(',');
  var hasOwn = Object.prototype.hasOwnProperty;
  var lang = 'ro', roTitle = null, roDesc = null;
  var missing = window.__dgI18nMissing = window.__dgI18nMissing || [];

  /* activ doar pe sateliți: pagina a definit DG_I18N și NU există motorul homepage-ului */
  function active(){ return !!(window.DG_I18N && !window.__dgDict); }
  function dict(){
    var out = {}, k, c = DG_I18N_COMMON.en || {}, p = (window.DG_I18N && window.DG_I18N.en) || {};
    for(k in c) if(hasOwn.call(c, k)) out[k] = c[k];
    for(k in p) if(hasOwn.call(p, k)) out[k] = p[k];
    return out;
  }
  function lookup(d, key){
    if(hasOwn.call(d, key) && d[key] != null) return String(d[key]);
    if(missing.indexOf(key) === -1) missing.push(key);
    return null;
  }
  function hasI18n(el){
    for(var i = 0; i < ATTRS.length; i++) if(el.hasAttribute(ATTRS[i][0])) return true;
    return false;
  }
  function capture(el){
    el.__dgRo = {
      text: el.textContent, html: el.innerHTML,
      ph: el.getAttribute('placeholder'), aria: el.getAttribute('aria-label'), alt: el.getAttribute('alt'),
      title: el.getAttribute('title'), value: el.getAttribute('value'), content: el.getAttribute('content')
    };
  }
  function setAttr(el, name, v){
    if(v == null) el.removeAttribute(name); else el.setAttribute(name, v);
    if(name === 'value' && /^(INPUT|BUTTON|OPTION|TEXTAREA)$/.test(el.tagName)) el.value = (v == null ? '' : v);
  }
  function applyEl(el, d, to){
    if(!el.__dgRo) capture(el);
    var ro = el.__dgRo;
    for(var i = 0; i < ATTRS.length; i++){
      var key = el.getAttribute(ATTRS[i][0]);
      if(key == null) continue;
      var kind = ATTRS[i][1], v;
      /* toleranță la tiparul homepage-ului (data-i18n="k" data-i18n-html): markup-ul
         inline se scrie prin innerHTML cu cheia din data-i18n, nu prin textContent */
      if(kind === 'text' && el.hasAttribute('data-i18n-html')) continue;
      if(kind === 'html' && key === '') key = el.getAttribute('data-i18n') || '';
      if(to === 'en'){
        v = lookup(d, key);
        if(v === null) continue; /* cheie lipsă → rămâne româna */
      } else {
        v = ro[kind];
      }
      if(kind === 'text'){ if(el.textContent !== v) el.textContent = v; }
      else if(kind === 'html'){ if(el.innerHTML !== v) el.innerHTML = v; }
      else setAttr(el, ATTR_NAME[kind], v);
    }
  }
  function applyLang(to){
    if(!active()) return;
    to = (to === 'en') ? 'en' : 'ro';
    var d = dict();
    var els = document.querySelectorAll(SEL);
    for(var i = 0; i < els.length; i++) applyEl(els[i], d, to);
    /* titlul și descrierea paginii — și când pagina n-a pus atributele pe <title>/<meta> */
    if(!document.querySelector('title[data-i18n]')){
      if(roTitle == null) roTitle = document.title;
      if(to === 'en'){ if(d.page_title) document.title = String(d.page_title); }
      else document.title = roTitle;
    }
    var meta = document.querySelector('meta[name="description"]');
    if(meta && !meta.hasAttribute('data-i18n-content')){
      if(roDesc == null) roDesc = meta.getAttribute('content');
      if(to === 'en'){ if(d.page_desc) meta.setAttribute('content', String(d.page_desc)); }
      else setAttr(meta, 'content', roDesc);
    }
    lang = to;
    window.__dgLang = to;
    document.documentElement.setAttribute('lang', to);
    try{ localStorage.setItem('dg_lang', to); }catch(e){}
    if(window.__goldLast) window.__goldLast(); /* rescrierea textelor a distrus span-urile gold-last */
    try{ document.dispatchEvent(new CustomEvent('dg:lang', { detail: { lang: to } })); }catch(e){}
  }
  /* după hidratarea din /admin: recaptează româna scrisă de apply(map) pe elementele
     data-set / data-set-html care poartă și data-i18n*, apoi rescrie engleza dacă e cazul.
     map (opțional) limitează la cheile pe care hidratarea chiar le-a scris.               */
  function refresh(map){
    if(!active() || !window.__dgI18nInit) return;
    var d = dict();
    var els = document.querySelectorAll('[data-set],[data-set-html]');
    for(var i = 0; i < els.length; i++){
      var el = els[i];
      if(!hasI18n(el)) continue;
      var key = el.getAttribute('data-set') || el.getAttribute('data-set-html');
      if(map && !map[key]) continue;
      if(!el.__dgRo) capture(el);
      el.__dgRo.text = el.textContent;
      el.__dgRo.html = el.innerHTML;
      if(lang === 'en') applyEl(el, d, 'en');
    }
  }
  function init(){
    if(window.__dgI18nInit || !active()) return;
    window.__dgI18nInit = true;
    var els = document.querySelectorAll(SEL);
    for(var i = 0; i < els.length; i++) if(!els[i].__dgRo) capture(els[i]);
    var want = 'ro';
    try{ want = localStorage.getItem('dg_lang') || 'ro'; }catch(e){}
    try{
      var q = new URLSearchParams(window.location.search).get('lang');
      if(q === 'en' || q === 'ro') want = q;
    }catch(e){}
    applyLang(want);
    document.addEventListener('click', function(e){
      var btn = (e.target && e.target.closest) ? e.target.closest('[data-lang-btn]') : null;
      if(!btn) return;
      applyLang(btn.getAttribute('data-lang-btn'));
    });
  }
  window.__dgT = function(key, ro){
    if(window.__dgLang !== 'en') return ro;
    var d = dict();
    return (hasOwn.call(d, key) && d[key] != null) ? String(d[key]) : ro;
  };
  window.__dgApplyLang = applyLang;
  window.__dgI18nRefresh = refresh;
  /* social.js e defer → readyState e deja 'interactive' aici: aplicăm imediat, ca româna să nu pâlpâie */
  if(document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();

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
   it, and filled submissions are silently dropped.
   After the insert (and on 409 = already listed) we ask the
   announce-episode function to (re)send the double-opt-in email —
   same call the homepage capsule makes, fire-and-forget.          */
function sendConfirm(email){
  fetch('https://fgwsmrwhuzkvrixcgovk.supabase.co/functions/v1/announce-episode', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ action:'send_confirm', email: email }) }).catch(function(){});
}
function initNewsletterForms(){
  document.querySelectorAll('[data-nl-form]').forEach(function(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var hp = form.querySelector('input[name="website"]');
      var input = form.querySelector('input[type="email"]');
      var msg = form.querySelector('[data-nl-msg]');
      var btn = form.querySelector('button[type="submit"]');
      function show(t){ if(msg){ msg.textContent = t; msg.style.opacity = '1'; } }
      /* mesajele trec prin motorul i18n la momentul afișării (engleză doar când limba curentă e 'en') */
      function T(k, ro){ return window.__dgT ? window.__dgT(k, ro) : ro; }
      if(hp && hp.value){ input.value = ''; show(T('nl_ok', 'Aproape gata — confirmă-ți adresa. Ți-am trimis un email de confirmare.')); return; }
      var email = (input.value || '').trim();
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ show(T('nl_invalid', 'Introdu o adresă de email validă.')); return; }
      if(btn) btn.disabled = true;
      fetch(SUPA_URL + '/rest/v1/subscribers', {
        method: 'POST',
        headers: { 'apikey': SUPA_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ email: email })
      }).then(function(r){
        if(btn) btn.disabled = false;
        if(r.status === 409){
          show(T('nl_dup', 'Ești deja pe listă. Dacă nu ți-ai confirmat încă adresa, ți-am retrimis emailul de confirmare.'));
          sendConfirm(email);
          input.value = '';
          return;
        }
        if(!r.ok) throw new Error('HTTP ' + r.status);
        input.value = '';
        show(T('nl_ok', 'Aproape gata — confirmă-ți adresa. Ți-am trimis un email de confirmare.'));
        sendConfirm(email);
      }).catch(function(){
        if(btn) btn.disabled = false;
        show(T('nl_err', 'A apărut o eroare. Încearcă din nou.'));
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
      el.style.display = 'inline-flex';
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
    if(v && (/^https?:\/\//.test(v) || /^\/?assets\//.test(v))){
      el.removeAttribute('srcset');
      var pic = el.closest && el.closest('picture');
      if(pic){ pic.querySelectorAll('source').forEach(function(sn){ sn.remove(); }); }
      el.setAttribute('src', v);
    }
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
  /* rescrierea linkurilor sociale hardcodate — ruleaza pe TOATE paginile,
     nu doar cand exista clipuri (era blocata in renderClips de early-return-uri) */
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
  renderClips(map);
  /* i18n: hidratarea a scris româna peste elementele data-set/data-set-html — motorul
     le recaptează originalul și rescrie engleza dacă limba curentă e 'en' (înainte de
     re-ambalarea gold-last, ca originalul capturat să fie curat, fără span-uri) */
  if(window.__dgI18nRefresh) window.__dgI18nRefresh(map);
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

/* ── valurile aurii din footer (acelasi desen pe toate paginile) ── */
(function(){
  var wraps = document.querySelectorAll('.pfoot-wave');
  if(!wraps.length) return;
  var H1 = [], H2 = [], N = 42;
  for(var j = 0; j < N; j++){
    /* profil de voce: purtatoare rapida modulata de doua anvelope lente — rafale si respiro, ca o inregistrare radio */
    var carrier = Math.abs(Math.sin(j * 0.9 + 0.4));
    var env = 0.35 + 0.65 * Math.abs(Math.sin(j * 0.21 + 1.1) * Math.sin(j * 0.47 + 2.6));
    var v = Math.min(1, carrier * env + 0.08);
    H1.push(6 + Math.round(38 * v));
    H2.push(3 + Math.round(15 * v));
  }
  function row(cls, hs){
    var r = document.createElement('div');
    r.className = cls;
    for(var i = 0; i < hs.length; i++){
      var sp = document.createElement('span');
      sp.style.height = hs[i] + 'px';
      sp.style.animationDelay = (i * 0.045).toFixed(3) + 's';
      r.appendChild(sp);
    }
    return r;
  }
  for(var k = 0; k < wraps.length; k++){
    if(wraps[k].children.length) continue;
    wraps[k].appendChild(row('pfoot-wave-in', H1));
    wraps[k].appendChild(row('pfoot-wave-re', H2));
  }
})();

/* ── sagetile CTA devin vii: aluneca spre dreapta la hover pe buton ── */
(function(){
  function wrap(){
    var els = document.querySelectorAll('a, button');
    for(var k = 0; k < els.length; k++){
      var el = els[k];
      var last = el.lastChild;
      if(last && last.nodeType === 3 && /→\s*$/.test(last.nodeValue)){
        last.nodeValue = last.nodeValue.replace(/→\s*$/, '');
        var sp = document.createElement('span');
        sp.className = 'cta-arr';
        sp.textContent = '→';
        sp.setAttribute('aria-hidden', 'true');
        /* transform-ul inline ramane doar pentru alinierea optica (si tine blocata vechea
           alunecare pe transform din CSS-ul paginilor); alunecarea la hover se face pe
           proprietatea translate, din <style id="dg-micro"> — vezi injectMicro()      */
        sp.style.cssText = 'display:inline-block;transform:translateY(-1px)';
        el.appendChild(sp);
        el.setAttribute('data-arr', '1');
      }
    }
  }
  /* un singur <style id="dg-micro"> (idempotent): sageata aluneca 4px spre dreapta pe
     proprietatea translate cand a/button-ul parinte (marcat data-arr) e in hover;
     fara tranzitie la prefers-reduced-motion                                         */
  function injectMicro(){
    if(document.getElementById('dg-micro')) return;
    var st = document.createElement('style');
    st.id = 'dg-micro';
    st.textContent =
      '.cta-arr{transition:translate .3s cubic-bezier(.2,.8,.2,1)}' +
      'a[data-arr]:hover>.cta-arr,button[data-arr]:hover>.cta-arr{translate:4px 0}' +
      '@media (prefers-reduced-motion:reduce){.cta-arr{transition:none}}';
    (document.head || document.documentElement).appendChild(st);
  }
  function init(){
    injectMicro();
    wrap();
    /* i18n rescrie textele dupa incarcare si distruge span-urile: re-ambalam
       inainte de urmatorul paint, ca butonul sa nu-si schimbe latimea vizibil */
    var moT = null;
    var mo = new MutationObserver(function(){
      if(moT) clearTimeout(moT);
      moT = setTimeout(function(){ moT = null; wrap(); }, 150);
    });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
    window.addEventListener('load', function(){ setTimeout(wrap, 200); });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* ── nav-ul se strange la scroll: clasa is-scrolled pe #top (acasa) si pe .pnav (sateliti) ──
   Toggle cand scrollY > 40, listener pasiv + requestAnimationFrame, starea initiala
   aplicata la incarcare. CSS-ul efectiv (padding vertical mai mic, logo ~84%) sta in
   fiecare pagina; social.js doar comuta clasa.                                        */
(function(){
  function init(){
    if(window.__dgNavShrinkInit) return;
    window.__dgNavShrinkInit = true;
    var els = [];
    var top = document.getElementById('top');
    if(top) els.push(top);
    var navs = document.querySelectorAll('.pnav');
    for(var i = 0; i < navs.length; i++) els.push(navs[i]);
    if(!els.length) return;
    var ticking = false, state = null;
    function upd(){
      ticking = false;
      var s = (window.scrollY || window.pageYOffset || 0) > 40;
      if(s === state) return;
      state = s;
      for(var k = 0; k < els.length; k++) els[k].classList.toggle('is-scrolled', s);
    }
    function onScroll(){ if(!ticking){ ticking = true; requestAnimationFrame(upd); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('load', upd);
    window.addEventListener('pageshow', upd);
    upd();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* ── butoane magnetice: CTA-urile urmaresc usor cursorul ──
   Doar cu pointer fin si fara prefers-reduced-motion. Foloseste EXCLUSIV proprietatea
   CSS translate (niciodata transform), offset = distanta fata de centru x .18, limitat
   la ±10px, revine elastic la iesire. Delegare la nivel de document, ca elementele
   hidratate mai tarziu (episoade, i18n) sa fie acoperite fara re-scanare. Tranzitia
   pe translate se ADAUGA la tranzitia existenta (inline sau din foaia de stil).      */
(function(){
  var SEL = '.hero-btn,.sec-cta,.btn,.pfcta-gold,.pfcta-line,[data-magnetic],.nl-btn,.nlx-btn';
  var EASE = 'translate .25s cubic-bezier(.2,.8,.2,1)';
  var MAX = 10, K = 0.18;
  function init(){
    if(window.__dgMagnetInit) return;
    window.__dgMagnetInit = true;
    if(!window.matchMedia || !('translate' in document.documentElement.style)) return;
    var fine = window.matchMedia('(pointer:fine)');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var active = null, lastX = 0, lastY = 0, ticking = false;
    function enabled(){ return fine.matches && !reduce.matches; }
    function clamp(v){ return Math.max(-MAX, Math.min(MAX, v)); }
    function ensureTransition(el){
      var cur = el.style.transition || '';
      if(!cur){
        /* fara tranzitie inline: preluam pe cea din foaia de stil ca sa n-o pierdem */
        var cs = window.getComputedStyle(el).transition || '';
        if(cs && cs !== 'none' && !/^all 0s/.test(cs)) cur = cs;
      }
      if(/(^|,)\s*translate\b/.test(cur)) return;
      el.style.transition = cur ? cur + ',' + EASE : EASE;
    }
    function apply(){
      ticking = false;
      if(!active) return;
      var r = active.getBoundingClientRect();
      var dx = clamp((lastX - (r.left + r.width / 2)) * K);
      var dy = clamp((lastY - (r.top + r.height / 2)) * K);
      active.style.translate = dx.toFixed(1) + 'px ' + dy.toFixed(1) + 'px';
    }
    function release(){
      if(!active) return;
      active.style.translate = '0 0';
      active = null;
    }
    document.addEventListener('mouseover', function(e){
      if(!enabled()){ release(); return; }
      var t = e.target;
      var el = (t && t.closest) ? t.closest(SEL) : null;
      if(el === active) return;
      release();
      if(!el) return;
      ensureTransition(el);
      active = el;
    }, { passive: true });
    document.addEventListener('mousemove', function(e){
      if(!active) return;
      lastX = e.clientX; lastY = e.clientY;
      if(!ticking){ ticking = true; requestAnimationFrame(apply); }
    }, { passive: true });
    document.addEventListener('mouseout', function(e){
      if(!active) return;
      var to = e.relatedTarget;
      if(to && active.contains(to)) return;      /* doar s-a mutat pe un copil */
      if(!active.contains(e.target)) return;      /* n-a iesit din elementul activ */
      release();
    }, { passive: true });
    /* daca utilizatorul comuta reduced-motion sau pointerul devine grosier, oprim efectul */
    function onChange(){ if(!enabled()) release(); }
    if(fine.addEventListener){ fine.addEventListener('change', onChange); reduce.addEventListener('change', onChange); }
    else if(fine.addListener){ fine.addListener(onChange); reduce.addListener(onChange); }
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

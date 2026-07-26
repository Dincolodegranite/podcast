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

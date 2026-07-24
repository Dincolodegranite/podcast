/* Dincolo de Granițe — premium layer:
   diaspora map + distance moment, launch countdown, scroll reveals, cursor.
   Self-contained; waits for the React-rendered DOM via retry loop. */
(function(){
'use strict';

/* ── World land grid ─────────────────────────────────────────────
   180 x 65 cells (2°/cell), equirectangular, lon -180..180, lat 75..-55.
   Rasterized from real country boundaries (world.geo.json) with coastal
   supersampling — regenerate with scratchpad/rasterize.js if needed. */
var GRID = [
'............................####.#..##.############..........###################.....................................###..........####################.###......##..................',
'#..........................###########.#####.#########........#################.....................................##......###############################.##########..............',
'........#############.########.##########################.....#################....................########.............##.###################################################.####.',
'##....############################################.#######.....#############.....................##############.#.##################################################################',
'#####.###########################################....######....##########.....#####.............####################################################################################',
'...##..#.#####################################.###.#######......######.........####...........######################################################################################',
'.......#####################################....#..###.##........####.......................#######.################################################################################',
'.......#########.##########################........#####.#.........##.......................#######..###################################################################..######....',
'...........###.......#######################.......########............................##....#######.############################################################.......####........',
'........###.............#######################....#########...........................##.....#####.###########################################################........#####........',
'.......#...............##########################.############.......................##.##...#####################################################################......###.........',
'..........................#####################################......................######.######################################################################......#...........',
'..........................##################################.##........................###########################################################################..................',
'............................##############################..####.......................#########################################################################.#..................',
'............................################################.............................##########################.###########################################..#..................',
'............................############################.#............................##.################....#####.###########################################..###.................',
'............................###########################..............................#######..####.#####..###.#####.########################################....##..................',
'............................#########################................................######...#..#####.############.#######################################.....#...................',
'............................#########################................................#####......##..##.############..##################################.###....##...................',
'.............................#######################...................................#.#######.....#..###.###########################################..##.#####...................',
'..............................######################..................................##########...........############################################..#.####.....................',
'...............................###################...................................#############..####.#.############################################....#........................',
'................................##################...................................##################################################################.............................',
'................................##########......##.................................####################################################################.............................',
'.................................#########.......##...............................##################################..################################..............................',
'..................................#.#####.........................................######################################...############################.............................',
'.....................................#####......####.............................#######################################.....#######################..#.............................',
'............#........................#####..###....####...........................###########################.##########......########..##########..................................',
'......................................########.....#.####.........................#####################################.......######.....########.....#.............................',
'........................................########.................................#############################.######.........#####......########.....#.............................',
'............................................#####................................##################################............###.........######.....##............................',
'..............................................###....#...........................###############################..##...........###.........#.####......##...........................',
'...............................................##.#.########......................##################################............###........#..##.....#.##...........................',
'................................................##.##########......................################################.............#.#........#...........###..........................',
'...................................................#############....................###############################...............#.........##......##..#...........................',
'...................................................##############.....................#......#####################........................####....####..............................',
'..................................................###############.............................###################..........................###..#####.....#.........................',
'..................................................################............................##################...........................###..#####.##..#.#.......................',
'.................................................####################.........................#################.............................###..######....##.##....................',
'.................................................######################........................###############...............................##....#.###.#.########...#.............',
'.................................................########################.......................##############................................###......#.....#.#######.#............',
'..................................................#######################.......................##############.................................#########.#.....#####.....#..........',
'..................................................######################........................##############.......................................#..#..........###....#.........',
'...................................................#####################........................###############...#........................................####..#..................',
'....................................................###################.........................###############...#......................................#####...##.................',
'....................................................###################.........................##############..###.....................................#######.###..........#.....#',
'......................................................#################.........................#############...###....................................############................#',
'.......................................................###############..........................############....###..................................################.......#.......',
'.......................................................###############...........................###########...###.................................##################.......#.......',
'......................................................##############.............................###########....##................................####################..............',
'......................................................############...............................##########.....#.................................#####################.............',
'......................................................############...............................##########........................................####################.............',
'......................................................###########.................................########.........................................####################.............',
'......................................................###########..................................######...........................................###################.............',
'......................................................##########...................................#####...........................................#####.....#########..............',
'.....................................................#########.................................................................................................######...........##..',
'.....................................................#########..................................................................................................#####............##.',
'.....................................................######......................................................................................................................##.',
'.....................................................######.......................................................................................................##...........###..',
'.....................................................#####.........................................................................................................#..........###...',
'....................................................#####....................................................................................................................###....',
'....................................................#####...........................................................................................................................',
'....................................................####....................................................................#.......................................................',
'....................................................####...##.......................................................................................................................',
'.....................................................####...........................................................................................................................',
];
var GRID_COLS = 180, GRID_ROWS = 65;
var LAT_TOP = 75, LAT_SPAN = 130;

var HOME = { name: 'România', lat: 44.43, lon: 26.10 };

/* name, lat, lon, aliases (Romanian exonyms + variants) */
var CITIES = [
['London',51.51,-0.13,['londra']],['Canterbury',51.28,1.08,['kent']],['Manchester',53.48,-2.24,[]],
['Birmingham',52.48,-1.90,[]],['Leeds',53.80,-1.55,[]],['Liverpool',53.41,-2.98,[]],
['Sheffield',53.38,-1.47,[]],['Nottingham',52.95,-1.15,[]],['Bristol',51.45,-2.59,[]],
['Southampton',50.90,-1.40,[]],['Portsmouth',50.82,-1.09,[]],['Cambridge',52.21,0.12,[]],
['Oxford',51.75,-1.26,[]],['Glasgow',55.86,-4.25,[]],['Edinburgh',55.95,-3.19,[]],
['Cardiff',51.48,-3.18,[]],['Belfast',54.60,-5.93,[]],['Dublin',53.35,-6.26,[]],['Cork',51.90,-8.47,[]],
['Paris',48.86,2.35,[]],['Lyon',45.76,4.84,[]],['Marseille',43.30,5.37,['marsilia']],['Nice',43.70,7.27,[]],
['Brussels',50.85,4.35,['bruxelles']],['Antwerp',51.22,4.40,['anvers']],
['Amsterdam',52.37,4.90,[]],['Rotterdam',51.92,4.48,[]],['The Hague',52.08,4.31,['haga']],
['Berlin',52.52,13.41,[]],['Munich',48.14,11.58,['munchen','münchen']],['Frankfurt',50.11,8.68,[]],
['Hamburg',53.55,9.99,[]],['Cologne',50.94,6.96,['koln','köln']],['Stuttgart',48.78,9.18,[]],
['Dusseldorf',51.23,6.77,['düsseldorf']],['Nuremberg',49.45,11.08,['nurnberg','nürnberg']],
['Vienna',48.21,16.37,['viena']],['Zurich',47.37,8.54,['zürich']],['Geneva',46.20,6.14,['geneva']],
['Basel',47.56,7.59,[]],['Milan',45.46,9.19,['milano']],['Rome',41.90,12.50,['roma']],
['Turin',45.07,7.69,['torino']],['Naples',40.85,14.27,['napoli']],['Bologna',44.49,11.34,[]],
['Florence',43.77,11.26,['florenta','florența']],['Venice',45.44,12.32,['venetia','veneția']],
['Padua',45.41,11.88,['padova']],['Verona',45.44,10.99,[]],['Brescia',45.54,10.22,[]],
['Madrid',40.42,-3.70,[]],['Barcelona',41.39,2.17,[]],['Valencia',39.47,-0.38,[]],
['Seville',37.39,-5.99,['sevilla']],['Zaragoza',41.65,-0.89,[]],['Malaga',36.72,-4.42,[]],
['Lisbon',38.72,-9.14,['lisabona']],['Porto',41.15,-8.61,[]],
['Copenhagen',55.68,12.57,['copenhaga']],['Stockholm',59.33,18.06,[]],['Gothenburg',57.71,11.97,[]],
['Oslo',59.91,10.75,[]],['Helsinki',60.17,24.94,[]],['Warsaw',52.23,21.01,['varsovia','varșovia']],
['Krakow',50.06,19.94,['cracovia']],['Prague',50.08,14.44,['praga']],['Budapest',47.50,19.04,['budapesta']],
['Athens',37.98,23.73,['atena']],['Thessaloniki',40.64,22.94,['salonic']],['Nicosia',35.19,33.38,[]],
['Valletta',35.90,14.51,['malta']],['Luxembourg',49.61,6.13,['luxemburg']],
['Istanbul',41.01,28.98,[]],['Sofia',42.70,23.32,[]],['Belgrade',44.80,20.47,['belgrad']],
['Kyiv',50.45,30.52,['kiev']],['Moscow',55.75,37.62,['moscova']],['Tel Aviv',32.08,34.78,[]],
['Dubai',25.20,55.27,[]],['Abu Dhabi',24.45,54.38,[]],['Doha',25.29,51.53,[]],
['Riyadh',24.71,46.68,['riad']],['Kuwait City',29.38,47.99,['kuweit']],['Manama',26.23,50.59,['bahrain']],
['Muscat',23.59,58.41,[]],
['New York',40.71,-74.01,[]],['Los Angeles',34.05,-118.24,[]],['Chicago',41.88,-87.63,[]],
['Miami',25.76,-80.19,[]],['Houston',29.76,-95.37,[]],['Dallas',32.78,-96.80,[]],
['Atlanta',33.75,-84.39,[]],['Boston',42.36,-71.06,[]],['Washington',38.91,-77.04,[]],
['Philadelphia',39.95,-75.17,[]],['Seattle',47.61,-122.33,[]],['San Francisco',37.77,-122.42,[]],
['Las Vegas',36.17,-115.14,[]],['Phoenix',33.45,-112.07,[]],['Detroit',42.33,-83.05,[]],
['Toronto',43.65,-79.38,[]],['Montreal',45.50,-73.57,[]],['Vancouver',49.28,-123.12,[]],
['Calgary',51.05,-114.07,[]],['Ottawa',45.42,-75.70,[]],
['Sydney',-33.87,151.21,[]],['Melbourne',-37.81,144.96,[]],['Brisbane',-27.47,153.03,[]],
['Perth',-31.95,115.86,[]],['Adelaide',-34.93,138.60,[]],['Auckland',-36.85,174.76,[]],
['Wellington',-41.29,174.78,[]],
['Tokyo',35.68,139.69,[]],['Singapore',1.35,103.82,[]],['Hong Kong',22.32,114.17,[]],
['Bangkok',13.76,100.50,[]],['Johannesburg',-26.20,28.05,[]],['Cape Town',-33.92,18.42,[]],
['Cairo',30.04,31.24,[]],['Casablanca',33.57,-7.59,[]],
['Buenos Aires',-34.60,-58.38,[]],['Sao Paulo',-23.55,-46.63,['são paulo']],
['Rio de Janeiro',-22.91,-43.17,['rio']],['Mexico City',19.43,-99.13,[]],
['Lima',-12.05,-77.04,[]],['Bogota',4.71,-74.07,['bogotá']],['Santiago',-33.45,-70.67,[]],
['București',44.43,26.10,['bucuresti','bucharest']],['Cluj-Napoca',46.77,23.60,['cluj']],
['Iași',47.16,27.59,['iasi']],['Timișoara',45.76,21.23,['timisoara']],
['Constanța',44.18,28.63,['constanta']],['Brașov',45.66,25.61,['brasov']],
['Craiova',44.33,23.79,[]],['Galați',45.44,28.05,['galati']],['Oradea',47.05,21.92,[]],
['Sibiu',45.79,24.15,[]],['Chișinău',47.01,28.86,['chisinau']]
];

/* Seed dots shown before real applications populate the map */
var SEED_GUESTS = ['london','canterbury','dublin','paris','madrid','munich','dubai','new york','toronto'];

function norm(s){
  return String(s || '').toLowerCase()
    .replace(/ă/g,'a').replace(/â/g,'a').replace(/î/g,'i').replace(/ș/g,'s').replace(/ş/g,'s')
    .replace(/ț/g,'t').replace(/ţ/g,'t').replace(/é/g,'e').replace(/è/g,'e').replace(/ü/g,'u')
    .replace(/ö/g,'o').replace(/ä/g,'a').replace(/ç/g,'c').replace(/ñ/g,'n').replace(/ã/g,'a')
    .trim();
}
function findCity(q){
  var n = norm(q);
  if(n.length < 2) return null;
  for(var i = 0; i < CITIES.length; i++){
    if(norm(CITIES[i][0]) === n) return CITIES[i];
    for(var j = 0; j < CITIES[i][3].length; j++){ if(CITIES[i][3][j] === n) return CITIES[i]; }
  }
  return null;
}
function suggest(q){
  var n = norm(q), out = [];
  if(n.length < 2) return out;
  for(var i = 0; i < CITIES.length && out.length < 6; i++){
    var hit = norm(CITIES[i][0]).indexOf(n) === 0;
    if(!hit){ for(var j = 0; j < CITIES[i][3].length; j++){ if(CITIES[i][3][j].indexOf(n) === 0){ hit = true; break; } } }
    if(hit) out.push(CITIES[i]);
  }
  return out;
}
function haversine(a, b, c, d){
  var R = 6371, dLat = (c - a) * Math.PI / 180, dLon = (d - b) * Math.PI / 180;
  var x = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(a * Math.PI / 180) * Math.cos(c * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
}

/* ── Diaspora map ──────────────────────────────────────────────── */
function initMap(){
  var canvas = document.querySelector('[data-harta-canvas]');
  var wrap = canvas.parentElement;
  var ctx = canvas.getContext('2d');
  var W = 0, H = 0, dpr = Math.max(1, window.devicePixelRatio || 1);
  var guests = {};   /* normName -> city entry */
  var arc = null;    /* {from:[lat,lon], t:0..1} */
  var raf = 0, visible = false, t0 = performance.now();

  SEED_GUESTS.forEach(function(n){ var c = findCity(n); if(c) guests[norm(c[0])] = c; });

  var supa = window.__dgSupa;
  if(supa){
    fetch(supa.url + '/rest/v1/rpc/get_guest_cities', {
      method: 'POST',
      headers: { 'apikey': supa.key, 'Content-Type': 'application/json' },
      body: '{}'
    }).then(function(r){ return r.ok ? r.json() : []; }).then(function(rows){
      (rows || []).forEach(function(row){
        var c = findCity(row.city);
        if(c) guests[norm(c[0])] = c;
      });
    }).catch(function(){});
  }

  function proj(lat, lon){
    return [ (lon + 180) / 360 * W, (LAT_TOP - lat) / LAT_SPAN * H ];
  }
  var land = document.createElement('canvas');
  function renderLand(){
    var lctx = land.getContext('2d');
    land.width = Math.round(W * dpr); land.height = Math.round(H * dpr);
    lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var cw = W / GRID_COLS, ch = H / GRID_ROWS, r = Math.max(0.8, cw * 0.3);
    lctx.fillStyle = 'rgba(201,162,90,.14)';
    for(var row = 0; row < GRID_ROWS; row++){
      var line = GRID[row];
      for(var col = 0; col < GRID_COLS; col++){
        if(line.charAt(col) === '#'){
          lctx.beginPath();
          lctx.arc(col * cw + cw / 2, row * ch + ch / 2, r, 0, 6.2832);
          lctx.fill();
        }
      }
    }
  }
  function size(){
    var w = wrap.clientWidth;
    if(!w) return;
    W = w; H = Math.round(w * GRID_ROWS / GRID_COLS * 1.18);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderLand();
  }
  function draw(now){
    ctx.clearRect(0, 0, W, H);
    if(land.width) ctx.drawImage(land, 0, 0, W, H);
    var mr = Math.max(3, Math.min(6, W * 0.005));
    var phase = (now - t0) / 1000;
    Object.keys(guests).forEach(function(k, i){
      var c = guests[k], p = proj(c[1], c[2]);
      var pulse = 0.55 + 0.45 * Math.sin(phase * 2 + i * 1.7);
      ctx.beginPath();
      ctx.fillStyle = 'rgba(227,192,125,' + (0.35 + 0.4 * pulse).toFixed(2) + ')';
      ctx.arc(p[0], p[1], mr, 0, 6.2832);
      ctx.fill();
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(227,192,125,' + (0.25 * pulse).toFixed(2) + ')';
      ctx.lineWidth = 1;
      ctx.arc(p[0], p[1], mr * (1.8 + 0.9 * pulse), 0, 6.2832);
      ctx.stroke();
    });
    var hp = proj(HOME.lat, HOME.lon);
    var hPulse = 0.5 + 0.5 * Math.sin(phase * 2.4);
    ctx.beginPath(); ctx.fillStyle = '#e3c07d';
    ctx.arc(hp[0], hp[1], mr * 1.3, 0, 6.2832); ctx.fill();
    ctx.beginPath(); ctx.strokeStyle = 'rgba(227,192,125,' + (0.6 * hPulse).toFixed(2) + ')';
    ctx.lineWidth = 1.4;
    ctx.arc(hp[0], hp[1], mr * (2.1 + 1.5 * hPulse), 0, 6.2832); ctx.stroke();
    if(arc){
      var p1 = proj(arc.from[0], arc.from[1]);
      var mx = (p1[0] + hp[0]) / 2, my = (p1[1] + hp[1]) / 2;
      var dist = Math.hypot(hp[0] - p1[0], hp[1] - p1[1]);
      var cx = mx, cy = my - Math.min(H * 0.42, dist * 0.35 + H * 0.06);
      var steps = 60, upto = Math.floor(steps * Math.min(1, arc.t));
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(227,192,125,.9)';
      ctx.lineWidth = 1.6;
      ctx.shadowColor = 'rgba(227,192,125,.8)'; ctx.shadowBlur = 6;
      for(var s = 0; s <= upto; s++){
        var tt = s / steps;
        var x = (1-tt)*(1-tt)*p1[0] + 2*(1-tt)*tt*cx + tt*tt*hp[0];
        var y = (1-tt)*(1-tt)*p1[1] + 2*(1-tt)*tt*cy + tt*tt*hp[1];
        if(s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.fillStyle = '#f5e3bd';
      ctx.arc(p1[0], p1[1], mr * 1.15, 0, 6.2832); ctx.fill();
      if(arc.t < 1) arc.t += 0.016;
    }
  }
  function loop(now){
    if(visible){ draw(now); }
    raf = requestAnimationFrame(loop);
  }
  size();
  window.addEventListener('resize', size, { passive: true });
  if(window.IntersectionObserver){
    new IntersectionObserver(function(es){ visible = es[0].isIntersecting; }, { rootMargin: '100px' }).observe(canvas);
  } else { visible = true; }
  raf = requestAnimationFrame(loop);

  /* input + suggestions + result */
  var input = document.querySelector('[data-harta-input]');
  var sug = document.querySelector('[data-harta-suggestions]');
  var btn = document.querySelector('[data-harta-btn]');
  var result = document.querySelector('[data-harta-result]');
  var kmEl = document.querySelector('[data-harta-km]');
  var errEl = document.querySelector('[data-harta-err]');

  function pick(city){
    sug.style.display = 'none';
    input.value = city[0];
    errEl.style.opacity = '0';
    arc = { from: [city[1], city[2]], t: 0 };
    var km = haversine(city[1], city[2], HOME.lat, HOME.lon);
    result.style.display = 'block';
    var start = null, dur = 1400;
    function count(ts){
      if(!start) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      kmEl.textContent = Math.round(km * eased).toLocaleString('ro-RO');
      if(p < 1) requestAnimationFrame(count);
    }
    requestAnimationFrame(count);
    setTimeout(function(){ result.style.opacity = '1'; result.style.transform = 'none'; }, 60);
  }
  function go(){
    var c = findCity(input.value) || suggest(input.value)[0];
    if(c){ pick(c); }
    else {
      errEl.style.opacity = '1';
      result.style.display = 'none';
    }
  }
  input.addEventListener('input', function(){
    var list = suggest(input.value);
    errEl.style.opacity = '0';
    if(!list.length){ sug.style.display = 'none'; return; }
    sug.textContent = '';
    list.forEach(function(c){
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = c[0];
      b.setAttribute('style', 'display:block;width:100%;text-align:left;padding:10px 16px;background:transparent;border:none;color:#f5f6f7;font:400 14px Inter,sans-serif;cursor:pointer');
      b.addEventListener('mouseenter', function(){ b.style.background = 'rgba(201,162,90,.14)'; });
      b.addEventListener('mouseleave', function(){ b.style.background = 'transparent'; });
      b.addEventListener('click', function(){ pick(c); });
      sug.appendChild(b);
    });
    sug.style.display = 'block';
  });
  input.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); go(); } });
  document.addEventListener('click', function(e){
    if(!sug.contains(e.target) && e.target !== input) sug.style.display = 'none';
  });
  btn.addEventListener('click', go);
}

/* ── Countdown ─────────────────────────────────────────────────── */
function initCountdown(){
  var box = document.querySelector('[data-countdown]');
  var target = new Date('2026-09-01T00:00:00+01:00').getTime();
  var d = box.querySelector('[data-count-d]'), h = box.querySelector('[data-count-h]');
  var m = box.querySelector('[data-count-m]'), s = box.querySelector('[data-count-s]');
  function pad(n){ return n < 10 ? '0' + n : String(n); }
  function tick(){
    var diff = target - Date.now();
    if(diff <= 0){ box.style.display = 'none'; return; }
    d.textContent = Math.floor(diff / 86400000);
    h.textContent = pad(Math.floor(diff / 3600000) % 24);
    m.textContent = pad(Math.floor(diff / 60000) % 60);
    s.textContent = pad(Math.floor(diff / 1000) % 60);
    setTimeout(tick, 1000);
  }
  tick();
}

/* ── Scroll reveals ────────────────────────────────────────────── */
function initReveals(){
  var els = document.querySelectorAll('[data-reveal]');
  if(!els.length) return;
  if(!window.IntersectionObserver){ return; }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){
        en.target.style.opacity = '1';
        en.target.style.transform = 'none';
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.08 });
  els.forEach(function(el){
    var r = el.getBoundingClientRect();
    if(r.top < window.innerHeight){ return; } /* already visible — leave untouched */
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity .9s cubic-bezier(.2,.8,.2,1), transform .9s cubic-bezier(.2,.8,.2,1)';
    io.observe(el);
  });
}

/* ── Cursor (desktop, fine pointers only) ──────────────────────── */
function initCursor(){
  if(!window.matchMedia) return;
  if(!matchMedia('(pointer:fine)').matches) return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var ring = document.createElement('div');
  ring.setAttribute('style',
    'position:fixed;left:0;top:0;width:34px;height:34px;border:1px solid rgba(201,162,90,.65);' +
    'border-radius:50%;pointer-events:none;z-index:9999;transform:translate(-100px,-100px);' +
    'transition:width .25s ease,height .25s ease,border-color .25s ease;will-change:transform');
  var dot = document.createElement('div');
  dot.setAttribute('style',
    'position:fixed;left:0;top:0;width:5px;height:5px;background:#e3c07d;border-radius:50%;' +
    'pointer-events:none;z-index:9999;transform:translate(-100px,-100px);will-change:transform');
  document.body.appendChild(ring);
  document.body.appendChild(dot);
  var mx = -100, my = -100, rx = -100, ry = -100;
  document.addEventListener('pointermove', function(e){
    mx = e.clientX; my = e.clientY;
    dot.style.transform = 'translate(' + (mx - 2.5) + 'px,' + (my - 2.5) + 'px)';
    var t = e.target;
    var interactive = t.closest && t.closest('a,button,input,textarea,select,[role="button"],[data-nav-toggle]');
    ring.style.width = interactive ? '52px' : '34px';
    ring.style.height = interactive ? '52px' : '34px';
    ring.style.borderColor = interactive ? 'rgba(227,192,125,.9)' : 'rgba(201,162,90,.65)';
  }, { passive: true });
  (function follow(){
    rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
    var w = parseFloat(ring.style.width) || 34;
    ring.style.transform = 'translate(' + (rx - w / 2) + 'px,' + (ry - w / 2) + 'px)';
    requestAnimationFrame(follow);
  })();
}

/* ── Boot (retry until the React-rendered DOM exists) ──────────── */
var tries = 0;
var iv = setInterval(function(){
  tries++;
  var mapReady = document.querySelector('[data-harta-canvas]');
  var cdReady = document.querySelector('[data-countdown]');
  if(mapReady && cdReady){
    clearInterval(iv);
    try { initMap(); } catch(e){ console.warn('harta init:', e); }
    try { initCountdown(); } catch(e){ console.warn('countdown init:', e); }
    try { initReveals(); } catch(e){}
    try { initCursor(); } catch(e){}
  } else if(tries > 100){ clearInterval(iv); }
}, 300);
})();

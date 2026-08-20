/* ============ DATA ============ */

const RARITIES = [
  { key:'common',      label:'Обычный',        color:'var(--c-common)',      hex:'#8a93a0', weight:60, mult:1   },
  { key:'uncommon',    label:'Необычный',      color:'var(--c-uncommon)',    hex:'#3f8ede', weight:25, mult:2.4 },
  { key:'rare',        label:'Редкий',         color:'var(--c-rare)',        hex:'#8b4fd1', weight:10, mult:6   },
  { key:'exceptional', label:'Исключительный', color:'var(--c-exceptional)', hex:'#d94fa0', weight:4,  mult:16  },
  { key:'legendary',   label:'Легендарный',    color:'var(--c-legendary)',   hex:'#f0b90b', weight:1,  mult:60  },
];

const FAMILIES = [
  {n:'Ridge',    shape:'rifle'},
  {n:'Vantage',  shape:'rifle'},
  {n:'Sable',    shape:'pistol'},
  {n:'Halcyon',  shape:'pistol'},
  {n:'Ferro',    shape:'knife'},
  {n:'Tundra',   shape:'rifle'},
  {n:'Oxide',    shape:'pistol'},
  {n:'Marrow',   shape:'knife'},
];

const FINISHES = {
  common:      ['Полевой шов','Серый контур','Стальной оттиск','Матовый след','Пыльный край'],
  uncommon:    ['Ледяной раскол','Медный узор','Штормовой хром','Кобальтовый разлом','Ночной прибой'],
  rare:        ['Пепельная жила','Фиолетовый разлом','Кварцевый скол','Аметистовый шов','Тёмный отлив'],
  exceptional: ['Коралловый закат','Электрический цвет','Розовый вихрь','Неоновый разлом','Малиновый прилив'],
  legendary:   ['Солнечный разлом','Золотой оттиск','Огненная жила','Императорский блеск','Пламя вырезки'],
};

const CASES = [
  { id:'c1', name:'Кейс «Периметр»', desc:'Базовый набор — низкая цена, честные шансы.', price:35, biasIdx:0,
    weights:[60,25,10,4,1] },
  { id:'c2', name:'Кейс «Обсидиан»', desc:'Смещён в сторону редких находок.', price:85, biasIdx:1,
    weights:[45,30,16,7,2] },
  { id:'c3', name:'Кейс «Меридиан»', desc:'Баланс цены и шанса на топ-предметы.', price:150, biasIdx:2,
    weights:[35,30,22,10,3] },
  { id:'c4', name:'Кейс «Латунь-86»', desc:'Дорогой кейс с высоким шансом легенды.', price:320, biasIdx:3,
    weights:[20,28,28,17,7] },
];

/* deterministic pseudo-random from string, for stable per-item art */
function hashStr(s){
  let h = 2166136261;
  for(let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h>>>0);
}
function rand(seed){ // mulberry32
  return function(){
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

/* build item pool once */
let ITEM_POOL = [];
(function buildPool(){
  RARITIES.forEach(r=>{
    FAMILIES.forEach(f=>{
      FINISHES[r.key].forEach(fin=>{
        const id = f.n+'-'+r.key+'-'+fin;
        ITEM_POOL.push({
          id, family:f.n, shape:f.shape, rarity:r.key, finish:fin,
          baseValue: Math.round((8 + hashStr(id)%40) * r.mult),
        });
      });
    });
  });
})();

function itemsByRarity(key){ return ITEM_POOL.filter(i=>i.rarity===key); }
function rarityOf(key){ return RARITIES.find(r=>r.key===key); }

/* ============ SVG ART (procedural, original shapes) ============ */
function weaponPath(shape){
  if(shape==='rifle'){
    return `<path d="M6 34 h58 v6 h-8 v6 h-10 v-6 h-16 l-6 10 h-8 v-10 h-10 z" />
            <rect x="60" y="30" width="8" height="14" rx="1"/>
            <rect x="10" y="30" width="46" height="4" rx="1" opacity="0.55"/>`;
  }
  if(shape==='pistol'){
    return `<path d="M14 30 h34 v10 h-8 v14 h-8 v-14 h-10 l-4 8 h-6 v-8 h-10 z"/>
            <rect x="14" y="30" width="34" height="4" rx="1" opacity="0.55"/>`;
  }
  return `<path d="M10 40 l40 -22 c3 -1.5 6 1 4.5 4 l-16 26 -4 -2 12 -22 -34 20 z"/>
          <rect x="6" y="38" width="14" height="6" rx="1.5"/>`;
}

function patternDefs(id, rarityHex){
  const r = rand(hashStr(id));
  const a = r(), b = r();
  const styleRoll = Math.floor(r()*3);
  const grad = `
    <linearGradient id="g-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${rarityHex}" stop-opacity="0.95"/>
      <stop offset="${(40+a*30).toFixed(0)}%" stop-color="#ffffff" stop-opacity="${(0.08+b*0.15).toFixed(2)}"/>
      <stop offset="100%" stop-color="${rarityHex}" stop-opacity="0.55"/>
    </linearGradient>`;
  let overlay = '';
  if(styleRoll===0){
    overlay = `<g opacity="0.5">${Array.from({length:5}).map((_,i)=>{
      const y = 8 + i*10 + r()*4;
      return `<rect x="0" y="${y}" width="80" height="${1.5+r()*2}" fill="#000" opacity="${0.12+r()*0.1}" transform="skewX(-18)"/>`;
    }).join('')}</g>`;
  } else if(styleRoll===1){
    overlay = `<g opacity="0.55">${Array.from({length:6}).map(()=>{
      const cx=r()*80, cy=r()*54, rr=4+r()*7;
      return `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="#000" opacity="${0.08+r()*0.1}"/>`;
    }).join('')}</g>`;
  } else {
    overlay = `<g opacity="0.4">${Array.from({length:4}).map((_,i)=>{
      const x=i*20+r()*6;
      return `<rect x="${x}" y="0" width="${3+r()*4}" height="54" fill="#fff" opacity="${0.05+r()*0.08}"/>`;
    }).join('')}</g>`;
  }
  return {grad, overlay};
}

function itemSVG(item, rarityHex){
  const {grad, overlay} = patternDefs(item.id, rarityHex);
  return `<svg viewBox="0 0 80 54" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>${grad}</defs>
    <g fill="url(#g-${item.id})" stroke="${rarityHex}" stroke-width="0.6" stroke-opacity="0.6">
      ${weaponPath(item.shape)}
    </g>
    ${overlay}
  </svg>`;
}

function caseGlyphSVG(hex){
  return `<svg viewBox="0 0 100 90" width="72" height="72" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="14" width="84" height="62" rx="2" fill="none" stroke="${hex}" stroke-width="2" opacity="0.85"/>
    <rect x="8" y="14" width="84" height="62" rx="2" fill="${hex}" opacity="0.06"/>
    <circle cx="50" cy="45" r="13" fill="none" stroke="${hex}" stroke-width="2"/>
    <circle cx="50" cy="45" r="3" fill="${hex}"/>
    <line x1="8" y1="30" x2="92" y2="30" stroke="${hex}" stroke-width="1" opacity="0.35"/>
    <line x1="8" y1="60" x2="92" y2="60" stroke="${hex}" stroke-width="1" opacity="0.35"/>
  </svg>`;
}

/* ============ STATE ============ */
let balance = 500;
let displayedBalance = 500;
let inventory = [];
let spinning = false;
let activeCaseId = CASES[0].id;

const balanceAmt = document.getElementById('balanceAmt');
const balanceBox = document.querySelector('.balance');

function animateBalanceTo(target){
  const start = displayedBalance;
  const diff = target - start;
  const dur = 500;
  const t0 = performance.now();
  balanceBox.classList.add('pulse');
  function step(now){
    const p = Math.min(1, (now - t0)/dur);
    const eased = 1 - Math.pow(1-p, 3);
    displayedBalance = Math.round(start + diff*eased);
    balanceAmt.textContent = displayedBalance.toLocaleString('ru-RU');
    if(p < 1){ requestAnimationFrame(step); }
    else{ balanceAmt.textContent = target.toLocaleString('ru-RU'); setTimeout(()=>balanceBox.classList.remove('pulse'), 200); }
  }
  requestAnimationFrame(step);
}

function setBalance(v){
  balance = v;
  animateBalanceTo(v);
  renderCases();
}

/* ============ ODDS PANEL ============ */
function renderOdds(){
  const wrap = document.getElementById('oddsTable');
  wrap.innerHTML = RARITIES.map(r=>`
    <div class="odds-row">
      <span class="odds-swatch" style="background:${r.hex}"></span>
      <span class="name">${r.label}</span>
      <span class="pct">${r.weight.toFixed(0)}%</span>
    </div>
  `).join('');
}

/* ============ TICKER ============ */
function randomTickerFeed(n){
  const out = [];
  for(let i=0;i<n;i++){
    const r = RARITIES[Math.floor(Math.random()*RARITIES.length)];
    const pool = itemsByRarity(r.key);
    const item = pool[Math.floor(Math.random()*pool.length)];
    const names = ['drop_lynx','ghostpilot','nika.k','zeroday','sable_rc','anka','void.exe','marrow_jt','coldwire','ferrum'];
    out.push({user:names[Math.floor(Math.random()*names.length)]+Math.floor(Math.random()*99), item, rarity:r});
  }
  return out;
}
function renderTicker(){
  const el = document.getElementById('ticker');
  const feed = randomTickerFeed(16);
  const html = feed.map(f=>`
    <span class="ticker-item">
      <span class="dot ${f.rarity.key==='legendary'||f.rarity.key==='exceptional' ? 'glint':''}" style="background:${f.rarity.hex}; color:${f.rarity.hex}"></span>
      <b>${f.user}</b> получил ${f.item.family} // ${f.item.finish}
    </span>
  `).join('');
  el.innerHTML = html + html; // duplicate for seamless loop
}

/* ============ CASES ============ */
function renderCases(){
  const grid = document.getElementById('caseGrid');
  grid.innerHTML = CASES.map(c=>{
    const affordable = balance >= c.price;
    const iconRarity = RARITIES[c.biasIdx];
    return `
    <div class="case-card ${c.id===activeCaseId?'active':''} ${affordable?'':'locked'}" data-case="${c.id}">
      <div class="tier-strip" style="background:linear-gradient(90deg, ${RARITIES[0].hex}, ${RARITIES[1].hex}, ${RARITIES[2].hex}, ${RARITIES[3].hex}, ${RARITIES[4].hex})"></div>
      <div class="case-glyph">${caseGlyphSVG(iconRarity.hex)}</div>
      <h3>${c.name}</h3>
      <div class="desc">${c.desc}</div>
      <div class="foot">
        <span class="price">${c.price}</span>
        <span style="color:${affordable?'var(--text-dim)':'var(--blood)'}">${affordable?'Открыть →':'Мало ₡'}</span>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.case-card').forEach(el=>{
    el.addEventListener('click', ()=>{
      const id = el.dataset.case;
      const cs = CASES.find(x=>x.id===id);
      if(balance < cs.price || spinning) return;
      activeCaseId = id;
      renderCases();
      openCase(cs);
    });
    /* 3D tilt on mousemove */
    el.addEventListener('mousemove', (e)=>{
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width/2, cy = rect.height/2;
      const rotX = ((y-cy)/cy) * -6;
      const rotY = ((x-cx)/cx) * 6;
      el.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-2px)`;
    });
    el.addEventListener('mouseleave', ()=>{
      el.style.transform = '';
    });
  });
}

/* ============ WEIGHTED PICK ============ */
function pickRarity(weights){
  const total = weights.reduce((a,b)=>a+b,0);
  let roll = Math.random()*total;
  for(let i=0;i<weights.length;i++){
    if(roll < weights[i]) return RARITIES[i].key;
    roll -= weights[i];
  }
  return RARITIES[0].key;
}
function pickItem(rarityKey){
  const pool = itemsByRarity(rarityKey);
  return pool[Math.floor(Math.random()*pool.length)];
}

/* ============ OPEN CASE / REEL ANIM ============ */
const ITEM_W = 132 + 12; // width + margins

function openCase(cs){
  if(balance < cs.price) return;
  spinning = true;
  setBalance(balance - cs.price);

  const winRarity = pickRarity(cs.weights);
  const winItem = pickItem(winRarity);

  const frame = document.getElementById('reelFrame');
  const strip = document.getElementById('reelStrip');
  frame.classList.add('show');
  frame.scrollIntoView({behavior:'smooth', block:'center'});

  const REEL_LEN = 60;
  const WIN_INDEX = 48;
  const reelItems = [];
  for(let i=0;i<REEL_LEN;i++){
    if(i===WIN_INDEX){ reelItems.push(winItem); continue; }
    const rk = pickRarity(cs.weights);
    reelItems.push(pickItem(rk));
  }

  strip.classList.add('spinning');
  strip.style.transition = 'none';
  strip.style.transform = 'translateX(0px)';
  strip.innerHTML = reelItems.map((it,i)=>{
    const r = rarityOf(it.rarity);
    return `<div class="reel-item" data-idx="${i}" style="--rc:${r.hex}">
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${r.hex}"></div>
      <div class="art">${itemSVG(it, r.hex)}</div>
      <div class="rname">${it.family} // ${it.finish}</div>
    </div>`;
  }).join('');

  void strip.offsetWidth;

  const frameWidth = frame.clientWidth;
  const jitter = (Math.random()*0.7 - 0.35) * ITEM_W * 0.5;
  const targetX = -(WIN_INDEX*ITEM_W + ITEM_W/2 - frameWidth/2) + jitter;

  requestAnimationFrame(()=>{
    strip.style.transition = 'transform 5.2s cubic-bezier(0.09, 0.85, 0.1, 1)';
    strip.style.transform = `translateX(${targetX}px)`;
  });

  // remove motion blur near the end of the spin
  setTimeout(()=>{ strip.classList.remove('spinning'); }, 4600);

  setTimeout(()=>{
    const winnerEl = strip.querySelector(`.reel-item[data-idx="${WIN_INDEX}"]`);
    if(winnerEl) winnerEl.classList.add('winner');
    const reelFlash = document.getElementById('reelFlash');
    reelFlash.classList.remove('fire'); void reelFlash.offsetWidth; reelFlash.classList.add('fire');
    showResult(winItem, cs);
    spinning = false;
  }, 5300);
}

/* ============ EFFECTS: confetti / flash / shake ============ */
function fireEffects(rarityKey){
  const isBig = rarityKey === 'exceptional' || rarityKey === 'legendary';
  const isMega = rarityKey === 'legendary';
  const hex = rarityOf(rarityKey).hex;

  if(isBig){
    const flash = document.getElementById('screenFlash');
    flash.style.background = `radial-gradient(circle at 50% 40%, ${hex}, transparent 65%)`;
    flash.classList.remove('fire'); void flash.offsetWidth; flash.classList.add('fire');
    burstConfetti(hex, isMega ? 70 : 36);
  }
  if(isMega){
    document.body.classList.remove('shake'); void document.body.offsetWidth; document.body.classList.add('shake');
    setTimeout(()=>document.body.classList.remove('shake'), 550);
  }
}

function burstConfetti(hex, count){
  const layer = document.getElementById('confettiLayer');
  const cx = window.innerWidth/2, cy = window.innerHeight*0.42;
  for(let i=0;i<count;i++){
    const bit = document.createElement('div');
    bit.className = 'confetti-bit';
    const isGold = Math.random() < 0.5;
    bit.style.background = isGold ? hex : '#ffffff';
    bit.style.left = cx + 'px';
    bit.style.top = cy + 'px';
    const angle = Math.random()*Math.PI*2;
    const dist = 120 + Math.random()*260;
    const dx = Math.cos(angle)*dist;
    const dy = Math.sin(angle)*dist - 60;
    const rot = (Math.random()*720-360);
    const dur = 900 + Math.random()*700;
    const shapeRoll = Math.random();
    if(shapeRoll < 0.4) bit.style.borderRadius = '50%';
    layer.appendChild(bit);

    bit.animate([
      { transform:'translate(0,0) rotate(0deg)', opacity:1 },
      { transform:`translate(${dx*0.6}px, ${dy}px) rotate(${rot*0.6}deg)`, opacity:1, offset:0.5 },
      { transform:`translate(${dx}px, ${dy+240}px) rotate(${rot}deg)`, opacity:0 },
    ], { duration:dur, easing:'cubic-bezier(.2,.7,.3,1)' });

    setTimeout(()=>bit.remove(), dur+50);
  }
}

/* ============ RESULT MODAL ============ */
function showResult(item, cs){
  const r = rarityOf(item.rarity);
  const card = document.getElementById('resultCard');
  card.classList.toggle('epic', r.key==='exceptional' || r.key==='legendary');

  document.getElementById('resultStrip').style.background =
    r.key==='legendary'
      ? `linear-gradient(90deg, ${r.hex}, #fff5c4, ${r.hex})`
      : r.hex;
  document.getElementById('resultRarity').textContent = r.label;
  document.getElementById('resultRarity').style.color = r.hex;
  document.getElementById('resultArt').innerHTML = itemSVG(item, r.hex);
  document.getElementById('resultGlow').style.background = r.hex;
  document.getElementById('resultRays').style.background =
    `repeating-conic-gradient(from 0deg, ${r.hex}33 0deg 4deg, transparent 4deg 18deg)`;
  document.getElementById('resultName').textContent = item.family;
  document.getElementById('resultFinish').textContent = item.finish;
  document.getElementById('resultValue').textContent = item.baseValue.toLocaleString('ru-RU');

  const overlay = document.getElementById('modalOverlay');
  overlay.classList.add('show');

  fireEffects(item.rarity);

  document.getElementById('sellBtn').onclick = ()=>{
    setBalance(balance + item.baseValue);
    overlay.classList.remove('show');
  };
  document.getElementById('keepBtn').onclick = ()=>{
    inventory.unshift(item);
    renderInventory();
    overlay.classList.remove('show');
  };
}

/* ============ INVENTORY ============ */
function renderInventory(){
  const grid = document.getElementById('invGrid');
  document.getElementById('invCount').textContent = inventory.length + ' предметов';
  if(inventory.length===0){
    grid.innerHTML = `<div class="inv-empty">Пусто. Открой кейс, чтобы получить первый предмет.</div>`;
    return;
  }
  grid.innerHTML = inventory.map((it)=>{
    const r = rarityOf(it.rarity);
    return `<div class="inv-card">
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${r.hex}"></div>
      <div class="art">${itemSVG(it, r.hex)}</div>
      <div class="nm">${it.family}<br><span style="color:var(--text-faint)">${it.finish}</span></div>
      <div class="vl">${it.baseValue.toLocaleString('ru-RU')}</div>
    </div>`;
  }).join('');
}

/* ============ AMBIENT PARTICLE BACKGROUND ============ */
function initAmbientCanvas(){
  const canvas = document.getElementById('ambientCanvas');
  const ctx = canvas.getContext('2d');
  let w, h, particles;

  function resize(){
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  function makeParticles(){
    const count = Math.min(70, Math.floor((w*h)/22000));
    particles = Array.from({length:count}).map(()=>({
      x:Math.random()*w,
      y:Math.random()*h,
      r:0.6 + Math.random()*1.6,
      vy:0.06 + Math.random()*0.14,
      vx:(Math.random()-0.5)*0.05,
      a:0.15 + Math.random()*0.35,
    }));
  }
  resize(); makeParticles();
  window.addEventListener('resize', ()=>{ resize(); makeParticles(); });

  function tick(){
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = '#c9a227';
    particles.forEach(p=>{
      p.y -= p.vy; p.x += p.vx;
      if(p.y < -5){ p.y = h+5; p.x = Math.random()*w; }
      ctx.globalAlpha = p.a;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  }
  tick();
}

/* ============ INIT ============ */
renderOdds();
renderTicker();
setInterval(renderTicker, 38000);
renderCases();
renderInventory();
setBalance(500);
initAmbientCanvas();

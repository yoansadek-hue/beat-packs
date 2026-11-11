// ---------- catalogue : une carte par titre (toute la discographie), plus les spéciales Holo (un titre) et Icône (un artiste) ----------
// la rareté suit le code couleur des disques : Vinyle (noir), Or, Platine, Diamant
const TIER = {commune:"Vinyle",rare:"Or",epique:"Platine",legendaire:"Diamant"};
const TCOLOR = {commune:"#55555f",rare:"#ffcf3a",epique:"#e3e6ef",legendaire:"#7af0ff"};
const ORDER = ["commune","rare","epique","legendaire"];
// les disques : seuils de certification d'un single dans chaque pays, en millions de streams
const CERT = {US:{or:75,pl:150,dia:1500},UK:{ar:20,or:40,pl:60},FR:{or:15,pl:30,dia:50}};
function disc(country,m){
  const t=CERT[country];
  if(t.dia&&m>=t.dia){const n=Math.floor(m/t.dia);return {lvl:"Diamant",label:n>1?`${n}× Diamant`:"Diamant"}}
  if(m>=t.pl){const n=Math.floor(m/t.pl);return {lvl:"Platine",label:n>1?`${n}× Platine`:"Platine"}}
  if(m>=t.or)return {lvl:"Or",label:"Or"};
  if(t.ar&&m>=t.ar)return {lvl:"Argent",label:"Argent"};
  return {lvl:"",label:"Aucun"};
}
const plat = (country,m) => m/CERT[country].pl; // nombre de disques de platine
// la note vient des streams (1 M → 68, 10 M → 76, 100 M → 84, 1 Md → 92), plus un bonus selon les disques de platine (jusqu'à +4)
const ovrOf = (country,m) => Math.max(50,Math.min(99,Math.round(60+8*(Math.log10(Math.max(.05,m))+1)+Math.min(4,plat(country,m)*.5))));
const tierOf = o => o>=90?"legendaire":o>=83?"epique":o>=75?"rare":"commune";
const slug = s => s.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const hue = s => {let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))%360;return h};
const initials = s => s.replace(/[^\p{L}\p{N} ]/gu,"").split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase()||"♪";
const esc = s => String(s).replace(/[&<>"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));
const rid = () => Math.random().toString(36).slice(2,10);
const any = a => a[Math.floor(Math.random()*a.length)];

const ART={},ALB={},CARD={},TRACKS=[],ICONES=[],POOL={commune:[],rare:[],epique:[],legendaire:[]};
ARTISTS.forEach(a=>{ART[a.id]=a;a.albums=[];a.tracks=[]});
const HOLOS=[];
ALBUMS.forEach(al=>{
  const a=ART[al.ar];ALB[al.id]=al;a.albums.push(al);al.total=0;
  al.tr.forEach(([title,m],i)=>{
    const ovr=ovrOf(a.c,m),c={key:`t:${al.id}:${i}`,kind:"track",alb:al.id,ar:a.id,title,artist:a.n,country:a.c,streams:m,vs:m,ovr,tier:tierOf(ovr)};
    TRACKS.push(c);CARD[c.key]=c;POOL[c.tier].push(c);a.tracks.push(c);al.total+=m;
  });
});
// les Holo : une version brillante (+1) des 5 titres les plus streamés de chaque album, en plus de la carte normale
ALBUMS.forEach(al=>al.tr.map((t,i)=>[t[1],i]).sort((x,y)=>y[0]-x[0]).slice(0,5).forEach(([,i])=>{
  const c=CARD[`t:${al.id}:${i}`],h={...c,key:`h:${al.id}:${i}`,kind:"holo",ovr:Math.min(99,c.ovr+1)};
  CARD[h.key]=h;HOLOS.push(h);
}));
// une Icône vaut au moins 85, et monte jusqu'à 99 avec le total des streams de l'artiste
const TOT=ARTISTS.map(a=>a.tracks.reduce((s,t)=>s+t.streams,0)).filter(Boolean);
const TLO=Math.log10(Math.min(...TOT)),THI=Math.log10(Math.max(...TOT));
ARTISTS.forEach(a=>{
  if(!a.tracks.length)return;
  const best=a.tracks.reduce((x,y)=>y.streams>x.streams?y:x);
  a.cover=a.albums.reduce((x,y)=>y.total>x.total?y:x).id;
  const c={key:`a:${a.id}`,kind:"icone",alb:a.cover,ar:a.id,title:a.n,artist:a.n,country:a.c,streams:Math.round(a.tracks.reduce((s,t)=>s+t.streams,0)),vs:best.streams,ovr:Math.round(85+14*(Math.log10(a.tracks.reduce((s,t)=>s+t.streams,0))-TLO)/(THI-TLO)),tier:"legendaire"};
  ICONES.push(c);CARD[c.key]=c;a.icone=c.key;
});
const holo = t => CARD["h"+t.key.slice(1)]; // undefined si le titre n'a pas de version Holo
const drawHolo = f => any(f?HOLOS.filter(f):HOLOS);
// la valeur vient des disques : 100 pièces + 800 par disque de platine (×2,5 en Holo, ×4 en Icône)
const value = c => Math.round((100+800*plat(c.country,c.vs))*(c.kind==="holo"?2.5:c.kind==="icone"?4:1)/10)*10;
const quick = c => Math.round(value(c)*.6/10)*10;
const weight = c => c.ovr+(c.kind==="icone"?20:c.kind==="holo"?10:0);
const walkout = c => c.kind==="icone"||(c.kind==="holo"?c.ovr>=83:c.ovr>=86); // walkout : 86+ (Holo 83+), et toujours pour une Icône
const labelOf = c => c.kind==="icone"?"Icône":c.kind==="holo"?"Holo":TIER[c.tier];

const ODDS={commune:.62,rare:.27,epique:.09,legendaire:.02};
const PACKS=[
  {key:"3",label:"Pack 3 cartes",size:3,price:2000},
  {key:"5",label:"Pack 5 cartes",size:5,price:3500},
  {key:"10",label:"Pack 10 cartes",size:10,price:6500}
];
// packs spéciaux : on ne les gagne qu'avec les défis de cartes
const SPECIAL={
  sp3:{key:"sp",label:"Pack Spécial",desc:"3 cartes · 1 Or minimum",size:3,guarantee:"rare"},
  fr:{key:"sp",label:"Pack Rap FR",desc:"5 cartes FR · 1 Platine minimum",size:5,country:"FR",guarantee:"epique"},
  us:{key:"sp",label:"Pack Rap US",desc:"5 cartes US · 1 Platine minimum",size:5,country:"US",guarantee:"epique"},
  uk:{key:"sp",label:"Pack Rap UK",desc:"5 cartes UK · 1 Platine minimum",size:5,country:"UK",guarantee:"epique"},
  legend:{key:"sp",label:"Pack Diamant",desc:"5 cartes · 1 Diamant garanti",size:5,guarantee:"legendaire"},
  icone:{key:"sp",label:"Pack Icône",desc:"5 cartes · 1 Icône garantie",size:5,guarantee:"epique",icon:true},
  holo:{key:"sp",label:"Pack Holo",desc:"5 cartes · 2 Holo garanties",size:5,holo:2},
  old:{key:"sp",label:"Pack Old School",desc:"5 cartes d’avant 2005 · 1 Platine minimum",size:5,before:2005,guarantee:"epique"}
};

// ---------- sauvegarde ----------
const today = () => new Date().toLocaleDateString("sv");
const START = () => ({coins:500000,bonus2:1,owned:{},seen:{},vibrate:true,skipWO:false,pseudo:"Joueur"+Math.floor(1000+Math.random()*9000),listings:[],market:null,daily:null,claimed:[],friends:[],usedGifts:[],tick:Date.now()});
let state=START();
try{const s=JSON.parse(localStorage.getItem("beatpacks3"));if(s&&typeof s.coins==="number")state={...state,bonus2:0,...s}}catch(e){}
if(!state.bonus2){state.coins+=400000;state.bonus2=1} // cadeau unique pour les parties déjà commencées
for(const k in state.owned)if(!CARD[k])delete state.owned[k]; // un titre retiré du catalogue
function save(){try{localStorage.setItem("beatpacks3",JSON.stringify(state))}catch(e){}}
function daily(){if(!state.daily||state.daily.date!==today())state.daily={date:today(),packs:0,sold:0,bought:0,hi:0,sbc:0,claimed:[]};return state.daily}
const has = k => (state.owned[k]||0)>0;
const give = k => state.owned[k]=(state.owned[k]||0)+1;
const take = k => {state.owned[k]--;if(state.owned[k]<=0)delete state.owned[k]};
const isNew = k => has(k)&&!state.seen[k];

const $=id=>document.getElementById(id);
const fmt=n=>n.toLocaleString("fr-FR");
function toast(t){const el=$("toast");el.textContent=t;el.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("show"),2400)}
function haptic(p=8){if(state.vibrate&&navigator.vibrate)navigator.vibrate(p)}
function wallet(){$("wallet").textContent=fmt(state.coins);if(!$("s-shop").hidden)renderPacks()}
function earn(n,why){state.coins+=n;save();wallet();toast(`${why?why+" · ":""}+${fmt(n)} pièces`);haptic([10,30,10])}

// ---------- cartes ----------
function coverHTML(id,cls=""){
  const a=ALB[id];
  return `<span class="cov ${cls}" style="--h:${hue(a.t)}">${esc(initials(a.t))}${a.cv?`<img src="${a.cv}" alt="" loading="lazy" onerror="this.remove()">`:""}</span>`;
}
const PLAY='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>';
const fmtStreams=m=>m>=1000?(m/1000).toLocaleString("fr-FR",{maximumFractionDigits:1})+" Md":m>=1?fmt(Math.round(m))+" M":fmt(Math.round(m*1000))+" k";
function cardHTML(c,fresh){
  return `<div class="card ${c.kind==="track"?"t-"+c.tier:"k-"+c.kind}">
    <span class="ovr">${c.ovr}</span>${fresh?`<span class="new">NEW</span>`:""}
    ${c.kind!=="track"?`<span class="kind">${labelOf(c).toUpperCase()}</span>`:""}
    ${coverHTML(c.alb,"art")}
    <div class="nm">${esc(c.kind==="icone"?"Icône":c.title)}</div>
    <div class="ar">${esc(c.artist)}</div>
    <span class="stm">${PLAY}${fmtStreams(c.streams)}</span>
    <div class="glare"></div>
  </div>`;
}
const cw=(c,{fresh=false,qty=0,tap=false,i}={})=>`<div class="cw"${tap?` data-k="${c.key}"`:""}${i!=null?` style="--i:${i}"`:""}>${cardHTML(c,fresh)}${qty>1?`<span class="qty">×${qty}</span>`:""}</div>`;
// les pochettes des packs : les albums de rap les plus streamés au monde, trois par pack
const WORLD=[["Views","beerbongs & bentleys","The Eminem Show"],["ASTROWORLD","Goodbye & Good Riddance","DAMN."],["Curtain Call","Hollywood's Bleeding","2014 Forest Hills Drive"]]
  .map(g=>g.map(t=>ALBUMS.find(a=>a.t.toLowerCase().startsWith(t.toLowerCase()))).filter(Boolean));
const TOPALB=ALBUMS.filter(a=>a.cv&&a.cv.includes("mzstatic")).sort((a,b)=>b.total-a.total);
const COVS={};
PACKS.forEach((p,i)=>{if(WORLD[i]&&WORLD[i].length===3)COVS[p.label]=WORLD[i]});
// packs spéciaux : les plus gros albums du catalogue (du pays du pack s'il en a un)
function packCovers(p){
  const id=p.label;if(COVS[id])return COVS[id];
  const pool=TOPALB.filter(a=>!p.country||ART[a.ar].c===p.country).filter(a=>!p.before||a.y<p.before).slice(0,90),out=[];
  while(out.length<3&&pool.length){const a=pool.splice(Math.floor(Math.random()*pool.length),1)[0];if(!out.some(x=>x.ar===a.ar))out.push(a)}
  return COVS[id]=out;
}
const packHTML=p=>`<div class="pack k-${p.key}"><div class="foil"></div><div class="pcovs">${packCovers(p).map(a=>`<img src="${a.cv}" alt="">`).join("")}</div><div class="logo"><small>BEAT PACKS</small><b>${p.size}</b><small>CARTES</small></div><div class="shine"></div></div>`;
function pickTier(odds){let x=Math.random(),acc=0;for(const r of ORDER){acc+=odds[r];if(x<acc)return r}return "commune"}
function drawTrack(t,f){
  for(let i=ORDER.indexOf(t);i>=0;i--){const p=f?POOL[ORDER[i]].filter(f):POOL[ORDER[i]];if(p.length)return any(p)}
  return any(f?TRACKS.filter(f):TRACKS);
}
const drawIcone = country => any(ICONES.filter(c=>!country||c.country===country));
function drawPack(p){
  const f=p.country||p.before?c=>(!p.country||c.country===p.country)&&(!p.before||ALB[c.alb].y<p.before):null;
  const out=Array.from({length:p.size},()=>{
    if(!p.before&&Math.random()<.004)return drawIcone(p.country);
    const t=drawTrack(pickTier(ODDS),f);
    return Math.random()<.03?drawHolo(f):t;
  });
  if(p.guarantee&&!out.some(c=>c.kind!=="track"||ORDER.indexOf(c.tier)>=ORDER.indexOf(p.guarantee)))out[0]=drawTrack(p.guarantee,f);
  if(p.icon&&!out.some(c=>c.kind==="icone"))out[out.length-1]=drawIcone();
  for(let i=0,n=0;n<(p.holo||0)&&i<out.length;i++)if(out[i].kind==="track"){out[i]=drawHolo(f);n++}
  return out.sort((a,b)=>weight(b)-weight(a)); // la meilleure carte en premier
}

// ---------- boutique : 3 packs, seul le nombre de cartes change ----------
function renderPacks(){
  $("packs").innerHTML=PACKS.map(p=>`<div class="offer p-${p.key}">
    ${packHTML(p)}
    <div class="info">
      <h3>${p.label}</h3><p>${p.size} cartes tirées dans toutes les discographies</p>
      <div class="odds">${ORDER.slice().reverse().map(r=>`<span><i style="background:${TCOLOR[r]}"></i>${TIER[r]} ${Math.round(ODDS[r]*100)}%</span>`).join("")}</div>
      <button class="btn light" data-k="${p.key}" ${state.coins<p.price?"disabled":""}><i class="coin"></i>${fmt(p.price)}</button>
    </div>
  </div>`).join("")+`<p class="note">Les packs spéciaux se gagnent dans les défis de cartes (onglet Défis).</p>`;
  document.querySelectorAll(".offer .btn").forEach(b=>b.onclick=()=>buyPack(b.dataset.k));
}
function buyPack(k){const p=PACKS.find(x=>x.key===k);if(state.coins<p.price)return;state.coins-=p.price;openPack(p)}

// ---------- ouverture façon FIFA 21 : le pack, le tunnel, la walkout si grosse carte, la carte, puis les autres ----------
let run=null;
const open=$("open"),scene=$("scene");
const hint=t=>$("skipHint").textContent=t;
const later=(f,ms)=>run.timers.push(setTimeout(f,ms));
const clearT=()=>{run.timers.forEach(clearTimeout);run.timers=[]};
function openPack(p){
  const cards=drawPack(p),fresh=new Set();
  cards.forEach(c=>{if(!has(c.key))fresh.add(c.key);give(c.key)});
  const d=daily();d.packs++;if(cards.some(walkout))d.hi++;
  save();wallet();badge();
  // toutes les grosses cartes du pack ont leur walkout (2 ou 3 d'affilée, comme les doubles animations de FIFA)
  const wos=state.skipWO?[]:cards.filter(walkout).slice(0,3).reverse();
  run={cards,fresh,best:cards[0],wos,wi:0,phase:"pack",timers:[],step:0};
  open.className="open";$("burst").innerHTML="";
  scene.innerHTML=`<div class="bigpack">${packHTML(p)}</div><b style="font:900 24px var(--font)">${esc(p.label)}</b>`;
  hint("Touche le pack pour l’ouvrir");
  open.hidden=false;
}
function advance(e){
  if(!run)return;
  if(run.phase==="pack"){
    run.phase="busy";hint("");
    const bp=scene.querySelector(".bigpack");bp.classList.add("shake");haptic([15,40,15,40,15]);
    later(()=>bp.classList.replace("shake","go"),500);
    later(tunnel,1000);
  }else if(run.phase==="wo"){clearT();step()}
  else if(run.phase==="card"&&e.target.closest(".reveal")){clearT();nextWalkout()} // il faut toucher la carte pour continuer
}
open.addEventListener("click",e=>{
  if(e.target.closest("button"))return;
  const c=run&&run.phase==="recap"&&e.target.closest(".cw[data-k]");
  if(c){cardSheet(c.dataset.k);haptic();return} // dans le récap, on touche une carte pour la voir, comme sur FIFA
  advance(e);
});
// le tunnel : les lumières foncent vers nous, toujours de la même couleur (rien ne trahit la carte)
// l'indice, comme sur FIFA 21 : au bout du couloir, une simple carte (Vinyle, Or), une carte à cadre (Platine)
// ou une porte de lumière (walkout) ; discret, sans couleur
// couleur de la lumière : celle de la carte (Icône, Holo, sinon sa rareté)
const colorOf = c => c.kind==="track"?c.tier:c.kind;
function tunnel(){
  open.dataset.fl="";
  const h=run.wos.length?"board":run.best.tier==="epique"?"rare":"plain";
  scene.innerHTML=`<div class="flash"></div><div class="endcard h-${h}"></div>`;
  later(()=>scene.querySelector(".flash")?.remove(),520);
  open.classList.add("run");if(h==="board")later(()=>{open.dataset.fl=colorOf(run.wos[run.wos.length-1]);open.classList.add("board")},900);haptic(14);
  later(()=>{open.classList.remove("board");open.dataset.fl=colorOf(run.wos.length?run.wos[run.wos.length-1]:run.best);if(run.wos.length){run.phase="wo";open.classList.replace("run","wo");run.step=0;step()}else{run.cur=run.best;reveal()}},1800);
}
// walkout : le pays, l'artiste, l'album, puis la carte
function step(){
  const c=run.wos[0],a=ALB[c.alb];run.cur=c;
  const steps=[
    `<div class="wstep"><small>Pays</small><strong>${c.country}</strong></div>`,
    `<div class="wstep"><small>Artiste</small><strong>${esc(c.artist)}</strong></div>`,
    c.kind==="icone"
      ?`<div class="wstep"><small>Carte spéciale</small>${coverHTML(a.id,"round")}<strong>Icône</strong></div>`
      :`<div class="wstep"><small>Album · ${a.y}</small><strong style="font-size:min(12vw,64px)">${esc(a.t)}</strong></div>`
  ];
  if(run.step>=steps.length){reveal();return}
  scene.innerHTML=steps[run.step++];
  hint("");haptic(10);
  later(step,1600);
}
function reveal(){
  const c=run.cur;
  run.phase="card";open.classList.remove("run","board");open.classList.add("wo");
  scene.innerHTML=`<div class="reveal">${cw(c,{fresh:run.fresh.has(c.key)})}</div>`;
  if(walkout(c)){burst();haptic([30,40,60])}
  hint("");
  tilt(scene);
}
// plusieurs grosses cartes : quand on touche la carte, elle se retourne et laisse place à une meilleure ; ensuite le récap
function nextWalkout(){
  if(run.wi<run.wos.length-1){
    run.wi++;run.phase="busy";const c=run.wos[run.wi],box=scene.querySelector(".reveal");
    box.classList.remove("flipin");box.classList.add("flipout");haptic([20,30,20]);
    later(()=>{
      run.cur=c;box.innerHTML=cw(c,{fresh:run.fresh.has(c.key)});
      box.classList.replace("flipout","flipin");$("burst").innerHTML="";burst();haptic([30,40,60]);
      later(()=>{run.phase="card"},450);
    },320);
  }else recap();
}
function burst(){
  const cols=[getComputedStyle(open).getPropertyValue("--fl"),"#ffffff","#ff3d8b","#22e0ff","#b6ff3b","#ff8a1f"];
  $("burst").innerHTML=Array.from({length:46},()=>{
    const a=Math.random()*Math.PI*2,d=120+Math.random()*220;
    return `<i style="--x:${Math.cos(a)*d}px;--y:${Math.sin(a)*d}px;--c:${any(cols)};animation-delay:${Math.random()*.15}s"></i>`;
  }).join("");
}
function recap(){
  run.phase="recap";clearT();
  open.classList.remove("run","wo");open.classList.add("recapmode");hint("");
  const seen=new Set(),n=run.cards.length;
  // la grille est calculée pour tenir dans l'écran, sans défilement
  const gap=8,W=Math.min(innerWidth-36,520),H=(visualViewport?.height||innerHeight)-290;
  const size=c=>{const r=Math.ceil(n/c);return Math.floor(Math.min((W-gap*(c-1))/c,((H-gap*(r-1))/r)*.72,170))};
  let cols=1;for(let c=2;c<=Math.min(n,5);c++)if(size(c)>size(cols))cols=c; // le nombre de colonnes qui donne les plus grandes cartes
  const w=size(cols);
  scene.innerHTML=`<div class="recap"><h2>Ton pack</h2><p class="note" style="margin:-10px 0 0">Touche une carte pour la voir, la vendre ou l’offrir.</p><div class="recapgrid" style="grid-template-columns:repeat(${cols},${w}px);gap:${gap}px">${run.cards.map((c,i)=>{const f=run.fresh.has(c.key)&&!seen.has(c.key);seen.add(c.key);return cw(c,{fresh:f,i,tap:true})}).join("")}</div></div><div class="recapbar"><button class="btn go" id="done">Continuer</button></div>`;
  $("done").onclick=closePack;
}
function closePack(){
  open.hidden=true;run=null;scene.innerHTML="";
  renderClub();
  if(state.coins<PACKS[0].price)toast("Plus de pièces ? Vends des cartes ou fais tes défis");
}

// incliner une carte au doigt : le reflet suit
function tilt(box){
  if(box.dataset.tilt)return;box.dataset.tilt=1;
  box.addEventListener("pointermove",e=>{
    const card=box.querySelector(".card");if(!card)return;
    const r=card.getBoundingClientRect(),px=(e.clientX-r.left)/r.width,py=(e.clientY-r.top)/r.height;
    if(px<-.2||px>1.2||py<-.2||py>1.2)return;
    card.style.transition="transform .08s";
    card.style.setProperty("--rx",((.5-py)*18).toFixed(1)+"deg");card.style.setProperty("--ry",((px-.5)*22).toFixed(1)+"deg");
    card.style.setProperty("--mx",(px*100).toFixed(0)+"%");card.style.setProperty("--my",(py*100).toFixed(0)+"%");
  });
  box.addEventListener("pointerleave",()=>box.querySelectorAll(".card").forEach(c=>{c.style.transition="";["--rx","--ry","--mx","--my"].forEach(v=>c.style.removeProperty(v))}));
}

// ---------- feuille du bas : fiche d'une carte (vendre, mettre au marché, offrir) ----------
function sheet(html){$("sheetIn").onclick=null;$("sheetIn").innerHTML=`<button class="xclose" aria-label="Fermer">✕</button>`+html;$("sheet").hidden=false;$("sheetIn").scrollTop=0}
const closeSheet=()=>{$("sheet").hidden=true};
$("sheet").addEventListener("click",e=>{if(e.target.id==="sheet"||e.target.closest(".xclose"))closeSheet()});
tilt($("sheetIn"));
function facts(c){
  const a=ALB[c.alb];
  return `<div class="facts">
    ${c.kind==="icone"?`<div><small>Artiste</small><b>${esc(c.artist)}</b></div><div><small>Titres</small><b>${ART[c.ar].tracks.length}</b></div>`:`<div><small>Album</small><b>${esc(a.t)}</b></div><div><small>Année</small><b>${a.y}</b></div>`}
    <div><small>Streams</small><b>${fmtStreams(c.streams)}</b></div>
    <div><small>Certif. du pays</small><b>${disc(c.country,c.vs).label}</b></div>
    <div><small>Rareté</small><b>${labelOf(c)}</b></div>
    <div><small>Valeur</small><b><i class="coin"></i>${fmt(value(c))}</b></div>
  </div>`;
}
function cardSheet(k){
  const c=CARD[k],q=state.owned[k]||0;
  state.seen[k]=1;save();
  sheet(`${cw(c)}${facts(c)}<div class="acts" id="acts">
    <div class="two"><button class="btn ghost" id="shQuick">Vente rapide · +${fmt(quick(c))}</button><button class="btn cyan" id="shList">Au marché</button></div>
    <button class="btn ghost" id="shGift">Offrir à un ami</button>
    <p class="note" style="text-align:center">Tu possèdes ${q} exemplaire${q>1?"s":""}.</p>
  </div>`);
  $("shQuick").onclick=()=>{take(k);daily().sold++;closeSheet();earn(quick(c),"Vendue");renderClub();badge()};
  $("shList").onclick=()=>priceSheet(k);
  $("shGift").onclick=()=>giftSheet(k);
}
function priceSheet(k){
  const c=CARD[k],v=value(c),lo=Math.max(10,Math.round(v*.5/10)*10),hi=Math.round(v*2/10)*10;
  $("acts").innerHTML=`<div class="pricer"><label><span>Prix</span><b id="prV"></b></label><input type="range" id="prR" min="${lo}" max="${hi}" step="10" value="${v}"><p class="note" id="prN" style="margin:8px 0 0"></p></div>
    <button class="btn" id="prGo">Mettre en vente</button>`;
  const upd=()=>{const p=+$("prR").value,r=p/v;$("prV").textContent=fmt(p)+" pièces";$("prN").textContent=`Tu recevras ${fmt(Math.round(p*.95))} pièces (5 % de taxe). Vente ${r<=.9?"très rapide":r<=1.1?"rapide":r<=1.35?"lente":"très lente"}.`};
  $("prR").oninput=upd;upd();
  $("prGo").onclick=()=>{take(k);state.listings.push({id:rid(),k,price:+$("prR").value,at:Date.now()});save();closeSheet();renderClub();toast("Carte mise en vente au marché");haptic()};
}
const enc=o=>"BP-"+btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/=+$/,"");
const dec=s=>JSON.parse(decodeURIComponent(escape(atob(s.trim().replace(/^BP-/i,"")))));
function giftSheet(k){
  $("acts").innerHTML=`<div class="inrow" style="width:100%"><input type="text" id="gfTo" placeholder="Pour qui ? (pseudo)" maxlength="16"><button class="btn sm" id="gfGo">Créer le code</button></div>
    <p class="note">La carte quitte ta collection. Envoie le code à ton ami : il le colle dans l’onglet Amis.</p>`;
  $("gfGo").onclick=()=>{
    const to=$("gfTo").value.trim()||"Un ami",code=enc({k,f:state.pseudo,n:rid()});
    take(k);addFriend(to,"sent");save();renderClub();
    $("acts").innerHTML=`<div class="code">${code}</div><button class="btn" id="gfCopy">Copier le code</button>`;
    $("gfCopy").onclick=()=>{navigator.clipboard?.writeText(code).then(()=>toast("Code copié"),()=>{});};
  };
}
function addFriend(name,dir){let f=state.friends.find(x=>x.name.toLowerCase()===name.toLowerCase());if(!f){f={name,sent:0,recv:0};state.friends.push(f)}f[dir]++}

// ---------- collection : mes artistes → tous leurs albums → toutes les cartes de l'album ----------
const club={view:"artists",ar:null,alb:null,q:""};
const albumOwned=al=>al.tr.filter((_,i)=>has(`t:${al.id}:${i}`)||has(`h:${al.id}:${i}`)).length;
const uniq=()=>TRACKS.filter(t=>has(t.key)||has(holo(t)?.key)).length;
const albumDone=al=>albumOwned(al)===al.tr.length;
function myArtists(){
  const n={},fresh={};
  for(const k in state.owned){const c=CARD[k];n[c.ar]=(n[c.ar]||0)+1;if(!state.seen[k])fresh[c.ar]=1}
  return {n,fresh};
}
function renderClub(){
  if($("s-club").hidden)return;
  const el=$("club");let html="";
  if(club.view==="artists"){
    const {n,fresh}=myArtists(),q=slug(club.q);
    const list=ARTISTS.filter(a=>n[a.id]&&(!q||slug(a.n).includes(q))).sort((a,b)=>n[b.id]-n[a.id]);
    html=`<div class="titlerow"><h1>Collection</h1><span class="count-big"><b>${uniq()}</b> / ${fmt(TRACKS.length)}</span></div>
      <input type="search" id="search" class="search" placeholder="Rechercher un artiste" value="${esc(club.q)}" autocomplete="off">
      ${list.length?`<div class="agrid">${list.map(a=>`<button class="atile" data-ar="${a.id}">${fresh[a.id]?`<i class="dot"></i>`:""}${coverHTML(a.cover)}<b>${esc(a.n)}</b><small>${n[a.id]} carte${n[a.id]>1?"s":""}</small></button>`).join("")}</div>`
        :`<p class="empty">${Object.keys(state.owned).length?"Aucun artiste ne correspond.":"Ta collection est vide : ouvre un pack dans la Boutique."}</p>`}`;
  }else if(club.view==="artist"){
    const a=ART[club.ar],own=a.tracks.filter(t=>has(t.key)||has(holo(t)?.key)).length,ic=CARD[a.icone];
    html=`<button class="back" data-back="artists">‹ Mes artistes</button>
      <div class="ahero">${coverHTML(a.cover)}<div><h1>${esc(a.n)}</h1><small>${a.albums.length} albums · ${own}/${a.tracks.length} titres</small></div></div>
      <div class="alist">
        <button class="arow${has(ic.key)?" done":""}" data-icone="1">${coverHTML(a.cover)}<div class="at"><b>Carte Icône</b><small>${has(ic.key)?"Obtenue":"Pas encore obtenue"}</small></div></button>
        ${a.albums.map(al=>{const o=albumOwned(al);return `<button class="arow${o===al.tr.length?" done":""}" data-alb="${al.id}">${coverHTML(al.id)}<div class="at"><b>${esc(al.t)}</b><small>${al.y} · ${o}/${al.tr.length} titres</small><div class="bar"><i style="width:${o/al.tr.length*100}%"></i></div></div></button>`}).join("")}
      </div>`;
  }else{
    const a=ART[club.ar],al=ALB[club.alb];
    if(club.alb==="icone"){
      const ic=CARD[a.icone];
      html=`<button class="back" data-back="artist">‹ ${esc(a.n)}</button><h1>Carte Icône</h1><div class="grid">${has(ic.key)?cw(ic,{qty:state.owned[ic.key],tap:true,fresh:isNew(ic.key)}):`<div class="cw"><div class="card ghost"><b>★</b><span>${esc(a.n)}</span></div></div>`}</div>`;
    }else{
      const mine=[],miss=[];
      al.tr.forEach((tr,i)=>{const t=CARD[`t:${al.id}:${i}`];if(has(t.key))mine.push(cw(t,{qty:state.owned[t.key],tap:true,fresh:isNew(t.key)}));else miss.push(`<div class="cw"><div class="card ghost"><b>#${i+1}</b><span>${esc(tr[0])}</span></div></div>`)});
      const holos=al.tr.map((_,i)=>CARD[`h:${al.id}:${i}`]).filter(h=>h&&has(h.key)).map(h=>cw(h,{qty:state.owned[h.key],tap:true,fresh:isNew(h.key)})).join("");
      html=`<button class="back" data-back="artist">‹ ${esc(a.n)}</button>
        <div class="ahero alb">${coverHTML(al.id)}<div><h1 style="font-size:26px">${esc(al.t)}</h1><small>${esc(a.n)} · ${al.y} · ${albumOwned(al)}/${al.tr.length} titres</small></div></div>
        <div class="grid">${mine.join("")}${holos}${miss.join("")}</div>`;
    }
  }
  el.innerHTML=html;
  if($("search"))$("search").oninput=e=>{club.q=e.target.value;const p=e.target.selectionStart;renderClub();$("search").focus();$("search").setSelectionRange(p,p)};
}
$("club").onclick=e=>{
  const t=e.target;
  const b=t.closest("[data-back]");if(b){club.view=b.dataset.back;renderClub();scrollTo(0,0);return}
  const ar=t.closest("[data-ar]");if(ar){club.view="artist";club.ar=ar.dataset.ar;renderClub();scrollTo(0,0);haptic();return}
  const al=t.closest("[data-alb]");if(al){club.view="album";club.alb=al.dataset.alb;renderClub();markSeen();scrollTo(0,0);haptic();return}
  if(t.closest("[data-icone]")){club.view="album";club.alb="icone";renderClub();markSeen();scrollTo(0,0);return}
  const c=t.closest(".cw[data-k]");if(c){cardSheet(c.dataset.k);haptic()}
};
// les cartes d'un album perdent leur NEW une fois l'album ouvert
function markSeen(){$("club").querySelectorAll(".cw[data-k]").forEach(el=>state.seen[el.dataset.k]=1);save()}

// ---------- marché : acheter les offres des autres joueurs, vendre les siennes ----------
const SELLERS=["Lyricist","BeatHunter","NightDrive","Mixtape93","DripKing","LDN_Flow","Vinyl_Joe","Bassline","ParisFlow","Trap_Lord","GrimeTime","Studio_B"];
const REFRESH=10*60e3,REFRESH_COST=1000;
let mkt="buy";
function market(){if(!state.market||Date.now()-state.market.at>REFRESH)newOffers();return state.market}
function newOffers(){
  state.market={at:Date.now(),offers:Array.from({length:10},()=>{
    let c;if(Math.random()<.04)c=drawIcone();else{const t=drawTrack(pickTier({commune:.3,rare:.35,epique:.25,legendaire:.1}));c=Math.random()<.06?drawHolo():t}
    return {id:rid(),k:c.key,price:Math.round(value(c)*(.9+Math.random()*.45)/10)*10,seller:any(SELLERS)};
  }).sort((a,b)=>b.price-a.price)};
  save();
}
function renderMarket(){
  if($("s-market").hidden)return;
  $("mktBuy").hidden=mkt!=="buy";$("mktSell").hidden=mkt!=="sell";
  $("mktSeg").querySelectorAll("button").forEach(b=>{b.setAttribute("aria-pressed",b.dataset.m===mkt);if(b.dataset.m==="sell")b.textContent=`Mes ventes (${state.listings.length})`});
  const m=market();
  $("mktRefresh").innerHTML=`Actualiser · <i class="coin"></i>${fmt(REFRESH_COST)}`;$("mktRefresh").disabled=state.coins<REFRESH_COST;
  $("mktOffers").innerHTML=m.offers.length?m.offers.map(o=>{const c=CARD[o.k];return `<div class="mrow">${cw(c,{tap:true})}<div class="mi"><b>${esc(c.kind==="icone"?"Icône "+c.artist:c.title)}</b><small>${esc(c.artist)} · ${labelOf(c)} ${c.ovr}</small><small>${disc(c.country,c.vs).label!=="Aucun"?"Disque "+disc(c.country,c.vs).label+" · ":""}Vendu par ${o.seller}</small></div><button class="btn sm" data-buy="${o.id}" ${state.coins<o.price?"disabled":""}><i class="coin"></i>${fmt(o.price)}</button></div>`}).join(""):`<p class="empty">Tout est parti ! Reviens dans quelques minutes.</p>`;
  $("mktListings").innerHTML=state.listings.length?state.listings.map(l=>{const c=CARD[l.k];return `<div class="mrow">${cw(c,{tap:true})}<div class="mi"><b>${esc(c.title)}</b><small>En vente · ${fmt(l.price)} pièces</small><small>Valeur ${fmt(value(c))}</small></div><button class="btn sm ghost" data-cancel="${l.id}">Retirer</button></div>`}).join(""):`<p class="empty">Aucune carte en vente.</p>`;
  mktTimer();
}
function mktTimer(){if(!state.market)return;const s=Math.max(0,Math.ceil((state.market.at+REFRESH-Date.now())/1000));$("mktTimer").textContent=`Nouvelles offres dans ${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;if(s===0)renderMarket()}
$("mktSeg").onclick=e=>{const b=e.target.closest("button");if(b){mkt=b.dataset.m;renderMarket()}};
$("mktRefresh").onclick=()=>{if(state.coins<REFRESH_COST)return;state.coins-=REFRESH_COST;newOffers();wallet();renderMarket();haptic()};
$("s-market").onclick=e=>{
  const buy=e.target.closest("[data-buy]"),cancel=e.target.closest("[data-cancel]"),card=e.target.closest(".cw[data-k]");
  if(buy){const m=state.market,o=m.offers.find(x=>x.id===buy.dataset.buy);if(!o||state.coins<o.price)return;
    state.coins-=o.price;give(o.k);m.offers=m.offers.filter(x=>x!==o);daily().bought++;save();wallet();renderMarket();badge();toast(`${CARD[o.k].title} rejoint ta collection`);haptic([10,30,10]);return}
  if(cancel){const l=state.listings.find(x=>x.id===cancel.dataset.cancel);if(!l)return;give(l.k);state.listings=state.listings.filter(x=>x!==l);save();renderMarket();toast("Carte retirée du marché");return}
  if(card){const c=CARD[card.dataset.k];sheet(`${cw(c)}${facts(c)}<button class="btn ghost" onclick="closeSheet()">Fermer</button>`)}
};
// des acheteurs passent : plus le prix est bas par rapport à la valeur, plus la carte part vite
function tickListings(){
  const now=Date.now(),n=Math.min(2000,Math.floor((now-(state.tick||now))/3000));
  if(n<1)return;state.tick=(state.tick||now)+n*3000;
  const sold=[];
  state.listings=state.listings.filter(l=>{
    const c=CARD[l.k];if(!c)return false;
    const p=Math.max(.004,Math.min(.25,.24*(1.5-l.price/value(c))));
    if(Math.random()<1-Math.pow(1-p,n)){sold.push(l);return false}return true;
  });
  if(sold.length){
    const g=sold.reduce((s,l)=>s+Math.round(l.price*.95),0);
    daily().sold+=sold.length;
    earn(g,sold.length>1?`${sold.length} cartes vendues`:`${CARD[sold[0].k].title} vendue`);
    renderMarket();badge();
  }else save();
}

// ---------- défis de cartes : on donne des cartes, on gagne un pack spécial ----------
const avg=cs=>cs.reduce((s,c)=>s+c.ovr,0)/cs.length;
const SBC=[
  {id:"swap",t:"Échange",d:"3 cartes au choix",n:3,ok:()=>true,rw:"sp3",c1:"#22e0ff",c2:"#4361ee"},
  {id:"fr",t:"Rap FR",d:"5 cartes d’artistes français",n:5,ok:c=>c.country==="FR",rw:"fr",c1:"#2f6bff",c2:"#ff4d6d"},
  {id:"us",t:"Rap US",d:"5 cartes d’artistes américains",n:5,ok:c=>c.country==="US",rw:"us",c1:"#ff4d6d",c2:"#3a3b8f"},
  {id:"uk",t:"Rap UK",d:"5 cartes d’artistes anglais",n:5,ok:c=>c.country==="UK",rw:"uk",c1:"#3a7bff",c2:"#c8102e"},
  {id:"same",t:"Même artiste",d:"4 cartes du même artiste",n:4,ok:()=>true,check:cs=>new Set(cs.map(c=>c.ar)).size===1,rule:"Toutes du même artiste",rw:"icone",c1:"#ff3d8b",c2:"#7b2ff7"},
  {id:"avg",t:"Note 85",d:"5 cartes, note moyenne de 85 ou plus",n:5,ok:()=>true,check:cs=>avg(cs)>=85,rule:"Note moyenne ≥ 85",rw:"legend",c1:"#ffd23f",c2:"#e8590c"},
  {id:"dia",t:"Disques de diamant",d:"3 titres certifiés Diamant",n:3,ok:c=>disc(c.country,c.vs).lvl==="Diamant",rw:"holo",c1:"#7af0ff",c2:"#8a5cff"},
  {id:"old",t:"Old School",d:"4 cartes d’albums sortis avant 2005",n:4,ok:c=>ALB[c.alb].y<2005,rw:"old",c1:"#b6ff3b",c2:"#0b5e4a"}
];
let sbcSel=[];
function sbcSheet(id){sbcSel=[];drawSbc(id)}
function eligible(s){return Object.keys(state.owned).map(k=>CARD[k]).filter(s.ok).sort((a,b)=>value(a)-value(b))}
function drawSbc(id){
  const s=SBC.find(x=>x.id===id),cs=sbcSel.map(k=>CARD[k]),full=cs.length===s.n,ok=full&&(!s.check||s.check(cs));
  const reqs=[[`${s.n} cartes (${cs.length}/${s.n})`,full],s.check?[s.rule,cs.length>0&&s.check(cs)]:[s.d,full]];
  const el=eligible(s),cnt={};sbcSel.forEach(k=>cnt[k]=(cnt[k]||0)+1);
  sheet(`<h2>${esc(s.t)}</h2><p class="note" style="align-self:flex-start;margin:-6px 0 0">Récompense : <b style="color:#fff">${SPECIAL[s.rw].label}</b> (${SPECIAL[s.rw].desc}). Les cartes données quittent ta collection.</p>
    <div class="reqs">${reqs.map(([t,v])=>`<div class="req${v?" ok":""}"><i>${v?"✓":""}</i>${esc(t)}</div>`).join("")}</div>
    <div class="slots">${Array.from({length:s.n},(_,i)=>sbcSel[i]?`<div data-un="${i}">${cw(CARD[sbcSel[i]])}</div>`:`<div class="slot">${i+1}</div>`).join("")}</div>
    <div class="acts"><div class="two"><button class="btn ghost" id="sbAuto">Remplir auto</button><button class="btn" id="sbGo" ${ok?"":"disabled"}>Valider</button></div></div>
    <h2 style="font-size:17px">Tes cartes éligibles (${el.length})</h2>
    ${el.length?`<div class="picker">${el.map(c=>`<div class="cw${cnt[c.key]?" sel":""}${!cnt[c.key]&&full?" off":""}" data-pick="${c.key}">${cardHTML(c)}${cnt[c.key]?`<span class="qty">${cnt[c.key]}/${state.owned[c.key]}</span>`:state.owned[c.key]>1?`<span class="qty">×${state.owned[c.key]}</span>`:""}</div>`).join("")}</div>`:`<p class="empty" style="width:100%">Aucune carte éligible pour l’instant.</p>`}`);
  $("sheetIn").onclick=e=>{
    const p=e.target.closest("[data-pick]"),u=e.target.closest("[data-un]");
    if(p){const k=p.dataset.pick,c=cnt[k]||0;if(c<state.owned[k]&&sbcSel.length<s.n)sbcSel.push(k);else if(c)sbcSel.splice(sbcSel.lastIndexOf(k),1);haptic(6);drawSbc(id);return}
    if(u){sbcSel.splice(+u.dataset.un,1);drawSbc(id);return}
    if(e.target.closest("#sbAuto")){sbcSel=autoFill(s);if(sbcSel.length<s.n)toast("Pas assez de cartes éligibles");drawSbc(id);return}
    if(e.target.closest("#sbGo")&&ok){
      sbcSel.forEach(take);daily().sbc++;save();closeSheet();$("sheetIn").onclick=null;sbcSel=[];
      renderQuests();badge();toast(`Défi réussi : ${SPECIAL[s.rw].label} !`);openPack(SPECIAL[s.rw]);
    }
  };
}
// remplit le défi avec les cartes les moins chères qui le valident
function autoFill(s){
  const copies=[];eligible(s).forEach(c=>{for(let i=0;i<state.owned[c.key];i++)copies.push(c)});
  let pick=[];
  if(s.id==="same"){const by={};copies.forEach(c=>(by[c.ar]??=[]).push(c));const g=Object.values(by).filter(x=>x.length>=s.n).map(x=>x.slice(0,s.n)).sort((a,b)=>a.reduce((t,c)=>t+value(c),0)-b.reduce((t,c)=>t+value(c),0))[0];pick=g||[]}
  else if(s.id==="avg")pick=copies.filter(c=>c.ovr>=85).slice(0,s.n);
  else pick=copies.slice(0,s.n);
  return pick.map(c=>c.key);
}

// ---------- défis du jour et albums : ils rapportent des pièces ----------
const DAILY=[
  {id:"login",t:"Connexion du jour",goal:1,get:()=>1,r:30000},
  {id:"packs",t:"Ouvre 3 packs",goal:3,get:d=>d.packs,r:45000},
  {id:"sold",t:"Vends 3 cartes",goal:3,get:d=>d.sold,r:30000},
  {id:"bought",t:"Achète une carte au marché",goal:1,get:d=>d.bought,r:30000},
  {id:"sbc",t:"Termine un défi de cartes",goal:1,get:d=>d.sbc,r:60000},
  {id:"hi",t:"Obtiens une walkout (carte 86+, Holo 83+ ou Icône)",goal:1,get:d=>d.hi,r:45000}
];
function quests(){
  const d=daily(),list=[];
  DAILY.forEach(q=>list.push({sec:"day",id:q.id,t:q.t,goal:q.goal,v:Math.min(q.goal,q.get(d)),r:q.r,got:d.claimed.includes(q.id)}));
  return list;
}
const ready=q=>!q.got&&q.v>=q.goal;
function badge(){$("questBadge").hidden=!quests().some(ready)}
function renderQuests(){
  if($("s-quests").hidden)return;
  const all=quests(),row=q=>`<div class="quest${q.got?" got":""}">${q.al?coverHTML(q.al.id):""}<div class="qi"><b>${esc(q.t)}</b><div class="bar"><i style="width:${q.v/q.goal*100}%"></i></div><small>${q.v}/${q.goal} · <i class="coin"></i>${fmt(q.r)}</small></div>${q.got?`<span class="note" style="margin:0">Reçu ✓</span>`:`<button class="btn sm" data-claim="${q.id}" ${ready(q)?"":"disabled"}>Récupérer</button>`}</div>`;
  $("quests").innerHTML=`<h2 style="margin-top:4px">Défis de cartes</h2><p class="note">Donne des cartes de ta collection pour gagner un pack spécial. Tu peux les refaire autant que tu veux.</p>
    <div class="sbcs">${SBC.map(s=>`<button class="sbc" data-sbc="${s.id}" style="--c1:${s.c1};--c2:${s.c2}"><b>${esc(s.t)}</b><small>${esc(s.d)}</small><span class="rw">${SPECIAL[s.rw].label}</span></button>`).join("")}</div>
    ${all.some(ready)?`<button class="btn" id="claimAll" style="margin-top:22px">Tout récupérer · <i class="coin"></i>${fmt(all.filter(ready).reduce((t,q)=>t+q.r,0))}</button>`:""}
    <h2>Défis du jour</h2><p class="note">Ils reviennent chaque jour à minuit.</p>${all.filter(q=>q.sec==="day").map(row).join("")}
`;
}
$("quests").onclick=e=>{
  const s=e.target.closest("[data-sbc]");if(s){sbcSheet(s.dataset.sbc);haptic();return}
  if(e.target.closest("#claimAll")){const rs=quests().filter(ready);rs.forEach(q=>(q.sec==="day"?daily().claimed:state.claimed).push(q.id));earn(rs.reduce((t,q)=>t+q.r,0),`${rs.length} défis récupérés`);renderQuests();badge();return}
  const b=e.target.closest("[data-claim]");if(!b)return;
  const q=quests().find(x=>x.id===b.dataset.claim);if(!q||!ready(q))return;
  (q.sec==="day"?daily().claimed:state.claimed).push(q.id);
  earn(q.r,"Défi réussi");renderQuests();badge();
};

// ---------- amis : offrir et recevoir des cartes par code ----------
function renderFriends(){
  if($("s-friends").hidden)return;
  const best=Object.keys(state.owned).map(k=>CARD[k]).sort((a,b)=>weight(b)-weight(a))[0];
  const total=Object.values(state.owned).reduce((s,n)=>s+n,0);
  $("profile").innerHTML=`<span class="avatar">${esc(state.pseudo[0]||"?").toUpperCase()}</span><div><b>${esc(state.pseudo)}</b><small>${total} cartes · ${ALBUMS.filter(albumDone).length} albums complets</small>${best?`<small>Meilleure carte : ${esc(best.title)} (${best.ovr})</small>`:""}</div>`;
  $("friends").innerHTML=state.friends.length?state.friends.map(f=>`<div class="friend"><span class="avatar">${esc(f.name[0]||"?").toUpperCase()}</span><div><b>${esc(f.name)}</b><small>${f.sent} envoyée${f.sent>1?"s":""} · ${f.recv} reçue${f.recv>1?"s":""}</small></div></div>`).join(""):`<p class="empty">Offre ou reçois une carte pour ajouter un ami.</p>`;
}
$("giftGo").onclick=()=>{
  let g;try{g=dec($("giftIn").value)}catch(e){}
  if(!g||!CARD[g.k]||!g.n)return toast("Code invalide");
  if(state.usedGifts.includes(g.n))return toast("Ce code a déjà été utilisé");
  state.usedGifts.push(g.n);give(g.k);addFriend(String(g.f||"Un ami").slice(0,16),"recv");save();
  $("giftIn").value="";renderFriends();badge();haptic([20,40,20]);
  sheet(`<h2>Cadeau de ${esc(g.f||"un ami")}</h2>${cw(CARD[g.k],{fresh:true})}<button class="btn" onclick="closeSheet()">Super</button>`);
};

// ---------- paramètres ----------
$("optPseudo").value=state.pseudo;
$("optPseudo").onchange=e=>{state.pseudo=e.target.value.trim().slice(0,16)||state.pseudo;e.target.value=state.pseudo;save()};
$("optVibrate").checked=state.vibrate;
$("optVibrate").onchange=e=>{state.vibrate=e.target.checked;save()};
$("optSkip").checked=state.skipWO;
$("optSkip").onchange=e=>{state.skipWO=e.target.checked;save()};
$("reset").onclick=()=>{
  if(!confirm("Effacer ta collection et repartir avec 500 000 pièces ?"))return;
  state={...START(),vibrate:state.vibrate,skipWO:state.skipWO,pseudo:state.pseudo};save();wallet();badge();toast("Nouvelle partie");
};
$("foot").textContent=`${ARTISTS.length} artistes · ${fmt(ALBUMS.length)} albums · ${fmt(TRACKS.length)} titres · pochettes Apple Music`;

// ---------- écrans ----------
const SCREENS=["s-market","s-friends","s-shop","s-quests","s-settings","s-club"];
function show(id){
  SCREENS.forEach(s=>$(s).hidden=s!==id);
  $("btnClub").classList.toggle("on",id==="s-club");
  if(id==="s-club"){TABS.forEach(b=>b.classList.remove("on"));pillTo(null)}
  ({"s-shop":renderPacks,"s-club":renderClub,"s-market":renderMarket,"s-quests":renderQuests,"s-friends":renderFriends})[id]?.();
  scrollTo(0,0);
}
$("btnClub").onclick=()=>{haptic();club.view="artists";show("s-club")};

// ---------- barre d'onglets du bas : la bulle de verre s'étire en glissant d'un onglet à l'autre,
// grossit comme une loupe sous le doigt et suit le doigt quand on la fait glisser ----------
const bar=$("tabbar"),pill=$("tabPill"),TABS=[...bar.querySelectorAll(".tab")];
const P={x:0,shown:false,anim:null};
const still=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
const place=(x,sx=1,sy=1)=>{P.x=x;pill.style.transform=`translate3d(${x}px,0,0) scale(${sx},${sy})`};
function pillTo(t,from){
  if(!t){pill.classList.remove("show");P.shown=false;return}
  const x=t.offsetLeft,w=t.offsetWidth,x0=from??P.x;
  pill.style.width=w+"px";
  if(P.anim){P.anim.cancel();P.anim=null}
  if(P.shown&&Math.abs(x-x0)>1&&!still()){
    const d=Math.abs(x-x0),k=Math.min(.55,d/(w*2.6));
    P.anim=pill.animate([
      {transform:`translate3d(${x0}px,0,0) scale(1,1)`},
      {offset:.42,transform:`translate3d(${x0+(x-x0)*.58}px,0,0) scale(${1+k},${1-k*.32})`},
      {offset:.8,transform:`translate3d(${x+(x-x0)*.02}px,0,0) scale(${1-k*.08},${1+k*.06})`},
      {transform:`translate3d(${x}px,0,0) scale(1,1)`}
    ],{duration:380+Math.min(180,d*.5),easing:"cubic-bezier(.22,.8,.3,1)"});
    P.anim.onfinish=()=>(P.anim=null);
  }
  place(x);
  pill.classList.add("show");P.shown=true;
}
let drag=null;
function dragLoop(){
  if(!drag)return;
  if(drag.moved){
    const w=pill.offsetWidth,g=drag.geo,lo=g[0].x,hi=g[g.length-1].x,raw=drag.cx-drag.left-w/2;
    // au-delà du premier ou du dernier onglet : la bulle résiste et la barre s'étire de ce côté
    const out=raw<lo?raw-lo:raw>hi?raw-hi:0;
    const x=out?(out<0?lo:hi)+Math.max(-14,Math.min(14,out*.12)):raw;
    if(!!out!==drag.edge){drag.edge=!!out;if(out)haptic()}
    if(out){bar.style.transformOrigin=out<0?"right center":"left center";bar.style.scale=`${1+Math.min(.045,Math.abs(out)/bar.offsetWidth*.2)} 1`}
    else bar.style.scale="";
    drag.v*=.82;
    const k=Math.min(.4,Math.abs(drag.v)*.09);
    place(x,1+k,1-k*.3);
    const mid=x+w/2,over=g.reduce((a,b)=>Math.abs(mid-(b.x+b.w/2))<Math.abs(mid-(a.x+a.w/2))?b:a).t;
    if(over!==drag.over){drag.over.classList.remove("over");over.classList.add("over");drag.over=over;haptic()}
  }
  requestAnimationFrame(dragLoop);
}
bar.addEventListener("pointerdown",e=>{
  const t=e.target.closest(".tab");if(!t||(e.pointerType==="mouse"&&e.button!==0))return;
  drag={id:e.pointerId,x0:e.clientX,cx:e.clientX,t:performance.now(),v:0,left:bar.getBoundingClientRect().left,moved:false,edge:false,tab:t,over:t,geo:TABS.map(b=>({t:b,x:b.offsetLeft,w:b.offsetWidth}))};
  try{bar.setPointerCapture(e.pointerId)}catch(err){}
  bar.classList.add("press");
  pillTo(t);
  requestAnimationFrame(dragLoop);
});
bar.addEventListener("pointermove",e=>{
  if(!drag||e.pointerId!==drag.id)return;
  if(!drag.moved&&Math.abs(e.clientX-drag.x0)<5)return;
  if(!drag.moved){drag.moved=true;bar.classList.add("drag");if(P.anim){P.anim.cancel();P.anim=null}}
  const now=performance.now(),dt=Math.max(1,now-drag.t);
  drag.v=drag.v*.4+((e.clientX-drag.cx)/dt)*.6;drag.cx=e.clientX;drag.t=now;
});
function dragEnd(e,cancel){
  if(!drag||e.pointerId!==drag.id)return;
  const t=cancel?null:drag.moved?drag.over:drag.tab,d0=drag;
  drag=null;
  bar.classList.remove("press","drag");TABS.forEach(b=>b.classList.remove("over"));
  bar.style.scale="";
  if(t){if(!d0.moved&&!t.classList.contains("on"))haptic();TABS.forEach(b=>b.classList.toggle("on",b===t));pillTo(t,P.x);show(t.dataset.go)}
  else pillTo(bar.querySelector(".tab.on"),P.x);
}
bar.addEventListener("pointerup",e=>dragEnd(e,false));
bar.addEventListener("pointercancel",e=>dragEnd(e,true));
// clavier : Entrée / Espace sur un onglet
bar.addEventListener("click",e=>{const t=e.target.closest(".tab");if(t&&e.detail===0){TABS.forEach(b=>b.classList.toggle("on",b===t));pillTo(t);show(t.dataset.go)}});
addEventListener("resize",()=>pillTo(bar.querySelector(".tab.on")));

// ---------- démarrage ----------
wallet();renderPacks();badge();tickListings();
setInterval(tickListings,3000);
setInterval(()=>{if(!$("s-market").hidden)mktTimer()},1000);
setInterval(()=>{if(state.daily&&state.daily.date!==today()){badge();renderQuests()}},60e3);
requestAnimationFrame(()=>pillTo(bar.querySelector(".tab.on")));
document.fonts&&document.fonts.ready.then(()=>pillTo(bar.querySelector(".tab.on")));

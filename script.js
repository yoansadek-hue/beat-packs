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
// valeur au marché, comme les prix moyens de FIFA selon la note : ~400 à 75, ~1 000 à 81, ~9 000 à 86, ~55 000 à 90, plus d'un million à 99
const FIFA={75:400,76:450,77:500,78:600,79:700,80:850,81:1000,82:1300,83:1800,84:3000,85:5000,86:9000,87:15000,88:24000,89:35000,90:55000,91:75000,92:100000,93:140000,94:200000,95:300000,96:450000,97:650000,98:900000,99:1300000};
const baseValue = o => o>=75?FIFA[Math.min(99,o)]:o>=70?300+(o-70)*20:o>=65?200:o>=60?150:100;
const value = c => Math.round(baseValue(c.ovr)*(c.kind==="holo"?1.5:c.kind==="icone"?2:1)/10)*10;
const quick = c => Math.max(10,Math.round(value(c)*.25/10)*10); // la vente rapide rapporte peu, comme sur FIFA
const weight = c => c.ovr+(c.kind==="icone"?.2:c.kind==="holo"?.1:0); // on range par note, la couleur ne sert qu'à départager une égalité
const walkout = c => c.kind==="icone"||(c.kind==="holo"?c.ovr>=83:c.ovr>=86); // walkout : 86+ (Holo 83+), et toujours pour une Icône
const labelOf = c => c.kind==="icone"?"Icône":c.kind==="holo"?"Holo":TIER[c.tier];

const ODDS={commune:.62,rare:.27,epique:.09,legendaire:.02};
const PACKS=[
  {key:"3",label:"Pack 3 cartes",size:3,price:10000},
  {key:"5",label:"Pack 6 cartes",size:6,price:20000},
  {key:"10",label:"Pack 12 cartes",size:12,price:38000}
];
// packs spéciaux : on ne les gagne qu'avec les défis de cartes
const SPECIAL={
  sp3:{key:"sp",label:"Pack Spécial",desc:"2 cartes · 1 Or minimum",size:2,guarantee:"rare"},
  fr:{key:"sp",label:"Pack Rap FR",desc:"3 cartes FR · 1 Platine minimum",size:3,country:"FR",guarantee:"epique"},
  us:{key:"sp",label:"Pack Rap US",desc:"3 cartes US · 1 Platine minimum",size:3,country:"US",guarantee:"epique"},
  uk:{key:"sp",label:"Pack Rap UK",desc:"3 cartes UK · 1 Platine minimum",size:3,country:"UK",guarantee:"epique"},
  legend:{key:"sp",label:"Pack Diamant",desc:"1 carte Diamant",size:1,guarantee:"legendaire"},
  icone:{key:"sp",label:"Pack Icône",desc:"1 carte Icône",size:1,icon:true},
  holo:{key:"sp",label:"Pack Holo",desc:"1 carte Holo",size:1,holo:1},
  old:{key:"sp",label:"Pack Old School",desc:"3 cartes d’avant 2005 · 1 Platine minimum",size:3,before:2005,guarantee:"epique"},
  newgen:{key:"sp",label:"Pack Nouvelle vague",desc:"3 cartes sorties depuis 2023 · 1 Platine minimum",size:3,after:2023,guarantee:"epique"},
  // choix de cartes : on en voit 3, on en garde 1
  pickDia:{key:"sp",label:"Choix Diamant",desc:"Choisis 1 Diamant parmi 3",pick:"legendaire"},
  pickIco:{key:"sp",label:"Choix Icône",desc:"Choisis 1 Icône parmi 3",pick:"icone"},
  pickHolo:{key:"sp",label:"Choix Holo",desc:"Choisis 1 Holo parmi 3",pick:"holo"}
};
// ce que peut rapporter un défi : un pack spécial ou un pack de la boutique
const REWARD={...SPECIAL,p3:PACKS[0],p6:PACKS[1],p12:PACKS[2]};
const rewardOf=k=>PACKS.find(p=>p.key===k)||REWARD[k];
// ouvre une récompense : un pack, ou un choix de cartes
function openReward(rw){if(rw.pick)pickSheet(rw);else openPack(rw)}
function pickSheet(rw){
  const pool=rw.pick==="icone"?ICONES:rw.pick==="holo"?HOLOS:POOL.legendaire,ch=[];
  while(ch.length<3){const c=any(pool);if(!ch.includes(c))ch.push(c)}
  SFX.board();haptic([30,40,30]);
  sheet(`<h2>${rw.label}</h2><p class="note" style="margin:-6px 0 0">Touche la carte que tu veux garder.</p><div class="picks">${ch.map((c,i)=>`<div class="pickc" style="--i:${i}" data-pk="${c.key}">${cw(c,{fresh:!has(c.key)})}<small>${fmt(value(c))} pièces</small></div>`).join("")}</div>`);
  $("sheetIn").onclick=e=>{const p=e.target.closest("[data-pk]");if(!p)return;const c=CARD[p.dataset.pk];give(c.key);save();SFX.bigReveal();closeSheet();toast(`${c.kind==="icone"?"Icône "+c.artist:c.title} rejoint ta collection`);setTimeout(announceAlbums,400)};
}

// ---------- sauvegarde ----------
const today = () => new Date().toLocaleDateString("sv");
const START = () => ({coins:500000,bonus2:1,owned:{},seen:{},vibrate:true,sound:true,sfx:true,skipWO:false,pseudo:"Joueur"+Math.floor(1000+Math.random()*9000),inbox:[],rewarded:[],sbcDone:{},listings:[],market:null,daily:null,claimed:[],friends:[],usedGifts:[],tick:Date.now()});
let state=START();
try{const s=JSON.parse(localStorage.getItem("beatpacks3"));if(s&&typeof s.coins==="number")state={...state,bonus2:0,...s}}catch(e){}
if(state.draft&&!state.draft.slots)state.draft=null;
if(!state.bonus2){state.coins+=400000;state.bonus2=1} // cadeau unique pour les parties déjà commencées
for(const k in state.owned)if(!CARD[k])delete state.owned[k]; // un titre retiré du catalogue
state.inbox??=[];state.rewarded??=[];state.sbcDone??={};
function save(){try{localStorage.setItem("beatpacks3",JSON.stringify(state))}catch(e){}try{document.getElementById("shopBadge").hidden=!state.inbox.length}catch(e){}}
function daily(){if(!state.daily||state.daily.date!==today())state.daily={date:today(),packs:0,sold:0,bought:0,hi:0,sbc:0,claimed:[]};return state.daily}
const has = k => (state.owned[k]||0)>0;
const give = k => state.owned[k]=(state.owned[k]||0)+1;
const take = k => {state.owned[k]--;if(state.owned[k]<=0)delete state.owned[k]};
const isNew = k => has(k)&&!state.seen[k];

const $=id=>document.getElementById(id);
const fmt=n=>n.toLocaleString("fr-FR");
function toast(t){const el=$("toast");el.textContent=t;el.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("show"),2400)}
function haptic(p=8){if(state.vibrate&&navigator.vibrate)navigator.vibrate(p)}
function wallet(){$("wallet").textContent=fmt(state.coins);$("clubName").textContent=state.pseudo;if(!$("s-shop").hidden)renderPacks()}
function earn(n,why){state.coins+=n;save();wallet();SFX.coin();toast(`${why?why+" · ":""}+${fmt(n)} pièces`);haptic([10,30,10])}

// ---------- cartes ----------
function coverHTML(id,cls=""){
  const a=ALB[id];
  return `<span class="cov ${cls}" style="--h:${hue(a.t)}">${esc(initials(a.t))}${a.cv?`<img src="${a.cv}" alt="" loading="lazy" onerror="this.remove()">`:""}</span>`;
}
const PLAY='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>';
const fmtStreams=m=>m>=1000?(m/1000).toLocaleString("fr-FR",{maximumFractionDigits:1})+" Md":m>=1?fmt(Math.round(m))+" M":fmt(Math.round(m*1000))+" k";
// 6 stats façon FIFA, calculées à partir de la note (et des streams pour STR, de la sortie pour HYP)
const STATN=["FLO","TXT","PRD","VOX","HYP","STR"];
function statsOf(c){
  if(c._st)return c._st;
  let h=0;for(const ch of c.key)h=(h*31+ch.charCodeAt(0))>>>0;
  const rnd=()=>{h=(h*1103515245+12345)>>>0;return h/4294967296},cl=v=>Math.max(40,Math.min(99,Math.round(v)));
  const age=2026-ALB[c.alb].y,bump=c.kind==="icone"?3:c.kind==="holo"?1:0;
  const st=[0,1,2,3].map(()=>cl(c.ovr-9+rnd()*14+bump));
  st.push(cl(c.ovr-5+(age<=2?7:age<=6?2:-5)+rnd()*6+bump));
  st.push(cl(54+10*Math.log10(Math.max(.05,c.kind==="icone"?c.vs:c.streams))+bump));
  return c._st=st;
}
function cardHTML(c,fresh,qty){
  return `<div class="card ${c.kind==="track"?"t-"+c.tier:"k-"+c.kind}">
    <div class="cart">${coverHTML(c.alb,"art")}${c.kind!=="track"?`<span class="kind">${labelOf(c).toUpperCase()}</span>`:""}</div>
    <span class="ovr">${c.ovr}</span><span class="cc">${c.country}</span>
    ${fresh?`<span class="new">NEW</span>`:qty>1?`<span class="new dup">×${qty}</span>`:""}
    <div class="nm">${esc(c.kind==="icone"?"Icône":c.title)}</div>
    <div class="ar">${esc(c.artist)}</div>
    <div class="tl"><span>${labelOf(c)}</span><span>${PLAY}${fmtStreams(c.streams)}</span></div>
    <div class="glare"></div>
  </div>`;
}
const cw=(c,{fresh=false,qty=0,tap=false,i,lock=false}={})=>`<div class="cw${lock?" lock":""}"${tap?` data-k="${c.key}"`:""}${i!=null?` style="--i:${i}"`:""}>${cardHTML(c,fresh,qty)}</div>`;
// les pochettes des packs : les albums de rap les plus streamés au monde, trois par pack
const WORLD=[["Views","beerbongs & bentleys","The Eminem Show"],["ASTROWORLD","Goodbye & Good Riddance","DAMN."],["Certified Lover Boy","My Beautiful Dark Twisted Fantasy","Rodeo"]]
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
const packHTML=p=>`<div class="pack k-${p.key}"><div class="foil"></div><div class="pcovs">${packCovers(p).map(a=>`<img src="${a.cv}" alt="">`).join("")}</div><i class="crimp t"></i><i class="crimp b"></i><div class="shine"></div></div>`;
function pickTier(odds){let x=Math.random(),acc=0;for(const r of ORDER){acc+=odds[r];if(x<acc)return r}return "commune"}
// tirage par note : dans une rareté, chaque point de note en plus rend la carte ~30 % plus rare
function byNote(p){
  const lo=Math.min(...p.map(c=>c.ovr)),w=p.map(c=>Math.exp(-.35*(c.ovr-lo))),tot=w.reduce((s,x)=>s+x,0);
  let x=Math.random()*tot;for(let i=0;i<p.length;i++){x-=w[i];if(x<=0)return p[i]}return p[p.length-1];
}
function drawTrack(t,f,not){
  for(let i=ORDER.indexOf(t);i>=0;i--){const p=POOL[ORDER[i]].filter(c=>(!f||f(c))&&!(not&&not.has(c.key)));if(p.length)return byNote(p)}
  return any(TRACKS.filter(c=>(!f||f(c))&&!(not&&not.has(c.key))));
}
const drawIcone = country => any(ICONES.filter(c=>!country||c.country===country));
function drawPack(p){
  const f=p.country||p.before||p.after?c=>(!p.country||c.country===p.country)&&(!p.before||ALB[c.alb].y<p.before)&&(!p.after||ALB[c.alb].y>=p.after):null;
  // jamais deux fois la même carte (ni un titre et sa Holo) dans un même pack
  const used=new Set(),songKey=c=>c.kind==="icone"?c.key:"s"+c.key.slice(1);
  const take1=gen=>{for(let k=0;k<40;k++){const c=gen();if(!used.has(songKey(c))){used.add(songKey(c));return c}}const c=gen();used.add(songKey(c));return c};
  const notUsed=()=>new Set([...used].map(k=>"t"+k.slice(1)));
  const out=Array.from({length:p.size},()=>take1(()=>{
    if(!p.before&&Math.random()<.004)return drawIcone(p.country);
    return Math.random()<.03?drawHolo(f):drawTrack(pickTier(ODDS),f,notUsed());
  }));
  const swap=(i,gen)=>{used.delete(songKey(out[i]));out[i]=take1(gen)};
  if(p.guarantee&&!out.some(c=>c.kind!=="track"||ORDER.indexOf(c.tier)>=ORDER.indexOf(p.guarantee)))swap(0,()=>drawTrack(p.guarantee,f,notUsed()));
  if(p.icon&&!out.some(c=>c.kind==="icone"))swap(out.length-1,()=>drawIcone());
  for(let i=0,n=0;n<(p.holo||0)&&i<out.length;i++)if(out[i].kind==="track"){swap(i,()=>drawHolo(f));n++}
  return out.sort((a,b)=>weight(b)-weight(a)); // la meilleure carte en premier
}

// ---------- prime d'album : finir un album rapporte des pièces et un pack offert ----------
const albumPrize=al=>al.tr.length<4?null:({coins:10000+2500*al.tr.length,pack:al.tr.length<=10?"3":al.tr.length<=18?"5":"10"}); // pas de prime pour les EP de moins de 4 titres
function checkAlbums(){
  const done=[];
  for(const al of ALBUMS){
    if(state.rewarded.includes(al.id)||al.tr.length<4)continue;
    if(!al.tr.every((_,i)=>has(`t:${al.id}:${i}`)||has(`h:${al.id}:${i}`)))continue;
    const pr=albumPrize(al);state.rewarded.push(al.id);state.coins+=pr.coins;state.inbox.push(pr.pack);done.push({al,pr});
  }
  if(done.length){save();wallet()}
  return done;
}
// annonce les albums terminés (après un pack, un achat ou un cadeau)
function announceAlbums(){
  const done=checkAlbums();if(!done.length)return;
  SFX.done();haptic([20,40,20,40,60]);
  const coins=done.reduce((t,d)=>t+d.pr.coins,0);
  sheet(`<h2>${done.length>1?done.length+" albums complétés !":"Album complété !"}</h2>
    <div class="prizes">${done.slice(0,6).map(d=>`<div class="prize">${coverHTML(d.al.id)}<div><b>${esc(d.al.t)}</b><small>${esc(ART[d.al.ar].n)} · ${d.al.tr.length} titres</small><small><i class="coin"></i>+${fmt(d.pr.coins)} · ${PACKS.find(p=>p.key===d.pr.pack).label} offert</small></div></div>`).join("")}</div>
    <p class="note" style="text-align:center">+${fmt(coins)} pièces et ${done.length} pack${done.length>1?"s":""} offert${done.length>1?"s":""}, à ouvrir dans la Boutique.</p>
    <button class="btn" id="openGift">Ouvrir mon pack</button>`);
  $("openGift").onclick=()=>{closeSheet();openInbox(0)};
}
function openInbox(i){const k=state.inbox[i];if(k==null)return;state.inbox.splice(i,1);save();openReward(rewardOf(k))}

// ---------- boutique : 3 packs, seul le nombre de cartes change ----------
// la carte du jour : une grosse carte du jeu, la même pour toute la journée
function cardOfDay(){
  const pool=[...POOL.legendaire,...ICONES];let h=0;for(const ch of today())h=(h*31+ch.charCodeAt(0))>>>0;
  return pool[h%pool.length];
}
function renderHub(){
  const ready=SBC.filter(canDo).length,c=cardOfDay(),gifts=state.inbox.length;
  const main=gifts?{k:"À la une",t:"Mes packs",p:`${gifts} pack${gifts>1?"s":""} t’attend${gifts>1?"ent":""} : récompenses de SBC, de draft et d’albums.`,b:"Voir mes packs",go:"gift"}
    :ready?{k:"Central Beat",t:"SBC prêts",p:`${ready} défi${ready>1?"s":""} de cartes faisable${ready>1?"s":""} maintenant avec tes doublons.`,b:"Voir les SBC",go:"s-quests"}
    :{k:"Central Beat",t:"Primes d’album",p:"Finis un album pour gagner des pièces et un pack offert. Toutes les primes sont dans le Catalogue.",b:"Voir le catalogue",go:"s-club"};
  $("hub").innerHTML=`<button class="hubmain" data-hub="${main.go}"><small>${main.k}</small><h3>${main.t}</h3><p>${main.p}</p><span class="hubgo">${main.b}</span>${packHTML(PACKS[2])}</button>
    <button class="hubside" data-k="${c.key}"><h3>Carte du jour</h3><p>${esc(c.artist)}</p>${cw(c,{lock:!has(c.key)})}</button>`;
}
function renderMenu(){
  renderHub();
  const ready=SBC.filter(canDo).length,d=state.draft;
  $("mtiles").innerHTML=`<button class="mtile mt-draft" data-play="draft"><small>Jouer</small><b>Draft</b><span>${d?(d.over?"Récompense à récupérer":d.step<5?`Choix ${d.step+1} sur 5 en cours`:`Combat ${d.round+1} sur 4`):"Monte ta maison de disque, puis 4 combats"}</span><i class="mic">♫</i></button>
    <button class="mtile mt-match" data-play="match"><small>Jouer</small><b>Match</b><span>Ton meilleur label contre l’ordinateur</span><i class="mic">⚔</i></button>
    <button class="mtile mt-sbc" data-go2="s-quests"><small>Objectifs</small><b>SBC</b><span>${ready} défi${ready>1?"s":""} prêt${ready>1?"s":""}</span><i class="mic">◆</i></button>
    <button class="mtile mt-set" data-go2="s-settings"><small>Options</small><b>Paramètres</b><span>Son, vibrations, pseudo</span><i class="mic">⚙</i></button>`;
}
$("mtiles").onclick=e=>{
  const p=e.target.closest("[data-play]");if(p){SFX.tap();playView=p.dataset.play;show("s-play");return}
  const g=e.target.closest("[data-go2]");if(g){SFX.tap();show(g.dataset.go2)}
};
$("hub").onclick=e=>{
  const m=e.target.closest("[data-hub]");
  if(m){SFX.tap();let g=m.dataset.hub;if(g==="gift"){shopTab="mine";g="s-shop"}if(g==="s-club")club.view="artists";TABS.forEach(b=>b.classList.toggle("on",b.dataset.go===g));pillTo(TABS.find(b=>b.dataset.go===g));show(g);return}
  const c=e.target.closest("[data-k]");if(c)cardSheet(c.dataset.k);
};
let shopTab="buy";
function renderPacks(){
  const n=state.inbox.length;
  $("shopSeg").innerHTML=`<button aria-pressed="${shopTab==="buy"}" data-s="buy">Packs</button><button aria-pressed="${shopTab==="mine"}" data-s="mine">Mes packs${n?` <i class="qdot"></i><em class="segn">${n}</em>`:""}</button>`;
  if(shopTab==="mine"){
    $("packs").innerHTML=n?`<p class="note" style="margin-top:0">Tes récompenses de SBC, de draft et d’albums. Ouvre-les quand tu veux.</p><div class="mypacks">${state.inbox.map((k,i)=>{const p=rewardOf(k);return `<button class="mypack" data-inbox="${i}">${p.pick?`<div class="pickpk">${rwBadge(p)}</div>`:packHTML(p)}<b>${p.label}</b><small>${p.desc||p.size+" cartes"}</small><span>Ouvrir</span></button>`}).join("")}</div>`
      :`<p class="empty">Aucun pack en attente. Gagne-en avec les SBC, le Draft et les albums complétés.</p>`;
  }else{
    $("packs").innerHTML=PACKS.map(p=>`<div class="offer p-${p.key}">
    ${packHTML(p)}
    <div class="info">
      <h3>${p.label}</h3><p>${p.size} cartes tirées dans toutes les discographies</p>
      <div class="odds">${ORDER.slice().reverse().map(r=>`<span><i style="background:${TCOLOR[r]}"></i>${TIER[r]} ${Math.round(ODDS[r]*100)}%</span>`).join("")}</div>
      <button class="btn light" data-k="${p.key}" ${state.coins<p.price?"disabled":""}><i class="coin"></i>${fmt(p.price)}</button>
    </div>
  </div>`).join("")+`<p class="note">Les packs spéciaux se gagnent dans les SBC (onglet Défis) et le Draft. Ils t’attendent dans « Mes packs ».</p>`;
  }
  document.querySelectorAll(".offer .btn").forEach(b=>b.onclick=()=>buyPack(b.dataset.k));
  document.querySelectorAll("[data-inbox]").forEach(b=>b.onclick=()=>{SFX.tap();openInbox(+b.dataset.inbox)});
}
$("shopSeg").onclick=e=>{const b=e.target.closest("[data-s]");if(!b)return;shopTab=b.dataset.s;SFX.tab();renderPacks()};
// écran de récompenses : les pièces sont créditées, les packs vont dans « Mes packs »
function rewardScreen({title,sub="",coins=0,packs=[]}){
  if(coins)state.coins+=coins;
  const first=state.inbox.length;packs.forEach(k=>state.inbox.push(k));save();wallet();
  SFX.done();haptic([20,40,20,40,60]);
  const items=[coins?`<div class="rwi rwc" style="--i:0"><i class="coin"></i><b>+${fmt(coins)}</b><small>pièces</small></div>`:"",...packs.map((k,i)=>{const p=rewardOf(k);return `<div class="rwi" style="--i:${i+1}">${p.pick?`<div class="pickpk">${rwBadge(p)}</div>`:packHTML(p)}<b>${p.label}</b><small>${p.desc||p.size+" cartes"}</small></div>`})].join("");
  sheet(`<div class="rws"><small>${esc(sub)}</small><h2>${esc(title)}</h2><p class="rwk">Récompenses</p>
    <div class="rwgrid">${items||`<p class="empty">Pas de récompense cette fois.</p>`}</div>
    ${packs.length?`<p class="note" style="text-align:center;margin:0">${packs.length>1?"Les packs sont rangés":"Le pack est rangé"} dans Boutique › Mes packs.</p><div class="two"><button class="btn ghost" id="rwLater">Plus tard</button><button class="btn" id="rwOpen">Ouvrir maintenant</button></div>`:`<button class="btn" id="rwLater">Continuer</button>`}</div>`);
  $("sheetIn").onclick=e=>{
    if(e.target.closest("#rwOpen")){closeSheet();openInbox(first)}
    else if(e.target.closest("#rwLater")){closeSheet();renderMenu()}
  };
}
function buyPack(k){const p=PACKS.find(x=>x.key===k);if(state.coins<p.price)return;state.coins-=p.price;SFX.cash();openPack(p)}

// ---------- ouverture façon FIFA 21 : le pack, le tunnel, la walkout si grosse carte, la carte, puis les autres ----------
let run=null;
const open=$("open"),scene=$("scene");
const hint=t=>$("skipHint").textContent=t;
const later=(f,ms)=>run.timers.push(setTimeout(f,ms));
const clearT=()=>{run.timers.forEach(clearTimeout);run.timers=[]};
// ---------- bruitages : fabriqués à la volée avec Web Audio, aucun fichier à charger ----------
let AC=null,MASTER=null;
function ac(){
  if(!AC){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;AC=new C();MASTER=AC.createGain();MASTER.gain.value=.7;MASTER.connect(AC.destination)}
  if(AC.state==="suspended")AC.resume();
  return AC;
}
addEventListener("pointerdown",()=>{if(state.sfx!==false)ac()},{passive:true}); // les téléphones exigent un geste pour lancer le son
// une note : fréquence (avec glissé), forme d'onde, durée, volume
function tone({f=440,f2,type="sine",d=.15,v=.2,delay=0}){
  const c=ac();if(!c||state.sfx===false)return;
  const t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(g).connect(MASTER);o.start(t);o.stop(t+d+.05);
}
// un souffle : bruit blanc filtré (avec glissé du filtre)
function noise({d=.3,v=.2,f=1000,f2,q=1,type="bandpass",delay=0,attack=.01}){
  const c=ac();if(!c||state.sfx===false)return;
  const t=c.currentTime+delay,len=Math.ceil(c.sampleRate*(d+.05)),buf=c.createBuffer(1,len,c.sampleRate),data=buf.getChannelData(0);
  for(let i=0;i<len;i++)data[i]=Math.random()*2-1;
  const src=c.createBufferSource(),fl=c.createBiquadFilter(),g=c.createGain();
  src.buffer=buf;fl.type=type;fl.Q.value=q;fl.frequency.setValueAtTime(f,t);if(f2)fl.frequency.exponentialRampToValueAtTime(f2,t+d);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+attack);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  src.connect(fl).connect(g).connect(MASTER);src.start(t);src.stop(t+d+.05);
}
const SFX={
  tap:()=>tone({f:880,f2:620,d:.05,v:.05,type:"triangle"}),
  tab:()=>tone({f:520,f2:760,d:.07,v:.045}),
  coin:()=>{tone({f:1319,d:.09,v:.07,type:"square"});tone({f:1976,d:.28,v:.06,type:"square",delay:.08})},
  cash:()=>{noise({d:.06,v:.25,f:3000,type:"highpass"});tone({f:1568,d:.12,v:.07,type:"triangle",delay:.05});tone({f:2093,d:.3,v:.06,type:"triangle",delay:.13})},
  shake:()=>{noise({d:.55,v:.35,f:180,type:"lowpass",q:4});for(let i=0;i<5;i++)tone({f:70+i*6,d:.08,v:.12,type:"sawtooth",delay:i*.1})},
  rip:()=>{noise({d:.28,v:.32,f:900,f2:7000,q:.6,attack:.01});noise({d:.12,v:.2,f:5000,type:"highpass",delay:.05})},
  whoosh:()=>noise({d:.5,v:.3,f:300,f2:4000,q:1.5,attack:.2}),
  tunnel:()=>{noise({d:1.8,v:.16,f:200,f2:1800,q:2,attack:.6});tone({f:55,f2:110,d:1.8,v:.18})},
  board:()=>{tone({f:110,f2:38,d:1,v:.5});noise({d:.5,v:.3,f:400,type:"lowpass"});[1568,2093,2637,3136].forEach((f,i)=>tone({f,d:.9,v:.035,type:"triangle",delay:.15+i*.07}))},
  slam:()=>{tone({f:160,f2:55,d:.3,v:.35});noise({d:.12,v:.18,f:900,type:"lowpass"})},
  reveal:()=>[523,659,784].forEach((f,i)=>tone({f,d:.35,v:.07,type:"triangle",delay:i*.06})),
  bigReveal:()=>{tone({f:98,f2:49,d:.9,v:.4});[523,659,784,1047,1319].forEach((f,i)=>tone({f,d:.7,v:.08,type:"triangle",delay:i*.07}));noise({d:1,v:.08,f:6000,type:"highpass",delay:.2,attack:.3})},
  flip:()=>noise({d:.25,v:.22,f:1500,f2:7000,q:.8,attack:.05}),
  tick:()=>tone({f:1400,f2:1100,d:.04,v:.04,type:"triangle"}),
  done:()=>[784,1047,1319,1568].forEach((f,i)=>tone({f,d:.4,v:.06,type:"triangle",delay:i*.08}))
};

// ---------- extraits audio : 30 s de la carte révélée (le plus gros titre pour une Icône) ----------
// l'extrait vient de l'album Deezer du titre (liens valables un moment seulement, donc pris à l'ouverture du pack) ;
// à défaut, l'aperçu Apple Music
const audio=new Audio();audio.preload="auto";
const songOf=c=>c.kind==="icone"?ART[c.ar].tracks.reduce((x,y)=>y.streams>x.streams?y:x):c;
const DZ={};
function dzTracks(albId){
  const hit=DZ[albId];if(hit&&Date.now()-hit.at<10*60e3)return hit.p;
  const p=new Promise(res=>{
    const cb="dz_"+rid(),s=document.createElement("script");let done=false;
    const fin=v=>{if(done)return;done=true;delete window[cb];s.remove();res(v)};
    window[cb]=d=>fin((d&&d.data)||[]);s.onerror=()=>fin([]);setTimeout(()=>fin([]),8000);
    s.src=`https://api.deezer.com/album/${albId}/tracks?limit=200&output=jsonp&callback=${cb}`;document.head.append(s);
  });
  DZ[albId]={at:Date.now(),p};return p;
}
const cleanT=t=>t.replace(/\s*[\(\[][^\)\]]*[\)\]]/g,"").trim();
function itunesPreview(t){
  const clean=cleanT(t.title),who=slug(t.artist).split("-").find(w=>w.length>2&&w!=="the")||slug(t.artist),T=slug(clean);
  const store=t.country==="FR"?"fr":t.country==="UK"?"gb":"us";
  return fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(t.artist+" "+clean)}&entity=song&limit=10&country=${store}`).then(r=>r.json()).then(d=>{
    const rs=(d.results||[]).filter(x=>x.previewUrl&&!/live|instrumental|remix|acapella/i.test(x.trackName)&&slug(x.artistName||"").includes(who));
    const r=rs.find(x=>slug(x.trackName||"").startsWith(T))||rs.find(x=>slug(x.trackName||"").includes(T));
    return r?r.previewUrl:"";
  }).catch(()=>"");
}
function previewUrl(c){
  const t=songOf(c);
  return dzTracks(t.alb).then(list=>{
    const T=slug(t.title),C=slug(cleanT(t.title));
    const x=list.find(x=>x.title===t.title)||list.find(x=>slug(x.title)===T)||list.find(x=>slug(x.title_short||"")===C)||list.find(x=>slug(x.title).startsWith(C));
    return x&&x.preview?x.preview:itunesPreview(t);
  });
}
const SILENT="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
function unlockAudio(){if(!state.sound)return;try{audio.muted=true;if(!audio.src)audio.src=SILENT;audio.play().then(()=>{audio.pause();audio.muted=false},()=>{audio.muted=false})}catch(e){}}
let fadeT=null;
function fadeTo(v,ms,done){clearInterval(fadeT);const from=audio.volume,t0=performance.now();fadeT=setInterval(()=>{const k=Math.min(1,(performance.now()-t0)/ms);audio.volume=from+(v-from)*k;if(k>=1){clearInterval(fadeT);done&&done()}},40)}
function playFor(c){
  if(!state.sound)return;
  const want=songOf(c).key;audio.dataset.want=want;
  previewUrl(c).then(u=>{
    if(!u||audio.dataset.want!==want)return;
    audio.src=u;audio.currentTime=0;audio.volume=0;
    audio.play().then(()=>fadeTo(.9,600),()=>{});
  });
}
function stopAudio(){audio.dataset.want="";if(!audio.paused)fadeTo(0,500,()=>audio.pause())}

function openPack(p){
  const cards=drawPack(p),fresh=new Set();
  cards.forEach(c=>{if(!has(c.key))fresh.add(c.key);give(c.key)});
  const d=daily();d.packs++;if(cards.some(walkout))d.hi++;
  save();wallet();badge();
  // les deux meilleures cartes du pack ont leur walkout (double animation, comme sur FIFA)
  const wos=cards.filter(walkout).slice(0,2).reverse(); // 2 walkouts au plus, même en cas d'égalité
  run={cards,fresh,best:cards[0],wos,wi:0,phase:"pack",timers:[],step:0};
  if(state.sound)[...wos,cards[0]].forEach(c=>previewUrl(c));
  open.className="open";open.dataset.h="";open.dataset.fl="";$("burst").innerHTML="";
  // ce qui sort du sachet est un indice : 1 carte (pas de walkout), 3 cartes (walkout 86+), 2 cartes (double walkout)
  const outsN=wos.length===2?2:wos.length===1?3:1;
  scene.innerHTML=`<div class="bigpack"><div class="outs n${outsN}">${"<i></i>".repeat(outsN)}</div><div class="mouth"></div><div class="pk body">${packHTML(p)}</div><div class="pk cap">${packHTML(p)}</div><div class="tearline"></div></div><b class="plabel">${esc(p.label)}</b>`;
  hint("Touche le pack pour l’ouvrir");
  open.hidden=false;
}
function advance(e){
  if(!run)return;
  if(run.phase==="pack"){
    run.phase="busy";hint("");unlockAudio();
    const bp=scene.querySelector(".bigpack");bp.classList.add("shake");haptic([15,40,15,40,15]);SFX.shake();
    later(()=>{bp.classList.replace("shake","torn");SFX.rip();haptic([10,20,30])},500);
    later(()=>{bp.classList.add("go");SFX.whoosh()},1500);
    later(tunnel,2000);
  }else if(run.phase==="card"&&e.target.closest(".reveal")&&run.wi>=run.wos.length-1){clearT();nextWalkout()} // on touche la dernière carte pour voir les autres
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
  // on plonge dans les sillons d'un vinyle, entre deux égaliseurs. Les indices, un peu comme sur FIFA :
  // - les égaliseurs restent bas pour une carte simple, montent en blanc pour un Platine ;
  // - walkout (86+) : ils saturent d'un coup, puis le disque du fond s'allume à la couleur de la carte ;
  // - double walkout : un second disque sort de derrière le premier, avec une seconde onde.
  open.dataset.fl="";
  const h=run.wos.length?"board":run.best.tier==="epique"?"rare":"plain",two=run.wos.length>1;
  open.dataset.h=h;
  scene.innerHTML=`<div class="flash"></div><div class="tdisc${h==="rare"?" rare":""}"><i class="coin"></i></div>`;
  later(()=>scene.querySelector(".flash")?.remove(),520);
  open.classList.add("run");SFX.tunnel();haptic(14);
  if(h!=="board"){ // pas de walkout : la couleur de la carte s'affiche tout de suite et la carte arrive vite
    open.dataset.fl=colorOf(run.best);open.classList.add("fast");
    later(()=>{open.classList.remove("fast");run.cur=run.best;reveal()},1100);
    return;
  }
  {
    later(()=>{open.classList.add("bars");SFX.slam()},700);
    later(()=>{
      const d=scene.querySelector(".tdisc");
      if(d){d.classList.add("lit");d.insertAdjacentHTML("beforeend",`<b class="halo"></b>${two?`<b class="halo h2"></b><span class="twinw"><i class="coin"></i></span>`:""}`)}
      open.dataset.fl=colorOf(run.wos[run.wos.length-1]);open.classList.add("board");SFX.board();if(two)later(SFX.reveal,350);
    },1150);
  }
  later(()=>{open.classList.remove("board","bars");open.dataset.fl=colorOf(run.wos.length?run.wos[run.wos.length-1]:run.best);if(run.wos.length){run.phase="wo";open.classList.replace("run","wo");run.step=0;step()}else{run.cur=run.best;reveal()}},2100);
}
// walkout : le pays, l'artiste, l'album, puis la carte
function step(){
  const c=run.wos[0],a=ALB[c.alb];run.cur=c;
  // une Icône ne dévoile pas son artiste : seulement le pays, puis « Icône »
  const steps=c.kind==="icone"?[
    `<div class="wstep"><small>Pays</small><strong>${c.country}</strong></div>`,
    `<div class="wstep"><small>Carte spéciale</small><strong>Icône</strong></div>`
  ]:[
    `<div class="wstep"><small>Pays</small><strong>${c.country}</strong></div>`,
    `<div class="wstep"><small>Artiste</small><strong>${esc(c.artist)}</strong></div>`,
    `<div class="wstep"><small>Album · ${a.y}</small><strong style="font-size:min(12vw,64px)">${esc(a.t)}</strong></div>`
  ];
  if(run.step>=steps.length){reveal();return}
  scene.innerHTML=steps[run.step++];SFX.slam();
  hint("");haptic(10);
  later(step,1600);
}
function reveal(){
  const c=run.cur;
  run.phase="card";open.classList.remove("run","board");open.classList.add("wo");
  scene.innerHTML=`<div class="reveal">${cw(c,{fresh:run.fresh.has(c.key)})}</div>`;
  if(walkout(c)){burst();haptic([30,40,60]);SFX.bigReveal()}else SFX.reveal();
  hint("");playFor(c);
  tilt(scene);
  if(run.wi<run.wos.length-1)later(nextWalkout,2800); // double animation : la carte reste 2 s (après son entrée), puis se retourne seule sur la meilleure
}
// plusieurs grosses cartes : quand on touche la carte, elle se retourne et laisse place à une meilleure ; ensuite le récap
function nextWalkout(){
  if(run.wi<run.wos.length-1){
    run.wi++;run.phase="busy";const c=run.wos[run.wi],box=scene.querySelector(".reveal");
    box.classList.remove("flipin");box.classList.add("flipout");haptic([20,30,20]);SFX.flip();
    later(()=>{
      run.cur=c;box.innerHTML=cw(c,{fresh:run.fresh.has(c.key)});
      box.classList.replace("flipout","flipin");$("burst").innerHTML="";burst();haptic([30,40,60]);SFX.bigReveal();playFor(c);
      later(()=>{run.phase="card";if(run.wi<run.wos.length-1)later(nextWalkout,500)},450);
    },320);
  }else recap();
}
function burst(){
  const cols=[getComputedStyle(open).getPropertyValue("--fl"),"#ffffff","#ff3d8b","#22e0ff","#b6ff3b","#ff8a1f"];
  $("burst").innerHTML=Array.from({length:28},()=>{
    const a=Math.random()*Math.PI*2,d=120+Math.random()*220;
    return `<i style="--x:${Math.cos(a)*d}px;--y:${Math.sin(a)*d}px;--c:${any(cols)};animation-delay:${Math.random()*.15}s"></i>`;
  }).join("");
}
function recap(){
  run.phase="recap";clearT();
  open.classList.remove("run","wo");open.classList.add("recapmode");hint("");
  const seen=new Set(),n=run.cards.length;
  // la grille est calculée pour tenir dans l'écran, sans défilement
  const gap=8,big=innerWidth>=700,CAP=big?200:170,MAXC=big?6:5,W=Math.min(innerWidth-36,big?1180:520),H=(visualViewport?.height||innerHeight)-290;
  const size=c=>{const r=Math.ceil(n/c);return Math.floor(Math.min((W-gap*(c-1))/c,((H-gap*(r-1))/r)*.72,CAP))};
  let cols=1;for(let c=2;c<=Math.min(n,MAXC);c++)if(size(c)>size(cols))cols=c; // le nombre de colonnes qui donne les plus grandes cartes
  const w=size(cols);
  scene.innerHTML=`<div class="recap"><h2>Ton pack</h2><p class="note" style="margin:-10px 0 0">Touche une carte pour la voir, la vendre ou l’offrir.</p><div class="recapgrid" style="grid-template-columns:repeat(${cols},${w}px);gap:${gap}px">${run.cards.map((c,i)=>{const f=run.fresh.has(c.key)&&!seen.has(c.key);seen.add(c.key);return cw(c,{fresh:f,i,tap:true})}).join("")}</div></div><div class="recapbar"><button class="btn go" id="done">Continuer</button></div>`;
  run.cards.forEach((_,i)=>later(SFX.tick,i*90)); // un petit tic par carte qui apparaît
  $("done").onclick=()=>{SFX.tap();closePack()};
  requestAnimationFrame(()=>{
    const grid=scene.querySelector(".recapgrid"),bar=document.querySelector(".recapbar");if(!grid||!bar)return;
    const H2=bar.getBoundingClientRect().top-grid.getBoundingClientRect().top-12;
    const fit=c=>{const r=Math.ceil(n/c);return Math.floor(Math.min((W-gap*(c-1))/c,((H2-gap*(r-1))/r)*.72,CAP))};
    let c2=1;for(let c=2;c<=Math.min(n,MAXC);c++)if(fit(c)>fit(c2))c2=c;
    grid.style.gridTemplateColumns=`repeat(${c2},${fit(c2)}px)`;
  });
}
function closePack(){
  stopAudio();
  open.hidden=true;run=null;scene.innerHTML="";
  renderPacks();setTimeout(announceAlbums,250);
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
function sheet(html){SFX.tap();$("sheetIn").onclick=null;$("sheetIn").innerHTML=`<button class="xclose" aria-label="Fermer">✕</button>`+html;$("sheet").hidden=false;$("sheetIn").scrollTop=0}
const closeSheet=()=>{$("sheet").hidden=true;if(!run)stopAudio()};
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
  </div>
  <div class="statbars">${statsOf(c).map((v,i)=>`<div><span>${STATN[i]}</span><i><b style="width:${v}%"></b></i><em>${v}</em></div>`).join("")}</div>
  <p class="note" style="margin:0;font-size:12px">FLO flow · TXT textes · PRD prod · VOX voix · HYP hype · STR streams</p>`;
}
function cardSheet(k){
  const c=CARD[k],q=state.owned[k]||0;
  if(!run){unlockAudio();playFor(c)} // on écoute l'extrait du titre en ouvrant sa carte
  state.seen[k]=1;save();
  if(!q){sheet(`${cw(c)}${facts(c)}<p class="note" style="text-align:center">Tu n’as pas encore cette carte.</p>`);return}
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
const club={view:"artists",ar:null,alb:null,q:"",sort:"note",asort:"own"};
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
  const seg=`<div class="seg" id="clubSeg"><button aria-pressed="${club.view!=="binder"}" data-v="artists">Catalogue</button><button aria-pressed="${club.view==="binder"}" data-v="binder">Classeur</button></div>`;
  const lock=(c)=>cw(c,{tap:true,lock:true}); // carte du jeu pas encore obtenue : visible, avec sa note, mais grisée
  const SORTS={note:["Note",(a,b)=>weight(b)-weight(a)||a.title.localeCompare(b.title)],streams:["Streams",(a,b)=>b.streams-a.streams],valeur:["Valeur",(a,b)=>value(b)-value(a)],titre:["Titre",(a,b)=>a.title.localeCompare(b.title)],artiste:["Artiste",(a,b)=>a.artist.localeCompare(b.artist)||weight(b)-weight(a)],doublons:["Doublons",(a,b)=>(state.owned[b.key]||0)-(state.owned[a.key]||0)||weight(b)-weight(a)]};
  const sortBar=`<div class="chips" id="sortBar">${Object.entries(SORTS).map(([k,[l]])=>`<button aria-pressed="${club.sort===k}" data-sort="${k}">${l}</button>`).join("")}</div>`;
  const sorter=SORTS[club.sort][1];
  if(club.view==="binder"){
    // le classeur : toutes tes cartes, une par titre, avec le nombre de doublons ; tri au choix
    const q=slug(club.q);
    const list=Object.keys(state.owned).map(k=>CARD[k]).filter(c=>!q||slug(c.title+" "+c.artist).includes(q)).sort(sorter);
    const total=Object.values(state.owned).reduce((s,n)=>s+n,0);
    html=`<div class="titlerow"><h1>Classeur</h1><span class="count-big"><b>${fmt(Object.keys(state.owned).length)}</b> cartes</span></div>${seg}
      <input type="search" id="search" class="search" placeholder="Rechercher un titre ou un artiste" value="${esc(club.q)}" autocomplete="off">${sortBar}
      ${list.length?`<div class="grid">${list.slice(0,600).map(c=>cw(c,{tap:true,qty:state.owned[c.key]})).join("")}</div>${list.length>600?`<p class="note" style="text-align:center;margin-top:14px">+ ${fmt(list.length-600)} cartes : affine avec la recherche</p>`:""}`
        :`<p class="empty">${total?"Aucune carte ne correspond.":"Ta collection est vide : ouvre un pack dans la Boutique."}</p>`}`;
  }else if(club.view==="artists"){
    // le catalogue : tous les artistes du jeu, ceux qu'on a et ceux qu'on n'a pas encore
    const {n}=myArtists(),q=slug(club.q);
    const AS={own:["Mes cartes",(a,b)=>(n[b.id]||0)-(n[a.id]||0)||a.n.localeCompare(b.n)],pop:["Popularité",(a,b)=>CARD[b.icone].ovr-CARD[a.icone].ovr],nom:["Nom",(a,b)=>a.n.localeCompare(b.n)],FR:["France",null],US:["USA",null],UK:["UK",null]};
    const list=ARTISTS.filter(a=>a.tracks.length&&(!q||slug(a.n).includes(q))&&(!["FR","US","UK"].includes(club.asort)||a.c===club.asort)).sort(AS[club.asort][1]||AS.own[1]);
    html=`<div class="titlerow"><h1>Catalogue</h1><span class="count-big"><b>${uniq()}</b> / ${fmt(TRACKS.length)}</span></div>${seg}
      <input type="search" id="search" class="search" placeholder="Rechercher un artiste" value="${esc(club.q)}" autocomplete="off">
      <div class="chips" id="asortBar">${Object.entries(AS).map(([k,[l]])=>`<button aria-pressed="${club.asort===k}" data-asort="${k}">${l}</button>`).join("")}</div>
      ${list.length?`<div class="agrid">${list.map(a=>{const o=a.tracks.filter(t=>has(t.key)||has(holo(t)?.key)).length;return `<button class="atile${o?"":" none"}" data-ar="${a.id}">${coverHTML(a.cover)}<b>${esc(a.n)}</b><small>${o}/${a.tracks.length} · Icône ${CARD[a.icone].ovr}</small></button>`}).join("")}</div>`:`<p class="empty">Aucun artiste ne correspond.</p>`}`;
  }else if(club.view==="artist"){
    const a=ART[club.ar],own=a.tracks.filter(t=>has(t.key)||has(holo(t)?.key)).length,ic=CARD[a.icone];
    html=`<button class="back" data-back="artists">‹ Catalogue</button>
      <div class="ahero">${coverHTML(a.cover)}<div><h1>${esc(a.n)}</h1><small>${a.albums.length} albums · ${own}/${a.tracks.length} titres</small></div></div>
      <div class="alist">
        <button class="arow${has(ic.key)?" done":""}" data-icone="1">${coverHTML(a.cover)}<div class="at"><b>Carte Icône · ${ic.ovr}</b><small>${has(ic.key)?"Obtenue":"Pas encore obtenue"}</small></div></button>
        ${a.albums.map(al=>{const o=albumOwned(al),pr=albumPrize(al),got=state.rewarded.includes(al.id);return `<button class="arow${o===al.tr.length?" done":""}" data-alb="${al.id}">${coverHTML(al.id)}<div class="at"><b>${esc(al.t)}</b><small>${al.y} · ${o}/${al.tr.length} titres${!pr?"":got?" · prime reçue ✓":` · prime ${fmt(pr.coins)} + ${PACKS.find(p=>p.key===pr.pack).label}`}</small><div class="bar"><i style="width:${o/al.tr.length*100}%"></i></div></div></button>`}).join("")}
      </div>`;
  }else{
    const a=ART[club.ar],al=ALB[club.alb];
    if(club.alb==="icone"){
      const ic=CARD[a.icone];
      html=`<button class="back" data-back="artist">‹ ${esc(a.n)}</button><h1>Carte Icône</h1><div class="grid">${has(ic.key)?cw(ic,{qty:state.owned[ic.key],tap:true}):lock(ic)}</div>`;
    }else{
      const mine=[],miss=[];
      const own=[];
      al.tr.forEach((tr,i)=>{const t=CARD[`t:${al.id}:${i}`];if(has(t.key))own.push(t);else miss.push(t)});
      const missHTML=miss.sort(sorter).map(lock);
      own.sort(sorter).forEach(t=>mine.push(cw(t,{qty:state.owned[t.key],tap:true})));
      const holos=al.tr.map((_,i)=>CARD[`h:${al.id}:${i}`]).filter(Boolean).sort(sorter).map(h=>has(h.key)?cw(h,{qty:state.owned[h.key],tap:true}):lock(h)).join("");
      const pr=albumPrize(al),got=state.rewarded.includes(al.id);
      html=`<button class="back" data-back="artist">‹ ${esc(a.n)}</button>
        <div class="ahero alb">${coverHTML(al.id)}<div><h1 style="font-size:26px">${esc(al.t)}</h1><small>${esc(a.n)} · ${al.y} · ${albumOwned(al)}/${al.tr.length} titres</small></div></div>
        ${pr?`<div class="aprize${got?" got":""}"><i class="coin"></i>${got?"Prime de l’album reçue ✓":`Finis l’album : +${fmt(pr.coins)} pièces et un ${PACKS.find(p=>p.key===pr.pack).label} offert`}</div>`:""}
        ${sortBar}<h2 style="font-size:16px;margin:14px 0 8px">Titres</h2><div class="grid">${mine.join("")}${missHTML.join("")}</div>
        ${holos?`<h2 style="font-size:16px;margin:18px 0 8px">Holo de l’album</h2><div class="grid">${holos}</div>`:""}`;
    }
  }
  el.innerHTML=html;
  if($("search"))$("search").oninput=e=>{club.q=e.target.value;const p=e.target.selectionStart;renderClub();$("search").focus();$("search").setSelectionRange(p,p)};
}
$("club").onclick=e=>{
  const t=e.target;
  const v=t.closest("#clubSeg [data-v]");if(v){club.view=v.dataset.v;club.q="";renderClub();haptic(6);return}
  const so=t.closest("#sortBar [data-sort]");if(so){club.sort=so.dataset.sort;renderClub();haptic(6);return}
  const as=t.closest("#asortBar [data-asort]");if(as){club.asort=as.dataset.asort;renderClub();haptic(6);return}
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
    state.coins-=o.price;give(o.k);SFX.cash();m.offers=m.offers.filter(x=>x!==o);daily().bought++;save();wallet();renderMarket();badge();toast(`${CARD[o.k].title} rejoint ta collection`);haptic([10,30,10]);setTimeout(announceAlbums,600);return}
  if(cancel){const l=state.listings.find(x=>x.id===cancel.dataset.cancel);if(!l)return;give(l.k);state.listings=state.listings.filter(x=>x!==l);save();renderMarket();toast("Carte retirée du marché");return}
  if(card){const c=CARD[card.dataset.k];sheet(`${cw(c)}${facts(c)}<button class="btn ghost" onclick="closeSheet()">Fermer</button>`);unlockAudio();playFor(c)}
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

// ---------- défis de cartes : on donne des cartes, on gagne un pack ----------
const avg=cs=>cs.reduce((s,c)=>s+c.ovr,0)/cs.length;
// conditions : min/max de cartes d'un type, note moyenne, tout du même artiste ou album, nombre de pays ou d'artistes différents
const R={
  min:(k,f,t)=>({type:"min",k,f,t}),
  max:(k,f,t)=>({type:"max",k,f,t}),
  avg:k=>({type:"avg",k,t:`Note moyenne ≥ ${k}`}),
  same:(key,t)=>({type:"same",key,t}),
  cty:k=>({type:"distinct",key:"country",k,t:`Min. ${k} pays différents`}),
  arts:k=>({type:"distinct",key:"ar",k,t:`Min. ${k} artistes différents`})
};
const isT=t=>c=>c.kind==="track"&&c.tier===t;
const atLeast=t=>c=>c.kind!=="track"||ORDER.indexOf(c.tier)>=ORDER.indexOf(t);
const inC=k=>c=>c.country===k;
const yr=c=>ALB[c.alb]?.y||0;
const SBC=[
  {id:"swap",cat:"Échanges",t:"Échange express",d:"3 cartes au choix",b:"3 cartes au choix",n:3,ok:()=>true,rw:"sp3",c1:"#22e0ff",c2:"#4361ee"},
  {id:"vinyle",cat:"Échanges",t:"Bac à vinyles",d:"8 cartes Vinyle",b:"8 cartes Vinyle",n:8,ok:isT("commune"),rw:"p3",c1:"#6a6a78",c2:"#1d1b2a"},
  {id:"gold",cat:"Échanges",t:"Disques d’or",d:"6 cartes Or de 2 pays",b:"6 cartes Or",n:6,ok:isT("rare"),reqs:[R.cty(2)],rw:"p6",c1:"#ffd23f",c2:"#b86e00"},
  {id:"fr",cat:"Pays",t:"Rap FR",d:"6 cartes FR dont 1 Platine",b:"6 cartes d’artistes français",n:6,ok:inC("FR"),reqs:[R.min(1,atLeast("epique"),"Min. 1 Platine ou mieux"),R.arts(3)],rw:"fr",c1:"#2f6bff",c2:"#ff4d6d"},
  {id:"us",cat:"Pays",t:"Rap US",d:"6 cartes US dont 1 Platine",b:"6 cartes d’artistes américains",n:6,ok:inC("US"),reqs:[R.min(1,atLeast("epique"),"Min. 1 Platine ou mieux"),R.arts(3)],rw:"us",c1:"#ff4d6d",c2:"#3a3b8f"},
  {id:"uk",cat:"Pays",t:"Rap UK",d:"6 cartes UK dont 1 Or",b:"6 cartes d’artistes anglais",n:6,ok:inC("UK"),reqs:[R.min(1,atLeast("rare"),"Min. 1 Or ou mieux"),R.arts(3)],rw:"uk",c1:"#3a7bff",c2:"#c8102e"},
  {id:"banlieue",cat:"Pays",t:"Banlieue",d:"7 cartes FR, 2 Platine, 5 artistes",b:"7 cartes d’artistes français",n:7,ok:inC("FR"),reqs:[R.min(2,atLeast("epique"),"Min. 2 Platine ou mieux"),R.arts(5),R.avg(79)],rw:"p12",c1:"#1f4bd8",c2:"#ffd23f"},
  {id:"holo",cat:"Spéciales",t:"Prisme",d:"5 cartes Platine",b:"5 cartes Platine",n:5,ok:isT("epique"),rw:"holo",c1:"#ff7ad9",c2:"#4ee6d0"},
  {id:"avg",cat:"Spéciales",t:"Note 85",d:"5 cartes, moyenne 85, 2 pays",b:"5 cartes au choix",n:5,ok:()=>true,reqs:[R.avg(85),R.cty(2)],rw:"legend",c1:"#7af0ff",c2:"#2a8fd6"},
  {id:"same",cat:"Spéciales",t:"Fan absolu",d:"5 cartes du même artiste",b:"5 cartes au choix",n:5,ok:()=>true,reqs:[R.same("ar","Toutes du même artiste")],rw:"icone",c1:"#ff3d8b",c2:"#7b2ff7"},
  {id:"album",cat:"Spéciales",t:"Face A",d:"5 cartes du même album",b:"5 titres",n:5,ok:c=>c.kind!=="icone",reqs:[R.same("alb","Toutes du même album")],rw:"p12",c1:"#ff8a1f",c2:"#7b1fa2"},
  {id:"world",cat:"Multi-conditions",t:"Tour du monde",d:"FR, US et UK, moyenne 78",b:"6 cartes au choix",n:6,ok:()=>true,reqs:[R.min(1,inC("FR"),"Min. 1 carte FR"),R.min(1,inC("US"),"Min. 1 carte US"),R.min(1,inC("UK"),"Min. 1 carte UK"),R.avg(78)],rw:"p6",c1:"#22e0ff",c2:"#ff8a1f"},
  {id:"era",cat:"Multi-conditions",t:"Classique & moderne",d:"2 d’avant 2005, 2 depuis 2020, moyenne 80",b:"6 cartes au choix",n:6,ok:()=>true,reqs:[R.min(2,c=>yr(c)<2005,"Min. 2 cartes d’avant 2005"),R.min(2,c=>yr(c)>=2020,"Min. 2 cartes depuis 2020"),R.avg(80)],rw:"p12",c1:"#b6ff3b",c2:"#8a5cff"},
  {id:"atl",cat:"Multi-conditions",t:"Transatlantique",d:"3 US, 2 UK, max 1 Vinyle",b:"6 cartes au choix",n:6,ok:()=>true,reqs:[R.min(3,inC("US"),"Min. 3 cartes US"),R.min(2,inC("UK"),"Min. 2 cartes UK"),R.max(1,isT("commune"),"Max. 1 Vinyle")],rw:"pickHolo",c1:"#3a7bff",c2:"#ff4d6d"},
  {id:"novinyl",cat:"Multi-conditions",t:"Zéro vinyle",d:"Or ou mieux, moyenne 82, 3 pays",b:"5 cartes Or ou mieux",n:5,ok:atLeast("rare"),reqs:[R.avg(82),R.cty(3)],rw:"legend",c1:"#ffd23f",c2:"#2a8fd6"},
  {id:"cent",cat:"Multi-conditions",t:"Club des 100 M",d:"6 titres à 100 M, moyenne 85, max 3 US",b:"6 titres à 100 M de streams ou plus",n:6,ok:c=>c.kind!=="icone"&&c.streams>=100,reqs:[R.avg(85),R.max(3,inC("US"),"Max. 3 cartes US"),R.arts(4)],rw:"pickDia",c1:"#3ef0d0",c2:"#1f4bd8"},
  {id:"elite",cat:"Multi-conditions",t:"Élite",d:"8 cartes, moyenne 86, 1 Holo",b:"8 cartes au choix",n:8,ok:()=>true,reqs:[R.min(1,c=>c.kind==="holo","Min. 1 Holo"),R.avg(86),R.cty(2),R.arts(6)],rw:"pickIco",c1:"#ff3d8b",c2:"#ffd23f"},
  {id:"dia",cat:"Choix de cartes",t:"Disques de diamant",d:"5 titres certifiés Diamant",b:"5 titres certifiés Diamant",n:5,ok:c=>disc(c.country,c.vs).lvl==="Diamant",rw:"pickDia",c1:"#7af0ff",c2:"#8a5cff"},
  {id:"prism2",cat:"Choix de cartes",t:"Arc-en-ciel",d:"3 cartes Holo",b:"3 cartes Holo",n:3,ok:c=>c.kind==="holo",rw:"pickHolo",c1:"#ff7ad9",c2:"#7f8cff"},
  {id:"pantheon",cat:"Choix de cartes",t:"Panthéon",d:"3 cartes Diamant",b:"3 cartes Diamant",n:3,ok:isT("legendaire"),rw:"pickIco",c1:"#ffd23f",c2:"#ff3d8b"},
  {id:"old",cat:"Époques",t:"Old School",d:"5 cartes d’avant 2005, moyenne 76",b:"5 cartes d’albums sortis avant 2005",n:5,ok:c=>yr(c)<2005,reqs:[R.avg(76)],rw:"old",c1:"#b6ff3b",c2:"#0b5e4a"},
  {id:"newgen",cat:"Époques",t:"Nouvelle vague",d:"5 cartes depuis 2023, 3 artistes",b:"5 cartes d’albums sortis depuis 2023",n:5,ok:c=>yr(c)>=2023,reqs:[R.arts(3)],rw:"newgen",c1:"#22e0ff",c2:"#ff3d8b"}
];
function reqState(r,cs){
  if(r.type==="min"){const n=cs.filter(r.f).length;return {v:`${Math.min(n,r.k)}/${r.k}`,p:n/r.k,ok:n>=r.k}}
  if(r.type==="max"){const n=cs.filter(r.f).length;return {v:`${n}/${r.k}`,p:n<=r.k?1:0,ok:n<=r.k}}
  if(r.type==="avg"){const a=cs.length?avg(cs):0;return {v:cs.length?a.toFixed(1):"",p:a/r.k,ok:cs.length>0&&a>=r.k}}
  if(r.type==="same"){const ok=cs.length>0&&new Set(cs.map(c=>c[r.key])).size===1;return {v:"",p:ok?1:0,ok}}
  const n=new Set(cs.map(c=>c[r.key])).size;return {v:`${Math.min(n,r.k)}/${r.k}`,p:n/r.k,ok:n>=r.k};
}
const sbcValid=(s,cs)=>cs.length===s.n&&(s.reqs||[]).every(r=>reqState(r,cs).ok);
let sbcSel=[],sbcOnlyDup=false;
function sbcSheet(id){sbcSel=[];sbcOnlyDup=false;drawSbc(id)}
// les cartes éligibles : les doublons d'abord, puis les moins chères (on garde ses meilleures cartes)
function eligible(s){return Object.keys(state.owned).map(k=>CARD[k]).filter(s.ok).sort((a,b)=>((state.owned[b.key]>1)-(state.owned[a.key]>1))||value(a)-value(b))}
const canDo=s=>sbcValid(s,autoFill(s).map(k=>CARD[k]));
function drawSbc(id){
  const s=SBC.find(x=>x.id===id),rw=REWARD[s.rw],cs=sbcSel.map(k=>CARD[k]),full=cs.length===s.n,ok=sbcValid(s,cs);
  const reqs=[[s.b,`${cs.length}/${s.n}`,cs.length/s.n,full],...(s.reqs||[]).map(r=>{const st=reqState(r,cs);return [r.t,st.v,st.p,st.ok&&cs.length>0]})];
  const el=eligible(s).filter(c=>!sbcOnlyDup||state.owned[c.key]>1),cnt={};sbcSel.forEach(k=>cnt[k]=(cnt[k]||0)+1);
  const lost=cs.reduce((t,c)=>t+value(c),0);
  sheet(`<div class="sbchead" style="--c1:${s.c1};--c2:${s.c2}"><div><small>${esc(s.cat)}</small><h2>${esc(s.t)}</h2><p>${esc(s.d)}</p><span class="rw">Récompense · ${rw.label}</span><small style="display:block;margin-top:6px;letter-spacing:0;text-transform:none;font:600 12px var(--font)">${rw.desc||rw.size+" cartes"}</small></div>${rwBadge(rw)}</div>
    <div class="reqs">${reqs.map(([t,v,p,okk])=>`<div class="req${okk?" ok":""}"><i>${okk?"✓":""}</i><span>${esc(t)}</span><em>${v}</em><b style="width:${Math.min(1,p)*100}%"></b></div>`).join("")}</div>
    <div class="slots" style="grid-template-columns:repeat(${Math.min(s.n,5)},1fr)">${Array.from({length:s.n},(_,i)=>sbcSel[i]?`<div data-un="${i}">${cw(CARD[sbcSel[i]])}</div>`:`<div class="slot">${i+1}</div>`).join("")}</div>
    ${cs.length?`<p class="note" style="margin:0;align-self:center">Valeur des cartes données : <b style="color:#fff">${fmt(lost)}</b> pièces</p>`:""}
    <div class="acts"><div class="two"><button class="btn ghost" id="sbAuto">Remplir auto</button><button class="btn" id="sbGo" ${ok?"":"disabled"}>Valider</button></div></div>
    <div class="titlerow" style="width:100%"><h2 style="font-size:17px">Tes cartes éligibles (${el.length})</h2><button class="chipbtn${sbcOnlyDup?" on":""}" id="sbDup">Doublons</button></div>
    ${el.length?`<div class="picker">${el.map(c=>`<div class="cw${cnt[c.key]?" sel":""}${!cnt[c.key]&&full?" off":""}" data-pick="${c.key}">${cardHTML(c)}${cnt[c.key]?`<span class="qty">${cnt[c.key]}/${state.owned[c.key]}</span>`:state.owned[c.key]>1?`<span class="qty">×${state.owned[c.key]}</span>`:""}</div>`).join("")}</div>`:`<p class="empty" style="width:100%">Aucune carte éligible pour l’instant.</p>`}`);
  $("sheetIn").onclick=e=>{
    const p=e.target.closest("[data-pick]"),u=e.target.closest("[data-un]");
    if(p){const k=p.dataset.pick,c=cnt[k]||0;if(c<state.owned[k]&&sbcSel.length<s.n)sbcSel.push(k);else if(c)sbcSel.splice(sbcSel.lastIndexOf(k),1);haptic(6);SFX.tick();drawSbc(id);return}
    if(u){sbcSel.splice(+u.dataset.un,1);drawSbc(id);return}
    if(e.target.closest("#sbDup")){sbcOnlyDup=!sbcOnlyDup;drawSbc(id);return}
    if(e.target.closest("#sbAuto")){sbcSel=autoFill(s);if(sbcSel.length<s.n)toast("Pas assez de cartes éligibles");drawSbc(id);return}
    if(e.target.closest("#sbGo")&&ok){
      sbcSel.forEach(take);daily().sbc++;state.sbcDone[s.id]=(state.sbcDone[s.id]||0)+1;SFX.done();save();closeSheet();$("sheetIn").onclick=null;sbcSel=[];
      renderQuests();badge();rewardScreen({title:"SBC réussi",sub:s.t,packs:[s.rw]});
    }
  };
}
// remplit le défi avec les doublons et les cartes les moins chères qui valident toutes les conditions
const costOf=cs=>cs.reduce((t,c)=>t+value(c)*(state.owned[c.key]>1?.3:1),0);
function solve(s,copies){
  const reqs=s.reqs||[],pick=[],av=copies.slice(),A=reqs.find(r=>r.type==="avg");
  const fits=(c,arr=pick)=>reqs.every(r=>r.type!=="max"||arr.filter(r.f).length+(r.f(c)?1:0)<=r.k);
  const take1=pred=>{const i=av.findIndex(c=>pred(c)&&fits(c));if(i<0)return false;pick.push(av.splice(i,1)[0]);return true};
  for(const r of reqs)if(r.type==="min")while(pick.length<s.n&&pick.filter(r.f).length<r.k&&take1(r.f));
  for(const r of reqs)if(r.type==="distinct")while(pick.length<s.n&&new Set(pick.map(c=>c[r.key])).size<r.k&&take1(c=>!pick.some(p=>p[r.key]===c[r.key])));
  while(pick.length<s.n&&((A&&take1(c=>c.ovr>=A.k))||take1(()=>true)));
  const struct=arr=>reqs.every(r=>r.type==="avg"||r.type==="same"||reqState(r,arr).ok);
  for(let g=0;A&&pick.length===s.n&&g<40&&avg(pick)<A.k;g++){
    const need=A.k*s.n-pick.reduce((t,c)=>t+c.ovr,0),order=pick.map((_,i)=>i).sort((x,y)=>pick[x].ovr-pick[y].ovr);let swapped=false;
    for(const i of order){
      const old=pick.splice(i,1)[0],okc=c=>c.ovr>old.ovr&&fits(c)&&struct([...pick,c]);
      let j=av.findIndex(c=>c.ovr>=old.ovr+need&&okc(c));
      if(j<0){let best=-1;av.forEach((c,k)=>{if(okc(c)&&(best<0||c.ovr>av[best].ovr))best=k});j=best}
      if(j>=0){pick.splice(i,0,av.splice(j,1)[0]);av.push(old);swapped=true;break}
      pick.splice(i,0,old);
    }
    if(!swapped)break;
  }
  return pick;
}
function autoFill(s){
  const copies=[];eligible(s).forEach(c=>{for(let i=0;i<state.owned[c.key];i++)copies.push(c)});
  const same=(s.reqs||[]).find(r=>r.type==="same");
  let pick;
  if(same){const by={};copies.forEach(c=>(by[c[same.key]]??=[]).push(c));pick=Object.values(by).filter(x=>x.length>=s.n).map(x=>solve(s,x)).filter(p=>sbcValid(s,p)).sort((x,y)=>costOf(x)-costOf(y))[0]||[]}
  else pick=solve(s,copies);
  return pick.map(c=>c.key);
}

// ---------- Draft : on monte sa maison de disque (5 postes reliés), puis 4 combats ----------
// chaque poste a sa stat clé : en combat, la carte du poste se bat sur cette stat
const SLOTS=[{id:"head",n:"Tête d’affiche",st:4,x:50,y:1},{id:"plume",n:"Plume",st:1,x:15,y:29},{id:"flow",n:"Flow",st:0,x:85,y:29},{id:"beat",n:"Beatmaker",st:2,x:29,y:62},{id:"voix",n:"Refrain",st:3,x:71,y:62}];
const LINKS=[["head","plume"],["head","flow"],["plume","beat"],["flow","voix"],["beat","voix"]];
const LABELS=["Nuit Blanche Records","Cartel 93","Golden Ear","Royal Wax","Bitume Music","Neon Tape","Studio Nord","Lune Noire","Velours Records","Asphalte Club","Satellite Sound","Rue Pigalle"];
const DRAFT_COST=15000,DRAFT_OPP=[76,82,87,92];
const DRAFT_PRIZE=[{coins:1000},{coins:3000},{coins:5000,pack:"3"},{coins:8000,pack:"5"},{coins:12000,pack:"10",extra:"sp3"}];
const prizeTxt=p=>[`${fmt(p.coins)} pièces`,p.pack&&PACKS.find(x=>x.key===p.pack).label,p.extra&&REWARD[p.extra].label].filter(Boolean).join(" · ");
const MATCH_LV=[{n:"Facile",t:76,r:1500},{n:"Moyen",t:83,r:3500},{n:"Difficile",t:88,r:7000},{n:"Légende",t:93,r:12000}];
let playView="draft",battle=null;
// le lien entre deux postes voisins : 3 même artiste, 1 même pays, 0 sinon
const linkVal=(a,b)=>!a||!b?0:a.ar===b.ar?3:a.country===b.country?1:0;
const chemOf=sl=>Math.min(10,LINKS.reduce((t,[x,y])=>t+linkVal(CARD[sl[x]],CARD[sl[y]]),0));
const cardChem=(sl,id)=>LINKS.filter(l=>l.includes(id)).reduce((t,[x,y])=>t+linkVal(CARD[sl[x]],CARD[sl[y]]),0);
function rosterRating(sl){const ks=SLOTS.map(x=>sl[x.id]).filter(Boolean);return ks.length?Math.round(ks.reduce((t,k)=>t+CARD[k].ovr,0)/ks.length+chemOf(sl)/2):0}
function studioHTML(sl,{active,label,hue=280,tap=true}={}){
  const P=Object.fromEntries(SLOTS.map(x=>[x.id,x]));
  const lines=LINKS.map(([a,b])=>{const v=sl[a]&&sl[b]?linkVal(CARD[sl[a]],CARD[sl[b]]):-1;return `<line x1="${P[a].x}" y1="${P[a].y+12}" x2="${P[b].x}" y2="${P[b].y+12}" class="lk lk${v}"/>`}).join("");
  return `<div class="studio" style="--h:${hue}"><div class="slab"><span class="slogo">${esc(initials(label))}</span><div><small>Maison de disque</small><b>${esc(label)}</b></div><span class="srat">${rosterRating(sl)||"–"}<small>note</small></span><span class="srat">${chemOf(sl)}<small>alchimie</small></span></div>
    <div class="sfloor"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>
    ${SLOTS.map(x=>`<div class="sslot${active===x.id?" act":""}" style="left:${x.x}%;top:${x.y}%">${sl[x.id]?cw(CARD[sl[x.id]],{tap}):`<div class="sempty">${active===x.id?"?":"+"}</div>`}<small>${x.n}<b>${STATN[x.st]}${sl[x.id]?" "+statsOf(CARD[sl[x.id]])[x.st]:""}</b></small></div>`).join("")}</div></div>`;
}
function draftOffer(slot){
  const d=state.draft,used=new Set(Object.values(d.slots)),out=[];
  const odds=slot.id==="head"?{commune:0,rare:.15,epique:.5,legendaire:.35}:{commune:.1,rare:.4,epique:.38,legendaire:.12};
  while(out.length<5){const c=Math.random()<(slot.id==="head"?.08:.03)?any(ICONES):drawTrack(pickTier(odds));if(!out.includes(c)&&!used.has(c.key))out.push(c)}
  return out.map(c=>c.key);
}
function startDraft(){
  if(state.coins<DRAFT_COST)return toast("Pas assez de pièces");
  state.coins-=DRAFT_COST;
  const opps=[...LABELS].sort(()=>Math.random()-.5);
  state.draft={name:opps.pop(),hue:Math.floor(Math.random()*360),slots:{},step:0,offer:[],round:0,wins:0,over:false,opps:opps.slice(0,4)};
  state.draft.offer=draftOffer(SLOTS[0]);save();wallet();SFX.cash();renderPlay();
}
function renderPlay(){
  if($("s-play").hidden)return;
  if(battle)return renderBattle();
  let back=`<button class="back" id="playBack">‹ Menu</button>`;
  if(playView==="match")return renderMatch(back);
  const d=state.draft;
  if(d&&!d.over)back=`<div class="playtop"><button class="back" id="playBack">‹ Menu</button><button class="quit" id="dQuit">Abandonner le draft</button></div>`;
  if(!d){
    $("play").innerHTML=`${back}<h1>Draft</h1><div class="draftin"><small>Mode de jeu</small><h3>Monte ta maison de disque</h3>
      <p>5 postes à pourvoir : Tête d’affiche, Plume, Flow, Beatmaker et Refrain. Pour chaque poste, choisis 1 artiste parmi 5. Chaque poste a sa <b>stat clé</b> : en combat, ta carte se bat sur cette stat. Deux postes voisins avec le même artiste (+3) ou le même pays (+1) gagnent de l’<b>alchimie</b>.</p>
      <p>Puis affronte 4 maisons de disque de plus en plus fortes. Les cartes du draft ne sont pas gardées, les récompenses oui.</p>
      <div class="dprize">${DRAFT_PRIZE.map((p,i)=>`<div><b>${i} victoire${i>1?"s":""}</b><span>${prizeTxt(p)}</span></div>`).join("")}</div>
      <button class="btn" id="dStart" ${state.coins<DRAFT_COST?"disabled":""}>Lancer un draft · <i class="coin"></i>${fmt(DRAFT_COST)}</button></div>`;
    return;
  }
  if(d.step<5){
    const slot=SLOTS[d.step];
    $("play").innerHTML=`${back}${studioHTML(d.slots,{active:slot.id,label:d.name,hue:d.hue,tap:false})}
      <h2>Poste ${d.step+1} sur 5 · ${slot.n}</h2><p class="note">Stat clé : <b style="color:var(--fut)">${STATN[slot.st]}</b>. Touche l’artiste à signer.</p>
      <div class="doffer">${d.offer.map((k,i)=>{const c=CARD[k],tmp={...d.slots,[slot.id]:k},ch=cardChem(tmp,slot.id);return `<div data-dpick="${k}" style="--i:${i}">${cw(c)}<span class="dstat"><b>${statsOf(c)[slot.st]}</b> ${STATN[slot.st]}${ch?` · <em>+${ch}</em>`:""}</span></div>`}).join("")}</div>`;
    return;
  }
  const dots=DRAFT_OPP.map((o,i)=>`<span class="${i<d.wins?"w":d.over&&i===d.round?"l":i===d.round&&!d.over?"cur":""}"><b>${o}</b><small>${esc(d.opps[i])}</small></span>`).join("");
  $("play").innerHTML=`${back}${studioHTML(d.slots,{label:d.name,hue:d.hue})}<div class="dpath">${dots}</div>
    ${d.over?`<div class="draftin"><h3>${d.wins} victoire${d.wins>1?"s":""}</h3><p>Récompense : ${prizeTxt(DRAFT_PRIZE[d.wins])}</p><button class="btn" id="dClaim">Récupérer</button></div>`
      :`<button class="btn" id="dPlay">Combat ${d.round+1} sur 4 · ${esc(d.opps[d.round])} (${DRAFT_OPP[d.round]})</button>`}`;
}
// le label du joueur pour un Match : ses meilleures cartes, chacune au poste où sa stat clé est la plus forte
function bestRoster(){
  const pool=Object.keys(state.owned).map(k=>CARD[k]).sort((a,b)=>b.ovr-a.ovr).slice(0,25),sl={};
  for(const x of [...SLOTS].sort(()=>0)){
    const free=pool.filter(c=>!Object.values(sl).includes(c.key));if(!free.length)break;
    sl[x.id]=free.sort((a,b)=>statsOf(b)[x.st]+b.ovr-(statsOf(a)[x.st]+a.ovr))[0].key;
  }
  return sl;
}
function renderMatch(back){
  const sl=bestRoster(),n=Object.keys(sl).length,d=daily();d.matches??=0;
  $("play").innerHTML=`${back}<h1>Match</h1>${n<5?`<p class="empty">Il te faut au moins 5 cartes pour jouer un match.</p>`:`${studioHTML(sl,{label:state.pseudo+" Records",hue:190})}
    <p class="note">Ton label est composé automatiquement avec tes meilleures cartes. Victoires récompensées aujourd’hui : ${Math.min(d.matches,10)}/10.</p>
    <div class="mlv">${MATCH_LV.map((l,i)=>`<button data-mlv="${i}"><b>${l.n}</b><span>Adversaire ${l.t}</span><em>${d.matches<10?`+${fmt(l.r)}`:"—"}</em></button>`).join("")}</div>`}`;
}
// un combat : les 5 postes s'affrontent un par un sur leur stat clé (impossible à passer)
function startBattle(mySl,target,oppName,myName,onDone){
  const pool=TRACKS.filter(c=>Math.abs(c.ovr-target)<=3),opp={};
  for(const x of SLOTS){let c;do{c=any(pool.length?pool:TRACKS)}while(Object.values(opp).includes(c.key));opp[x.id]=c.key}
  const duels=SLOTS.map(x=>{const a=CARD[mySl[x.id]],b=CARD[opp[x.id]];const va=Math.round(statsOf(a)[x.st]+cardChem(mySl,x.id)+Math.random()*8),vb=Math.round(statsOf(b)[x.st]+cardChem(opp,x.id)+Math.random()*8+(target>=90?2:0));return {x,a,b,va,vb,win:va>=vb}});
  const me=battle={duels,myName,oppName,target,mine:rosterRating(mySl),shown:0,done:false,onDone};
  show("s-play");
  const tick=()=>{if(battle!==me)return;battle.shown++;const du=battle.duels[battle.shown-1];du.win?SFX.reveal():SFX.slam();haptic(du.win?[10,20,10]:20);renderBattle();
    if(battle.shown<5)setTimeout(tick,1100);else setTimeout(()=>{if(battle!==me)return;battle.done=true;const w=battle.duels.filter(x=>x.win).length;w>=3?SFX.done():SFX.slam();renderBattle()},900)};
  renderBattle();setTimeout(tick,900);
}
function renderBattle(){
  const b=battle,w=b.duels.slice(0,b.shown).filter(x=>x.win).length,l=b.shown-w,won=b.duels.filter(x=>x.win).length>=3;
  $("play").innerHTML=`${b.done?"":`<div class="playtop"><span class="note" style="margin:0">Combat en direct</span><button class="quit" id="bQuit">Abandonner</button></div>`}<div class="board"><div><small>${esc(b.myName)}</small><b>${b.mine}</b></div><div class="score">${w}<em>–</em>${l}</div><div><small>${esc(b.oppName)}</small><b>${b.target}</b></div></div>
    <div class="duels">${b.duels.map((x,i)=>i<b.shown?`<div class="duel${i===b.shown-1&&!b.done?" now":""}"><div class="dc${x.win?" w":""}">${cw(x.a)}</div><div class="dmid"><small>${x.x.n}</small><span>${STATN[x.x.st]}</span><b class="${x.win?"w":""}">${x.va}</b><b class="${x.win?"":"w"}">${x.vb}</b></div><div class="dc${x.win?"":" w"}">${cw(x.b)}</div></div>`:`<div class="duel wait"><span>${x.x.n} · ${STATN[x.x.st]}</span></div>`).join("")}</div>
    ${b.done?`<div class="dres ${won?"won":"lost"}">${won?"Victoire":"Défaite"} ${b.duels.filter(x=>x.win).length}–${b.duels.filter(x=>!x.win).length}</div><button class="btn" id="bDone">Continuer</button>`:`<p class="note" style="text-align:center">Combat en cours…</p>`}`;
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
  const all=quests(),row=q=>`<div class="quest${q.got?" got":""}"><div class="qi"><b>${esc(q.t)}</b><div class="bar"><i style="width:${q.v/q.goal*100}%"></i></div><small>${q.v}/${q.goal} · <i class="coin"></i>${fmt(q.r)}</small></div>${q.got?`<span class="note" style="margin:0">Reçu ✓</span>`:`<button class="btn sm" data-claim="${q.id}" ${ready(q)?"":"disabled"}>Récupérer</button>`}</div>`;
  const done=Object.values(state.sbcDone).reduce((t,n)=>t+n,0),readyN=SBC.filter(canDo).length;
  const cats=[...new Set(SBC.map(s=>s.cat))];
  $("qSeg").querySelector('[data-q="day"]').innerHTML=`Défis${all.some(ready)?' <i class="qdot"></i>':""}`;
  if(qTab==="sbc"){
    $("quests").innerHTML=`<div class="qstats two"><div><b>${done}</b><small>SBC réussis</small></div><div><b>${readyN}</b><small>faisables maintenant</small></div></div>
      <p class="note" style="margin-top:12px">Donne des cartes pour gagner un pack. On les refait autant qu’on veut ; « Remplir auto » prend tes doublons en premier.</p>
      ${cats.map(cat=>`<h3 class="qcat">${cat}</h3><div class="stiles">${SBC.filter(s=>s.cat===cat).map(s=>{const rw=REWARD[s.rw],n=state.sbcDone[s.id]||0,r=canDo(s),el=eligible(s).reduce((t,c)=>t+state.owned[c.key],0);return `<button class="stile${r?" ready":""}" data-sbc="${s.id}" style="--c1:${s.c1};--c2:${s.c2}">
        <div class="sth">${rwBadge(rw)}<div><span>${rw.label}</span><small>${rw.desc||rw.size+" cartes"}</small></div></div>
        <div class="stb"><b>${esc(s.t)}</b><small>${esc(s.d)}</small>${(s.reqs||[]).length>1?`<span class="nreq">${s.reqs.length+1} conditions</span>`:""}<span class="srq"><i style="width:${Math.min(1,el/s.n)*100}%"></i></span>
        <div class="stf"><em>${Math.min(el,s.n)}/${s.n} cartes</em>${r?`<span class="ok">Prêt</span>`:""}${n?`<span class="cnt">×${n}</span>`:""}</div></div></button>`}).join("")}</div>`).join("")}`;
  }else{
    const albums=state.rewarded.length,near=ALBUMS.filter(al=>albumPrize(al)&&!state.rewarded.includes(al.id)).map(al=>({al,o:albumOwned(al)})).filter(x=>x.o).sort((a,b)=>(b.o/b.al.tr.length)-(a.o/a.al.tr.length)).slice(0,5);
    $("quests").innerHTML=`${all.some(ready)?`<button class="btn" id="claimAll">Tout récupérer · <i class="coin"></i>${fmt(all.filter(ready).reduce((t,q)=>t+q.r,0))}</button>`:""}
      <h2>Défis du jour</h2><p class="note">Ils reviennent chaque jour à minuit.</p>${all.map(row).join("")}
      <h2>Albums presque finis</h2><p class="note">Finis un album d’au moins 4 titres : pièces + pack offert. ${albums} album${albums>1?"s":""} déjà complété${albums>1?"s":""}.</p>
      ${near.length?near.map(({al,o})=>{const pr=albumPrize(al);return `<button class="quest qalb" data-alb2="${al.id}">${coverHTML(al.id)}<div class="qi"><b>${esc(al.t)}</b><div class="bar"><i style="width:${o/al.tr.length*100}%"></i></div><small>${o}/${al.tr.length} · ${esc(ART[al.ar].n)} · <i class="coin"></i>${fmt(pr.coins)} + ${PACKS.find(p=>p.key===pr.pack).label}</small></div></button>`}).join(""):`<p class="empty">Ouvre des packs pour commencer des albums.</p>`}`;
  }
}
// le badge de la récompense : ◆ Diamant, ★ Icône, prisme Holo, 1/3 pour un choix, le nombre de cartes sinon
function rwBadge(rw){
  const k=rw.pick?"pick":rw.icon?"ico":rw.holo?"holo":rw.guarantee==="legendaire"?"dia":rw.country?"cty":"pk";
  const t=rw.pick?"1/3":rw.icon?"★":rw.holo?"✦":rw.guarantee==="legendaire"?"◆":rw.country||rw.size;
  return `<span class="rwb rwb-${k}"><b>${t}</b></span>`;
}
let qTab="sbc";
$("qSeg").onclick=e=>{const b=e.target.closest("[data-q]");if(!b)return;qTab=b.dataset.q;$("qSeg").querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b));SFX.tab();renderQuests()};
$("quests").onclick=e=>{
  const s=e.target.closest("[data-sbc]");if(s){sbcSheet(s.dataset.sbc);haptic();return}
  const a2=e.target.closest("[data-alb2]");if(a2){const al=ALB[a2.dataset.alb2];club.view="album";club.ar=al.ar;club.alb=al.id;TABS.forEach(b=>b.classList.toggle("on",b.dataset.go==="s-club"));pillTo(TABS.find(b=>b.dataset.go==="s-club"));show("s-club");return}
  if(e.target.closest("#claimAll")){const rs=quests().filter(ready);rs.forEach(q=>(q.sec==="day"?daily().claimed:state.claimed).push(q.id));earn(rs.reduce((t,q)=>t+q.r,0),`${rs.length} défis récupérés`);renderQuests();badge();return}
  const b=e.target.closest("[data-claim]");if(!b)return;
  const q=quests().find(x=>x.id===b.dataset.claim);if(!q||!ready(q))return;
  (q.sec==="day"?daily().claimed:state.claimed).push(q.id);
  earn(q.r,"Défi réussi");renderQuests();badge();
};

$("play").onclick=e=>{
  if(battle){ // pendant le combat, on ne peut que l'abandonner (compte comme une défaite)
    if(e.target.closest("#bDone")){const b=battle;battle=null;const won=b.duels.filter(x=>x.win).length>=3;b.onDone(won);SFX.tap()}
    else if(e.target.closest("#bQuit"))confirmSheet("Abandonner le combat ?","Le combat compte comme une défaite.","Abandonner",()=>{if(!battle)return;const b=battle;battle=null;b.onDone(false,true)});
    return}
  if(e.target.closest("#dQuit")){const d=state.draft;return confirmSheet("Abandonner le draft ?",`Tu récupères la récompense de ${d.wins} victoire${d.wins>1?"s":""} : ${prizeTxt(DRAFT_PRIZE[d.wins])}.`,"Abandonner",()=>{if(state.draft){state.draft.over=true;claimDraft()}})}
  if(e.target.closest("#playBack")){SFX.tap();return show("s-menu")}
  if(e.target.closest("#dStart"))return startDraft();
  const dp=e.target.closest("[data-dpick]");if(dp){const d=state.draft;d.slots[SLOTS[d.step].id]=dp.dataset.dpick;d.step++;d.offer=d.step<5?draftOffer(SLOTS[d.step]):[];SFX.tick();haptic(8);save();renderPlay();return}
  if(e.target.closest("#dPlay")){const d=state.draft;return startBattle(d.slots,DRAFT_OPP[d.round],d.opps[d.round],d.name,won=>{if(won){d.wins++;d.round++;if(d.round>=4)d.over=true}else d.over=true;save();renderPlay()})}
  if(e.target.closest("#dClaim"))return claimDraft();
  const lv=e.target.closest("[data-mlv]");if(lv){const L=MATCH_LV[+lv.dataset.mlv],d=daily();d.matches??=0;
    return startBattle(bestRoster(),L.t,LABELS[(+lv.dataset.mlv*3+new Date().getDate())%LABELS.length],state.pseudo+" Records",(won,quit)=>{playView="match";if(won&&d.matches<10){d.matches++;renderPlay();rewardScreen({title:"Match gagné",sub:`${L.n} · ${state.pseudo} Records`,coins:L.r})}else{if(won)toast("Victoire ! (10 victoires récompensées aujourd’hui)");else toast(quit?"Combat abandonné":"Défaite");save();renderPlay()}})}
  const c=e.target.closest(".cw[data-k]");if(c)cardSheet(c.dataset.k);
};
function claimDraft(){
  const d=state.draft;if(!d)return;const p=DRAFT_PRIZE[d.wins];state.draft=null;renderPlay();renderMenu();
  rewardScreen({title:"Draft terminé",sub:`${d.name} · ${d.wins} victoire${d.wins>1?"s":""}`,coins:p.coins,packs:[p.pack,p.extra].filter(Boolean)});
}
function confirmSheet(title,txt,yes,go){
  sheet(`<h2>${esc(title)}</h2><p class="note" style="margin:0">${esc(txt)}</p><div class="acts"><div class="two"><button class="btn ghost" id="cfNo">Annuler</button><button class="btn danger" id="cfYes">${esc(yes)}</button></div></div>`);
  $("sheetIn").onclick=e=>{if(e.target.closest("#cfNo"))closeSheet();else if(e.target.closest("#cfYes")){closeSheet();SFX.tap();go()}};
}
$("setBack").onclick=()=>{SFX.tap();show("s-menu")};

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
  sheet(`<h2>Cadeau de ${esc(g.f||"un ami")}</h2>${cw(CARD[g.k],{fresh:true})}<button class="btn" id="giftOk">Super</button>`);
  $("giftOk").onclick=()=>{closeSheet();setTimeout(announceAlbums,300)};
};

// ---------- paramètres ----------
$("optPseudo").value=state.pseudo;
$("optPseudo").onchange=e=>{state.pseudo=e.target.value.trim().slice(0,16)||state.pseudo;e.target.value=state.pseudo;save()};
$("optVibrate").checked=state.vibrate;
$("optVibrate").onchange=e=>{state.vibrate=e.target.checked;save()};
$("optSfx").checked=state.sfx!==false;
$("optSfx").onchange=e=>{state.sfx=e.target.checked;save();if(state.sfx){ac();SFX.tap()}};
$("optSound").checked=state.sound!==false;
$("optSound").onchange=e=>{state.sound=e.target.checked;save();if(!state.sound)stopAudio()};
$("reset").onclick=()=>{
  if(!confirm("Effacer ta collection et repartir avec 500 000 pièces ?"))return;
  state={...START(),vibrate:state.vibrate,skipWO:state.skipWO,pseudo:state.pseudo};save();wallet();badge();toast("Nouvelle partie");
};
$("foot").textContent=`${ARTISTS.length} artistes · ${fmt(ALBUMS.length)} albums · ${fmt(TRACKS.length)} titres · pochettes Apple Music`;

// ---------- écrans ----------
const SCREENS=["s-market","s-friends","s-shop","s-quests","s-settings","s-club","s-menu","s-play"];
const TABOF={"s-play":"s-menu","s-settings":"s-menu"}; // l'onglet allumé pour chaque écran
function show(id){
  SCREENS.forEach(s=>$(s).hidden=s!==id);
  $("btnFriends").classList.toggle("on",id==="s-friends");
  const t=TABS.find(b=>b.dataset.go===(TABOF[id]||id));
  if(!t||!t.classList.contains("on")){TABS.forEach(b=>b.classList.toggle("on",b===t));pillTo(t||null)}
  ({"s-shop":renderPacks,"s-club":renderClub,"s-market":renderMarket,"s-quests":renderQuests,"s-friends":renderFriends,"s-menu":renderMenu,"s-play":renderPlay})[id]?.();
  scrollTo(0,0);
}
$("btnFriends").onclick=()=>{haptic();SFX.tab();show("s-friends")};

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
  if(t){if(!t.classList.contains("on")){if(!d0.moved)haptic();SFX.tab()}TABS.forEach(b=>b.classList.toggle("on",b===t));pillTo(t,P.x);show(t.dataset.go)}
  else pillTo(bar.querySelector(".tab.on"),P.x);
}
bar.addEventListener("pointerup",e=>dragEnd(e,false));
bar.addEventListener("pointercancel",e=>dragEnd(e,true));
// clavier : Entrée / Espace sur un onglet
bar.addEventListener("click",e=>{const t=e.target.closest(".tab");if(t&&e.detail===0){TABS.forEach(b=>b.classList.toggle("on",b===t));pillTo(t);show(t.dataset.go)}});
addEventListener("resize",()=>pillTo(bar.querySelector(".tab.on")));

// ---------- démarrage ----------
wallet();renderPacks();renderMenu();badge();save();tickListings();
setInterval(tickListings,3000);
setInterval(()=>{if(!$("s-market").hidden)mktTimer()},1000);
setInterval(()=>{if(state.daily&&state.daily.date!==today()){badge();renderQuests()}},60e3);
requestAnimationFrame(()=>pillTo(bar.querySelector(".tab.on")));
document.fonts&&document.fonts.ready.then(()=>pillTo(bar.querySelector(".tab.on")));

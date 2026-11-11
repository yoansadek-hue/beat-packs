// ---------- catalogue : une carte par titre, plus les spéciales (Diamant pour un titre, Icône pour un artiste) ----------
const RNAME = {commun:"Bronze",rare:"Argent",epique:"Or",legendaire:"Platine"};
const RCOLOR = {commun:"#d08a52",rare:"#d5dce6",epique:"#f6cb3a",legendaire:"#c9c2ff"};
const COUNTRY = {US:"USA",UK:"Royaume-Uni",FR:"France"};
const ORDER = ["commun","rare","epique","legendaire"];
const ovrOf = m => Math.min(99,Math.round(55+12*Math.log10(m))); // la note vient des streams : 10 M → 67, 100 M → 79, 1 Md → 91
const rarityOf = o => o>=90?"legendaire":o>=84?"epique":o>=76?"rare":"commun";
const slug = s => s.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const hue = s => {let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))%360;return h};
const initials = s => s.replace(/[^\p{L}\p{N} ]/gu,"").split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase()||"♪";
const esc = s => String(s).replace(/[&<>"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));
const rid = () => Math.random().toString(36).slice(2,10);

const ALB={},CARD={},TRACKS=[],ICONES=[];
ALBUMS.forEach(a=>{ALB[a.id]=a;a.tr.forEach(([title,streams],i)=>{
  const ovr=ovrOf(streams),c={key:`t:${a.id}:${i}`,kind:"track",alb:a.id,title,artist:a.a,country:a.c,streams,ovr,rarity:rarityOf(ovr)};
  TRACKS.push(c);CARD[c.key]=c;
  CARD[`d:${a.id}:${i}`]={...c,key:`d:${a.id}:${i}`,kind:"diamant",ovr:Math.min(99,ovr+4)};
})});
{
  const by={};TRACKS.forEach(t=>(by[t.artist]??=[]).push(t));
  for(const [artist,ts] of Object.entries(by)){
    const best=ts.reduce((a,b)=>b.streams>a.streams?b:a);
    const c={key:`a:${slug(artist)}`,kind:"icone",artist,title:artist,country:best.country,alb:best.alb,streams:ts.reduce((s,t)=>s+t.streams,0),ovr:Math.min(99,best.ovr+3),rarity:"legendaire",n:ts.length};
    ICONES.push(c);CARD[c.key]=c;
  }
}
const dia = t => CARD["d"+t.key.slice(1)];
const value = c => Math.round(120*Math.pow(1.11,c.ovr-60)*(c.kind==="diamant"?2.5:c.kind==="icone"?4:1)/10)*10;
const quick = c => Math.round(value(c)*.6/10)*10;
const weight = c => c.ovr+(c.kind==="icone"?20:c.kind==="diamant"?10:0);
const walkout = c => c.kind!=="track"||c.rarity==="legendaire"; // Platine, Diamant et Icône ont droit à la walkout
const flOf = c => c.kind==="track"?c.rarity:c.kind;
const labelOf = c => c.kind==="icone"?"Icône":c.kind==="diamant"?"Diamant":RNAME[c.rarity];

const PACKS = [
  {key:"bronze",group:"Packs classiques",label:"Bronze",desc:"3 cartes",price:1000,size:3,odds:{commun:.75,rare:.2,epique:.045,legendaire:.005},dia:.03,ico:.002},
  {key:"silver",label:"Argent",desc:"4 cartes · 1 Argent minimum",price:3000,size:4,guarantee:"rare",odds:{commun:.55,rare:.32,epique:.11,legendaire:.02},dia:.04,ico:.005},
  {key:"gold",label:"Or",desc:"5 cartes · 1 Or minimum",price:7500,size:5,guarantee:"epique",odds:{commun:.3,rare:.4,epique:.22,legendaire:.08},dia:.06,ico:.01},
  {key:"us",group:"Packs pays",label:"Rap US",country:"US",desc:"4 cartes US · 1 Argent minimum",price:4000,size:4,guarantee:"rare",odds:{commun:.45,rare:.35,epique:.15,legendaire:.05},dia:.05,ico:.006},
  {key:"uk",label:"Rap UK",country:"UK",desc:"4 cartes UK · 1 Argent minimum",price:4000,size:4,guarantee:"rare",odds:{commun:.45,rare:.35,epique:.15,legendaire:.05},dia:.05,ico:.006},
  {key:"fr",label:"Rap FR",country:"FR",desc:"4 cartes FR · 1 Argent minimum",price:4000,size:4,guarantee:"rare",odds:{commun:.45,rare:.35,epique:.15,legendaire:.05},dia:.05,ico:.006},
  {key:"icon",group:"Spécial",label:"Icône",desc:"5 cartes · 1 Icône garantie",price:25000,size:5,guarantee:"epique",odds:{commun:.2,rare:.4,epique:.3,legendaire:.1},dia:.1,ico:0,icon:true}
];

// ---------- sauvegarde ----------
const today = () => new Date().toLocaleDateString("sv");
const START = () => ({coins:20000,owned:{},vibrate:true,skipWO:false,pseudo:"Joueur"+Math.floor(1000+Math.random()*9000),listings:[],market:null,daily:null,claimed:[],friends:[],usedGifts:[],tick:Date.now()});
let state=START();
try{const s=JSON.parse(localStorage.getItem("beatpacks2"));if(s&&typeof s.coins==="number")state={...state,...s}}catch(e){}
for(const k in state.owned)if(!CARD[k])delete state.owned[k]; // un titre retiré du catalogue
function save(){try{localStorage.setItem("beatpacks2",JSON.stringify(state))}catch(e){}}
function daily(){if(!state.daily||state.daily.date!==today())state.daily={date:today(),packs:0,sold:0,bought:0,hi:0,claimed:[]};return state.daily}
const has = k => (state.owned[k]||0)>0;
const give = k => state.owned[k]=(state.owned[k]||0)+1;
const take = k => {state.owned[k]--;if(state.owned[k]<=0)delete state.owned[k]};

const $=id=>document.getElementById(id);
const fmt=n=>n.toLocaleString("fr-FR");
function toast(t){const el=$("toast");el.textContent=t;el.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("show"),2400)}
function haptic(p=8){if(state.vibrate&&navigator.vibrate)navigator.vibrate(p)}
function wallet(){$("wallet").textContent=fmt(state.coins);if(!$("s-shop").hidden)renderPacks()}
function earn(n,why){state.coins+=n;save();wallet();toast(`${why?why+" · ":""}+${fmt(n)} pièces`);haptic([10,30,10])}

// ---------- pochettes : recherche iTunes, gardées sur l'appareil ----------
// les pochettes du catalogue sont déjà dans covers.js ; seuls les albums ajoutés ensuite sont cherchés en ligne
let COVERS={};try{COVERS=JSON.parse(localStorage.getItem("bp-covers"))||{}}catch(e){}
Object.assign(COVERS,typeof COVER_ART==="object"?COVER_ART:{});
const coverQ=[];let coverBusy=false;
function wantCover(id,urgent){
  if(COVERS[id]!==undefined)return;
  const i=coverQ.indexOf(id);
  if(i>=0){if(urgent){coverQ.splice(i,1);coverQ.unshift(id)}return}
  urgent?coverQ.unshift(id):coverQ.push(id);pumpCovers();
}
// garde un résultat seulement si l'artiste et l'album correspondent (jamais la pochette d'un autre disque)
function bestCover(rs,a){
  const A=slug(a.a.split(" & ")[0]),T=slug(a.t);let top=null,ts=0;
  for(const x of rs){
    const xa=slug(x.artistName||""),xt=slug(x.collectionName||"");
    const sa=xa===A?2:xa.includes(A)?1:0,st=xt===T?3:xt.startsWith(T+"-")?2:xt.includes(T)?1:0;
    if(sa&&st&&(sa===2||st===3)&&sa+st>ts){ts=sa+st;top=x} // artiste approché → titre exact obligatoire
  }
  return top;
}
function pumpCovers(){
  if(coverBusy||!coverQ.length)return;coverBusy=true;
  const id=coverQ.shift(),a=ALB[id];
  const url=`https://itunes.apple.com/search?term=${encodeURIComponent(a.a.replace(" & "," ")+" "+a.t)}&entity=album&limit=25&country=${a.c==="FR"?"fr":a.c==="UK"?"gb":"us"}`;
  const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),15000);
  fetch(url,{signal:ctl.signal}).then(r=>{if(!r.ok)throw 0;return r.json()}).then(d=>{
    const r=bestCover(d.results||[],a);
    COVERS[id]=r&&r.artworkUrl100?r.artworkUrl100.replace("100x100bb","600x600bb"):"";
    try{localStorage.setItem("bp-covers",JSON.stringify(COVERS))}catch(e){}
    paintCover(id);return 3500;
  },()=>15000).then(wait=>{clearTimeout(to);setTimeout(()=>{coverBusy=false;pumpCovers()},wait)}); // iTunes limite à une vingtaine de recherches par minute
}
const img = u => `<img src="${u}" alt="" onload="this.classList.add('ok')">`;
function coverHTML(id,cls=""){
  const a=ALB[id],u=COVERS[id];if(u===undefined)wantCover(id);
  return `<span class="cov ${cls}" data-alb="${id}" style="--h:${hue(a.t)}">${esc(initials(a.t))}${u?img(u):""}</span>`;
}
function paintCover(id){const u=COVERS[id];if(u)document.querySelectorAll(`.cov[data-alb="${id}"]`).forEach(el=>{if(!el.querySelector("img"))el.insertAdjacentHTML("beforeend",img(u))})}

// ---------- cartes ----------
const PLAY='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>';
const fmtStreams=m=>m>=1000?(m/1000).toLocaleString("fr-FR",{maximumFractionDigits:1})+" Md":fmt(m)+" M";
function cardHTML(c){
  return `<div class="card ${c.kind==="track"?"r-"+c.rarity:"k-"+c.kind}">
    <div class="head"><div class="lft"><span class="ovr">${c.ovr}</span><span class="pos">${c.country}</span><i class="flag f-${c.country.toLowerCase()}"></i>${c.kind!=="track"?`<span class="kind">${labelOf(c).toUpperCase()}</span>`:""}</div>${coverHTML(c.alb,"art")}</div>
    <div class="nm">${esc(c.title)}</div>
    <div class="ar">${esc(c.kind==="icone"?c.n+" titres":c.artist)}</div>
    <div class="sm">${PLAY}${fmtStreams(c.streams)}</div>
    <div class="rar">${labelOf(c)}</div>
    <div class="glare"></div>
  </div>`;
}
const cw=(c,{isNew=false,qty=0,tap=false,i}={})=>`<div class="cw"${tap?` data-k="${c.key}"`:""}${i!=null?` style="--i:${i}"`:""}>${cardHTML(c)}${isNew?`<span class="badge">NOUVEAU</span>`:""}${qty>1?`<span class="qty">×${qty}</span>`:""}</div>`;
const packHTML=p=>`<div class="pack k-${p.key}"><div class="foil"></div><div class="stripe"></div><div class="logo"><small>BEAT PACKS</small><b>${p.size}</b><small>${p.country||"CARTES"}</small></div><div class="shine"></div></div>`;
function pickRarity(odds){let x=Math.random(),acc=0;for(const r of ORDER){acc+=odds[r];if(x<acc)return r}return "commun"}
const any = a => a[Math.floor(Math.random()*a.length)];
function drawTrack(r,country){for(let i=ORDER.indexOf(r);i>=0;i--){const p=TRACKS.filter(t=>t.rarity===ORDER[i]&&(!country||t.country===country));if(p.length)return any(p)}return any(TRACKS)}
const drawIcone = country => any(ICONES.filter(c=>!country||c.country===country));
function drawPack(p){
  const out=Array.from({length:p.size},()=>{
    if(Math.random()<p.ico)return drawIcone(p.country);
    const t=drawTrack(pickRarity(p.odds),p.country);
    return Math.random()<p.dia?dia(t):t;
  });
  if(p.guarantee&&!out.some(c=>c.kind!=="track"||ORDER.indexOf(c.rarity)>=ORDER.indexOf(p.guarantee)))out[0]=drawTrack(p.guarantee,p.country);
  if(p.icon&&!out.some(c=>c.kind==="icone"))out[out.length-1]=drawIcone();
  return out.sort((a,b)=>weight(b)-weight(a)); // la meilleure carte en premier
}

// ---------- boutique ----------
function renderPacks(){
  $("packs").innerHTML=PACKS.map(p=>`${p.group?`<h2>${p.group}</h2>`:""}<div class="offer p-${p.key}">
    ${packHTML(p)}
    <div class="info">
      <h3>Pack ${p.label}</h3><p>${p.desc}</p>
      <div class="odds">${ORDER.slice().reverse().map(r=>`<span><i style="background:${RCOLOR[r]}"></i>${pct(p.odds[r])}</span>`).join("")}</div>
      <button class="btn light" data-k="${p.key}" ${state.coins<p.price?"disabled":""}><i class="coin"></i>${fmt(p.price)}</button>
    </div>
  </div>`).join("");
  document.querySelectorAll(".offer .btn").forEach(b=>b.onclick=()=>openPack(b.dataset.k));
}
const pct=x=>x>=.1?Math.round(x*100)+"%":(+(x*100).toFixed(1))+"%";

// ---------- ouverture façon FIFA 21 : le pack, le tunnel, la walkout si grosse carte, le récap ----------
let run=null;
const open=$("open"),scene=$("scene");
const hint=t=>$("skipHint").textContent=t;
const later=(f,ms)=>run.timers.push(setTimeout(f,ms));
const clearT=()=>{run.timers.forEach(clearTimeout);run.timers=[]};
function openPack(k){
  const p=PACKS.find(x=>x.key===k); if(state.coins<p.price)return;
  state.coins-=p.price;
  const cards=drawPack(p),fresh=new Set();
  cards.forEach(c=>{if(!has(c.key))fresh.add(c.key);give(c.key);wantCover(c.alb,true)});
  const d=daily();d.packs++;if(cards.some(walkout))d.hi++;
  save();wallet();badge();
  run={cards,fresh,best:cards[0],phase:"pack",timers:[],step:0};
  open.className="open";open.dataset.fl="";$("burst").innerHTML="";
  scene.innerHTML=`<div class="bigpack">${packHTML(p)}</div>`;
  hint("Touche le pack pour l’ouvrir");
  open.hidden=false;
}
function advance(){
  if(!run)return;
  if(run.phase==="pack"){
    run.phase="busy";hint("");
    const bp=scene.querySelector(".bigpack");bp.classList.add("shake");haptic([15,40,15,40,15]);
    later(()=>bp.classList.replace("shake","go"),500);
    later(tunnel,1000);
  }else if(run.phase==="wo"){clearT();step()}
  else if(run.phase==="card"){clearT();recap()}
}
open.addEventListener("click",e=>{if(!e.target.closest("button"))advance()});
// le tunnel : les lumières foncent vers nous, les fusées prennent la couleur de la meilleure carte
function tunnel(){
  scene.innerHTML=`<div class="flash"></div>`;
  later(()=>scene.querySelector(".flash")?.remove(),520);
  open.dataset.fl=flOf(run.best);open.classList.add("run");
  haptic(walkout(run.best)?[40,60,40,60,80]:run.best.rarity==="epique"?[30,50,30]:12);
  const wo=walkout(run.best)&&!state.skipWO;
  later(()=>{if(wo){run.phase="wo";open.classList.replace("run","wo");run.step=0;step()}else recap()},1800);
}
// walkout : le pays, la pochette, l'artiste, puis la carte
function step(){
  const c=run.best,a=ALB[c.alb];
  const steps=[
    `<div class="wstep"><small>Pays</small><i class="flag f-${c.country.toLowerCase()}"></i><strong>${COUNTRY[c.country]}</strong></div>`,
    c.kind==="icone"
      ?`<div class="wstep"><small>Carte spéciale</small><strong>Icône</strong></div>`
      :`<div class="wstep"><small>Album · ${a.y}</small>${coverHTML(a.id)}<strong style="font-size:min(9vw,46px)">${esc(a.t)}</strong></div>`,
    `<div class="wstep"><small>Artiste</small><strong>${esc(c.artist)}</strong></div>`
  ];
  if(run.step>=steps.length){reveal();return}
  scene.innerHTML=steps[run.step++];
  hint("Touche pour passer");haptic(10);
  later(step,1600);
}
function reveal(){
  run.phase="card";
  scene.innerHTML=`<div class="reveal">${cw(run.best,{isNew:run.fresh.has(run.best.key)})}</div>`;
  burst();haptic([30,40,60]);
  hint("Touche pour voir tout le pack");
  tilt(scene);
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
  open.classList.remove("run","wo");hint("");
  scene.innerHTML=`<div class="recap"><h2>Ton pack</h2><div class="recapgrid">${run.cards.map((c,i)=>cw(c,{isNew:run.fresh.has(c.key)&&run.cards.findIndex(x=>x.key===c.key)===i,i})).join("")}</div><button class="btn" id="done">Continuer</button></div>`;
  $("done").onclick=closePack;
}
function closePack(){
  open.hidden=true;run=null;scene.innerHTML="";
  if(!$("s-club").hidden)renderClub();
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

// ---------- fiche d'une carte : vendre, mettre au marché, offrir ----------
function sheet(html){$("sheetIn").innerHTML=html;$("sheet").hidden=false;tilt($("sheetIn"))}
const closeSheet=()=>{$("sheet").hidden=true};
$("sheet").onclick=e=>{if(e.target.id==="sheet")closeSheet()};
function facts(c){
  const a=ALB[c.alb];
  return `<div class="facts">
    ${c.kind==="icone"?`<div><small>Artiste</small><b>${esc(c.artist)}</b></div><div><small>Titres</small><b>${c.n}</b></div>`:`<div><small>Album</small><b>${esc(a.t)}</b></div><div><small>Année</small><b>${a.y}</b></div>`}
    <div><small>Streams</small><b>${fmtStreams(c.streams)}</b></div>
    <div><small>Valeur</small><b><i class="coin"></i>${fmt(value(c))}</b></div>
  </div>`;
}
function cardSheet(k){
  const c=CARD[k],q=state.owned[k]||0;
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
    $("acts").innerHTML=`<div class="code" id="gfCode">${code}</div><button class="btn" id="gfCopy">Copier le code</button>`;
    $("gfCopy").onclick=()=>{navigator.clipboard?.writeText(code).then(()=>toast("Code copié"),()=>{});};
  };
}
function addFriend(name,dir){let f=state.friends.find(x=>x.name.toLowerCase()===name.toLowerCase());if(!f){f={name,sent:0,recv:0};state.friends.push(f)}f[dir]++}

// ---------- collection : regroupée par album ----------
let filter="all";
const uniq=()=>TRACKS.filter(t=>has(t.key)||has(dia(t).key)).length;
const albumDone=a=>a.tr.every((_,i)=>has(`t:${a.id}:${i}`)||has(`d:${a.id}:${i}`));
function renderClub(){
  if($("s-club").hidden)return;
  const q=slug($("search").value||"");
  const match=a=>!q||slug(a.a+" "+a.t+" "+a.tr.map(t=>t[0]).join(" ")).includes(q);
  const albs=ALBUMS.filter(a=>(filter==="all"||filter==="own"||a.c===filter)&&(filter!=="own"||a.tr.some((_,i)=>has(`t:${a.id}:${i}`)||has(`d:${a.id}:${i}`)))&&match(a));
  const icons=ICONES.filter(c=>(filter==="all"||c.country===filter||(filter==="own"&&has(c.key)))&&(!q||slug(c.artist).includes(q)));
  const ownedIcons=icons.filter(c=>has(c.key)).length;
  let html="";
  const iconHTML=!icons.length?"":`<div class="album"><div class="ahead"><span class="cov" style="--h:320">★</span><div class="at"><b>Icônes</b><small>Cartes spéciales des artistes</small></div><span class="ap">${ownedIcons}/${icons.length}</span></div>
    <div class="grid">${icons.map(c=>has(c.key)?cw(c,{qty:state.owned[c.key],tap:true}):`<div class="cw"><div class="card ghost"><b>★</b><span>${esc(c.artist)}</span></div></div>`).join("")}</div></div>`;
  // les Icônes passent après les albums
  html+=albs.map(a=>{
    const n=a.tr.filter((_,i)=>has(`t:${a.id}:${i}`)||has(`d:${a.id}:${i}`)).length,done=n===a.tr.length;
    const cards=a.tr.map((tr,i)=>{const t=CARD[`t:${a.id}:${i}`];return has(t.key)?cw(t,{qty:state.owned[t.key],tap:true}):`<div class="cw"><div class="card ghost"><b>#${i+1}</b><span>${esc(tr[0])}</span></div></div>`}).join("");
    const dias=a.tr.map((_,i)=>CARD[`d:${a.id}:${i}`]).filter(d=>has(d.key)).map(d=>cw(d,{qty:state.owned[d.key],tap:true})).join("");
    return `<div class="album${done?" done":""}"><div class="ahead">${coverHTML(a.id)}<div class="at"><b>${esc(a.t)}</b><small><i class="flag f-${a.c.toLowerCase()}"></i>${esc(a.a)} · ${a.y}</small></div><span class="ap">${done?"✓ ":""}${n}/${a.tr.length}</span></div><div class="grid">${cards}${dias}</div></div>`;
  }).join("")+iconHTML;
  $("albums").innerHTML=html||`<p class="empty">Aucun album ne correspond.</p>`;
  const u=uniq();$("pbar").style.width=(u/TRACKS.length*100)+"%";$("pct").innerHTML=`<b>${u}</b> / ${TRACKS.length}`;
}
$("filter").onclick=e=>{const b=e.target.closest("button");if(!b)return;filter=b.dataset.f;$("filter").querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b));renderClub()};
$("search").oninput=renderClub;
$("albums").onclick=e=>{const el=e.target.closest(".cw[data-k]");if(el){cardSheet(el.dataset.k);haptic()}};

// ---------- marché : acheter les offres des autres joueurs, vendre les siennes ----------
const SELLERS=["Lyricist","BeatHunter","NightDrive","Mixtape93","DripKing","LDN_Flow","Vinyl_Joe","Bassline","ParisFlow","Trap_Lord","GrimeTime","Studio_B"];
const REFRESH=10*60e3,REFRESH_COST=250;
let mkt="buy";
function market(){if(!state.market||Date.now()-state.market.at>REFRESH)newOffers();return state.market}
function newOffers(){
  state.market={at:Date.now(),offers:Array.from({length:8},()=>{
    let c;if(Math.random()<.04)c=drawIcone();else{const t=drawTrack(pickRarity({commun:.35,rare:.35,epique:.22,legendaire:.08}));c=Math.random()<.06?dia(t):t}
    return {id:rid(),k:c.key,price:Math.round(value(c)*(.9+Math.random()*.45)/10)*10,seller:any(SELLERS)};
  }).sort((a,b)=>b.price-a.price)};
  save();
}
function renderMarket(){
  if($("s-market").hidden)return;
  $("mktBuy").hidden=mkt!=="buy";$("mktSell").hidden=mkt!=="sell";
  $("mktSeg").querySelectorAll("button").forEach(b=>{b.setAttribute("aria-pressed",b.dataset.m===mkt);if(b.dataset.m==="sell")b.textContent=`Mes ventes (${state.listings.length})`});
  const m=market();
  $("mktRefresh").innerHTML=`Actualiser · <i class="coin"></i>${REFRESH_COST}`;$("mktRefresh").disabled=state.coins<REFRESH_COST;
  $("mktOffers").innerHTML=m.offers.length?m.offers.map(o=>{const c=CARD[o.k];return `<div class="mrow">${cw(c,{tap:true})}<div class="mi"><b>${esc(c.title)}</b><small>${esc(c.kind==="icone"?"Icône":c.artist)} · ${labelOf(c)} ${c.ovr}</small><small>Vendu par ${o.seller}</small></div><button class="btn sm" data-buy="${o.id}" ${state.coins<o.price?"disabled":""}><i class="coin"></i>${fmt(o.price)}</button></div>`}).join(""):`<p class="empty">Tout est parti ! Reviens dans quelques minutes.</p>`;
  $("mktListings").innerHTML=state.listings.length?state.listings.map(l=>{const c=CARD[l.k];return `<div class="mrow">${cw(c,{tap:true})}<div class="mi"><b>${esc(c.title)}</b><small>En vente · <i class="coin" style="width:12px;height:12px;vertical-align:-1px"></i> ${fmt(l.price)}</small><small>Valeur ${fmt(value(c))}</small></div><button class="btn sm ghost" data-cancel="${l.id}">Retirer</button></div>`}).join(""):`<p class="empty">Aucune carte en vente.</p>`;
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

// ---------- défis : ils rapportent des pièces ----------
const DAILY=[
  {id:"login",t:"Connexion du jour",goal:1,get:()=>1,r:1000},
  {id:"packs",t:"Ouvre 3 packs",goal:3,get:d=>d.packs,r:2000},
  {id:"sold",t:"Vends 3 cartes",goal:3,get:d=>d.sold,r:1500},
  {id:"bought",t:"Achète une carte au marché",goal:1,get:d=>d.bought,r:1500},
  {id:"hi",t:"Obtiens une Platine, un Diamant ou une Icône",goal:1,get:d=>d.hi,r:3000}
];
const GOALS=[
  {id:"g25",t:"Possède 25 titres différents",goal:25,get:uniq,r:5000},
  {id:"g50",t:"Possède 50 titres différents",goal:50,get:uniq,r:10000},
  {id:"g100",t:"Possède 100 titres différents",goal:100,get:uniq,r:25000},
  {id:"gall",t:`Possède les ${TRACKS.length} titres`,goal:TRACKS.length,get:uniq,r:100000},
  {id:"galb5",t:"Complète 5 albums",goal:5,get:()=>ALBUMS.filter(albumDone).length,r:15000},
  {id:"gico",t:"Obtiens une carte Icône",goal:1,get:()=>ICONES.filter(c=>has(c.key)).length,r:5000},
  {id:"gdia",t:"Obtiens une carte Diamant",goal:1,get:()=>Object.keys(state.owned).filter(k=>k[0]==="d").length,r:3000}
];
const albumReward=a=>1000+500*a.tr.length;
function quests(){
  const d=daily(),list=[];
  DAILY.forEach(q=>list.push({sec:"day",id:q.id,t:q.t,goal:q.goal,v:Math.min(q.goal,q.get(d)),r:q.r,got:d.claimed.includes(q.id)}));
  ALBUMS.forEach(a=>{const v=a.tr.filter((_,i)=>has(`t:${a.id}:${i}`)||has(`d:${a.id}:${i}`)).length;if(v)list.push({sec:"alb",id:"alb:"+a.id,a,t:`Complète ${a.t}`,goal:a.tr.length,v,r:albumReward(a),got:state.claimed.includes("alb:"+a.id)})});
  GOALS.forEach(q=>list.push({sec:"goal",id:q.id,t:q.t,goal:q.goal,v:Math.min(q.goal,q.get()),r:q.r,got:state.claimed.includes(q.id)}));
  return list;
}
const ready=q=>!q.got&&q.v>=q.goal;
function badge(){$("questBadge").hidden=!quests().some(ready)}
function renderQuests(){
  if($("s-quests").hidden)return;
  const all=quests(),row=q=>`<div class="quest${q.got?" got":""}">${q.a?coverHTML(q.a.id):""}<div class="qi"><b>${esc(q.t)}</b><div class="bar"><i style="width:${q.v/q.goal*100}%"></i></div><small>${q.v}/${q.goal} · <i class="coin"></i>${fmt(q.r)}</small></div>${q.got?`<span class="note" style="margin:0">Reçu ✓</span>`:`<button class="btn sm" data-claim="${q.id}" ${ready(q)?"":"disabled"}>Récupérer</button>`}</div>`;
  const albs=all.filter(q=>q.sec==="alb").sort((a,b)=>ready(b)-ready(a)||a.got-b.got||b.v/b.goal-a.v/a.goal);
  $("quests").innerHTML=`<h2 style="margin-top:4px">Défis du jour</h2><p class="note">Ils reviennent chaque jour à minuit.</p>${all.filter(q=>q.sec==="day").map(row).join("")}
    <h2>Albums</h2><p class="note">Complète un album pour toucher sa prime.</p>${albs.length?albs.map(row).join(""):`<p class="empty">Ouvre des packs pour commencer tes albums.</p>`}
    <h2>Objectifs</h2>${all.filter(q=>q.sec==="goal").map(row).join("")}`;
}
$("quests").onclick=e=>{
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
  sheet(`<h2 style="margin:0">Cadeau de ${esc(g.f||"un ami")}</h2>${cw(CARD[g.k])}<button class="btn" onclick="closeSheet()">Super</button>`);
};

// ---------- paramètres ----------
$("optPseudo").value=state.pseudo;
$("optPseudo").onchange=e=>{state.pseudo=e.target.value.trim().slice(0,16)||state.pseudo;e.target.value=state.pseudo;save()};
$("optVibrate").checked=state.vibrate;
$("optVibrate").onchange=e=>{state.vibrate=e.target.checked;save()};
$("optSkip").checked=state.skipWO;
$("optSkip").onchange=e=>{state.skipWO=e.target.checked;save()};
$("reset").onclick=()=>{
  if(!confirm("Effacer ta collection et repartir avec 20 000 pièces ?"))return;
  state={...START(),vibrate:state.vibrate,skipWO:state.skipWO,pseudo:state.pseudo};save();wallet();badge();toast("Nouvelle partie");
};

// ---------- écrans ----------
const SCREENS=["s-market","s-friends","s-shop","s-quests","s-settings","s-club"];
function show(id){
  SCREENS.forEach(s=>$(s).hidden=s!==id);
  $("btnClub").classList.toggle("on",id==="s-club");
  if(id==="s-club"){TABS.forEach(b=>b.classList.remove("on"));pillTo(null)}
  ({"s-shop":renderPacks,"s-club":renderClub,"s-market":renderMarket,"s-quests":renderQuests,"s-friends":renderFriends})[id]?.();
  scrollTo(0,0);
}
$("btnClub").onclick=()=>{haptic();show("s-club")};

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

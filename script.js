const ARTISTS = [
  ["Nova Kiss","Pop","legendaire"],["MC Orbite","Rap","legendaire"],["Lune Rouge","Électro","legendaire"],
  ["Saphir","R&B","epique"],["Kalo B","Afro","epique"],["Les Néons","Rock","epique"],["DJ Mistral","Électro","epique"],["Yasmeen","Pop","epique"],
  ["Tito Flex","Rap","rare"],["Velours","R&B","rare"],["Big Cassette","Rap","rare"],["Aurore","Pop","rare"],["Marée Haute","Rock","rare"],["Zélie","Afro","rare"],["Pixel Bloom","Électro","rare"],["Le Comte","Jazz","rare"],
  ["Petit Gravier","Rap","commun"],["Mila Sol","Pop","commun"],["Ronron","Rock","commun"],["Basse Cour","Électro","commun"],["Jojo Swing","Jazz","commun"],["Sunny K","Afro","commun"],["Lola Drift","R&B","commun"],["Gaston Beat","Rap","commun"],["Clara Vinyle","Pop","commun"],["Les Fusibles","Rock","commun"],["Noor","R&B","commun"],["Tempo Libre","Jazz","commun"]
];
const RANGE = {commun:[60,72],rare:[73,81],epique:[82,88],legendaire:[89,96]};
const RAR = {commun:"◆",rare:"◆◆",epique:"◆◆◆",legendaire:"★"};
const GLOW = {commun:"transparent",rare:"#2f7bff",epique:"#ff3dbb",legendaire:"#f0c040"};
const GENRE = {"Pop":"pop","Rap":"rap","Électro":"electro","R&B":"rnb","Rock":"rock","Afro":"afro","Jazz":"jazz"};
const SELL = {commun:50,rare:200,epique:600,legendaire:2000};
function seeded(s){let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return()=>{h=(h*1103515245+12345)>>>0;return h/4294967296}}
const CARDS = ARTISTS.map(([name,genre,rarity],id)=>{
  const r=seeded(name),[lo,hi]=RANGE[rarity],ovr=Math.round(lo+r()*(hi-lo));
  const st=()=>Math.min(99,Math.max(40,Math.round(ovr+(r()-.5)*16)));
  return {id,name,genre,rarity,ovr,stats:{Voix:st(),Flow:st(),Rythme:st(),Hype:st()}};
});
const PACKS = [
  {key:"bronze",label:"Bronze",desc:"3 cartes",price:500,size:3,odds:{commun:.8,rare:.17,epique:.028,legendaire:.002}},
  {key:"silver",label:"Argent",desc:"4 cartes · 1 ◆◆ minimum",price:1500,size:4,guarantee:"rare",odds:{commun:.6,rare:.3,epique:.09,legendaire:.01}},
  {key:"gold",label:"Or",desc:"5 cartes · 1 ◆◆◆ minimum",price:4000,size:5,guarantee:"epique",odds:{commun:.4,rare:.38,epique:.18,legendaire:.04}}
];
const ORDER=["commun","rare","epique","legendaire"];
const START={coins:5000,owned:{},vibrate:true};

let state={...START,owned:{}};
try{const s=JSON.parse(localStorage.getItem("beatpacks"));if(s&&typeof s.coins==="number")state={...state,...s}}catch(e){}
function save(){try{localStorage.setItem("beatpacks",JSON.stringify(state))}catch(e){}}

const $=id=>document.getElementById(id);
const fmt=n=>n.toLocaleString("fr-FR");
function toast(t){const el=$("toast");el.textContent=t;el.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("show"),2200)}
function haptic(p=8){if(state.vibrate&&navigator.vibrate)navigator.vibrate(p)}
function wallet(){$("wallet").textContent=fmt(state.coins);renderPacks()}

function cardHTML(c,isNew=false){
  return `<div class="card r-${c.rarity} g-${GENRE[c.genre]}">
    ${isNew?`<span class="new">NOUVEAU</span>`:""}
    <div class="top"><span class="ovr">${c.ovr}</span><span class="gen">${c.genre}</span></div>
    <span class="rar">${RAR[c.rarity]}</span>
    <div class="art"><i></i></div>
    <div class="nm">${c.name}</div>
    <div class="st">${Object.entries(c.stats).map(([k,v])=>`<span><b>${k.slice(0,3).toUpperCase()}</b>${v}</span>`).join("")}</div>
    <div class="glare"></div>
  </div>`;
}
function packHTML(p){
  return `<div class="pack p-${p.key}"><div class="rec"></div><div class="shine"></div>
    <div class="face"><small>Beat Packs</small><div><strong>${p.label}</strong><span>${p.desc}</span></div></div></div>`;
}
function pickRarity(odds){let x=Math.random(),acc=0;for(const r of ORDER){acc+=odds[r];if(x<acc)return r}return "commun"}
function draw(r){const pool=CARDS.filter(c=>c.rarity===r);return pool[Math.floor(Math.random()*pool.length)]}
const pct=x=>x>=.1?Math.round(x*100)+"%":(+(x*100).toFixed(1))+"%";

// ---------- boutique ----------
function renderPacks(){
  $("packs").innerHTML=PACKS.map(p=>`<div class="offer">
    ${packHTML(p)}
    <div class="meta"><b>Pack ${p.label}</b><span>${p.size} cartes</span></div>
    <div class="odds">${ORDER.slice().reverse().map(r=>`<span>${RAR[r]} <em>${pct(p.odds[r])}</em></span>`).join("")}</div>
    <button class="btn" data-k="${p.key}" ${state.coins<p.price?"disabled":""}><i class="dot" style="background:#111"></i>${fmt(p.price)}</button>
  </div>`).join("");
  document.querySelectorAll(".offer .btn").forEach(b=>b.onclick=()=>openPack(b.dataset.k));
}

// ---------- ouverture : déchirer, puis les cartes une par une, puis le récap ----------
let run=null;
function stage(id){["stTear","stDeck","stRecap"].forEach(s=>$(s).hidden=s!==id)}
function openPack(k){
  const p=PACKS.find(x=>x.key===k); if(state.coins<p.price)return;
  state.coins-=p.price;
  let rs=Array.from({length:p.size},()=>pickRarity(p.odds));
  if(p.guarantee&&!rs.some(r=>ORDER.indexOf(r)>=ORDER.indexOf(p.guarantee)))rs[0]=p.guarantee;
  const cards=rs.map(draw).sort((a,b)=>a.ovr-b.ovr); // la meilleure carte arrive en dernier
  const fresh=new Set();
  cards.forEach(c=>{if(!state.owned[c.id]&&!fresh.has(c.id))fresh.add(c.id);state.owned[c.id]=(state.owned[c.id]||0)+1});
  save();wallet();
  run={cards,fresh,shownNew:new Set(),i:-1,busy:false,cut:0};
  $("open").style.setProperty("--glow","transparent");
  $("bigpack").className="bigpack";
  $("bigpack").innerHTML=`<div class="body">${packHTML(p)}</div><div class="cap">${packHTML(p)}</div><div class="cut"><i></i></div>`;
  $("bigpack").style.setProperty("--cut",0);
  stage("stTear");$("open").hidden=false;
}
// on glisse le doigt le long du trait pointillé ; aux trois quarts, le pack s'ouvre
(()=>{
  const bp=$("bigpack");let g=null;
  bp.addEventListener("pointerdown",e=>{if(!run||bp.classList.contains("torn"))return;g={x0:e.clientX,w:bp.offsetWidth,step:0};try{bp.setPointerCapture(e.pointerId)}catch(err){}});
  bp.addEventListener("pointermove",e=>{
    if(!g)return;
    run.cut=Math.max(run.cut,Math.min(1,Math.abs(e.clientX-g.x0)/(g.w*.9)));
    bp.style.setProperty("--cut",run.cut);
    const s=Math.floor(run.cut*8);if(s>g.step){g.step=s;haptic(4)}
    if(run.cut>=.75){g=null;tear()}
  });
  const up=()=>{if(!g)return;g=null;if(run&&run.cut<.75){run.cut=0;bp.style.setProperty("--cut",0)}};
  bp.addEventListener("pointerup",up);bp.addEventListener("pointercancel",up);
})();
$("tearBtn").onclick=()=>tear();
function tear(){
  const bp=$("bigpack");if(!run||bp.classList.contains("torn"))return;
  bp.style.setProperty("--cut",1);bp.classList.add("torn");haptic([10,30,18]);
  setTimeout(()=>{$("pile").innerHTML="";stage("stDeck");next()},850);
}
function next(){
  if(!run||run.busy)return;
  const pile=$("pile"),cur=pile.querySelector(".cw:not(.out)");
  if(run.i>=run.cards.length-1){recap();return}
  run.busy=true;
  if(cur){cur.classList.add("out");setTimeout(()=>cur.remove(),360)}
  const c=run.cards[++run.i],isNew=run.fresh.has(c.id)&&!run.shownNew.has(c.id);
  if(isNew)run.shownNew.add(c.id);
  const el=document.createElement("div");
  el.className="cw in"+(ORDER.indexOf(c.rarity)>=2?" hot":"");
  el.innerHTML=cardHTML(c,isNew);
  pile.append(el);
  $("open").style.setProperty("--glow",GLOW[c.rarity]);
  $("deckCount").textContent=`${run.i+1} / ${run.cards.length}`;
  haptic(c.rarity==="legendaire"?[30,50,30,50,60]:c.rarity==="epique"?[20,40,20]:8);
  setTimeout(()=>run&&(run.busy=false),280);
}
$("pile").addEventListener("click",next);
function recap(){
  const seen=new Set();
  $("recapGrid").innerHTML=run.cards.slice().reverse().map((c,i)=>{const n=run.fresh.has(c.id)&&!seen.has(c.id);seen.add(c.id);return `<div class="cw" style="--i:${i}">${cardHTML(c,n)}</div>`}).join("");
  $("open").style.setProperty("--glow","transparent");
  stage("stRecap");
}
$("done").onclick=()=>{
  $("open").hidden=true;run=null;
  if(!$("s-club").hidden)renderClub();
  if(state.coins<PACKS[0].price)toast("Plus de crédits ? Vends tes doublons dans la collection.");
};

// incliner une carte au doigt : le reflet suit
function tilt(box){
  box.addEventListener("pointermove",e=>{
    const card=box.querySelector(".cw:not(.out) .card")||box.querySelector(".card");if(!card)return;
    const r=card.getBoundingClientRect(),px=(e.clientX-r.left)/r.width,py=(e.clientY-r.top)/r.height;
    if(px<-.2||px>1.2||py<-.2||py>1.2)return;
    card.style.transition="transform .08s";
    card.style.setProperty("--rx",((.5-py)*18).toFixed(1)+"deg");card.style.setProperty("--ry",((px-.5)*22).toFixed(1)+"deg");
    card.style.setProperty("--mx",(px*100).toFixed(0)+"%");card.style.setProperty("--my",(py*100).toFixed(0)+"%");
  });
  box.addEventListener("pointerleave",()=>box.querySelectorAll(".card").forEach(c=>{c.style.transition="";["--rx","--ry","--mx","--my"].forEach(v=>c.style.removeProperty(v))}));
}
tilt($("pile"));tilt($("viewCard"));

// ---------- collection ----------
let filter="all";
function dupGain(){let g=0;for(const c of CARDS){const q=state.owned[c.id]||0;if(q>1)g+=(q-1)*SELL[c.rarity]}return g}
function renderClub(){
  const list=CARDS.filter(c=>filter==="all"||c.rarity===filter);
  $("grid").innerHTML=list.map(c=>state.owned[c.id]
    ?`<div class="cw" data-id="${c.id}">${cardHTML(c)}${state.owned[c.id]>1?`<span class="qty">×${state.owned[c.id]}</span>`:""}</div>`
    :`<div class="cw"><div class="card ghost"><b>#${String(c.id+1).padStart(2,"0")}</b><span>${RAR[c.rarity]}</span></div></div>`).join("");
  const n=CARDS.filter(c=>state.owned[c.id]).length;
  $("pbar").style.width=(n/CARDS.length*100)+"%";$("pct").innerHTML=`<b>${n}</b> / ${CARDS.length}`;
  const g=dupGain();$("sellDupes").disabled=!g;$("sellDupes").textContent=g?`Vendre les doublons · +${fmt(g)}`:"Aucun doublon à vendre";
}
$("filter").onclick=e=>{
  const b=e.target.closest("button");if(!b)return;
  filter=b.dataset.f;$("filter").querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b));renderClub();
};
$("grid").onclick=e=>{
  const cw=e.target.closest(".cw[data-id]");if(!cw)return;
  $("viewCard").innerHTML=`<div class="cw">${cardHTML(CARDS[+cw.dataset.id])}</div>`;$("view").hidden=false;haptic();
};
$("view").onclick=()=>{$("view").hidden=true};
$("sellDupes").onclick=()=>{
  const g=dupGain();if(!g)return;
  for(const c of CARDS)if((state.owned[c.id]||0)>1)state.owned[c.id]=1;
  state.coins+=g;save();wallet();renderClub();haptic([10,30,10]);toast(`+${fmt(g)} crédits`);
};

// ---------- réglages ----------
$("optVibrate").checked=state.vibrate;
$("optVibrate").onchange=e=>{state.vibrate=e.target.checked;save()};
$("reset").onclick=()=>{
  if(!confirm("Effacer ta collection et repartir avec 5 000 crédits ?"))return;
  state={...START,owned:{},vibrate:state.vibrate};save();wallet();toast("Nouvelle partie");
};

// ---------- écrans ----------
const SCREENS=["s-shop","s-club","s-settings"];
function show(id){
  SCREENS.forEach(s=>$(s).hidden=s!==id);
  if(id==="s-club")renderClub();
  scrollTo(0,0);
}

// ---------- barre d'onglets du bas : la bulle de verre s'étire en glissant d'un onglet à l'autre,
// grossit comme une loupe sous le doigt et suit le doigt quand on la fait glisser ----------
const bar=$("tabbar"),pill=$("tabPill"),TABS=[...bar.querySelectorAll(".tab")];
const P={x:0,shown:false,anim:null};
const still=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
const place=(x,sx=1,sy=1)=>{P.x=x;pill.style.transform=`translate3d(${x}px,0,0) scale(${sx},${sy})`};
function pillTo(t,from){
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

wallet();
requestAnimationFrame(()=>pillTo(bar.querySelector(".tab.on")));
document.fonts&&document.fonts.ready.then(()=>pillTo(bar.querySelector(".tab.on")));

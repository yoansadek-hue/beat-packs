const ARTISTS = [
  ["Nova Kiss","Pop","legendaire"],["MC Orbite","Rap","legendaire"],["Lune Rouge","Électro","legendaire"],
  ["Saphir","R&B","epique"],["Kalo B","Afro","epique"],["Les Néons","Rock","epique"],["DJ Mistral","Électro","epique"],["Yasmeen","Pop","epique"],
  ["Tito Flex","Rap","rare"],["Velours","R&B","rare"],["Big Cassette","Rap","rare"],["Aurore","Pop","rare"],["Marée Haute","Rock","rare"],["Zélie","Afro","rare"],["Pixel Bloom","Électro","rare"],["Le Comte","Jazz","rare"],
  ["Petit Gravier","Rap","commun"],["Mila Sol","Pop","commun"],["Ronron","Rock","commun"],["Basse Cour","Électro","commun"],["Jojo Swing","Jazz","commun"],["Sunny K","Afro","commun"],["Lola Drift","R&B","commun"],["Gaston Beat","Rap","commun"],["Clara Vinyle","Pop","commun"],["Les Fusibles","Rock","commun"],["Noor","R&B","commun"],["Tempo Libre","Jazz","commun"]
];
const RANGE = {commun:[60,72],rare:[73,81],epique:[82,88],legendaire:[89,96]};
const LABEL = {commun:"Commune",rare:"Rare",epique:"Épique",legendaire:"Légendaire"};
const SELL = {commun:50,rare:200,epique:600,legendaire:2000};
function seeded(s){let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return()=>{h=(h*1103515245+12345)>>>0;return h/4294967296}}
const CARDS = ARTISTS.map(([name,genre,rarity],id)=>{
  const r=seeded(name),[lo,hi]=RANGE[rarity],ovr=Math.round(lo+r()*(hi-lo));
  const st=()=>Math.min(99,Math.max(40,Math.round(ovr+(r()-.5)*16)));
  return {id,name,genre,rarity,ovr,stats:{Voix:st(),Flow:st(),Rythme:st(),Hype:st()}};
});
const PACKS = [
  {key:"bronze",name:"Pack Bronze",desc:"3 cartes",price:500,size:3,odds:{commun:.8,rare:.17,epique:.028,legendaire:.002}},
  {key:"silver",name:"Pack Argent",desc:"4 cartes, 1 rare minimum",price:1500,size:4,guarantee:"rare",odds:{commun:.6,rare:.3,epique:.09,legendaire:.01}},
  {key:"gold",name:"Pack Or",desc:"5 cartes, 1 épique minimum",price:4000,size:5,guarantee:"epique",odds:{commun:.4,rare:.38,epique:.18,legendaire:.04}}
];
const ORDER=["commun","rare","epique","legendaire"];
const START={coins:5000,owned:{},vibrate:true};

let state={...START,owned:{}};
try{const s=JSON.parse(localStorage.getItem("beatpacks"));if(s&&typeof s.coins==="number")state={...state,...s}}catch(e){}
function save(){try{localStorage.setItem("beatpacks",JSON.stringify(state))}catch(e){}}

const $=id=>document.getElementById(id);
function toast(t){const el=$("toast");el.textContent=t;el.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("show"),2200)}
function wallet(){$("wallet").textContent=state.coins.toLocaleString("fr-FR");renderPacks()}

function cardHTML(c,extra=""){
  return `<div class="card r-${c.rarity} ${extra}">
    <span class="tag">${LABEL[c.rarity]}</span>
    <div class="ovr">${c.ovr}</div><div class="genre">${c.genre}</div>
    <div class="disc"><span></span></div>
    <div class="name">${c.name}</div>
    <div class="stats">${Object.entries(c.stats).map(([k,v])=>`<span><b>${k.slice(0,3).toUpperCase()}</b>${v}</span>`).join("")}</div>
  </div>`;
}
function pickRarity(odds){let x=Math.random(),acc=0;for(const r of ORDER){acc+=odds[r];if(x<acc)return r}return "commun"}
function draw(r){const pool=CARDS.filter(c=>c.rarity===r);return pool[Math.floor(Math.random()*pool.length)]}

function renderPacks(){
  $("packs").innerHTML=PACKS.map(p=>`<button class="pack p-${p.key}" data-k="${p.key}" ${state.coins<p.price?"disabled":""}>
    <div><h3>${p.name}</h3><p>${p.desc}</p></div><div class="price"><span class="coin"></span>${p.price.toLocaleString("fr-FR")}</div></button>`).join("");
  document.querySelectorAll(".pack").forEach(b=>b.onclick=()=>openPack(b.dataset.k));
}
function openPack(k){
  const p=PACKS.find(x=>x.key===k); if(state.coins<p.price)return;
  state.coins-=p.price;
  let rs=Array.from({length:p.size},()=>pickRarity(p.odds));
  if(p.guarantee&&!rs.some(r=>ORDER.indexOf(r)>=ORDER.indexOf(p.guarantee)))rs[0]=p.guarantee;
  const cards=rs.map(draw).sort((a,b)=>a.ovr-b.ovr);
  cards.forEach(c=>state.owned[c.id]=(state.owned[c.id]||0)+1);
  save();wallet();
  const box=$("reveal");box.innerHTML="";$("hint").textContent="";
  box.scrollIntoView({behavior:"smooth",block:"start"});
  cards.forEach((c,i)=>setTimeout(()=>{
    box.insertAdjacentHTML("beforeend",cardHTML(c,"flip"));haptic(c.rarity==="legendaire"?[30,40,30]:8);
    if(i===cards.length-1){const best=cards[cards.length-1];
      $("hint").textContent=best.rarity==="legendaire"?`Incroyable, ${best.name} est dans ton club !`:`Meilleure carte : ${best.name} (${best.ovr})`;}
  },i*420));
  if(state.coins<500)setTimeout(()=>toast("Plus assez de crédits ? Vends tes doublons dans ta collection."),cards.length*420+400);
}

function renderClub(){
  const f=$("filter").value;
  const list=CARDS.filter(c=>f==="all"||c.rarity===f).sort((a,b)=>b.ovr-a.ovr);
  $("grid").innerHTML=list.map(c=>state.owned[c.id]
    ?`<div class="slot">${cardHTML(c)}${state.owned[c.id]>1?`<span class="count">×${state.owned[c.id]}</span>`:""}</div>`
    :`<div class="card locked"><div class="ovr">?</div><div class="genre">${LABEL[c.rarity]}</div><div class="disc"></div><div class="name">À trouver</div></div>`).join("");
  const n=CARDS.filter(c=>state.owned[c.id]).length;
  $("pbar").style.width=(n/CARDS.length*100)+"%";$("pct").textContent=`${n} / ${CARDS.length} artistes trouvés`;
}
$("filter").onchange=renderClub;
$("sellDupes").onclick=()=>{
  let gain=0;for(const c of CARDS){const q=state.owned[c.id]||0;if(q>1){gain+=(q-1)*SELL[c.rarity];state.owned[c.id]=1}}
  if(!gain)return toast("Aucun doublon à vendre.");
  state.coins+=gain;save();wallet();renderClub();toast(`+${gain.toLocaleString("fr-FR")} crédits`);
};
$("optVibrate").checked=state.vibrate;
$("optVibrate").onchange=e=>{state.vibrate=e.target.checked;save()};
$("reset").onclick=()=>{
  if(!confirm("Effacer ta collection et repartir avec 5 000 crédits ?"))return;
  state={...START,owned:{},vibrate:state.vibrate};save();wallet();$("reveal").innerHTML="";$("hint").textContent="Choisis un pack pour l’ouvrir.";toast("Nouvelle partie !");
};

// ---------- écrans ----------
const SCREENS=["s-shop","s-club","s-settings"];
function show(id){
  SCREENS.forEach(s=>$(s).hidden=s!==id);
  if(id==="s-club")renderClub();
  scrollTo(0,0);
}

// ---------- barre d'onglets du bas, comme Quizly : la bulle de verre s'étire en glissant d'un onglet à l'autre,
// grossit comme une loupe sous le doigt et suit le doigt quand on la fait glisser ----------
const bar=$("tabbar"),pill=$("tabPill"),TABS=[...bar.querySelectorAll(".tab")];
const P={x:0,shown:false,anim:null};
const still=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
const place=(x,sx=1,sy=1)=>{P.x=x;pill.style.transform=`translate3d(${x}px,0,0) scale(${sx},${sy})`};
function haptic(p=8){if(state.vibrate&&navigator.vibrate)navigator.vibrate(p)}
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

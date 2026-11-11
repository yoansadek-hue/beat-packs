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

let state={coins:5000,owned:{}};
try{const s=JSON.parse(localStorage.getItem("beatpacks"));if(s&&typeof s.coins==="number")state=s}catch(e){}
function save(){try{localStorage.setItem("beatpacks",JSON.stringify(state))}catch(e){}}

const $=id=>document.getElementById(id);
function toast(t){const el=$("toast");el.textContent=t;el.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("show"),2200)}
function wallet(){$("wallet").textContent=state.coins.toLocaleString("fr-FR")+" crédits";renderPacks()}

function cardHTML(c,extra=""){
  return `<div class="card r-${c.rarity} ${extra}">
    <span class="tag">${LABEL[c.rarity]}</span>
    <div class="ovr">${c.ovr}</div><div class="genre">${c.genre}</div>
    <div class="disc"><span></span></div>
    <div class="name">${c.name}</div>
    <div class="stats">${Object.entries(c.stats).map(([k,v])=>`<span>${k} ${v}</span>`).join("")}</div>
  </div>`;
}
function pickRarity(odds){let x=Math.random(),acc=0;for(const r of ORDER){acc+=odds[r];if(x<acc)return r}return "commun"}
function draw(r){const pool=CARDS.filter(c=>c.rarity===r);return pool[Math.floor(Math.random()*pool.length)]}

function renderPacks(){
  $("packs").innerHTML=PACKS.map(p=>`<button class="pack p-${p.key}" data-k="${p.key}" ${state.coins<p.price?"disabled":""}>
    <div><h3>${p.name}</h3><p>${p.desc}</p></div><div class="price">${p.price.toLocaleString("fr-FR")} crédits</div></button>`).join("");
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
  cards.forEach((c,i)=>setTimeout(()=>{
    box.insertAdjacentHTML("beforeend",cardHTML(c,"flip"));
    if(i===cards.length-1){const best=cards[cards.length-1];
      $("hint").textContent=best.rarity==="legendaire"?`Incroyable, ${best.name} est dans ton club !`:`Meilleure carte : ${best.name} (${best.ovr})`;}
  },i*420));
  if(state.coins<500&&!Object.keys(state.owned).length===false)setTimeout(()=>toast("Plus assez de crédits ? Vends tes doublons dans ta collection."),cards.length*420+400);
}

function renderClub(){
  const f=$("filter").value;
  const list=CARDS.filter(c=>f==="all"||c.rarity===f).sort((a,b)=>b.ovr-a.ovr);
  $("grid").innerHTML=list.map(c=>state.owned[c.id]
    ?`<div style="position:relative">${cardHTML(c)}${state.owned[c.id]>1?`<span class="count">×${state.owned[c.id]}</span>`:""}</div>`
    :`<div class="card locked"><div class="ovr">?</div><div class="genre">${LABEL[c.rarity]}</div><div class="disc"></div><div class="name">À trouver</div></div>`).join("");
  const n=CARDS.filter(c=>state.owned[c.id]).length;
  $("bar").style.width=(n/CARDS.length*100)+"%";$("pct").textContent=`${n} / ${CARDS.length}`;
}
$("filter").onchange=renderClub;
$("sellDupes").onclick=()=>{
  let gain=0;for(const c of CARDS){const q=state.owned[c.id]||0;if(q>1){gain+=(q-1)*SELL[c.rarity];state.owned[c.id]=1}}
  if(!gain)return toast("Aucun doublon à vendre.");
  state.coins+=gain;save();wallet();renderClub();toast(`+${gain.toLocaleString("fr-FR")} crédits`);
};
document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{
  document.querySelectorAll(".tab").forEach(x=>x.setAttribute("aria-selected",x===t));
  $("shop").hidden=t.dataset.view!=="shop";$("club").hidden=t.dataset.view!=="club";
  if(t.dataset.view==="club")renderClub();
});
wallet();

// Mise à jour hebdomadaire du jeu (lancée chaque semaine par GitHub Actions, ou à la main : node tools/weekly.js)
// 1) streams Spotify de tous les titres (pages publiques kworb.net)
// 2) nouveautés : albums et EP sortis ces 4 dernières semaines par les artistes du jeu (Deezer)
// 3) dates de sortie des albums (Deezer), pour les cartes anniversaire
// 4) TOTW : les 10 titres du jeu les plus écoutés de la semaine (classements Spotify France, États-Unis, Royaume-Uni)
// Étapes au choix : STEPS=streams,news,dates,totw (toutes par défaut)
const fs=require("fs"),path=require("path");
const ROOT=path.join(__dirname,".."),DATA=path.join(ROOT,"data.js"),LIVEF=path.join(ROOT,"live.js");
const IDS=JSON.parse(fs.readFileSync(path.join(__dirname,"spotify_ids.json"),"utf8"));
const DZF=path.join(__dirname,"deezer_ids.json");
const DZ=fs.existsSync(DZF)?JSON.parse(fs.readFileSync(DZF,"utf8")):{};
eval(fs.readFileSync(DATA,"utf8").replace("const ARTISTS","global.ARTISTS").replace("const ALBUMS","global.ALBUMS"));
let LIVE={updated:"",totw:[],news:[]};
if(fs.existsSync(LIVEF)){try{LIVE=JSON.parse(fs.readFileSync(LIVEF,"utf8").replace(/^[\s\S]*?const LIVE = /,"").replace(/;\s*$/,""))}catch(e){console.log("live.js illisible, on repart de zéro")}}
const STEPS=new Set((process.env.STEPS||"streams,news,dates,totw").split(","));

const slug=s=>String(s).normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const clean=t=>slug(String(t).replace(/\s*[\(\[][^\)\]]*[\)\]]/g,"").replace(/\s+-\s+.*$/,"").replace(/\s+(feat|ft|with)\.?\s.*$/i,""));
const dec=s=>s.replace(/&amp;/g,"&").replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/<[^>]+>/g,"").replace(/^\*\s*/,"").trim();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const round=v=>v>=100?Math.round(v):v>=10?Math.round(v*10)/10:Math.max(.01,Math.round(v*100)/100);
const today=new Date(),iso=d=>d.toISOString().slice(0,10);
function isoWeek(d){const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const day=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-day);const y=t.getUTCFullYear(),w=Math.ceil(((t-Date.UTC(y,0,1))/864e5+1)/7);return `${y}-W${String(w).padStart(2,"0")}`}
async function get(url,json){
  for(let t=0;t<4;t++){
    try{const r=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0"}});if(r.status===200){const b=json?await r.json():await r.text();if(json&&b.error){await sleep(3000);continue}return b}await sleep(3000)}catch(e){await sleep(3000)}
  }
  return null;
}
function kworbSongs(h){
  const out={};
  for(const row of (h||"").match(/<tr>[\s\S]*?<\/tr>/g)||[]){
    const c=(row.match(/<td[^>]*>[\s\S]*?<\/td>/g)||[]).map(dec);
    if(c.length<2||!/^[\d,]+$/.test(c[1]))continue;
    const k=clean(c[0]),v=+c[1].replace(/,/g,"")/1e6;if(k)out[k]=Math.max(out[k]||0,v);
  }
  return out;
}

(async()=>{
  const byArtist={};ALBUMS.forEach(al=>(byArtist[al.ar]??=[]).push(al));
  const known=new Set(ALBUMS.map(a=>String(a.id)));
  const cutoff=iso(new Date(today-28*864e5));
  let upd=0,added=[];
  if(STEPS.has("streams")||STEPS.has("news"))for(const a of ARTISTS){
    const albs=byArtist[a.id]||[];
    let S={};
    if(IDS[a.id]){S=kworbSongs(await get(`https://kworb.net/spotify/artist/${IDS[a.id]}_songs.html`));await sleep(2000)}
    if(STEPS.has("streams"))for(const al of albs)for(const t of al.tr){const v=S[clean(t[0])];if(v&&v>t[1]){t[1]=round(v);upd++}} // un nombre d'écoutes ne baisse jamais
    if(STEPS.has("news")&&albs.length){
      if(!DZ[a.id]){const al=await get(`https://api.deezer.com/album/${albs[0].id}`,true);await sleep(150);if(al&&al.artist)DZ[a.id]=al.artist.id}
      if(!DZ[a.id])continue;
      const list=await get(`https://api.deezer.com/artist/${DZ[a.id]}/albums?limit=20`,true);await sleep(150);
      for(const x of (list&&list.data)||[]){
        if(!x.release_date||x.release_date<cutoff||x.release_date>iso(today)||known.has(String(x.id))||x.record_type==="single")continue;
        if(albs.some(al=>clean(al.t)===clean(x.title)))continue; // réédition d'un album déjà dans le jeu
        if(/\b(live|tiny desk|instrumental|remix(es)?|sped up|slowed|acapella|karaok)/i.test(x.title))continue; // pas les versions live, instrumentales ou remixées
        const full=await get(`https://api.deezer.com/album/${x.id}`,true);await sleep(150);
        if(!full||!full.tracks||full.tracks.data.length<3||(full.artist&&full.artist.id!==DZ[a.id]))continue;
        const al={id:String(x.id),ar:a.id,t:full.title,y:+full.release_date.slice(0,4),d:full.release_date,cv:full.cover_xl||full.cover_big,tr:full.tracks.data.map(t=>[t.title,round(S[clean(t.title)]||.05)])};
        ALBUMS.push(al);albs.push(al);known.add(al.id);added.push(al);
        console.log(`+ nouveauté : ${a.n} - ${al.t} (${al.d}, ${al.tr.length} titres)`);
      }
    }
  }
  fs.writeFileSync(DZF,JSON.stringify(DZ,null,1));
  if(STEPS.has("dates")){
    let n=0;
    for(const al of ALBUMS){if(al.d)continue;const x=await get(`https://api.deezer.com/album/${al.id}`,true);await sleep(130);if(x&&x.release_date&&x.release_date!=="0000-00-00"){al.d=x.release_date;n++}}
    console.log(`dates de sortie ajoutées : ${n}`);
  }
  // nouveautés affichées dans le jeu : les sorties des 4 dernières semaines, les plus récentes d'abord
  LIVE.news=ALBUMS.filter(al=>al.d&&al.d>=cutoff&&al.d<=iso(today)).sort((x,y)=>y.d.localeCompare(x.d)).slice(0,12).map(al=>al.id);
  if(STEPS.has("totw")){
    const sp2ar={};for(const [k,v] of Object.entries(IDS))if(v)sp2ar[v]=k;
    const score={};
    for(const c of ["fr","us","gb"]){
      const h=await get(`https://kworb.net/spotify/country/${c}_weekly.html`);await sleep(2000);if(!h)continue;
      let top=0;
      for(const row of h.match(/<tr>[\s\S]*?<\/tr>/g)||[]){
        const ar=(row.match(/artist\/([A-Za-z0-9]+)\.html/)||[])[1],tt=(row.match(/track\/[A-Za-z0-9]+\.html">([^<]+)</)||[])[1];
        const tds=(row.match(/<td[^>]*>[\s\S]*?<\/td>/g)||[]).map(dec),st=+((tds[6]||"").replace(/,/g,""));
        if(!ar||!tt||!st)continue;top=Math.max(top,st);
        const id=sp2ar[ar];if(!id)continue;
        for(const al of byArtist[id]||[])al.tr.forEach((t,i)=>{if(clean(t[0])===clean(dec(tt))){const k=al.id+":"+i;score[k]=Math.max(score[k]||0,st/top)}});
      }
    }
    // une seule version par titre, au plus 2 titres par artiste
    const seen=new Set(),per={},pick=[];
    for(const [k,s] of Object.entries(score).sort((x,y)=>y[1]-x[1])){
      const [alb,i]=k.split(":"),al=ALBUMS.find(a=>String(a.id)===alb),key=al.ar+"|"+clean(al.tr[i][0]);
      if(seen.has(key)||(per[al.ar]||0)>=2)continue;seen.add(key);per[al.ar]=(per[al.ar]||0)+1;pick.push([alb,+i]);if(pick.length>=10)break;
    }
    const w=isoWeek(today);
    if(pick.length>=5){LIVE.totw=[{w,tr:pick},...LIVE.totw.filter(x=>x.w!==w)].slice(0,52);console.log(`TOTW ${w} :`,pick.map(([a,i])=>{const al=ALBUMS.find(x=>String(x.id)===a);return al.tr[i][0]}).join(" | "))}
    else console.log("TOTW : pas assez de titres trouvés, on garde la précédente");
  }
  LIVE.updated=iso(today);
  const src=fs.readFileSync(DATA,"utf8").split("\n");
  const head=src.filter(l=>l.startsWith("//")||l.startsWith("const ARTISTS"));
  fs.writeFileSync(DATA,[...head,"const ALBUMS = [",...ALBUMS.map(a=>JSON.stringify(a)+","),"];",""].join("\n"));
  fs.writeFileSync(LIVEF,`// Généré chaque semaine par tools/weekly.js : TOTW, nouveautés, date de la dernière mise à jour des streams.\nconst LIVE = ${JSON.stringify(LIVE)};\n`);
  console.log(`streams mis à jour : ${upd} titres · nouveautés : ${added.length}`);
})();

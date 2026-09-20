let data=[];
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const validUrl=v=>{try{let u=new URL(v);return ["http:","https:"].includes(u.protocol)}catch{return false}};
function addOptions(id,values){const s=$(id);[...new Set(values.filter(Boolean))].sort().forEach(v=>{const o=document.createElement("option");o.value=v;o.textContent=v;s.appendChild(o)})}
function buildThemes(){
  const box=$("themeTiles"),counts={};
  data.forEach(x=>counts[x.theme]=(counts[x.theme]||0)+1);
  box.innerHTML=Object.keys(counts).sort().map(t=>`<button class="theme-tile" type="button" data-theme="${esc(t)}"><span>${esc(t)}</span><span class="theme-count">${counts[t]} dataset${counts[t]===1?"":"s"}</span></button>`).join("");
  box.querySelectorAll(".theme-tile").forEach(b=>b.onclick=()=>{const selected=b.dataset.theme;$("theme").value=selected;document.querySelectorAll(".theme-tile").forEach(x=>x.classList.toggle("active",x===b));render();$("catalogue").scrollIntoView({behavior:"smooth"})});
}
const keywordList=v=>String(v||"").split(/[,;|]/).map(x=>x.trim()).filter(Boolean);
const parseCheckedDate=v=>{
  if(!v) return null;
  const raw=String(v).trim();
  // Supports ISO dates, normal browser-readable dates, and values such as Sep-26.
  let d=new Date(raw);
  if(!Number.isNaN(d.getTime())) return d;
  const m=raw.match(/^([A-Za-z]{3,9})[-\s](\d{2}|\d{4})$/);
  if(m){
    const year=m[2].length===2?2000+Number(m[2]):Number(m[2]);
    d=new Date(`${m[1]} 1, ${year}`);
    if(!Number.isNaN(d.getTime())) return d;
  }
  return null;
};
const isNew=x=>{
  const d=parseCheckedDate(x.lastChecked);
  if(!d) return false;
  const age=Date.now()-d.getTime();
  return age>=0 && age<=30*24*60*60*1000;
};
function render(){
  const q=$("q").value.toLowerCase().trim(),t=$("theme").value,p=$("publisher").value,k=$("keyword").value;
  let r=data.filter(x=>(!t||x.theme===t)&&(!p||x.publisher===p)&&(!k||keywordList(x.keywords).includes(k))&&(!q||[x.title,x.theme,x.publisher,x.description,x.keywords,x.geography].join(" ").toLowerCase().includes(q)));
  const sort=$("sort").value;r.sort((a,b)=>String(a[sort]||"").localeCompare(String(b[sort]||"")));
  $("count").textContent=`${r.length} of ${data.length} datasets`;
  $("empty").hidden=r.length!==0;
  $("grid").innerHTML=r.map(x=>`<article class="card">
    <div class="card-tags">${isNew(x)?`<span class="new-tag">Newly added</span>`:""}<span class="tag">${esc(x.theme)}</span></div>
    <h3>${esc(x.title)}</h3>
    <div class="pub">${esc(x.publisher)}</div>
    <p class="desc">${esc(x.description)}</p>
    <div class="meta">${x.latestAvailable?`<span>Latest: ${esc(x.latestAvailable)}</span>`:""}${x.year?`<span>Year: ${esc(x.year)}</span>`:""}${x.geography?`<span>${esc(x.geography)}</span>`:""}${x.frequency?`<span>${esc(x.frequency)}</span>`:""}</div>
    <div class="actions">${validUrl(x.source)?`<a href="${esc(x.source)}" target="_blank" rel="noopener noreferrer">View Data Source →</a>`:`<span class="missing" title="${esc(x.sourceDisplay||"")}">Source link unavailable</span>`}${validUrl(x.dashboard)?`<a class="secondary" href="${esc(x.dashboard)}" target="_blank" rel="noopener noreferrer">View Dashboard →</a>`:""}</div>
  </article>`).join("");
}
function resetAll(){ $("q").value="";$("theme").value="";$("publisher").value="";$("keyword").value="";$("sort").value="title";document.querySelectorAll(".theme-tile").forEach(x=>x.classList.remove("active"));render()}
async function load(){ try{
  const r=await fetch("./data/catalogue.json?t="+Date.now(),{cache:"no-store"});
  if(!r.ok) throw new Error(await r.text());
  const j=await r.json();data=Array.isArray(j)?j:(j.items||[]);
  addOptions("theme",data.map(x=>x.theme));addOptions("publisher",data.map(x=>x.publisher));addOptions("keyword",data.flatMap(x=>keywordList(x.keywords)));buildThemes();
  $("status").textContent=`Catalogue loaded${j.refreshedAt ? " • Last automated refresh: "+new Date(j.refreshedAt).toLocaleString() : ""}.`;render();
 }catch(e){console.error(e);$("status").textContent="Unable to load the catalogue data. Please contact the Data Hub administrator.";$("count").textContent="0 datasets";}
}
$("q").addEventListener("input",render);$("theme").addEventListener("change",()=>{document.querySelectorAll(".theme-tile").forEach(x=>x.classList.toggle("active",x.dataset.theme===$("theme").value));render()});
$("publisher").addEventListener("change",render);$("keyword").addEventListener("change",render);$("sort").addEventListener("change",render);
$("searchBtn").onclick=()=>{$("catalogue").scrollIntoView({behavior:"smooth"});render()};
$("reset").onclick=resetAll;$("allThemes").onclick=()=>{$("theme").value="";document.querySelectorAll(".theme-tile").forEach(x=>x.classList.remove("active"));render();$("catalogue").scrollIntoView({behavior:"smooth"})};
load();
const API = window.location.origin;
let state = {documents: [], extracted: [], arc: [], rq: [], rules: {}};

document.addEventListener("DOMContentLoaded", async () => {
  setupNavigation();
  setupUpload();
  setupCalculate();
  await loadSchema();
  renderAll();
});

function setupNavigation(){document.querySelectorAll("aside button").forEach(btn=>btn.addEventListener("click",()=>openPage(btn.dataset.page)));}
function openPage(id){document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));document.getElementById(id).classList.add("active");document.querySelectorAll("aside button").forEach(b=>b.classList.toggle("active",b.dataset.page===id));}
function setupUpload(){
  document.getElementById("uploadForm").addEventListener("submit", async event => {
    event.preventDefault();
    const input=document.getElementById("files");
    if(!input.files.length){alert("Veuillez sélectionner au moins un document.");return;}
    const formData=new FormData();
    Array.from(input.files).forEach(file=>formData.append("files",file));
    const response=await fetch(API+"/api/upload",{method:"POST",body:formData});
    const data=await response.json();
    state.documents=data.documents;state.extracted=data.extracted;state.arc=data.arc;state.rq=data.rq;
    renderAll();openPage("review");
  });
}
function setupCalculate(){
  document.getElementById("calculateBtn").addEventListener("click", async () => {
    syncAmounts();
    const response=await fetch(API+"/api/calculate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:state.extracted})});
    const data=await response.json();
    state.arc=data.arc;state.rq=data.rq;
    renderAll();openPage("arc");
  });
}
async function loadSchema(){
  const response=await fetch(API+"/api/schema");
  const data=await response.json();
  state.arc=data.arc;state.rq=data.rq;state.rules=data.rules;
}
function syncAmounts(){document.querySelectorAll("[data-index]").forEach(input=>{state.extracted[Number(input.dataset.index)].amount=input.value;});}
function renderAll(){
  document.getElementById("statDocs").textContent=state.documents.length;
  document.getElementById("statItems").textContent=state.extracted.length;
  document.getElementById("statArc").textContent=state.arc.filter(r=>r.amount).length;
  document.getElementById("statRq").textContent=state.rq.filter(r=>r.amount).length;
  document.getElementById("docRows").innerHTML=state.documents.map(d=>`<tr><td>${esc(d.name)}</td><td>${esc(d.type)}</td><td>${badge(d.status)}</td></tr>`).join("");
  document.getElementById("reviewRows").innerHTML=state.extracted.map((item,i)=>`<tr><td>${esc(item.document)}</td><td>${esc(item.field)}</td><td>${esc(item.arc_line||"")}</td><td>${esc(item.rq_line||"")}</td><td><input type="number" step="0.01" data-index="${i}" value="${esc(item.amount||"")}"></td><td>${esc(item.source)}</td></tr>`).join("");
  renderDeclaration("arcRows",state.arc);renderDeclaration("rqRows",state.rq);
  if(state.rules.arc_t1){renderRules("arcRuleRows",state.rules.arc_t1);renderRules("rqRuleRows",state.rules.rq_tp1);}
}
function renderDeclaration(id,rows){document.getElementById(id).innerHTML=rows.map(r=>`<tr><td><strong>${esc(r.line)}</strong></td><td>${esc(r.label)}</td><td class="amount">${esc(r.amount||"")}</td><td>${esc(r.source||"")}</td><td>${esc(r.type||"")}</td></tr>`).join("");}
function renderRules(id,rows){document.getElementById(id).innerHTML=rows.map(r=>`<tr><td><strong>${esc(r[0])}</strong></td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td></tr>`).join("");}
function badge(status){return status==="Reconnu"?'<span class="ok">Reconnu</span>':'<span class="warn">À vérifier</span>';}
function downloadDeclaration(type){
  const rows=type==="arc"?state.arc:state.rq;
  const title=type==="arc"?"Déclaration fédérale ARC - T1":"Déclaration provinciale Revenu Québec - TP-1";
  const filename=type==="arc"?"declaration_ARC_T1.html":"declaration_RQ_TP1.html";
  const html=`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial;margin:35px}h1{color:#0d6efd}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:10px;text-align:left}th{background:#f3f6fb}</style></head><body><h1>${title}</h1><table><thead><tr><th>Ligne</th><th>Description</th><th>Montant</th><th>Source</th><th>Type</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.line)}</td><td>${esc(r.label)}</td><td>${esc(r.amount||"")}</td><td>${esc(r.source||"")}</td><td>${esc(r.type||"")}</td></tr>`).join("")}</tbody></table><p>Document de travail non transmis officiellement.</p></body></html>`;
  const blob=new Blob([html],{type:"text/html;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
}
function esc(value){return String(value??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}

const API = "http://127.0.0.1:8000";
let state = { documents: [], analysis: [], arc: [], rq: [] };

document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  setupUpload();
  loadSchema();
  renderAll();
});

function setupNavigation(){
  document.querySelectorAll("aside button").forEach(btn=>{
    btn.addEventListener("click",()=>openPage(btn.dataset.page));
  });
}

function openPage(id){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.querySelectorAll("aside button").forEach(b=>b.classList.toggle("active",b.dataset.page===id));
}

function setupUpload(){
  document.getElementById("uploadForm").addEventListener("submit", async e=>{
    e.preventDefault();
    const input = document.getElementById("files");
    if(!input.files.length){ alert("Veuillez sélectionner au moins un document."); return; }

    const formData = new FormData();
    Array.from(input.files).forEach(file => formData.append("files", file));

    const res = await fetch(API + "/upload", { method:"POST", body:formData });
    const data = await res.json();

    state.documents = data.documents;
    state.analysis = data.analysis;
    state.arc = data.arc;
    state.rq = data.rq;

    renderAll();
    openPage("analyse");
  });
}

async function loadSchema(){
  const res = await fetch(API + "/schema");
  const data = await res.json();
  state.arc = data.arc;
  state.rq = data.rq;
  renderAll();
}

function renderAll(){
  document.getElementById("countDocs").textContent = state.documents.length;
  document.getElementById("countArc").textContent = state.arc.filter(x=>x.source).length;
  document.getElementById("countRq").textContent = state.rq.filter(x=>x.source).length;
  document.getElementById("status").textContent = state.documents.length ? "Analyse" : "Brouillon";

  document.getElementById("documentRows").innerHTML = state.documents.map(d =>
    `<tr><td>${esc(d.name)}</td><td>${d.type}</td><td>${badge(d.status)}</td></tr>`
  ).join("");

  document.getElementById("analysisRows").innerHTML = state.analysis.map(a =>
    `<tr><td>${esc(a.document)}</td><td>${a.field}</td><td>${a.arc_line||""}</td><td>${a.rq_line||""}</td><td>${a.status}</td></tr>`
  ).join("");

  renderTax("arcRows", state.arc);
  renderTax("rqRows", state.rq);

  document.getElementById("summary").innerHTML =
    `<p><strong>Documents :</strong> ${state.documents.length}</p>
     <p><strong>Lignes ARC détectées :</strong> ${state.arc.filter(x=>x.source).length}</p>
     <p><strong>Lignes Revenu Québec détectées :</strong> ${state.rq.filter(x=>x.source).length}</p>
     <p>Les montants restent vides tant que l’OCR réel n’est pas activé.</p>`;
}

function renderTax(id, rows){
  document.getElementById(id).innerHTML = rows.map(r =>
    `<tr><td><strong>${r.line}</strong></td><td>${r.label}</td><td>${r.amount||""}</td><td>${r.source||""}</td></tr>`
  ).join("");
}

document.getElementById("btnValidate").addEventListener("click",()=>{
  const issues = [];
  if(!state.documents.length) issues.push("Aucun document téléversé.");
  if(!state.arc.some(x=>x.source)) issues.push("Aucune ligne ARC détectée.");
  if(!state.rq.some(x=>x.source)) issues.push("Aucune ligne Revenu Québec détectée.");
  if(!issues.length) issues.push("Validation terminée.");
  document.getElementById("validationBox").innerHTML = issues.map(x=>`<p>${x}</p>`).join("");
});

function badge(v){
  if(v==="Reconnu") return `<span class="badge ok">${v}</span>`;
  if(v==="À vérifier") return `<span class="badge warn">${v}</span>`;
  return `<span class="badge empty">${v}</span>`;
}

function esc(s){
  return String(s).replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}

const state = {
  documents: [],
  analyses: [],
  arc: [],
  rq: []
};

async function init() {
  const res = await fetch("data/formulaires.json");
  const defs = await res.json();
  state.arc = defs.arc.map(r => ({ ligne: r[0], description: r[1], montant: "", source: "", etat: "Vide" }));
  state.rq = defs.rq.map(r => ({ ligne: r[0], description: r[1], montant: "", source: "", etat: "Vide" }));
  setupNavigation();
  setupDropZone();
  renderAll();
}

function setupNavigation() {
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
      document.getElementById(btn.dataset.page).classList.add("active");
    });
  });
}

function setupDropZone() {
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");

  dropZone.addEventListener("click", () => fileInput.click());

  dropZone.addEventListener("dragover", event => {
    event.preventDefault();
    dropZone.classList.add("dragover");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
  });

  dropZone.addEventListener("drop", event => {
    event.preventDefault();
    dropZone.classList.remove("dragover");
    addFiles(event.dataTransfer.files);
  });

  fileInput.addEventListener("change", () => addFiles(fileInput.files));
}

function addFiles(fileList) {
  Array.from(fileList).forEach(file => {
    const format = file.name.split(".").pop().toUpperCase();
    if (!["PDF", "JPG", "JPEG", "PNG"].includes(format)) {
      state.documents.push({
        name: file.name,
        format,
        type: "Format non accepté",
        destination: "Aucune",
        etat: "Erreur"
      });
      return;
    }

    const type = detectType(file.name);
    state.documents.push({
      name: file.name,
      format,
      type,
      destination: destinationFor(type),
      etat: type === "Document fiscal non reconnu" ? "À vérifier" : "Reconnu"
    });
  });

  renderAll();
}

function processSelectedFiles() {
  state.analyses = [];
  resetDeclarations();

  state.documents.forEach(doc => {
    if (doc.etat === "Erreur") return;

    const mapping = mappingFor(doc.type);

    state.analyses.push({
      document: doc.name,
      champ: mapping.champ,
      arc: mapping.arc,
      rq: mapping.rq,
      statut: mapping.statut
    });

    if (mapping.arc) fillLine("arc", mapping.arc, "", doc.type);
    if (mapping.rq) fillLine("rq", mapping.rq, "", doc.type);
  });

  renderAll();
  openPage("analyse");
}

function detectType(name) {
  const n = name.toLowerCase();

  if (n.includes("t4a") && (n.includes("oas") || n.includes("psv"))) return "T4A(OAS)";
  if (n.includes("t4a")) return "T4A";
  if (n.includes("t4")) return "T4";
  if (n.includes("t5")) return "T5";
  if (n.includes("t1") || n.includes("arc") || n.includes("canada")) return "Déclaration ARC T1";
  if (n.includes("tp-1") || n.includes("tp1") || n.includes("revenu quebec") || n.includes("revenu québec") || n.includes("rq")) return "Déclaration Revenu Québec TP-1";
  if (n.includes("rl-1") || n.includes("relevé 1") || n.includes("releve 1")) return "Relevé 1";
  if (n.includes("rl-2") || n.includes("relevé 2") || n.includes("releve 2")) return "Relevé 2";
  if (n.includes("facture") || n.includes("reçu") || n.includes("recu")) return "Facture ou reçu";
  if (n.includes("medical") || n.includes("médical")) return "Frais médicaux";
  if (n.includes("don")) return "Don";
  if (n.includes("loyer")) return "Loyer";

  return "Document fiscal non reconnu";
}

function destinationFor(type) {
  const map = {
    "T4": "ARC 10100 / RQ 101",
    "Relevé 1": "RQ 101",
    "T4A(OAS)": "ARC 11300 / RQ 114",
    "Relevé 2": "ARC 11400 / RQ 119",
    "T5": "ARC 12100 / RQ 130",
    "Déclaration ARC T1": "ARC T1",
    "Déclaration Revenu Québec TP-1": "RQ TP-1",
    "Facture ou reçu": "Crédits ou déductions",
    "Frais médicaux": "Crédits médicaux",
    "Don": "Crédits pour dons",
    "Loyer": "Annexes / crédits RQ"
  };
  return map[type] || "À classer";
}

function mappingFor(type) {
  const map = {
    "T4": { champ: "Revenus d'emploi", arc: "10100", rq: "101", statut: "Montant à extraire par OCR" },
    "Relevé 1": { champ: "Revenus d'emploi Québec", arc: "", rq: "101", statut: "Montant à extraire par OCR" },
    "T4A(OAS)": { champ: "Pension de sécurité de la vieillesse", arc: "11300", rq: "114", statut: "Montant à extraire par OCR" },
    "Relevé 2": { champ: "Prestations RRQ ou RPC", arc: "11400", rq: "119", statut: "Montant à extraire par OCR" },
    "T5": { champ: "Revenus de placements", arc: "12100", rq: "130", statut: "Montant à extraire par OCR" },
    "Déclaration ARC T1": { champ: "Lignes de déclaration fédérale", arc: "T1", rq: "", statut: "Lecture du formulaire à prévoir" },
    "Déclaration Revenu Québec TP-1": { champ: "Lignes de déclaration provinciale", arc: "", rq: "TP-1", statut: "Lecture du formulaire à prévoir" },
    "Facture ou reçu": { champ: "Dépense ou crédit potentiel", arc: "", rq: "", statut: "À classifier" },
    "Frais médicaux": { champ: "Frais médicaux", arc: "", rq: "", statut: "À classifier" },
    "Don": { champ: "Dons", arc: "", rq: "", statut: "À classifier" },
    "Loyer": { champ: "Loyer / maintien à domicile", arc: "", rq: "Annexe J", statut: "À classifier" }
  };

  return map[type] || { champ: "Document non reconnu", arc: "", rq: "", statut: "À vérifier manuellement" };
}

function resetDeclarations() {
  state.arc.forEach(r => { r.montant = ""; r.source = ""; r.etat = "Vide"; });
  state.rq.forEach(r => { r.montant = ""; r.source = ""; r.etat = "Vide"; });
}

function fillLine(target, line, amount, source) {
  const rows = target === "arc" ? state.arc : state.rq;
  const row = rows.find(r => r.ligne === line);
  if (row) {
    row.montant = amount;
    row.source = source;
    row.etat = amount ? "Rempli" : "À extraire";
  }
}

function validateFiles() {
  const messages = [];

  if (state.documents.length === 0) {
    messages.push(["danger", "Aucun document téléversé."]);
  }

  const unknown = state.documents.filter(d => d.type === "Document fiscal non reconnu").length;
  if (unknown) {
    messages.push(["warning", unknown + " document(s) non reconnu(s)."]);
  }

  const toExtract = [...state.arc, ...state.rq].filter(r => r.etat === "À extraire").length;
  if (toExtract) {
    messages.push(["warning", toExtract + " ligne(s) détectée(s), mais les montants doivent être extraits par OCR."]);
  }

  if (messages.length === 0) {
    messages.push(["info", "Validation terminée. Aucun problème détecté."]);
  }

  document.getElementById("validationResults").innerHTML = messages.map(m => `<div class="alert alert-${m[0]}">${m[1]}</div>`).join("");
}

function renderDocuments() {
  document.getElementById("documentRows").innerHTML = state.documents.map(d => `
    <tr>
      <td>${escapeHtml(d.name)}</td>
      <td>${d.format}</td>
      <td>${d.type}</td>
      <td>${d.destination}</td>
      <td>${badge(d.etat)}</td>
    </tr>
  `).join("");
}

function renderAnalyses() {
  document.getElementById("analyseRows").innerHTML = state.analyses.map(a => `
    <tr>
      <td>${escapeHtml(a.document)}</td>
      <td>${a.champ}</td>
      <td>${a.arc}</td>
      <td>${a.rq}</td>
      <td>${a.statut}</td>
    </tr>
  `).join("");
}

function renderRows(id, rows) {
  document.getElementById(id).innerHTML = rows.map(r => `
    <tr>
      <td><strong>${r.ligne}</strong></td>
      <td>${r.description}</td>
      <td>${r.montant}</td>
      <td>${r.source}</td>
      <td>${badge(r.etat)}</td>
    </tr>
  `).join("");
}

function renderSummary() {
  const docs = state.documents.length;
  const recognized = state.documents.filter(d => d.etat === "Reconnu").length;
  const toExtract = [...state.arc, ...state.rq].filter(r => r.etat === "À extraire").length;

  document.getElementById("summary").innerHTML = `
    <p><strong>Documents téléversés :</strong> ${docs}</p>
    <p><strong>Documents reconnus :</strong> ${recognized}</p>
    <p><strong>Lignes fiscales détectées :</strong> ${toExtract}</p>
    <hr>
    <p>Les montants ne sont pas inventés. Ils restent vides tant que l'OCR réel n'est pas relié.</p>
  `;
}

function updateStats() {
  document.getElementById("statDocs").textContent = state.documents.length;
  document.getElementById("statReconnu").textContent = state.documents.filter(d => d.etat === "Reconnu").length;
  document.getElementById("statVerifier").textContent = state.documents.filter(d => d.etat === "À vérifier").length;
  document.getElementById("statEtat").textContent = state.documents.length ? "Documents chargés" : "Brouillon";
}

function renderAll() {
  renderDocuments();
  renderAnalyses();
  renderRows("arcRows", state.arc);
  renderRows("rqRows", state.rq);
  renderSummary();
  updateStats();
}

function clearDocuments() {
  state.documents = [];
  state.analyses = [];
  resetDeclarations();
  renderAll();
}

function openPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.page === id));
}

function badge(v) {
  if (v === "Reconnu" || v === "Rempli") return `<span class="badge badge-ok">${v}</span>`;
  if (v === "À vérifier" || v === "À extraire") return `<span class="badge badge-warning">${v}</span>`;
  if (v === "Erreur") return `<span class="badge badge-error">${v}</span>`;
  return `<span class="badge badge-empty">${v}</span>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[m]));
}

init();

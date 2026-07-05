
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import List, Dict, Any
from pathlib import Path
import shutil, json

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR.parent / "frontend"
UPLOAD_DIR = BASE_DIR / "uploads"
RULES_FILE = BASE_DIR / "data" / "tax_rules.json"
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI(title="Application Impôts ARC / Revenu Québec")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def load_rules():
    with RULES_FILE.open("r", encoding="utf-8") as f:
        return json.load(f)

def make_rows(key):
    return [
        {"line": x[0], "label": x[1], "source": x[2], "type": x[3], "amount": ""}
        for x in load_rules()[key]
    ]

def detect_type(filename: str) -> str:
    n = filename.lower()
    if "t4a" in n and ("oas" in n or "psv" in n):
        return "T4A(OAS)"
    if "t4" in n:
        return "T4"
    if "t5" in n:
        return "T5"
    if "reer" in n or "rrsp" in n:
        return "REER"
    if "garde" in n or "t778" in n:
        return "Frais de garde"
    if "rl-1" in n or "releve 1" in n or "relevé 1" in n:
        return "Relevé 1"
    if "rl-3" in n or "releve 3" in n or "relevé 3" in n:
        return "Relevé 3"
    if "location" in n or "loyer" in n or "tp-128" in n:
        return "Revenus de location"
    if "facture" in n or "recu" in n or "reçu" in n:
        return "Facture ou reçu"
    if "medical" in n or "médical" in n:
        return "Frais médicaux"
    if "don" in n:
        return "Dons"
    return "Document à vérifier"

def mappings(doc_type: str):
    m = {
        "T4": [
            ["Revenus d'emploi", "10100", "", "T4 case 14"],
            ["Impôt retenu à la source", "43700", "", "T4 case 22"]
        ],
        "Relevé 1": [
            ["Revenus d'emploi", "", "101", "Relevé 1 case A"],
            ["Impôt retenu à la source", "", "455", "Relevé 1 case E"]
        ],
        "T4A(OAS)": [
            ["Prestations de sécurité de la vieillesse", "11300", "122", "T4A(OAS) case 18"]
        ],
        "T5": [
            ["Intérêts et revenus de placements", "12100", "", "T5 case 13"]
        ],
        "Relevé 3": [
            ["Intérêts et revenus de placements", "", "130", "Relevé 3 case A"]
        ],
        "REER": [
            ["Déduction pour REER", "20800", "201", "Reçu REER"]
        ],
        "Frais de garde": [
            ["Frais de garde d'enfants", "21400", "", "Formulaire T778 / reçus"]
        ],
        "Revenus de location": [
            ["Revenus de location", "", "142", "Formulaire TP-128"]
        ],
        "Facture ou reçu": [
            ["Justificatif à classifier", "", "", "Facture ou reçu"]
        ],
        "Frais médicaux": [
            ["Frais médicaux", "", "", "Reçus médicaux"]
        ],
        "Dons": [
            ["Dons", "", "", "Reçus de dons"]
        ]
    }
    return m.get(doc_type, [["Document à vérifier", "", "", doc_type]])

def set_amount(rows, line, amount, source=None):
    for r in rows:
        if r["line"] == line:
            r["amount"] = amount
            if source:
                r["source"] = source

def get_amount(rows, line):
    for r in rows:
        if r["line"] == line:
            try:
                return float(str(r.get("amount", "")).replace(",", "."))
            except ValueError:
                return 0.0
    return 0.0

def calculate(arc, rq):
    arc_total = sum(get_amount(arc, l) for l in ["10100", "11300", "11500", "12100"])
    arc_deduct = sum(get_amount(arc, l) for l in ["20800", "21400"])
    arc_net = max(0, arc_total - arc_deduct)
    arc_tax = get_amount(arc, "42000")
    arc_withheld = get_amount(arc, "43700")

    set_amount(arc, "15000", f"{arc_total:.2f}")
    set_amount(arc, "23600", f"{arc_net:.2f}")
    set_amount(arc, "26000", f"{arc_net:.2f}")
    if arc_withheld > arc_tax:
        set_amount(arc, "48400", f"{arc_withheld - arc_tax:.2f}")
        set_amount(arc, "48500", "")
    elif arc_tax > arc_withheld:
        set_amount(arc, "48400", "")
        set_amount(arc, "48500", f"{arc_tax - arc_withheld:.2f}")

    rq_total = sum(get_amount(rq, l) for l in ["101", "122", "130", "142"])
    rq_deduct = sum(get_amount(rq, l) for l in ["201", "214"])
    rq_net = max(0, rq_total - rq_deduct)
    rq_tax = get_amount(rq, "451") + get_amount(rq, "451.1")
    rq_withheld = get_amount(rq, "455")

    set_amount(rq, "199", f"{rq_total:.2f}")
    set_amount(rq, "275", f"{rq_net:.2f}")
    set_amount(rq, "299", f"{rq_net:.2f}")
    if rq_withheld > rq_tax:
        set_amount(rq, "474", f"{rq_withheld - rq_tax:.2f}")
        set_amount(rq, "479", "")
    elif rq_tax > rq_withheld:
        set_amount(rq, "474", "")
        set_amount(rq, "479", f"{rq_tax - rq_withheld:.2f}")

@app.get("/api/schema")
def schema():
    return {"arc": make_rows("arc_t1"), "rq": make_rows("rq_tp1"), "rules": load_rules()}

@app.post("/api/upload")
async def upload(files: List[UploadFile] = File(...)):
    documents = []
    extracted = []
    for file in files:
        target = UPLOAD_DIR / file.filename
        with target.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        doc_type = detect_type(file.filename)
        documents.append({"name": file.filename, "type": doc_type, "status": "Reconnu" if doc_type != "Document à vérifier" else "À vérifier"})
        for field, arc_line, rq_line, source in mappings(doc_type):
            extracted.append({"document": file.filename, "document_type": doc_type, "field": field, "arc_line": arc_line, "rq_line": rq_line, "source": source, "amount": ""})
    return {"documents": documents, "extracted": extracted, "arc": make_rows("arc_t1"), "rq": make_rows("rq_tp1")}

@app.post("/api/calculate")
def calculate_declarations(payload: Dict[str, Any]):
    arc = make_rows("arc_t1")
    rq = make_rows("rq_tp1")
    for item in payload.get("items", []):
        amount = str(item.get("amount", "")).strip()
        if not amount:
            continue
        if item.get("arc_line"):
            set_amount(arc, item["arc_line"], amount, item.get("source", "Document"))
        if item.get("rq_line"):
            set_amount(rq, item["rq_line"], amount, item.get("source", "Document"))
    calculate(arc, rq)
    return {"arc": arc, "rq": rq}

app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")

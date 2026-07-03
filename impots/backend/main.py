from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import List
import shutil
from pathlib import Path

app = FastAPI(title="Impôts IA - Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ARC_SCHEMA = [
    {"line": "10100", "label": "Revenus d'emploi", "amount": "", "source": ""},
    {"line": "11300", "label": "Pension de sécurité de la vieillesse", "amount": "", "source": ""},
    {"line": "11400", "label": "Prestations du RPC ou du RRQ", "amount": "", "source": ""},
    {"line": "12100", "label": "Intérêts et autres revenus de placements", "amount": "", "source": ""},
    {"line": "14600", "label": "Versement net des suppléments fédéraux", "amount": "", "source": ""},
    {"line": "15000", "label": "Revenu total", "amount": "", "source": ""},
    {"line": "23600", "label": "Revenu net", "amount": "", "source": ""},
    {"line": "26000", "label": "Revenu imposable", "amount": "", "source": ""},
    {"line": "42000", "label": "Impôt fédéral net", "amount": "", "source": ""},
    {"line": "48200", "label": "Remboursement", "amount": "", "source": ""},
]

RQ_SCHEMA = [
    {"line": "101", "label": "Revenus d'emploi", "amount": "", "source": ""},
    {"line": "114", "label": "Pension de sécurité de la vieillesse", "amount": "", "source": ""},
    {"line": "119", "label": "Prestations du RRQ ou du RPC", "amount": "", "source": ""},
    {"line": "130", "label": "Intérêts et autres revenus de placements", "amount": "", "source": ""},
    {"line": "148", "label": "Indemnités de remplacement et suppléments fédéraux", "amount": "", "source": ""},
    {"line": "199", "label": "Revenu total", "amount": "", "source": ""},
    {"line": "275", "label": "Revenu net", "amount": "", "source": ""},
    {"line": "299", "label": "Revenu imposable", "amount": "", "source": ""},
    {"line": "401", "label": "Impôt sur le revenu imposable", "amount": "", "source": ""},
    {"line": "447", "label": "Cotisation assurance médicaments", "amount": "", "source": ""},
    {"line": "458", "label": "Maintien à domicile des aînés", "amount": "", "source": ""},
    {"line": "478", "label": "Remboursement", "amount": "", "source": ""},
]

def detect_type(filename: str) -> str:
    name = filename.lower()
    if "t4a" in name and ("oas" in name or "psv" in name):
        return "T4A(OAS)"
    if "t4" in name:
        return "T4"
    if "t5" in name:
        return "T5"
    if "rl-1" in name or "relevé 1" in name or "releve 1" in name:
        return "Relevé 1"
    if "rl-2" in name or "relevé 2" in name or "releve 2" in name:
        return "Relevé 2"
    if "t1" in name or "arc" in name or "canada" in name:
        return "Déclaration ARC T1"
    if "tp-1" in name or "tp1" in name or "rq" in name or "quebec" in name or "québec" in name:
        return "Déclaration Revenu Québec TP-1"
    if "recu" in name or "reçu" in name or "facture" in name:
        return "Reçu ou facture"
    return "À vérifier"

def apply_mapping(doc_type: str, arc: list, rq: list, analysis: list, filename: str):
    mapping = {
        "T4": ("Revenus d'emploi", "10100", "101"),
        "T4A(OAS)": ("Pension de sécurité de la vieillesse", "11300", "114"),
        "Relevé 2": ("Prestations RRQ/RPC", "11400", "119"),
        "T5": ("Revenus de placements", "12100", "130"),
        "Relevé 1": ("Revenus d'emploi Québec", "", "101"),
    }
    if doc_type not in mapping:
        analysis.append({
            "document": filename,
            "field": "Document à analyser",
            "arc_line": "",
            "rq_line": "",
            "status": "OCR requis"
        })
        return

    field, arc_line, rq_line = mapping[doc_type]
    analysis.append({
        "document": filename,
        "field": field,
        "arc_line": arc_line,
        "rq_line": rq_line,
        "status": "Montant à extraire par OCR"
    })

    for row in arc:
        if row["line"] == arc_line:
            row["source"] = doc_type
    for row in rq:
        if row["line"] == rq_line:
            row["source"] = doc_type

@app.get("/schema")
def schema():
    return {"arc": ARC_SCHEMA, "rq": RQ_SCHEMA}

@app.post("/upload")
async def upload(files: List[UploadFile] = File(...)):
    documents = []
    analysis = []
    arc = [dict(x) for x in ARC_SCHEMA]
    rq = [dict(x) for x in RQ_SCHEMA]

    for file in files:
        target = UPLOAD_DIR / file.filename
        with target.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        doc_type = detect_type(file.filename)
        documents.append({
            "name": file.filename,
            "type": doc_type,
            "status": "Reconnu" if doc_type != "À vérifier" else "À vérifier"
        })

        apply_mapping(doc_type, arc, rq, analysis, file.filename)

    return {
        "documents": documents,
        "analysis": analysis,
        "arc": arc,
        "rq": rq
    }

app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")

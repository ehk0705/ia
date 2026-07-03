# Architecture cible

## 1. Frontend
- HTML
- Bootstrap
- JavaScript
- Tableaux dynamiques
- Formulaires ARC et Revenu Québec séparés

## 2. Backend recommandé
- Python FastAPI ou Node.js
- PostgreSQL
- Stockage chiffré des fichiers
- Module OCR
- Module IA
- Moteur de règles fiscales

## 3. OCR
Options possibles :
- Tesseract local
- Azure Document Intelligence
- Google Vision
- AWS Textract

## 4. IA
Rôle :
- reconnaître les feuillets ;
- extraire les cases ;
- associer les cases aux lignes ARC et RQ ;
- signaler les incohérences.

## 5. Sécurité
- chiffrement au repos ;
- chiffrement en transit ;
- suppression automatique des fichiers ;
- journalisation des accès ;
- hébergement au Canada recommandé.

## 6. Évolution annuelle
Chaque année :
- mettre à jour data/formulaires.json ;
- mettre à jour le moteur de calcul ;
- mettre à jour les annexes ;
- mettre à jour les seuils et crédits.

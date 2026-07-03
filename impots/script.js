function showPage(id, button){document.querySelectorAll('.page').forEach(p=>p.classList.remove('visible'));document.getElementById(id).classList.add('visible');document.querySelectorAll('aside button').forEach(b=>b.classList.remove('active'));if(button)button.classList.add('active')}
function money(value){if(value===null||value===undefined||value==='')return '';if(typeof value==='string')return value;return Number(value).toLocaleString('fr-CA',{style:'currency',currency:'CAD'})}
const avant=[
['12','Votre situation le 31 décembre 2025','Sans conjoint ou conjointe','Sans conjoint ou conjointe'],
['21','Date de la faillite','2025-04-09','2025-04-09'],
['21.1','Période couverte par la déclaration','Avant la faillite','Avant la faillite'],
['25','Biens étrangers','Non','Non'],
['114','Pension de sécurité de la vieillesse, T4A(OAS)',1703.28,1703.28],
['119','Prestations du RRQ ou du RPC, relevé 2, case C',1947.15,1947.15],
['149','Précision sur les suppléments fédéraux','07 - Versement net des suppléments fédéraux','07 - Versement net des suppléments fédéraux'],
['148','Indemnités de remplacement du revenu et suppléments fédéraux',2512.71,2512.71],
['199','Revenu total',6163.14,6163.14],
['275','Revenu net',6163.14,6163.14],
['295','Déductions pour certains revenus',2512.71,2512.71],
['298','Total des déductions',2512.71,2512.71],
['299','Revenu imposable',3650.43,3650.43],
['350','Montant personnel de base',4986.13,4986.13],
['359','Montant personnel de base après redressement',4986.13,4986.13],
['377','Total des montants des lignes 359 à 376',4986.13,4986.13],
['377.1','Ligne 377 multipliée par 14 %',698.06,698.06],
['388','Total des montants des lignes 378 à 385',0,0],
['389','Ligne 388 multipliée par 20 %',0,0],
['399','Crédits d’impôt non remboursables',698.07,698.06],
['401','Impôt sur le revenu imposable',511.06,511.06],
['406','Crédits non remboursables, ligne 399',698.07,698.06],
['413','Impôt après certains crédits',-187.01,-187.00],
['430','Montant de la ligne 413 moins les lignes 414 à 424','',-187.00],
['449','Situation assurance médicaments','32 - Sans conjoint et revenu net ne dépassant pas 19 890 $',''],
['470','Montant de la ligne 450 moins celui de la ligne 468',0,0]
];
const apres=[
['12','Votre situation le 31 décembre 2025','Sans conjoint ou conjointe','Sans conjoint ou conjointe'],
['21','Date de la faillite','', '2025-04-09'],
['21.2','Période couverte par la déclaration','Après la faillite','Après la faillite'],
['25','Biens étrangers','Non','Non'],
['114','Pension de sécurité de la vieillesse, T4A(OAS)',5109.84,5109.84],
['119','Prestations du RRQ ou du RPC, relevé 2, case C',5841.45,5841.45],
['149','Précision sur les suppléments fédéraux','07 - Versement net des suppléments fédéraux','07 - Versement net des suppléments fédéraux'],
['148','Indemnités de remplacement du revenu et suppléments fédéraux',7538.13,7538.13],
['199','Revenu total',18489.42,18489.42],
['275','Revenu net',18489.42,18489.42],
['295','Déductions pour certains revenus',7538.13,7538.13],
['298','Total des déductions',7538.13,7538.13],
['299','Revenu imposable',10951.29,10951.29],
['350','Montant personnel de base',13584.87,13584.87],
['359','Montant personnel de base après redressement',13584.87,13584.87],
['361','Montant âge/personne seule/revenus de retraite',6034.00,6034.00],
['377','Total des montants des lignes 359 à 376',19618.87,19618.87],
['377.1','Ligne 377 multipliée par 14 %',2746.64,2746.64],
['388','Total des montants des lignes 378 à 385',0,0],
['389','Ligne 388 multipliée par 20 %',0,0],
['399','Crédits d’impôt non remboursables',2746.64,2746.64],
['401','Impôt sur le revenu imposable',1533.18,1533.18],
['406','Crédits non remboursables, ligne 399',2746.64,2746.64],
['413','Impôt après certains crédits',-1213.46,-1213.46],
['430','Montant de la ligne 413 moins les lignes 414 à 424','',-1213.46],
['447','Cotisation au régime d’assurance médicaments du Québec','',186.69],
['450','Impôt et cotisations','',186.69],
['458','Crédit maintien à domicile des aînés',140.40,140.40],
['463','Crédit soutien aux aînés',2000.00,2000.00],
['465','Impôt payé et autres crédits',2140.40,2140.40],
['468','Impôt payé et autres crédits incluant maintien à domicile',2140.40,2140.40],
['470','Montant de la ligne 450 moins celui de la ligne 468',-2140.40,-1953.71],
['474','Remboursement avant transfert au conjoint',2140.40,1953.71],
['478','Remboursement',2140.40,1953.71],
['480','Remboursement anticipé',2140.40,'']
];
const annexeB=[
['10','Revenu net, ligne 275',18489.42,24652.56],
['14','Revenu familial',18489.42,24652.56],
['18','Revenu familial net',0,0],
['20','Montant pour personne vivant seule',2128.00,2128.00],
['22','Montant si né avant le 1er janvier 1961','',3906.00],
['31','Réduction du montant',0,''],
['32','Montant auquel vous avez droit',2128.00,6034.00],
['34','Montant reporté à la ligne 361','',6034.00],
['39','Réduction des frais médicaux selon le revenu familial','',739.58]
];
const annexeJ=[
['30','Loyer du dernier mois de l’année',600.00,600.00],
['32','Nombre de mois - premier mois',6,6],
['32','Nombre de mois - dernier mois',6,6],
['34','Coût des services inclus dans le loyer',360.00,360.00],
['75','Coût des services non inclus dans le loyer',360.00,360.00],
['80','Revenu net, ligne 275',18489.42,24652.56],
['82','Revenu familial',18489.42,24652.56],
['90','Crédit maintien à domicile reporté à la ligne 458',140.40,140.40]
];
const annexeK=[
['36','Revenu net, ligne 275','',24652.56],
['40','Revenu familial','',24652.56],
['41','Réduction du revenu familial','',19890.00],
['48','Revenu servant à calculer la cotisation','',4762.56],
['60','Nombre de mois sans cotisation de janvier à juin','',4],
['90','Cotisation assurance médicaments pour vous','',186.69],
['98','Cotisation reportée à la ligne 447','',186.69]
];
function renderTable(id, rows){document.getElementById(id).innerHTML=rows.map(r=>'<tr><td>'+r[0]+'</td><td>'+r[1]+'</td><td>'+money(r[2])+'</td><td>'+money(r[3])+'</td></tr>').join('')}
function numeric(v){return typeof v==='number'?v:0}
function buildTotals(){const lines={};[...avant,...apres].forEach(r=>{const key=r[0]+'|'+r[1];if(!lines[key])lines[key]=[r[0],r[1],0,0];lines[key][2]+=numeric(r[2]);lines[key][3]+=numeric(r[3])});return Object.values(lines).filter(r=>r[2]!==0||r[3]!==0)}
function renderSummary(){const a199=avant.find(r=>r[0]==='199')[2];const p199=apres.find(r=>r[0]==='199')[2];const a275=avant.find(r=>r[0]==='275')[2];const p275=apres.find(r=>r[0]==='275')[2];const a299=avant.find(r=>r[0]==='299')[2];const p299=apres.find(r=>r[0]==='299')[2];const r478=apres.find(r=>r[0]==='478')[3];document.getElementById('summary').innerHTML='<p><strong>Revenu total avant faillite, ligne 199 :</strong> '+money(a199)+'</p><p><strong>Revenu total après faillite, ligne 199 :</strong> '+money(p199)+'</p><p><strong>Revenu total annuel combiné :</strong> '+money(a199+p199)+'</p><hr><p><strong>Revenu net annuel combiné, ligne 275 :</strong> '+money(a275+p275)+'</p><p><strong>Revenu imposable annuel combiné, ligne 299 :</strong> '+money(a299+p299)+'</p><hr><p><strong>Remboursement établi après faillite, ligne 478 :</strong> '+money(r478)+'</p><p>Aucun REER, T4 ou RL-1 n’a été ajouté dans cette version.</p>'}
renderTable('tableAvant',avant);renderTable('tableApres',apres);renderTable('tableTotal',buildTotals());renderTable('tableAnnexeB',annexeB);renderTable('tableAnnexeJ',annexeJ);renderTable('tableAnnexeK',annexeK);renderSummary();

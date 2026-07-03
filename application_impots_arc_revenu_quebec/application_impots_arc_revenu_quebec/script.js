function showStep(id, button) {
  document.querySelectorAll('.step').forEach(step => step.classList.remove('visible'));
  document.getElementById(id).classList.add('visible');

  document.querySelectorAll('aside button').forEach(btn => btn.classList.remove('active'));
  if (button) button.classList.add('active');
}

function showStepById(id) {
  const button = Array.from(document.querySelectorAll('aside button'))
    .find(btn => btn.textContent.toLowerCase().includes(id.substring(0, 5)));
  showStep(id, button);
}

function submitDocuments() {
  const files = document.getElementById('files').files;
  const result = document.getElementById('documentsResult');

  if (!files.length) {
    alert('Veuillez sélectionner au moins un document.');
    return;
  }

  let html = '<strong>Documents soumis :</strong><ul>';
  for (const file of files) {
    html += '<li>' + file.name + '</li>';
  }
  html += '</ul><p>Extraction simulée effectuée.</p>';

  result.innerHTML = html;
  result.classList.remove('hidden');

  const rows = [
    ['T4 / RL-1', 'Revenu d’emploi', '52 500 $', 'Extrait'],
    ['T4', 'Impôt fédéral retenu', '6 200 $', 'Extrait'],
    ['RL-1', 'Impôt Québec retenu', '5 400 $', 'Extrait'],
    ['Reçu REER', 'Cotisation REER', '2 500 $', 'Extrait'],
    ['Reçus médicaux', 'Frais médicaux', '900 $', 'Extrait']
  ];

  document.getElementById('extractionTable').innerHTML = rows.map(row =>
    '<tr><td>' + row[0] + '</td><td>' + row[1] + '</td><td>' + row[2] + '</td><td>' + row[3] + '</td></tr>'
  ).join('');

  showStepById('extraction');
}

function money(value) {
  return value.toLocaleString('fr-CA', {
    style: 'currency',
    currency: 'CAD'
  });
}

function calculate() {
  const revenuFederal = Number(document.getElementById('revenuFederal').value || 0);
  const revenuQuebec = Number(document.getElementById('revenuQuebec').value || 0);
  const impotFederal = Number(document.getElementById('impotFederal').value || 0);
  const impotQuebec = Number(document.getElementById('impotQuebec').value || 0);
  const reer = Number(document.getElementById('reer').value || 0);
  const medical = Number(document.getElementById('medical').value || 0);

  const revenuNetFederal = Math.max(0, revenuFederal - reer);
  const revenuNetQuebec = Math.max(0, revenuQuebec - reer);

  const impotFedEstime = revenuNetFederal * 0.13 - medical * 0.05;
  const impotQcEstime = revenuNetQuebec * 0.12 - medical * 0.04;

  const remboursementFed = impotFederal - impotFedEstime;
  const remboursementQc = impotQuebec - impotQcEstime;
  const total = remboursementFed + remboursementQc;

  document.getElementById('fedResult').textContent = money(remboursementFed);
  document.getElementById('qcResult').textContent = money(remboursementQc);
  document.getElementById('totalResult').textContent = money(total);

  document.getElementById('summary').innerHTML =
    '<p><strong>Revenu fédéral :</strong> ' + money(revenuFederal) + '</p>' +
    '<p><strong>Revenu Québec :</strong> ' + money(revenuQuebec) + '</p>' +
    '<p><strong>REER :</strong> ' + money(reer) + '</p>' +
    '<p><strong>Frais médicaux :</strong> ' + money(medical) + '</p>' +
    '<hr>' +
    '<p><strong>Remboursement fédéral estimé :</strong> ' + money(remboursementFed) + '</p>' +
    '<p><strong>Remboursement Québec estimé :</strong> ' + money(remboursementQc) + '</p>' +
    '<p><strong>Total estimé :</strong> ' + money(total) + '</p>';

  showStepById('calcul');
}

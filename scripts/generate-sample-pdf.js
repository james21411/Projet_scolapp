const { jsPDF } = require('jspdf');
const QRCode = require('qrcode');
const fs = require('fs');
const { format } = require('date-fns');

function numberToFrench(n) {
  if (n === 0) return 'zéro';
  const units = ['','un','deux','trois','quatre','cinq','six','sept','huit','neuf','dix','onze','douze','treize','quatorze','quinze','seize'];
  const tens = ['', '', 'vingt','trente','quarante','cinquante','soixante','soixante','quatre-vingt','quatre-vingt'];
  function underHundred(num) {
    if (num < 17) return units[num];
    if (num < 20) return 'dix-' + units[num - 10];
    if (num < 70) {
      const t = Math.floor(num / 10);
      const u = num % 10;
      if (u === 1 && (t === 1 || t === 7 || t === 9)) return tens[t] + '-et-un';
      return tens[t] + (u ? '-' + units[u] : '');
    }
    if (num < 80) return 'soixante' + (num % 20 ? '-' + underHundred(num % 20) : '');
    if (num < 100) return 'quatre-vingt' + (num % 20 ? '-' + underHundred(num % 20) : '');
    return '';
  }
  const parts = [];
  let millis = Math.floor(n / 1000000000);
  if (millis) { parts.push((millis > 1 ? numberToFrench(millis) + ' milliards' : 'un milliard')); n %= 1000000000; }
  let millions = Math.floor(n / 1000000);
  if (millions) { parts.push((millions > 1 ? numberToFrench(millions) + ' millions' : 'un million')); n %= 1000000; }
  let milliers = Math.floor(n / 1000);
  if (milliers) { parts.push((milliers > 1 ? numberToFrench(milliers) + ' mille' : 'mille')); n %= 1000; }
  if (n >= 100) {
    const h = Math.floor(n / 100);
    parts.push((h > 1 ? units[h] + ' cent' : 'cent') + (n % 100 === 0 ? '': ' ' + underHundred(n % 100)));
  } else if (n > 0) {
    parts.push(underHundred(n));
  }
  return parts.join(' ').replace(/ +/g,' ').trim();
}

(async function main() {
  try {
    const outDir = './out';
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

    const sample = {
      student: { id: 'S1234', prenom: 'Jean', nom: 'Dupont', classe: '6ème A', anneeScolaire: '2025-2026', niveau: 'Collège' },
      payment: { id: 'P-001', amount: 150000, date: new Date().toISOString(), receiptNumber: 'REC-20251021-1', reason: 'Frais de scolarité' },
      payments: [ { id: 'P-001', amount: 150000, date: new Date().toISOString(), reason: 'Frais de scolarité' } ],
      feeStructure: [ { name: 'Frais scolarité', amount: 200000, paidAmount: 150000, dueDate: new Date().toISOString() } ],
      schoolInfo: { name: 'École Exemple', slogan: 'Apprendre pour réussir', logoUrl: '' }
    };


    const doc = new jsPDF('p','mm','a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = margin;
    const colorPrimary = [0,51,102];

    doc.setFont('times','bold');
    doc.setFontSize(10);
    doc.text('RÉPUBLIQUE DU CAMEROUN', margin, y);
    doc.setFont('times','normal');
    doc.text('Paix - Travail - Patrie', margin, y+5);
    doc.setFont('times','bold');
    doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
    doc.text('MINISTÈRE DE L\'ÉDUCATION', margin, y+10);
    doc.setTextColor(0,0,0);

    y += 24;
    doc.setFontSize(14);
    doc.setFont('times','bold');
    doc.text(sample.schoolInfo.name, pageWidth/2, y, { align: 'center' });
    y += 8;
    doc.setFontSize(12);
    doc.text("DOSSIER FINANCIER DE L'ELÈVE", pageWidth/2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(10);
    doc.setFont('times','normal');
    doc.text(`Matricule: ${sample.student.id}`, margin, y);
    doc.text(`Nom: ${sample.student.prenom} ${sample.student.nom}`, margin, y+6);
    doc.text(`Classe: ${sample.student.classe}`, margin, y+12);

    // QR
    const qrData = `DossierFinancier|id:${sample.student.id}|nom:${sample.student.prenom} ${sample.student.nom}`;
    try {
      const qrUrl = await QRCode.toDataURL(qrData);
      doc.addImage(qrUrl, 'PNG', pageWidth - margin - 44, y-6, 44, 44);
    } catch(e) {
      // ignore
    }
    y += 28;

    // small table (manual)
    const tableX = margin;
    const tableW = pageWidth - margin * 2;
    const col1W = Math.round(tableW * 0.6);
    const col2W = tableW - col1W;
    const rowH = 8;
    // header
    doc.setDrawColor(220,220,220);
    doc.rect(tableX, y - 6, tableW, rowH, 'S');
    doc.setFont('times','bold');
    doc.text('Libellé', tableX + 2, y);
    doc.text('Montant versé', tableX + col1W + 2, y);
    doc.setFont('times','normal');
    // row 1
    y += rowH;
    doc.rect(tableX, y - 6, tableW, rowH, 'S');
    doc.text(sample.payment.reason, tableX + 2, y);
    doc.text((sample.payment.amount).toLocaleString('fr-FR') + ' XAF', tableX + col1W + 2, y);
    // total row
    y += rowH;
    doc.rect(tableX, y - 6, tableW, rowH, 'S');
    doc.setFont('times','bold');
    doc.text('Total', tableX + 2, y);
    doc.text((sample.payment.amount).toLocaleString('fr-FR') + ' XAF', tableX + col1W + 2, y);
    doc.setFont('times','normal');
    y += rowH + 4;

    const amountWords = numberToFrench(Math.round(sample.payment.amount));
    doc.setFontSize(9);
    doc.text(`Reçu au montant de : ${amountWords} XAF`, margin, y);
    y += 10;

    // recap (manual table)
    const recapX = margin;
    const recapW = pageWidth - margin * 2;
    const colCount = 5;
    const colW = recapW / colCount;
    // header
    doc.setFont('times','bold');
    doc.setDrawColor(230,230,230);
    doc.rect(recapX, y - 6, recapW, rowH, 'S');
    const headers = ['Date limite','Tranches/Frais','Tarif','Déjà payé','Reste à payer'];
    for (let i = 0; i < headers.length; i++) {
      doc.text(headers[i], recapX + i * colW + 2, y);
    }
    doc.setFont('times','normal');
    y += rowH;
    sample.feeStructure.forEach(f => {
      const tarif = Number(f.amount || 0);
      const deja = Number(f.paidAmount || 0);
      const reste = Math.max(0, tarif - deja);
      const cells = [f.dueDate ? format(new Date(f.dueDate), 'dd/MM/yyyy') : '', f.name || '—', tarif.toLocaleString('fr-FR') + ' XAF', deja.toLocaleString('fr-FR') + ' XAF', reste.toLocaleString('fr-FR') + ' XAF'];
      // draw row background
      doc.rect(recapX, y - 6, recapW, rowH, 'S');
      for (let i = 0; i < cells.length; i++) {
        doc.text(String(cells[i]), recapX + i * colW + 2, y);
      }
      y += rowH;
    });
    const finalY = y + 10;
    doc.setFontSize(8);
    doc.setFont('times','italic');
    doc.text("NB: les frais de scolarité payés ne sont ni remboursables, ni transférables.", margin, finalY);

    // write to file
    const arr = doc.output('arraybuffer');
    fs.writeFileSync(`${outDir}/dossier-financier-example.pdf`, Buffer.from(arr));
    console.log('PDF sample generated at out/dossier-financier-example.pdf');
  } catch (err) {
    console.error('Erreur génération PDF sample:', err);
    process.exit(1);
  }
})();

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExpenseRequest } from '@/db/services/expenseDb';

export interface GenerateExpensePdfOptions {
  request: ExpenseRequest;
  schoolInfo?: any;
}

export function generateExpensePdf({ request, schoolInfo }: GenerateExpensePdfOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - 2 * margin;

  // Header Banner
  doc.setFillColor(30, 64, 175); // Dark blue primary
  doc.rect(margin, margin, contentWidth, 14, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('FORMULAIRE DE DEMANDE DE DÉBLOCAGE DE FONDS', pageWidth / 2, margin + 9, { align: 'center' });

  let currentY = margin + 18;

  // Request & Auth Badges if validated
  if (request.status === 'VALIDE' && request.authorizationNumber) {
    doc.setFillColor(220, 252, 231); // Light green background
    doc.setDrawColor(22, 163, 74);
    doc.rect(margin, currentY, contentWidth, 8, 'FD');

    doc.setTextColor(22, 101, 52);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`DEMANDE VALIDÉE  |  N° D'AUTORISATION : ${request.authorizationNumber}`, pageWidth / 2, currentY + 5.5, { align: 'center' });
    currentY += 11;
  } else if (request.status === 'REFUSE') {
    doc.setFillColor(254, 226, 226); // Light red
    doc.setDrawColor(220, 38, 38);
    doc.rect(margin, currentY, contentWidth, 8, 'FD');

    doc.setTextColor(153, 27, 27);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`DEMANDE REFUSÉE  –  Motif: ${request.rejectionReason || 'Non approuvé'}`, pageWidth / 2, currentY + 5.5, { align: 'center' });
    currentY += 11;
  }

  // --- Top 3 Box Section ---
  const boxWidth = (contentWidth - 4) / 3;
  const boxHeight = 52;
  doc.setLineWidth(0.3);
  doc.setDrawColor(0, 0, 0);

  // Box 1: Objet/Rubrique
  doc.rect(margin, currentY, boxWidth, boxHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text('1. Objet/rubrique de la Demande', margin + 3, currentY + 5);

  const rubriques = [
    { key: '101-MP : Salaires et primes', label: '101-MP : Salaires et primes' },
    { key: '102-MP : Matériel scolaire, eau et électricité', label: '102-MP : Matériel scolaire, eau...' },
    { key: '103-MP : Cours de vacances et campagnes promo', label: '103-MP : Cours de vacances...' },
    { key: '104-MP : Fête, sorties et réunions des parents', label: '104-MP : Fête, sorties, réunions...' },
    { key: '105-MP : Bassin, inspection et formations', label: '105-MP : Bassin, inspection...' },
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  let rubY = currentY + 11;

  rubriques.forEach(rub => {
    const isChecked = request.subjectCategory.includes(rub.key.substring(0, 6));
    doc.text(isChecked ? '[X]' : '[  ]', margin + 3, rubY);
    doc.text(rub.label, margin + 9, rubY);
    rubY += 6;
  });

  const isOtherRubrique = !rubriques.some(r => request.subjectCategory.includes(r.key.substring(0, 6)));
  doc.text(isOtherRubrique ? '[X]' : '[  ]', margin + 3, rubY);
  doc.text(`Autre : ${isOtherRubrique ? (request.subjectOther || request.subjectCategory) : '.......................'}`, margin + 9, rubY);

  // Box 2: Documents justificatifs
  const box2X = margin + boxWidth + 2;
  doc.rect(box2X, currentY, boxWidth, boxHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('2. Documents justificatifs joints', box2X + 3, currentY + 5);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.text('(preuves jointes à cette demande)', box2X + 3, currentY + 9);

  const docsList = [
    'Budget prévisionnel',
    'Devis / Factures pro forma',
    'PV de réunion du comité de gestion',
    "Rapport d'activités précédent",
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  let docY = currentY + 15;

  docsList.forEach(dName => {
    const isChecked = (request.justificationDocs || []).some(d => d.toLowerCase().includes(dName.toLowerCase().substring(0, 6)));
    doc.text(isChecked ? '[X]' : '[  ]', box2X + 3, docY);
    doc.text(dName.length > 25 ? dName.substring(0, 25) + '...' : dName, box2X + 9, docY);
    docY += 6;
  });

  const hasOtherDoc = (request.justificationDocs || []).some(d => d.toLowerCase().includes('autre')) || !!request.justificationOther;
  doc.text(hasOtherDoc ? '[X]' : '[  ]', box2X + 3, docY);
  doc.text(`Autre : ${hasOtherDoc ? (request.justificationOther || 'Oui') : '...................'}`, box2X + 9, docY);

  // Box 3: Montant & Justification
  const box3X = box2X + boxWidth + 2;
  doc.rect(box3X, currentY, boxWidth, boxHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('3. Montant Sollicité', box3X + 3, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Montant demandé :`, box3X + 3, currentY + 11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text(`${request.amountRequested.toLocaleString()} XAF`, box3X + 3, currentY + 16);

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date souhaitée : ${request.desiredDate || 'Dès que possible'}`, box3X + 3, currentY + 22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('4. Justification de la Demande', box3X + 3, currentY + 28);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  const justifLines = doc.splitTextToSize(request.justificationText || 'Aucune justification saisie.', boxWidth - 6);
  doc.text(justifLines.slice(0, 4), box3X + 3, currentY + 33);

  currentY += boxHeight + 6;

  // --- Expenses Table ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);
  doc.text('DÉTAILS DES DÉPENSES PROPOSÉES / FOURNISSEURS', margin, currentY);
  currentY += 2;

  const tableItems = (request.items && request.items.length > 0)
    ? request.items
    : [{ description: request.subjectCategory, supplier1: '-', price1: request.amountRequested, supplier2: '', price2: 0, supplier3: '', price3: 0 }];

  const tableData = tableItems.map((item, idx) => {
    const p1 = Number(item.price1 || 0);
    const p2 = Number(item.price2 || 0);
    const p3 = Number(item.price3 || 0);
    const total = p1 > 0 ? p1 : (p2 > 0 ? p2 : p3);
    return [
      item.description || `Article ${idx + 1}`,
      item.supplier1 || '-',
      p1 > 0 ? `${p1.toLocaleString()}` : '-',
      item.supplier2 || '-',
      p2 > 0 ? `${p2.toLocaleString()}` : '-',
      item.supplier3 || '-',
      `${total.toLocaleString()} XAF`
    ];
  });

  // Calculate Total
  const grandTotal = request.items && request.items.length > 0
    ? request.items.reduce((sum, item) => sum + (Number(item.price1) || Number(item.price2) || Number(item.price3) || 0), 0)
    : request.amountRequested;

  tableData.push([
    { content: 'TOTAL', colSpan: 6, styles: { halign: 'right', fontStyle: 'bold' } },
    { content: `${grandTotal.toLocaleString()} XAF`, styles: { fontStyle: 'bold', textColor: [30, 64, 175] } }
  ] as any);

  autoTable(doc, {
    startY: currentY,
    head: [['Intitulé de la dépense', 'Fournisseur 1', 'Prix 1', 'Fournisseur 2', 'Prix 2', 'Fournisseur 3', 'Total']],
    body: tableData,
    margin: { left: margin, right: margin },
    styles: { fontSize: 7.5, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.2 },
    headStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
    theme: 'grid'
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // --- Engagement Section ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('4. Engagement du Responsable ou demandeur :', margin, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  const engagementText = `Je soussigné(e) ${request.applicantName} (${request.applicantRole}) atteste que les informations fournies sont exactes et que les fonds seront utilisés conformément à l'objet précisé ci-dessus.`;
  doc.text(engagementText, margin, currentY, { maxWidth: contentWidth });
  currentY += 6;

  doc.setFont('helvetica', 'normal');
  doc.text(`Fait à ${request.location || 'Yaoundé'}, le ${request.requestDate || new Date().toLocaleDateString('fr-FR')}`, margin, currentY);
  currentY += 8;

  // --- Signatures Block (3 columns) ---
  const sigColWidth = (contentWidth - 4) / 3;
  const sigBoxHeight = 35;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);

  // Sig 1: Demandeur
  doc.rect(margin, currentY, sigColWidth, sigBoxHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Le demandeur', margin + 3, currentY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Nom : ${request.applicantName}`, margin + 3, currentY + 10);
  doc.text(`Rôle : ${request.applicantRole}`, margin + 3, currentY + 14);
  doc.setFont('helvetica', 'italic');
  doc.text('Signature :', margin + 3, currentY + 28);

  // Sig 2: Director
  const sig2X = margin + sigColWidth + 2;
  doc.rect(sig2X, currentY, sigColWidth, sigBoxHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Avis du directeur', sig2X + 3, currentY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Nom : ${request.directorAvisName || 'Directeur d\'établissement'}`, sig2X + 3, currentY + 10);
  doc.text(`Avis : ${request.directorAvisStatus === 'FAVORABLE' ? 'FAVORABLE [X]' : (request.directorAvisStatus === 'DEFAVORABLE' ? 'DÉFAVORABLE [X]' : 'En attente')}`, sig2X + 3, currentY + 14);
  doc.text(`Date : ${request.directorAvisDate || '......../......../..........'}`, sig2X + 3, currentY + 18);
  doc.setFont('helvetica', 'italic');
  doc.text('Signature & Cachet :', sig2X + 3, currentY + 28);

  // Sig 3: Fondation / Admin
  const sig3X = sig2X + sigColWidth + 2;
  doc.rect(sig3X, currentY, sigColWidth, sigBoxHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Avis de la fondation / Direction', sig3X + 3, currentY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Nom : ${request.foundationAvisName || 'Administration Centrale'}`, sig3X + 3, currentY + 10);
  doc.text(`Avis : ${request.foundationAvisStatus === 'FAVORABLE' ? 'FAVORABLE [X]' : (request.foundationAvisStatus === 'DEFAVORABLE' ? 'DÉFAVORABLE [X]' : 'En attente')}`, sig3X + 3, currentY + 14);
  doc.text(`Date : ${request.foundationAvisDate || '......../......../..........'}`, sig3X + 3, currentY + 18);
  doc.setFont('helvetica', 'italic');
  doc.text('Signature & Cachet :', sig3X + 3, currentY + 28);

  currentY += sigBoxHeight + 6;

  // Authorization Number Line
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`N° d'autorisation (Si et seulement si tous les avis favorables) : `, margin, currentY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(request.authorizationNumber ? 22 : 0, request.authorizationNumber ? 101 : 0, request.authorizationNumber ? 52 : 0);
  doc.text(request.authorizationNumber || '..........................................................', margin + 95, currentY);

  // Footer at bottom of page
  const footerY = pageHeight - 16;
  doc.setDrawColor(0, 0, 0);
  doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(75, 85, 99);
  doc.text(`Tél : ${schoolInfo?.phone || '+237 600 00 00 00'}   |   WhatsApp : ${schoolInfo?.phone || '+237 600 00 00 00'}`, pageWidth / 2, footerY + 2, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 64, 175);
  doc.text(`${schoolInfo?.name || "Groupe Scolaire Bilingue l'Équité"}  –  Leadership · Rigueur · Succès`, pageWidth / 2, footerY + 6, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.text(`Localisation : ${schoolInfo?.address || 'Yaoundé, Cameroun'}`, pageWidth / 2, footerY + 10, { align: 'center' });

  return doc;
}

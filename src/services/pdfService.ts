import jsPDF from 'jspdf';
import type { Student } from './studentService';
import type { SchoolInfo } from './schoolInfoService';

export async function generateEnrollmentAttestation(student: Student, schoolInfo: SchoolInfo): Promise<Buffer> {
  const doc = new jsPDF('p', 'mm', 'a4');

  const normalizeText = (t?: string) => (t || '').toString().normalize('NFC');
  const upperFr = (t?: string) => normalizeText(t).toLocaleUpperCase('fr-FR');

  const isPrimary = (student.niveau || '').toLowerCase().includes('primaire') || (student.niveau || '').toLowerCase().includes('maternelle');
  const ministryFr = isPrimary ? 'MINISTÈRE DE L\'ÉDUCATION DE BASE' : 'MINISTÈRE DE L\'ENSEIGNEMENT SECONDAIRE';
  const ministryEn = isPrimary ? 'MINISTRY OF BASIC EDUCATION' : 'MINISTRY OF SECONDARY EDUCATION';

  const colorPrimary = [0, 51, 102];
  const colorMuted = [90, 90, 90];

  const margin = 18;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Use Times for a formal look
  doc.setFont('times', 'normal');

  // Bilingual state header
  let y = margin;
  doc.setFontSize(10);
  doc.setFont('times', 'bold');
  doc.text('RÉPUBLIQUE DU CAMEROUN', margin, y);
  doc.setFont('times', 'normal');
  doc.text('Paix - Travail - Patrie', margin, y + 6);
  doc.setFont('times', 'bold');
  doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
  doc.text(ministryFr, margin, y + 12);

  doc.setTextColor(0, 0, 0);
  doc.setFont('times', 'bold');
  const rightX = pageWidth - margin;
  doc.text('REPUBLIC OF CAMEROON', rightX, y, { align: 'right' });
  doc.setFont('times', 'normal');
  doc.text('Peace - Work - Fatherland', rightX, y + 6, { align: 'right' });
  doc.setFont('times', 'bold');
  doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
  doc.text(ministryEn, rightX, y + 12, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  // Center logo and school info block
  y += 22;
  const centerX = pageWidth / 2;
  const logoSize = 24;
  if (schoolInfo.logoUrl && typeof schoolInfo.logoUrl === 'string' && schoolInfo.logoUrl.startsWith('data:image')) {
    try {
      // Accept JPEG/PNG data URIs
      const format = schoolInfo.logoUrl.includes('png') ? 'PNG' : 'JPEG';
      doc.addImage(schoolInfo.logoUrl, format as any, centerX - logoSize / 2, y, logoSize, logoSize);
    } catch (e) {
      // ignore logo if it fails to load server-side
    }
  }

  y += logoSize + 4;
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.text(schoolInfo.name || 'ÉTABLISSEMENT SCOLAIRE', centerX, y, { align: 'center' });
  y += 6;
  if (schoolInfo.slogan) {
    doc.setFont('times', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
    doc.text(schoolInfo.slogan, centerX, y, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y += 6;
  }
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  const contact = [schoolInfo.address, schoolInfo.phone && `Tél: ${schoolInfo.phone}`, schoolInfo.email && `Email: ${schoolInfo.email}`]
    .filter(Boolean)
    .join(' • ');
  if (contact) {
    doc.text(contact, centerX, y, { align: 'center' });
    y += 10;
  }

  // Title with rule
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
  doc.text("ATTESTATION D'INSCRIPTION", centerX, y, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  y += 6;
  doc.setDrawColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Student information block
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text("Informations de l'élève", pageWidth / 2, y, { align: 'center' });
  y += 5;

  // Cadre centré pour les infos élève
  const studentBoxWidth = pageWidth - 2 * margin;
  const studentBoxX = (pageWidth - studentBoxWidth) / 2;
  const studentEntries = [
    { label: "Nom et Prénom(s)", value: `${upperFr(student.nom)} ${upperFr(student.prenom)}`.trim() || '—' },
    { label: 'Sexe', value: normalizeText(student.sexe) || '—' },
    { label: 'Naissance', value: `${student.dateNaissance ? new Date(student.dateNaissance).toLocaleDateString('fr-FR') : '—'} à ${normalizeText(student.lieuNaissance) || '—'}` },
    { label: 'Nationalité', value: normalizeText(student.nationalite) || '—' },
    { label: 'Classe / Niveau', value: `${normalizeText(student.classe) || '—'} / ${normalizeText(student.niveau) || '—'}` },
    { label: 'Année scolaire', value: normalizeText(student.anneeScolaire) || '—' },
    { label: "Date d'inscription", value: student.createdAt ? new Date(student.createdAt).toLocaleDateString('fr-FR') : '—' },
  ];
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  const studentMaxLabelWidth = Math.max(...studentEntries.map(e => doc.getTextWidth(e.label + ' : ')));
  const studentInnerMargin = 8;
  const studentLabelX = studentBoxX + studentInnerMargin + 2;
  const studentValueX = studentLabelX + studentMaxLabelWidth;
  const studentLineH = 6;
  const studentBoxHeight = studentEntries.length * studentLineH + studentInnerMargin * 2;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.4);
  doc.roundedRect(studentBoxX, y, studentBoxWidth, studentBoxHeight, 2, 2, 'S' as any);
  let sy = y + studentInnerMargin + 2;
  studentEntries.forEach(e => {
    doc.setFont('times', 'bold');
    doc.text(`${e.label} :`, studentLabelX, sy);
    doc.setFont('times', 'normal');
    doc.text(e.value, studentValueX, sy);
    sy += studentLineH;
  });
  y += studentBoxHeight + 8;

  // Parent/guardian info (optional) — bloc centré et encadré
  if (student.infoParent) {
    const p = student.infoParent as any;
    const boxWidth = pageWidth - 2 * margin - 10; // légère marge intérieure
    const boxX = (pageWidth - boxWidth) / 2;
    const title = 'Parent / Tuteur';

    // Titre centré
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text(title, pageWidth / 2, y, { align: 'center' });
    y += 5;

    // Cadre
    const startY = y;
    const lineHeight = 6;
    const entries = [
      { label: "Nom et Prénom(s)", value: `${upperFr(p.nom)} ${upperFr(p.prenom)}`.trim() || '—' },
      { label: 'Profession', value: normalizeText(p.profession) || '—' },
      { label: 'Téléphone', value: normalizeText(p.telephone) || '—' },
      ...(p.email ? [{ label: 'Email', value: normalizeText(p.email) }] : []),
    ];

    // Mesure max label pour alignement interne
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    const maxLabelWidth = Math.max(...entries.map(e => doc.getTextWidth(e.label + ' : ')));
    const innerMargin = 8;
    const contentX = boxX + innerMargin;
    const labelX = contentX + 2;
    const valueX = labelX + maxLabelWidth;

    // Hauteur du cadre
    const boxHeight = entries.length * lineHeight + innerMargin * 2;
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.4);
    doc.roundedRect(boxX, startY, boxWidth, boxHeight, 2, 2, 'S' as any);

    // Remplir contenu centré horizontalement dans le cadre (texte aligné à gauche à l'intérieur)
    let cy = startY + innerMargin + 2;
    entries.forEach(e => {
      doc.setFont('times', 'bold');
      doc.text(`${e.label} :`, labelX, cy);
      doc.setFont('times', 'normal');
      doc.text(e.value as string, valueX, cy);
      cy += lineHeight;
    });

    y = startY + boxHeight + 6;
  }

  // Attestation paragraph
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  const attestation = normalizeText(`Le Chef d'établissement atteste que l'élève susnommé(e) est régulièrement inscrit(e) au sein de l'établissement pour l'année scolaire ${student.anneeScolaire || ''}. La présente attestation lui est délivrée pour servir et valoir ce que de droit.`);
  const wrapped = doc.splitTextToSize(attestation, pageWidth - 2 * margin);
  doc.text(wrapped, margin, y);
  y += wrapped.length * 5 + 8;

  // Place & date
  const town = (schoolInfo.address || '').split(',')[0] || '';
  doc.text(`Fait à ${town}, le ${new Date().toLocaleDateString('fr-FR')}`, margin, y);
  y += 20;

  // Signature block
  const sigX = pageWidth - margin - 70;
  doc.setFont('times', 'bold');
  doc.text("Le Chef d'Établissement", sigX, y);
  doc.setLineWidth(0.4);
  doc.setDrawColor(120, 120, 120);
  doc.line(sigX, y + 18, sigX + 68, y + 18);

  // Stamp placeholder
  const stampX = margin;
  const stampY = y - 8;
  doc.setDrawColor(160, 160, 160);
  doc.rect(stampX, stampY, 36, 36);
  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  doc.text('Cachet de l\'établissement', stampX + 18, stampY + 19, { align: 'center' });

  // Footer note
  doc.setFont('times', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Document généré par le système d\'information de l\'établissement', centerX, pageHeight - 10, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  return Buffer.from(doc.output('arraybuffer'));
}
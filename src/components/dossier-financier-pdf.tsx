"use client";

import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DialogDescription } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { DebugTranches } from './debug-tranches';

// Minimal French number-to-words for amounts (integers). Good enough for receipts.
function numberToFrench(n: number): string {
  if (n === 0) return 'zéro';
  const units = ['','un','deux','trois','quatre','cinq','six','sept','huit','neuf','dix','onze','douze','treize','quatorze','quinze','seize'];
  const tens = ['', '', 'vingt','trente','quarante','cinquante','soixante','soixante','quatre-vingt','quatre-vingt'];

  const underHundred = (num: number): string => {
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
  };

  const parts: string[] = [];
  const milliards = Math.floor(n / 1_000_000_000);
  if (milliards) { parts.push((milliards > 1 ? numberToFrench(milliards) + ' milliards' : 'un milliard')); n %= 1_000_000_000; }
  const millions = Math.floor(n / 1_000_000);
  if (millions) { parts.push((millions > 1 ? numberToFrench(millions) + ' millions' : 'un million')); n %= 1_000_000; }
  const milliers = Math.floor(n / 1000);
  if (milliers) { parts.push((milliers > 1 ? numberToFrench(milliers) + ' mille' : 'mille')); n %= 1000; }
  if (n >= 100) {
    const h = Math.floor(n / 100);
    parts.push((h > 1 ? units[h] + ' cent' : 'cent') + (n % 100 === 0 ? '': ' ' + underHundred(n % 100)));
  } else if (n > 0) {
    parts.push(underHundred(n));
  }

  return parts.join(' ').replace(/ +/g,' ').trim();
}

export async function generateDossierFinancierPdf(options: {
  student: any;
  payment: any; // the payment that was just encashed
  payments: any[]; // all payments of the student
  feeStructure: any[]; // configuration of tranches/services
  schoolInfo: any;
  generatedAt?: Date;
}) {
  const { student, payment, payments, feeStructure: originalFeeStructure, schoolInfo, generatedAt = new Date() } = options;

  // Récupérer la structure des frais depuis la base de données
  let feeStructure = originalFeeStructure;
  try {
    // Récupérer directement depuis la base via l'API existante
    const feeRes = await fetch('/api/finance/fee-structure');
    if (feeRes.ok) {
      const feeData = await feeRes.json();
      console.log('Structure de frais récupérée:', feeData);

      // Trouver la structure pour la classe de l'élève
      console.log('Recherche de la classe:', student.classe);
      const feeDataArray = Array.isArray(feeData) ? feeData : Object.values(feeData);
      console.log('Classes disponibles:', feeDataArray.map((item: any) => item.className));
      const classStructure = feeDataArray.find((item: any) => item.className?.trim() === student.classe?.trim());
      console.log('Structure trouvée pour la classe', student.classe, ':', classStructure);

      if (classStructure) {
        // Convertir la structure en format attendu
        const convertedStructure = [];

        // Ajouter les frais d'inscription si > 0
        if (classStructure.registrationFee > 0) {
          convertedStructure.push({
            name: 'Inscription',
            amount: classStructure.registrationFee,
            dueDate: null // Pas de date limite pour l'inscription
          });
        }

        // Ajouter les tranches depuis le JSON
        if (classStructure.installments && Array.isArray(classStructure.installments)) {
          classStructure.installments.forEach((installment: any) => {
            convertedStructure.push({
              name: installment.name,
              amount: installment.amount,
              dueDate: installment.dueDate
            });
          });
        }

        feeStructure = convertedStructure;
        console.log('Structure convertie:', feeStructure);
      }
    }
  } catch (e) {
    console.error('Erreur récupération structure de frais:', e);
  }
  // Convert feeStructure to array if it's an object
  if (!Array.isArray(feeStructure)) {
    console.log('feeStructure is not an array, converting from object');
    const classStructure = feeStructure[student.classe?.trim()] as any;
    console.log('classStructure found:', classStructure);
    if (classStructure) {
      feeStructure = [];
      if (classStructure.registrationFee > 0) {
        feeStructure.push({
          name: 'Inscription',
          amount: classStructure.registrationFee,
          dueDate: null
        });
      }
      if (classStructure.installments && Array.isArray(classStructure.installments)) {
        classStructure.installments.forEach((installment: any) => {
          // Clean up encoding issues in installment names for display
          let displayName = installment.name;
          if (displayName) {
            // Fix common encoding issues for display
            displayName = displayName.replace(/1%[^\w\s]/g, '1ère'); // Fix "1ère"
            displayName = displayName.replace(/2nd/g, '2ème'); // Fix "2nd" to "2ème"
            displayName = displayName.replace(/3%[^\w\s]/g, '3ème'); // Fix "3ème"
            displayName = displayName.replace(/4%[^\w\s]/g, '4ème'); // Fix "4ème"
            displayName = displayName.replace(/5%[^\w\s]/g, '5ème'); // Fix "5ème"
            displayName = displayName.replace(/6%[^\w\s]/g, '6ème'); // Fix "6ème"
            // Fix other common issues
            displayName = displayName.replace(/├/g, 'à'); // Fix "à"
            displayName = displayName.replace(/¿/g, ''); // Remove unwanted characters
            displayName = displayName.replace(/[^\w\s\-]/g, ''); // Remove other special chars except spaces, letters, numbers, hyphens
            displayName = displayName.trim();
          }
          feeStructure.push({
            name: displayName || installment.name, // display name for PDF
            originalName: installment.name, // keep original for payment matching
            amount: installment.amount,
            dueDate: installment.dueDate
          });
        });
      }
      console.log('Converted feeStructure:', feeStructure);
    } else {
      // If no structure found for class, try to get from API
      try {
        const feeStructureRes = await fetch('/api/finance/fee-structure');
        if (feeStructureRes.ok) {
          const feeData = await feeStructureRes.json();
          const feeDataArray = Array.isArray(feeData) ? feeData : Object.values(feeData);
          const apiClassStructure = feeDataArray.find((item: any) => item.className?.trim() === student.classe?.trim());
          if (apiClassStructure) {
            feeStructure = [];
            if (apiClassStructure.registrationFee > 0) {
              feeStructure.push({
                name: 'Inscription',
                amount: apiClassStructure.registrationFee,
                dueDate: null
              });
            }
            if (apiClassStructure.installments && Array.isArray(apiClassStructure.installments)) {
              apiClassStructure.installments.forEach((installment: any) => {
                // Clean up encoding issues in installment names for display
                let displayName = installment.name;
                if (displayName) {
                  // Fix common encoding issues for display
                  displayName = displayName.replace(/1%[^\w\s]/g, '1ère'); // Fix "1ère"
                  displayName = displayName.replace(/2nd/g, '2ème'); // Fix "2nd" to "2ème"
                  displayName = displayName.replace(/3%[^\w\s]/g, '3ème'); // Fix "3ème"
                  displayName = displayName.replace(/4%[^\w\s]/g, '4ème'); // Fix "4ème"
                  displayName = displayName.replace(/5%[^\w\s]/g, '5ème'); // Fix "5ème"
                  displayName = displayName.replace(/6%[^\w\s]/g, '6ème'); // Fix "6ème"
                  // Fix other common issues
                  displayName = displayName.replace(/├/g, 'à'); // Fix "à"
                  displayName = displayName.replace(/¿/g, ''); // Remove unwanted characters
                  displayName = displayName.replace(/[^\w\s\-]/g, ''); // Remove other special chars except spaces, letters, numbers, hyphens
                  displayName = displayName.trim();
                }
                feeStructure.push({
                  name: displayName || installment.name, // display name for PDF
                  originalName: installment.name, // keep original for payment matching
                  amount: installment.amount,
                  dueDate: installment.dueDate
                });
              });
            }
          }
        }
      } catch (e) {
        console.error('Erreur récupération fee-structure:', e);
      }
    }
  }

  // Ensure inscription is included if configured but missing
  if (Array.isArray(feeStructure) && !feeStructure.some((f: any) => f.name === 'Inscription')) {
    try {
      const feeStructureRes = await fetch('/api/finance/fee-structure');
      if (feeStructureRes.ok) {
        const feeData = await feeStructureRes.json();
        const feeDataArray = Array.isArray(feeData) ? feeData : Object.values(feeData);
        const classStructure = feeDataArray.find((item: any) => item.className?.trim() === student.classe?.trim());
        if (classStructure && classStructure.registrationFee > 0) {
          feeStructure.push({
            name: 'Inscription',
            amount: classStructure.registrationFee,
            dueDate: null
          });
        }
      }
    } catch (e) {
      console.error('Erreur récupération fee-structure pour inscription:', e);
    }
  }

  console.log('feeStructure utilisée:', feeStructure);
  console.log('payments utilisés:', payments);
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  // Header: reuse visual style from attestation
  const isPrimary = (student?.niveau || '').toLowerCase().includes('primaire') || (student?.niveau || '').toLowerCase().includes('maternelle');
  const ministryFr = isPrimary ? 'MINISTÈRE DE L\'ÉDUCATION DE BASE' : 'MINISTÈRE DE L\'ENSEIGNEMENT SECONDAIRE';
  const colorPrimary: [number, number, number] = [30, 64, 175]; // #1e40af (couleur bulletin)
  let y = margin;
  const formatNumber = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  // Add logo as watermark on the same line as header
  const centerX = pageWidth / 2;
  const logoSize = 20;
  if (schoolInfo?.logoUrl && typeof schoolInfo.logoUrl === 'string' && schoolInfo.logoUrl.startsWith('data:image')) {
    try {
      const fmt = schoolInfo.logoUrl.includes('png') ? 'PNG' : 'JPEG';
      // Set low opacity for watermark effect using globalAlpha
      (doc as any).globalAlpha = 0.1;
      doc.addImage(schoolInfo.logoUrl, fmt as any, centerX - logoSize/2, y - 5, logoSize, logoSize);
      (doc as any).globalAlpha = 1; // Reset opacity
    } catch(e) {}
  }

  doc.setFont('times', 'bold');
  doc.setFontSize(8);
  doc.text('RÉPUBLIQUE DU CAMEROUN', margin, y);
  doc.setFont('times', 'normal');
  doc.text('Paix - Travail - Patrie', margin, y + 5);
  doc.setFont('times', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...colorPrimary);
  doc.text(ministryFr, margin, y + 10);
  doc.setTextColor(0,0,0);

  // Right side english header
  doc.setFont('times', 'bold');
  doc.text('REPUBLIC OF CAMEROON', pageWidth - margin, y, { align: 'right' });
  doc.setFont('times', 'normal');
  doc.text('Peace - Work - Fatherland', pageWidth - margin, y + 5, { align: 'right' });
  doc.setFont('times', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...colorPrimary);
  doc.text(isPrimary ? 'MINISTRY OF BASIC EDUCATION' : 'MINISTRY OF SECONDARY EDUCATION', pageWidth - margin, y + 10, { align: 'right' });
  doc.setTextColor(0,0,0);

  y += 18;

  // Separator line
  doc.setDrawColor(...colorPrimary);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Title rectangle center with school year and generation info on right
  const title = "DOSSIER FINANCIER DE L'ELÈVE";
  doc.setFontSize(12);
  doc.setFont('times','bold');
  const titleWidth = doc.getTextWidth(title);
  const badgePadX = 6;
  const badgePadY = 3;
  const badgeW = titleWidth + badgePadX * 2;
  const badgeH = 12;
  const badgeX = centerX - badgeW / 2;
  const badgeY = y - (badgeH/2);
  doc.setDrawColor(...colorPrimary);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 2, 2, 'S' as any);
  doc.text(title, centerX, y + 1, { align: 'center' });
  // Right side (à droite du badge, hors cadre)
  const schoolYearText = student?.anneeScolaire || '';
  doc.setFontSize(9);
  doc.setFont('times','bold');
  doc.text(`Année scolaire : ${schoolYearText}`, pageWidth - margin, y + 7, { align: 'right' });
  doc.setFont('times','normal');
  const generatedStr = `Généré le : ${format(generatedAt, 'dd/MM/yyyy')} à ${format(generatedAt, 'HH:mm')}`;
  doc.text(generatedStr, pageWidth - margin, y + 14, { align: 'right' });
  y += badgeH + 18;

  // Left student info block and right QR box
  const leftX = margin;
  const rightX = pageWidth - margin - 30;
  doc.setFontSize(10);
  doc.setFont('times','normal');
  doc.setFont('times','bold'); doc.text(`Matricule:`, leftX, y); doc.setFont('times','normal'); doc.text(` ${student?.id || '—'}`, leftX + 22, y);
  doc.setFont('times','bold'); doc.text(`Nom de l'élève:`, leftX, y+6); doc.setFont('times','normal'); doc.text(` ${student?.prenom || ''} ${student?.nom || ''}`, leftX + 32, y+6);
  doc.setFont('times','bold'); doc.text(`Classe:`, leftX, y+12); doc.setFont('times','normal'); doc.text(` ${student?.classe || '—'}`, leftX + 18, y+12);

  // QR code box on right
  const qrX = rightX;
  const qrY = y - 2;
  const qrSize = 20; // taille ajustée proche du bulletin
  const qrData = `DossierFinancier|id:${student?.id}|nom:${student?.prenom} ${student?.nom}|classe:${student?.classe}|annee:${student?.anneeScolaire}|gen:${generatedAt.toISOString()}`;
  try {
    // dynamic import of qrcode to avoid SSR issues
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const QRCode = (await import('qrcode')).default;
    const qrUrl = await QRCode.toDataURL(qrData, { errorCorrectionLevel: 'H' });
    // cadre QR (couleur bulletin)
    doc.setDrawColor(...colorPrimary);
    doc.rect(qrX-2, qrY-6, qrSize+4, qrSize+8);
    doc.addImage(qrUrl, 'PNG' as any, qrX, qrY, qrSize, qrSize);
  } catch (e) {
    // draw placeholder
    doc.setDrawColor(200,200,200);
    doc.rect(qrX, qrY, qrSize, qrSize);
  }

  // Avancer sous le QR pour éviter tout chevauchement
  y = Math.max(y + 24, qrY + qrSize + 6);

  // Payment date and receipt number on next lines
  doc.setFont('times','bold'); doc.text(`Date paiement:`, leftX, y); doc.setFont('times','normal'); doc.text(` ${payment?.date ? format(new Date(payment.date), 'dd/MM/yyyy à HH:mm') : '—'}`, leftX + 28, y);
  doc.setFont('times','bold'); doc.text(`No reçu:`, leftX, y+6); doc.setFont('times','normal'); doc.text(` ${payment?.receiptNumber || payment?.id || '—'}`, leftX + 20, y+6);
  y += 14;

  // Small 2x2 table: Libellé | Montant versé (we show the payment and a total row) - full width
  const col1Width = Math.round((pageWidth - 2 * margin) * 0.7);
  const col2Width = Math.round((pageWidth - 2 * margin) * 0.3);
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [["Libellé", 'Montant versé']],
    body: [
      [payment?.reason || 'Paiement', formatNumber(Number(payment?.amount ?? 0)) + ' XAF'],
      ['Total', formatNumber(Number(payment?.amount ?? 0)) + ' XAF'],
    ],
    styles: { font: 'times', fontSize: 10, lineColor: [220,220,220] },
    headStyles: { fillColor: [30, 64, 175], textColor: 255, halign: 'left' },
    alternateRowStyles: { fillColor: [250, 251, 252] },
    columnStyles: {
      0: { cellWidth: col1Width },
      1: { cellWidth: col2Width, halign: 'center' },
    },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.row.index === 1) {
        data.cell.styles.fontStyle = 'bold';
        if (data.column.index === 0) {
          data.cell.styles.textColor = [34, 197, 94]; // vert pour "Total"
        } else if (data.column.index === 1) {
          data.cell.styles.textColor = [34, 197, 94]; // vert pour la valeur
        }
      }
    }
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // Amount in words
  const amountNumber = Math.round(payment?.amount ?? 0);
  const amountWords = numberToFrench(amountNumber);
  doc.setFontSize(9);
  doc.setFont('times','bold'); doc.text(`Reçu au montant de :`, margin, y); doc.setFont('times','italic'); doc.setFontSize(10); doc.setTextColor(34, 197, 94); doc.text(` ${amountWords} XAF`, margin + 44, y); doc.setTextColor(0,0,0);
  y += 10;

  // Separator
  doc.setDrawColor(200,200,200);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Stamp rectangle positioned between separator and services
  const stampWidth2 = 35;
  const stampHeight2 = 15;
  const stampX2 = pageWidth - margin - stampWidth2;
  const stampY2 = y - 16; // Position slightly lower

  doc.setDrawColor(...colorPrimary); // Blue color
  doc.setLineWidth(0.5);
  doc.rect(stampX2, stampY2, stampWidth2, stampHeight2);
  doc.setFontSize(6);
  doc.setFont('times','normal');
  doc.text('Cachet+Signature', stampX2 + 1, stampY2 + 4);

  // Fetch service payments for the student
  let servicePayments = [];
  try {
    const serviceRes = await fetch(`/api/finance/service-payments?studentId=${student.id}&schoolYear=${student.anneeScolaire}`);
    if (serviceRes.ok) {
      const serviceData = await serviceRes.json();
      servicePayments = Array.isArray(serviceData) ? serviceData : (Array.isArray(serviceData?.data) ? serviceData.data : []);
    }
  } catch (e) {
    console.error('Erreur récupération paiements services:', e);
  }

  // Only show services table if student has subscribed to services
  if (servicePayments.length > 0) {
    // Services table title
    doc.setFont('times','bold');
    doc.setFontSize(11);
    doc.setTextColor(...colorPrimary);
    doc.text(`Services souscrits`, margin, y);
    doc.setTextColor(0,0,0);
    doc.setFont('times','normal');
    y += 6;

    // Services table with 4 columns: Service | Montant | Payé | Reste à payer
    const serviceBody: any[] = [];
    let totalServiceTarif = 0, totalServicePaye = 0, totalServiceReste = 0;

    // Group payments by service
    const serviceGroups: { [key: string]: { name: string; amount: number; paid: number } } = {};

    servicePayments.forEach((p: any) => {
      const serviceName = p.serviceName || 'Service';
      const amount = Number(p.amount || 0);
      if (!serviceGroups[serviceName]) {
        serviceGroups[serviceName] = { name: serviceName, amount: 0, paid: 0 };
      }
      serviceGroups[serviceName].paid += amount;
    });

    // Get service definitions to know the required amounts
    try {
      const servicesRes = await fetch(`/api/finance/services?schoolYear=${student.anneeScolaire}`);
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        const servicesList = Array.isArray(servicesData) ? servicesData : (Array.isArray(servicesData?.data) ? servicesData.data : []);

        servicesList.forEach((s: any) => {
          if (serviceGroups[s.name]) {
            serviceGroups[s.name].amount = Number(s.amount || s.price || 0);
          }
        });
      }
    } catch (e) {
      console.error('Erreur récupération services:', e);
    }

    // Build table rows
    Object.values(serviceGroups).forEach((service: any) => {
      const tarif = service.amount;
      const paye = service.paid;
      const reste = Math.max(0, tarif - paye);
      totalServiceTarif += tarif;
      totalServicePaye += paye;
      totalServiceReste += reste;
      serviceBody.push([
        service.name,
        formatNumber(tarif) + ' XAF',
        formatNumber(paye) + ' XAF',
        formatNumber(reste) + ' XAF'
      ]);
    });

    // Services totals row
    serviceBody.push(['TOTAUX SERVICES', formatNumber(totalServiceTarif) + ' XAF', formatNumber(totalServicePaye) + ' XAF', formatNumber(totalServiceReste) + ' XAF']);

    // Services table columns
    const serviceColWidths = [80, 35, 35, 35]; // Service name gets more space

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: 'grid',
      head: [["Service","Tarif","Payé","Reste à payer"]],
      body: serviceBody,
      styles: { font: 'times', fontSize: 9, lineColor: [220,220,220] },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, halign: 'left' },
      alternateRowStyles: { fillColor: [250, 251, 252] },
      columnStyles: {
        0: { cellWidth: serviceColWidths[0] },
        1: { cellWidth: serviceColWidths[1], halign: 'right' },
        2: { cellWidth: serviceColWidths[2], halign: 'right' },
        3: { cellWidth: serviceColWidths[3], halign: 'right' },
      },
      didParseCell: (data: any) => {
        if (data.section === 'body') {
          const rowIndex = data.row.index;
          const isTotalRow = rowIndex === serviceBody.length - 1;

          if (isTotalRow) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [64, 64, 64];
            data.cell.styles.textColor = 255;
          }
        }
      }
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Section title for recap
  doc.setFont('times','bold');
  doc.setFontSize(11);
  doc.setTextColor(...colorPrimary);
  doc.text(`Récapitulatif des versements sur les frais exigibles en date du ${format(generatedAt, 'dd/MM/yyyy')}`, margin, y);
  doc.setTextColor(0,0,0);
  doc.setFont('times','normal');
  y += 6;

  // Recapitulatif table with 5 columns: date limite, tranches/frais, tarif, déjà payé, reste à payer
  const recapBody: any[] = [];
  let totalTarif = 0, totalDeja = 0, totalReste = 0;
  let carryover = 0;

  // Calculate paid amounts with rollover logic
  feeStructure.forEach((f: any) => {
    const tarif = Number(f.amount || 0);
    let tranchePayments = 0;
    if (f.name === 'Inscription') {
      tranchePayments = (payments || []).filter(p => p.reason && p.reason.toLowerCase().includes('inscription')).reduce((sum, p) => sum + Number(p.amount || 0), 0);
    } else {
      // for tranches, match by payment reason patterns used in the payment form
      // The payment reasons follow pattern: "Paiement Tranche X Scolarité YYYY-YYYY"
      const trancheNumber = f.name.match(/(\d+)(?:ère|ème|ère)?/)?.[1]; // Extract number from "1ère", "2ème", etc.
      if (trancheNumber) {
        tranchePayments = (payments || []).filter(p =>
          p.reason && p.reason.toLowerCase().includes(`tranche ${trancheNumber}`) && p.reason.toLowerCase().includes('scolarité')
        ).reduce((sum, p) => sum + Number(p.amount || 0), 0);
      } else {
        // fallback to original matching
        tranchePayments = (payments || []).filter(p =>
          p.reason === f.originalName ||
          p.reason === f.name ||
          (p.reason && f.originalName && p.reason.toLowerCase().includes(f.originalName.toLowerCase())) ||
          (p.reason && f.name && p.reason.toLowerCase().includes(f.name.toLowerCase()))
        ).reduce((sum, p) => sum + Number(p.amount || 0), 0);
      }
    }

    // Total available for this tranche: carryover + payments for this tranche
    const totalAvailable = carryover + tranchePayments;

    // Amount applied to this tranche: min of required and available
    const deja = Math.min(tarif, totalAvailable);

    // Remaining for this tranche
    const reste = tarif - deja;

    // Carryover for next tranche: excess payments
    carryover = totalAvailable - deja;

    totalTarif += tarif;
    totalDeja += deja;
    totalReste += reste;
    recapBody.push([
      f.dueDate ? format(new Date(f.dueDate), 'dd/MM/yyyy') : '',
      f.name, // display the cleaned name
      formatNumber(tarif) + ' XAF',
      formatNumber(deja) + ' XAF',
      formatNumber(reste) + ' XAF'
    ]);
  });

  // Totals row
  recapBody.push(['', 'TOTAUX', formatNumber(Number(totalTarif)) + ' XAF', formatNumber(Number(totalDeja)) + ' XAF', formatNumber(Number(totalReste)) + ' XAF']);

  // Column widths for recap
  const recapWidth = pageWidth - 2 * margin;
  const wDate = 26;
  const wLabel = Math.max(60, recapWidth - (wDate + 30 + 30 + 30));
  const wTarif = 30;
  const wDeja = 30;
  const wReste = 30;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [["Date limite","Tranches/Frais","Tarif","Déjà payé","Reste à payer"]],
    body: recapBody,
    styles: { font: 'times', fontSize: 9, lineColor: [220,220,220] },
    headStyles: { fillColor: [34, 197, 94], textColor: 255, halign: 'left' },
    alternateRowStyles: { fillColor: [250, 251, 252] },
    columnStyles: {
      0: { cellWidth: wDate },
      1: { cellWidth: wLabel },
      2: { cellWidth: wTarif, halign: 'right' },
      3: { cellWidth: wDeja, halign: 'right' },
      4: { cellWidth: wReste, halign: 'right' },
    },
    didParseCell: (data: any) => {
      if (data.section === 'body') {
        const rowIndex = data.row.index;
        const isTotalRow = rowIndex === recapBody.length - 1;

        if (isTotalRow) {
          // Total row: bold and dark gray background
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [64, 64, 64]; // dark gray
          data.cell.styles.textColor = 255; // white text

          // Color code the total values
          if (data.column.index === 2) { // Tarif column - blue
            data.cell.styles.fillColor = [59, 130, 246]; // blue-500
            data.cell.styles.textColor = 255;
          } else if (data.column.index === 3) { // Déjà payé column - green
            data.cell.styles.fillColor = [34, 197, 94]; // green-500
            data.cell.styles.textColor = 255;
          } else if (data.column.index === 4) { // Reste à payer column - red
            data.cell.styles.fillColor = [239, 68, 68]; // red-500
            data.cell.styles.textColor = 255;
          }
        } else {
          // Check if due date is past
          const dueDateStr = recapBody[rowIndex][0];
          if (dueDateStr) {
            const dueDate = new Date(dueDateStr.split('/').reverse().join('-')); // Convert DD/MM/YYYY to YYYY-MM-DD
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (dueDate < today) {
              // Past due: light red background
              data.cell.styles.fillColor = [255, 235, 235]; // light red
            }
          }
        }
      }
    }
  });

  // Footer note - fixed position at bottom
  const pageHeight = (doc as any).internal.pageSize.getHeight();
  const footerY = pageHeight - 20;
  doc.setDrawColor(200,200,200);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY - 8, pageWidth - margin, footerY - 8);
  doc.setFontSize(8);
  doc.setFont('times','italic');
  doc.text("NB: les frais de scolarité payés ne sont ni remboursables, ni transférables.", margin, footerY);

  // Numérotation de page (pied de page sobre)
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    (doc as any).setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120,120,120);
    doc.text(`Page ${i}/${pageCount}`, pageWidth - margin, (doc as any).internal.pageSize.getHeight() - 8, { align: 'right' });
    doc.setTextColor(0,0,0);
  }

  return doc;
}

export function PrintDossierAfterPayment({ student, payment, payments, feeStructure, schoolInfo, autoOpen = false, showButton = true, onPrinted, onClose }: any) {
  const [open, setOpen] = useState(!!autoOpen);
  React.useEffect(() => { if (autoOpen) setOpen(true); }, [autoOpen]);
  const handlePrint = async () => {
    console.log('Début de la génération du PDF...');
    console.log('Student:', student);
    console.log('Payment:', payment);
    console.log('Payments:', payments);
    console.log('FeeStructure:', feeStructure);
    try {
      const doc = await generateDossierFinancierPdf({ student, payment, payments, feeStructure, schoolInfo });
      console.log('PDF généré avec succès');
      // téléchargement direct fiable
      if ((doc as any).save) {
        (doc as any).save(`dossier-financier-${student?.prenom || ''}-${student?.nom || ''}.pdf`);
        console.log('PDF sauvegardé');
      } else {
        console.error('Méthode save non disponible');
      }
      setOpen(false);
      onPrinted && onPrinted();
    } catch (e) {
      console.error('Erreur impression dossier financier:', e);
      // fallback: ouvrir dans un nouvel onglet via data URL, sinon save
      try {
        const doc2 = await generateDossierFinancierPdf({ student, payment, payments, feeStructure, schoolInfo });
        const dataUrl = (doc2 as any).output && (doc2 as any).output('dataurlstring');
        if (dataUrl && typeof window !== 'undefined') {
          const w = window.open('', '_blank');
          if (w) {
            w.document.write(`<iframe src="${dataUrl}" style="border:0;top:0;left:0;bottom:0;right:0;width:100%;height:100%;position:fixed;"></iframe>`);
          } else {
            (doc2 as any).save && (doc2 as any).save(`dossier-financier-${student?.prenom || ''}-${student?.nom || ''}.pdf`);
          }
        } else {
          (doc2 as any).save && (doc2 as any).save(`dossier-financier-${student?.prenom || ''}-${student?.nom || ''}.pdf`);
        }
      } catch(_){ }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) onClose && onClose(); }}>
      {showButton && (
        <DialogTrigger asChild>
          <Button onClick={() => setOpen(true)} variant="default">Imprimer le dossier</Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Imprimer le dossier financier</DialogTitle>
          <DialogDescription>
            Un reçu a été généré. Voulez-vous imprimer le dossier financier de l'élève maintenant ?
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={handlePrint}>Imprimer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

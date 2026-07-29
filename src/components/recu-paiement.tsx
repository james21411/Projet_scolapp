

"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Logo } from "./icons/logo";
import React, { useEffect, useState, useRef } from 'react';
import { FileDown } from "lucide-react";
import { getSchoolInfo, type SchoolInfo } from "@/services/schoolInfoService";
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { ScrollArea } from "./ui/scroll-area";

interface ReceiptProps {
  receiptId: string;
  studentId: string;
  studentName: string;
  class: string;
  amount: string;
  date: string;
  cashier: string;
  cashierUsername?: string;
  reason: string;
  schoolYear?: string;
  autoPrint?: boolean;
  compact?: boolean;
  onPrinted?: () => void;
}

export function RecuPaiement({
  receiptId,
  studentId,
  studentName,
  class: studentClass,
  amount,
  date,
  cashier,
  cashierUsername,
  reason,
  schoolYear,
  autoPrint = false,
  compact = false,
  onPrinted,
}: ReceiptProps) {
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState<string>('');
  const [paymentDateTimeStr, setPaymentDateTimeStr] = useState<string>('');
  const [resolvedCashier, setResolvedCashier] = useState<string>(cashier || '—');
  const printRef = useRef<HTMLDivElement>(null);

  // Attendre que toutes les images d'un élément soient chargées
  const waitForImages = async (root: HTMLElement) => {
    const images = Array.from(root.querySelectorAll('img')) as HTMLImageElement[];
    await Promise.all(images.map(img => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>(resolve => {
        const onDone = () => {
          img.removeEventListener('load', onDone);
          img.removeEventListener('error', onDone);
          resolve();
        };
        img.addEventListener('load', onDone);
        img.addEventListener('error', onDone);
      });
    }));
  };

  useEffect(() => {
    getSchoolInfo().then(setSchoolInfo);

    const now = new Date();
    const dateTimeStr = now.toLocaleString('fr-FR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    setCurrentDateTime(dateTimeStr);

    // Calculer la date du paiement (prioritaire) au format fr-FR
    let paymentStr = '';
    try {
      if (date) {
        const maybe = new Date(date);
        if (!isNaN(maybe.getTime())) {
          paymentStr = maybe.toLocaleString('fr-FR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          });
        } else if (typeof date === 'string') {
          paymentStr = date; // déjà formaté
        }
      }
    } catch {}
    setPaymentDateTimeStr(paymentStr || '');

    // Préparer les données du QR avec la date d'enregistrement du paiement si disponible
    // Utiliser l'ID de base sans suffixe '-tranche' pour l'attestation compacte
    const baseReceiptId = receiptId?.includes('-tranche') ? receiptId.split('-tranche')[0] : receiptId;
    const qrData = `Reçu N°: ${baseReceiptId}\nÉlève: ${studentName}\nMatricule: ${studentId}\nMontant: ${amount} XAF\nDate: ${paymentStr || dateTimeStr}`;
    QRCode.toDataURL(qrData, { errorCorrectionLevel: 'H' })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error('Erreur de génération du QR code:', err));

    // Try to fetch the school's logo and convert to data URL so it can be embedded in the PDF
    const fetchLogoAsDataUrl = async (url?: string) => {
      if (!url) return;
      try {
        const resp = await fetch(url, { mode: 'cors' });
        const blob = await resp.blob();
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.warn('Impossible de charger le logo en dataURL', e);
        return null;
      }
    };

    (async () => {
      if (schoolInfo?.logoUrl) {
        const data = await fetchLogoAsDataUrl(schoolInfo.logoUrl);
        if (data) setLogoDataUrl(data);
      }
    })();

    // Résoudre le vrai nom du caissier
    const rawCashier = cashierUsername || cashier;
    if (rawCashier) {
      (async () => {
        try {
          // Essayer d'abord /api/security/users puis /api/users
          let users: any[] = [];
          const resSec = await fetch('/api/security/users');
          if (resSec.ok) {
            const data = await resSec.json();
            users = Array.isArray(data) ? data : (data.users || data.data || []);
          }
          if (users.length === 0) {
            const resU = await fetch('/api/users');
            if (resU.ok) {
              const data = await resU.json();
              users = Array.isArray(data) ? data : (data.users || data.data || []);
            }
          }
          const target = rawCashier.toLowerCase().trim();
          const match = users.find(
            (u: any) =>
              (u.username && u.username.toLowerCase().trim() === target) ||
              (u.id && u.id.toLowerCase().trim() === target) ||
              (u.fullName && u.fullName.toLowerCase().trim() === target)
          );
          if (match?.fullName) {
            setResolvedCashier(match.fullName);
          } else if (target.includes('admin')) {
            // Chercher n'importe quel admin
            const adminUser = users.find((u: any) => u.role?.toLowerCase() === 'admin' && u.fullName);
            setResolvedCashier(adminUser?.fullName || 'Administration');
          } else {
            setResolvedCashier(rawCashier);
          }
        } catch {
          if (rawCashier.toLowerCase().includes('admin')) {
            setResolvedCashier('Administration');
          }
        }
      })();
    }
  }, [receiptId, studentName, studentId, amount, date, cashier, cashierUsername]);

  // Lancer automatiquement l'impression si demandé, une fois les données et images prêtes
  useEffect(() => {
    if (!autoPrint) return;
    const run = async () => {
      const root = printRef.current;
      if (!root) return;
      // Attendre schoolInfo, QR et images
      if (!schoolInfo) return; // attendra le prochain rendu
      if (!qrCodeUrl) return;  // attendra le prochain rendu
      await waitForImages(root);
      await handleDownloadPdf();
      onPrinted && onPrinted();
    };
    // Petite temporisation pour laisser le DOM peindre
    const id = setTimeout(run, 200);
    return () => clearTimeout(id);
  }, [autoPrint, schoolInfo, qrCodeUrl]);

  /** Dessine un reçu (haut ou bas de page A4) en jsPDF pur — sans bitmap */
  const drawReceiptBlock = (doc: jsPDF, startY: number, pageWidth: number, margin: number, qrUrl: string) => {
    const blockH = 148.5; // demi-page A4
    const colorPrimary: [number, number, number] = [30, 64, 175];
    const colorGray: [number, number, number] = [80, 80, 80];

    // ---- Cadre extérieur ----
    doc.setDrawColor(50, 50, 50);
    doc.setLineWidth(0.6);
    doc.rect(margin, startY, pageWidth - 2 * margin, blockH - 1);

    // ---- En-tête ----
    const headerH = 24;
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, startY, pageWidth - 2 * margin, headerH, 'F');
    doc.setDrawColor(50, 50, 50);
    doc.setLineWidth(0.5);
    doc.line(margin, startY + headerH, pageWidth - margin, startY + headerH);

    // Logo placeholder ou initiale
    const logoX = margin + 4;
    const logoY = startY + 4;
    const logoSize = 16;
    doc.setDrawColor(180, 180, 180);
    doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 'S');
    if (schoolInfo?.logoUrl && schoolInfo.logoUrl.startsWith('data:image')) {
      try {
        const fmt = schoolInfo.logoUrl.includes('png') ? 'PNG' : 'JPEG';
        doc.addImage(schoolInfo.logoUrl, fmt as any, logoX, logoY, logoSize, logoSize);
      } catch (_) {
        doc.setFontSize(10); doc.setFont('helvetica', 'bold');
        doc.text((schoolInfo?.name?.charAt(0) || 'S').toUpperCase(), logoX + logoSize / 2, logoY + logoSize / 2 + 3.5, { align: 'center' });
      }
    } else {
      doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.text((schoolInfo?.name?.charAt(0) || 'S').toUpperCase(), logoX + logoSize / 2, logoY + logoSize / 2 + 3.5, { align: 'center' });
    }

    // Nom école + REÇU DE PAIEMENT
    const centerX = pageWidth / 2;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(0, 0, 0);
    doc.text(schoolInfo?.name || 'École', centerX, startY + 9, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...colorGray);
    doc.text(schoolInfo?.address || '', centerX, startY + 14, { align: 'center' });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...colorPrimary);
    doc.text('REÇU DE PAIEMENT', centerX, startY + 20, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    // Numéro + date (droite)
    const trancheIndex = (receiptId || '').indexOf('-tranche');
    const baseId = trancheIndex > -1 ? receiptId.slice(0, trancheIndex) : receiptId;
    const trancheLabel = trancheIndex > -1 ? receiptId.slice(trancheIndex + 1).replace('tranche', 'Tranche: ') : '';
    const rightX = pageWidth - margin - 3;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(0, 0, 0);
    doc.text(`Reçu N°: ${baseId}`, rightX, startY + 9, { align: 'right' });
    if (trancheLabel) { doc.setFontSize(7); doc.text(trancheLabel, rightX, startY + 14, { align: 'right' }); }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...colorGray);
    doc.text(`Date: ${paymentDateTimeStr || '—'}`, rightX, startY + 20, { align: 'right' });
    doc.setTextColor(0, 0, 0);

    // ---- Infos élève (gauche) ----
    const bodyY = startY + headerH + 6;
    const leftColX = margin + 4;
    const leftColW = (pageWidth - 2 * margin) * 0.62;
    const rightColX = leftColX + leftColW + 4;

    // Bloc élève
    doc.setFillColor(248, 249, 250);
    doc.setDrawColor(200, 200, 200);
    doc.rect(leftColX, bodyY, leftColW, 38, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(50, 50, 50);
    doc.text("INFORMATIONS DE L'ÉLÈVE", leftColX + 3, bodyY + 5);
    doc.setDrawColor(200, 200, 200);
    doc.line(leftColX + 3, bodyY + 7, leftColX + leftColW - 3, bodyY + 7);

    const eleve = [
      { label: 'Nom :', value: studentName },
      { label: 'Matricule :', value: studentId },
      { label: 'Classe :', value: studentClass },
      { label: 'Motif :', value: reason },
    ];
    doc.setFontSize(8.5);
    eleve.forEach((e, i) => {
      const ey = bodyY + 13 + i * 6;
      doc.setFont('helvetica', 'bold'); doc.setTextColor(50, 50, 50); doc.text(e.label, leftColX + 3, ey);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(0, 0, 0);
      const labelW = doc.getTextWidth(e.label) + 2;
      doc.text(e.value || '—', leftColX + 3 + labelW, ey);
    });

    // Bloc paiement
    const payY = bodyY + 44;
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(147, 197, 253);
    doc.rect(leftColX, payY, leftColW, 32, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(30, 64, 175);
    doc.text('DÉTAILS DU PAIEMENT', leftColX + 3, payY + 5);
    doc.setDrawColor(147, 197, 253);
    doc.line(leftColX + 3, payY + 7, leftColX + leftColW - 3, payY + 7);

    const paiement = [
      { label: 'Montant :', value: `${amount} XAF` },
      { label: 'Total Payé :', value: `${amount} XAF` },
      { label: 'Année scol. :', value: schoolYear || '—' },
      { label: 'Caissier(e) :', value: resolvedCashier },
    ];
    doc.setFontSize(8.5);
    paiement.forEach((e, i) => {
      const py = payY + 13 + i * 6;
      doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 64, 175); doc.text(e.label, leftColX + 3, py);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(0, 0, 0);
      const labelW = doc.getTextWidth(e.label) + 2;
      doc.text(e.value, leftColX + 3 + labelW, py);
    });

    // ---- QR code + Signature (droite) ----
    const qrSize = 22;
    const qrX = rightColX + 2;
    const qrY = bodyY + 4;
    if (qrUrl) {
      doc.setDrawColor(50, 50, 50); doc.setLineWidth(0.5);
      doc.rect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4);
      doc.addImage(qrUrl, 'PNG' as any, qrX, qrY, qrSize, qrSize);
    }

    // Signature
    const sigX = qrX;
    const sigY = qrY + qrSize + 10;
    doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(...colorGray);
    doc.text('La Direction', sigX + qrSize / 2, sigY, { align: 'center' });
    doc.setDrawColor(160, 160, 160); doc.setLineWidth(0.4);
    if (typeof (doc as any).setLineDash === 'function') {
      (doc as any).setLineDash([2, 1]);
    }
    doc.rect(sigX, sigY + 3, qrSize, 12);
    if (typeof (doc as any).setLineDash === 'function') {
      (doc as any).setLineDash([]);
    }
    doc.setFontSize(7); doc.text('Signature', sigX + qrSize / 2, sigY + 10, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    // ---- Pied de page du bloc ----
    const footY = startY + blockH - 8;
    doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3);
    doc.line(margin + 2, footY, pageWidth - margin - 2, footY);
    doc.setFont('helvetica', 'italic'); doc.setFontSize(7); doc.setTextColor(...colorGray);
    doc.text(
      `Ce reçu est généré automatiquement par le système FosilaMaster — ${currentDateTime}`,
      centerX, footY + 4, { align: 'center' }
    );
    doc.setTextColor(0, 0, 0);
  };

  const handleDownloadPdf = async () => {
    try {
      // Générer QR en base64
      const baseReceiptId = (receiptId || '').includes('-tranche') ? receiptId.split('-tranche')[0] : receiptId;
      const qrData = `Reçu N°: ${baseReceiptId}\nÉlève: ${studentName}\nMatricule: ${studentId}\nMontant: ${amount} XAF\nDate: ${paymentDateTimeStr || currentDateTime}`;
      const qrUrl = await QRCode.toDataURL(qrData, { errorCorrectionLevel: 'M', width: 80 });

      // Créer le PDF A4 avec 2 reçus identiques (haut/bas)
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 8;

      drawReceiptBlock(doc, 0, pageWidth, margin, qrUrl);

      // Ligne de coupe
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.3);
      if (typeof (doc as any).setLineDash === 'function') {
        (doc as any).setLineDash([3, 2]);
      }
      doc.line(margin, 148.5, pageWidth - margin, 148.5);
      if (typeof (doc as any).setLineDash === 'function') {
        (doc as any).setLineDash([]);
      }
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(120, 120, 120);
      doc.text('✂  Découper ici', pageWidth / 2, 148.5, { align: 'center' });
      doc.setTextColor(0, 0, 0);

      drawReceiptBlock(doc, 149, pageWidth, margin, qrUrl);

      doc.save(`recu_${studentId}_${receiptId}.pdf`);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
    }
  };

  const handleGenerateCompactPdf = async () => {
    try {
      const baseReceiptId = (receiptId || '').includes('-tranche') ? receiptId.split('-tranche')[0] : receiptId;
      const qrData = `Reçu N°: ${baseReceiptId}\nÉlève: ${studentName}\nMatricule: ${studentId}\nMontant: ${amount} XAF\nDate: ${paymentDateTimeStr || currentDateTime}`;
      const qrUrl = await QRCode.toDataURL(qrData, { errorCorrectionLevel: 'M', width: 60 });

      // Format A6 (105 x 148 mm) pour l'attestation compacte
      const doc = new jsPDF('p', 'mm', [105, 148]);
      const colorPrimary: [number, number, number] = [30, 64, 175];
      const colorGray: [number, number, number] = [80, 80, 80];
      const margin = 6;
      const centerX = 105 / 2;

      // Cadre
      doc.setDrawColor(50, 50, 50); doc.setLineWidth(0.5);
      doc.rect(margin, margin, 105 - 2 * margin, 148 - 2 * margin);

      // Logo
      const logoSize = 12;
      const logoX = centerX - logoSize / 2;
      let logoY = margin + 5;
      if (schoolInfo?.logoUrl && schoolInfo.logoUrl.startsWith('data:image')) {
        try {
          const fmt = schoolInfo.logoUrl.includes('png') ? 'PNG' : 'JPEG';
          doc.addImage(schoolInfo.logoUrl, fmt as any, logoX, logoY, logoSize, logoSize);
        } catch (_) {}
      }

      let y = logoY + logoSize + 4;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(0, 0, 0);
      doc.text(schoolInfo?.name || 'École', centerX, y, { align: 'center' });
      y += 4;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...colorGray);
      doc.text(schoolInfo?.address || '', centerX, y, { align: 'center' });
      y += 5;

      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...colorPrimary);
      doc.text("ATTESTATION D'ENCAISSEMENT", centerX, y, { align: 'center' });
      y += 3;
      doc.setDrawColor(...colorPrimary); doc.setLineWidth(0.4);
      doc.line(margin + 2, y, 105 - margin - 2, y);
      y += 5;

      doc.setTextColor(0, 0, 0);
      const rows = [
        { label: `Reçu N° :`, value: baseReceiptId },
        { label: 'Élève :', value: studentName },
        { label: 'Classe :', value: studentClass || '—' },
        { label: 'Année scol. :', value: schoolYear || '—' },
        { label: 'Montant :', value: `${amount} XAF` },
        { label: 'Motif :', value: reason || '—' },
        { label: 'Date :', value: paymentDateTimeStr || '—' },
        { label: 'Caissier(e) :', value: resolvedCashier },
      ];
      rows.forEach(r => {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.text(r.label, margin + 3, y);
        doc.setFont('helvetica', 'normal');
        const lw = doc.getTextWidth(r.label) + 2;
        doc.text(r.value, margin + 3 + lw, y);
        y += 6;
      });

      // QR
      if (qrUrl) {
        const qrSize = 20;
        const qrX = centerX - qrSize / 2;
        doc.addImage(qrUrl, 'PNG' as any, qrX, y, qrSize, qrSize);
        y += qrSize + 4;
      }

      doc.setFont('helvetica', 'italic'); doc.setFontSize(6.5); doc.setTextColor(...colorGray);
      doc.text('Généré par FosilaMaster', centerX, y, { align: 'center' });

      doc.save(`attestation_encaissement_${studentId}_${receiptId}.pdf`);
    } catch (err) {
      console.error('Erreur génération PDF compact:', err);
    }
  };

  const handlePrintWindow = async () => {
    await handleDownloadPdf();
  };

  return (
    <>
      {compact ? (
        <div className="w-full flex justify-center">
              <div className="p-3 w-[320px] bg-white border rounded shadow" ref={printRef}>
                <div className="text-center mb-2 flex items-center justify-center gap-2">
                  <div className="w-10 h-10 flex-shrink-0">
                    {logoDataUrl ? (
                      <img src={logoDataUrl} alt="Logo" className="w-10 h-10 object-cover rounded" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 rounded">
                        {schoolInfo?.name?.charAt(0) || 'S'}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold">{schoolInfo?.name || 'École'}</div>
                    <div className="text-xs text-gray-600">{schoolInfo?.address || ''}</div>
                  </div>
                </div>
                <div className="text-center text-sm font-bold uppercase mb-2">ATTESTATION D'ENCAISSEMENT</div>
                {/* Use base receipt id without tranche suffix for attestation */}
                <div className="text-xs text-gray-700 mb-2">Reçu N° <strong>{receiptId?.includes('-tranche') ? receiptId.split('-tranche')[0] : receiptId}</strong></div>
                <div className="text-xs text-gray-700 mb-2">{studentName} — {studentClass}</div>
                <div className="text-sm mb-2">Montant encaissé: <strong>{amount} XAF</strong></div>
                <div className="text-xs mb-2">Motif: {reason || '—'}</div>
                <div className="text-xs text-gray-500 mb-2">Date: {paymentDateTimeStr || date || '—'}</div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-600">Caissier: {cashier || '—'}</div>
                  <div>
                    {qrCodeUrl ? <img src={qrCodeUrl} alt="QR" className="w-16 h-16" /> : null}
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <Button size="sm" onClick={() => onPrinted && onPrinted()}>Fermer</Button>
                  <Button size="sm" onClick={handleGenerateCompactPdf}><FileDown className="mr-2 h-4 w-4"/> Imprimer</Button>
                </div>
              </div>
        </div>
      ) : (
        <div className="w-full flex justify-center">
          <div className="w-[210mm] h-[297mm] border-2 border-gray-300 rounded-lg bg-white shadow-lg relative">
            {/* Zone d'impression A4 avec deux reçus demi-page */}
            <div className="w-full h-full overflow-auto">
              <div className="w-[210mm] h-[297mm] bg-white text-black" ref={printRef}>
                {/* Reçu 1 (haut de page) */}
                <div className="w-[210mm] h-[148.5mm] border-2 border-gray-800 rounded-none shadow-lg overflow-hidden">
                  {/* En-tête avec logo et informations */}
                  <div className="flex items-center justify-between p-3 border-b-2 border-gray-800 h-[25mm]">
                    {/* Logo */}
                    <div className="w-[15mm] h-[15mm] rounded-full overflow-hidden border-2 border-gray-800 flex items-center justify-center bg-gray-50 flex-shrink-0">
                {schoolInfo?.logoUrl ? (
                        <div className="w-[12mm] h-[12mm] flex items-center justify-center">
                    <Logo logoUrl={schoolInfo.logoUrl} />
                  </div>
                ) : (
                        <div className="w-[12mm] h-[12mm] bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-600">
                    {schoolInfo?.name?.charAt(0) || 'S'}
                  </div>
                )}
              </div>

                    {/* Titre centré */}
                    <div className="text-center flex-1">
                      <div className="text-lg font-bold mb-1">{schoolInfo?.name || 'École'}</div>
                      <div className="text-xs text-gray-600 mb-1">{schoolInfo?.address || 'Adresse de l\'école'}</div>
                      <div className="text-base font-bold uppercase tracking-wider">REÇU DE PAIEMENT</div>
              </div>

                    {/* Numéro, tranche et date */}
                    <div className="text-right w-[40mm]">
                      {(() => {
                        const trancheIndex = receiptId.indexOf('-tranche');
                        const baseId = trancheIndex > -1 ? receiptId.slice(0, trancheIndex) : receiptId;
                        const tranche = trancheIndex > -1 ? receiptId.slice(trancheIndex + 1) : '';
                        return (
                          <>
                            <div className="text-sm font-bold leading-snug">Reçu N°: {baseId}</div>
                            {tranche && (
                              <div className="text-[10px] text-gray-700 leading-snug break-all">{tranche.replace('tranche', 'Tranche: ')}</div>
                            )}
                            <div className="text-xs text-gray-700 leading-snug">Date: {paymentDateTimeStr || '—'}</div>
                          </>
                        );
                      })()}
              </div>
            </div>

                  {/* Contenu principal */}
                  <div className="flex h-[90mm] p-3">
                    {/* Colonne gauche - Informations élève et paiement */}
                    <div className="w-[120mm] space-y-2">
                {/* Informations de l'élève */}
                      <div className="border border-gray-300 rounded p-2 bg-gray-50 h-[40mm]">
                        <div className="text-sm font-bold mb-2 text-gray-800 border-b border-gray-300 pb-1">
                          INFORMATIONS DE L'ÉLÈVE
                  </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          <div><strong>Nom:</strong> {studentName}</div>
                          <div><strong>Classe:</strong> {studentClass}</div>
                          <div><strong>Matricule:</strong> {studentId}</div>
                          <div><strong>Motif:</strong> {reason}</div>
                  </div>
                </div>

                {/* Informations de paiement */}
                      <div className="border border-blue-300 rounded p-2 bg-blue-50 h-[35mm]">
                        <div className="text-sm font-bold mb-2 text-blue-800 border-b border-blue-300 pb-1">
                          DÉTAILS DU PAIEMENT
                  </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          <div><strong>Montant:</strong> {amount} XAF</div>
                          <div><strong>Total Payé:</strong> {amount} XAF</div>
                          <div><strong>Caissier(e):</strong> {cashier}</div>
                    {cashierUsername && (
                            <div><strong>Utilisateur:</strong> {cashierUsername}</div>
                    )}
                  </div>
                </div>
              </div>

                    {/* Colonne droite - QR Code et signature */}
                    <div className="w-[80mm] flex flex-col items-center justify-center space-y-3">
                      {/* QR Code */}
                      <div className="border-2 border-gray-800 rounded p-2 bg-white">
                  {qrCodeUrl ? (
                          <img src={qrCodeUrl} alt="QR Code" className="w-[20mm] h-[20mm]" />
                        ) : (
                          <div className="w-[20mm] h-[20mm] bg-gray-200 animate-pulse rounded" />
                  )}
                </div>

                {/* Zone de signature */}
                      <div className="text-center">
                        <div className="text-xs font-medium mb-1 italic">
                    La Direction
                        </div>
                        <div className="border-2 border-dashed border-gray-400 w-[25mm] h-[12mm] mx-auto flex items-center justify-center text-xs text-gray-500 bg-gray-50">
                          Signature
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pied de page */}
                  <div className="border-t border-gray-300 p-2 text-center text-xs text-gray-600 h-[15.5mm] flex items-center justify-center">
                    Ce reçu est généré automatiquement par le système FosilaMaster — Généré le {currentDateTime}
                  </div>
                </div>
                {/* Ligne de coupe en pointillés */}
                <div className="w-[210mm] h-[0mm] border-t-2 border-dashed border-gray-400 relative">
                  <div className="absolute left-1/2 -translate-x-1/2 -top-3 text-[10px] text-gray-500 bg-white px-2">Découper ici</div>
                </div>

                {/* Reçu 2 (bas de page) - duplication */}
                <div className="w-[210mm] h-[148.5mm] border-2 border-gray-800 rounded-none shadow-lg overflow-hidden">
                  {/* Reçu 2 (duplicated content) - identical to the first one so the A4 generates two copies */}
                  <div className="flex items-center justify-between p-3 border-b-2 border-gray-800 h-[25mm]">
                    {/* Logo */}
                    <div className="w-[15mm] h-[15mm] rounded-full overflow-hidden border-2 border-gray-800 flex items-center justify-center bg-gray-50 flex-shrink-0">
                      {schoolInfo?.logoUrl ? (
                        <div className="w-[12mm] h-[12mm] flex items-center justify-center">
                          <Logo logoUrl={schoolInfo.logoUrl} />
                        </div>
                      ) : (
                        <div className="w-[12mm] h-[12mm] bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-600">
                          {schoolInfo?.name?.charAt(0) || 'S'}
                        </div>
                      )}
                    </div>

                    {/* Titre centré */}
                    <div className="text-center flex-1">
                      <div className="text-lg font-bold mb-1">{schoolInfo?.name || 'École'}</div>
                      <div className="text-xs text-gray-600 mb-1">{schoolInfo?.address || 'Adresse de l\'école'}</div>
                      <div className="text-base font-bold uppercase tracking-wider">REÇU DE PAIEMENT</div>
                    </div>

                    {/* Numéro, tranche et date */}
                    <div className="text-right w-[40mm]">
                      {(() => {
                        const trancheIndex = receiptId.indexOf('-tranche');
                        const baseId = trancheIndex > -1 ? receiptId.slice(0, trancheIndex) : receiptId;
                        const tranche = trancheIndex > -1 ? receiptId.slice(trancheIndex + 1) : '';
                        return (
                          <>
                            <div className="text-sm font-bold leading-snug">Reçu N°: {baseId}</div>
                            {tranche && (
                              <div className="text-[10px] text-gray-700 leading-snug break-all">{tranche.replace('tranche', 'Tranche: ')}</div>
                            )}
                            <div className="text-xs text-gray-700 leading-snug">Date: {paymentDateTimeStr || '—'}</div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Contenu principal */}
                  <div className="flex h-[90mm] p-3">
                    {/* Colonne gauche - Informations élève et paiement */}
                    <div className="w-[120mm] space-y-2">
                      {/* Informations de l'élève */}
                      <div className="border border-gray-300 rounded p-2 bg-gray-50 h-[40mm]">
                        <div className="text-sm font-bold mb-2 text-gray-800 border-b border-gray-300 pb-1">
                          INFORMATIONS DE L'ÉLÈVE
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          <div><strong>Nom:</strong> {studentName}</div>
                          <div><strong>Classe:</strong> {studentClass}</div>
                          <div><strong>Matricule:</strong> {studentId}</div>
                          <div><strong>Motif:</strong> {reason}</div>
                        </div>
                      </div>

                      {/* Informations de paiement */}
                      <div className="border border-blue-300 rounded p-2 bg-blue-50 h-[35mm]">
                        <div className="text-sm font-bold mb-2 text-blue-800 border-b border-blue-300 pb-1">
                          DÉTAILS DU PAIEMENT
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          <div><strong>Montant:</strong> {amount} XAF</div>
                          <div><strong>Total Payé:</strong> {amount} XAF</div>
                          <div><strong>Caissier(e):</strong> {cashier}</div>
                          {cashierUsername && (
                            <div><strong>Utilisateur:</strong> {cashierUsername}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Colonne droite - QR Code et signature */}
                    <div className="w-[80mm] flex flex-col items-center justify-center space-y-3">
                      {/* QR Code */}
                      <div className="border-2 border-gray-800 rounded p-2 bg-white">
                        {qrCodeUrl ? (
                          <img src={qrCodeUrl} alt="QR Code" className="w-[20mm] h-[20mm]" />
                        ) : (
                          <div className="w-[20mm] h-[20mm] bg-gray-200 animate-pulse rounded" />
                        )}
                      </div>

                      {/* Zone de signature */}
                      <div className="text-center">
                        <div className="text-xs font-medium mb-1 italic">
                          La Direction
                        </div>
                        <div className="border-2 border-dashed border-gray-400 w-[25mm] h-[12mm] mx-auto flex items-center justify-center text-xs text-gray-500 bg-gray-50">
                          Signature
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pied de page */}
                  <div className="border-t border-gray-300 p-2 text-center text-xs text-gray-600 h-[15.5mm] flex items-center justify-center">
                    Ce reçu est généré automatiquement par le système FosilaMaster — Généré le {currentDateTime}
                  </div>
                </div>
              </div>
            </div>

            {/* Bouton d'impression flottant (masqué en autoPrint) */}
            {!autoPrint && (
              <div className="fixed bottom-4 right-6 z-50">
                <Button 
                  onClick={handleDownloadPdf} 
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
                >
                  <FileDown className="mr-2 h-4 w-4" /> Imprimer
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

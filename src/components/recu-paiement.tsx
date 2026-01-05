

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
import html2canvas from 'html2canvas';
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
  autoPrint = false,
  compact = false,
  onPrinted,
}: ReceiptProps) {
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState<string>('');
  const [paymentDateTimeStr, setPaymentDateTimeStr] = useState<string>('');
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
  }, [receiptId, studentName, studentId, amount, date]);

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

  const handleDownloadPdf = async () => {
    const element = printRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794,   // ~ 210mm @ 96dpi
        height: 1123, // ~ 297mm @ 96dpi
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
        windowHeight: 1123,
      });

      const imgData = canvas.toDataURL('image/png');

      // A4 portrait exact
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      pdf.save(`recu_${studentId}_${receiptId}.pdf`);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
    }
  };

  const handlePrintWindow = async () => {
    // For compact mode we can just open a print dialog on the coupon
    if (!printRef.current) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write('<!doctype html><html><head><title>Coupon</title></head><body>');
    w.document.write(printRef.current.innerHTML);
    w.document.write('</body></html>');
    w.document.close();
    w.focus();
    // Wait a tick then print
    setTimeout(() => {
      w.print();
      w.close();
    }, 300);
  };

  const handleGenerateCompactPdf = async () => {
    const element = printRef.current;
    if (!element) return;

    try {
      // Render the compact coupon to a canvas for high-quality PDF
      const canvas = await html2canvas(element, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');

      // A6 size in mm: 105 x 148
      // Create a portrait PDF sized to A6
      // Use same orientation/units as elsewhere
      // jsPDF accepts format array [width, height]
      // We'll add a small margin of 6mm
      const pdf = new jsPDF('p', 'mm', [105, 148]);
      const pageWidth = 105;
      const pageHeight = 148;

      // Calculate image size in mm preserving aspect ratio
      const imgWidthPx = canvas.width;
      const imgHeightPx = canvas.height;
      const pxPerMm = imgWidthPx / (pageWidth * (window.devicePixelRatio || 1));
      const margin = 6; // mm
      const availableWidth = pageWidth - margin * 2;
      const scale = availableWidth / (imgWidthPx / pxPerMm);

      // Draw the image to fill the PDF width minus margins
      pdf.addImage(imgData, 'PNG', margin, margin, availableWidth, (imgHeightPx / pxPerMm) * scale / (imgWidthPx / (pageWidth * (window.devicePixelRatio || 1))));

      // Save PDF
      pdf.save(`attestation_encaissement_${studentId}_${receiptId}.pdf`);
    } catch (err) {
      console.error('Erreur génération PDF compact:', err);
      // Fallback: open print window
      await handlePrintWindow();
    }
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
                    Ce reçu est généré automatiquement par le système ScolApp — Généré le {currentDateTime}
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
                    Ce reçu est généré automatiquement par le système ScolApp — Généré le {currentDateTime}
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

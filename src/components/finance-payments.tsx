"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, Download, Printer } from "lucide-react";
import { RecuPaiement } from "@/components/recu-paiement";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { SchoolYearSelect } from "@/components/ui/school-year-select";

type PaymentRow = {
  id: string;
  studentId: string;
  studentName?: string;
  class?: string;
  schoolYear?: string;
  date: string;
  amount: number;
  method?: string;
  reason?: string;
  cashier?: string;
  cashierUsername?: string;
  installmentsPaid?: any;
  receiptNumber?: string;
};

export default function FinancePaymentsSection() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [filtered, setFiltered] = useState<PaymentRow[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRow | null>(null);
  const [editFields, setEditFields] = useState<{ amount?: string; method?: string; reason?: string; date?: string }>({});
  const [schoolStructure, setSchoolStructure] = useState<Record<string, string[]>>({});
  const [receiptPreview, setReceiptPreview] = useState<{ dataUrl: string; fileName: string } | null>(null);
  const [receiptPreviewOpen, setReceiptPreviewOpen] = useState(false);
  // Impression rapide par ligne (même reçu que l'encaissement)
  const [showRowReceipt, setShowRowReceipt] = useState(false);
  const [rowReceiptData, setRowReceiptData] = useState<any | null>(null);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState<any | null>(null);
  const [amountInWords, setAmountInWords] = useState<string>("");

  // Filtres
  const [schoolYears, setSchoolYears] = useState<string[]>([]);
  const [currentSchoolYear, setCurrentSchoolYear] = useState<string>("");
  const [schoolYear, setSchoolYear] = useState<string>("");
  const [level, setLevel] = useState<string>("all");
  const [availableLevels, setAvailableLevels] = useState<string[]>([]);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [klass, setKlass] = useState<string>("all");
  const [receiptId, setReceiptId] = useState("");
  const [query, setQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / rowsPerPage)), [filtered.length, rowsPerPage]);
  const paginated = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  // Charger années + niveaux/classes
  useEffect(() => {
    (async () => {
      try {
        const sy = await fetch('/api/finance/school-years').then(r => r.json()).catch(() => ({ availableYears: [], currentSchoolYear: '' }));
        setSchoolYears(sy.availableYears || []);
        setCurrentSchoolYear(sy.currentSchoolYear || "");
        setSchoolYear(sy.currentSchoolYear || sy.availableYears?.[0] || "");

        const levelsRes = await fetch('/api/school/levels?fromSettings=true');
        if (levelsRes.ok) {
          const data = await levelsRes.json();
          const actives = (data.levels || data.data || []).filter((l: any) => l.isActive).map((l: any) => l.name);
          setAvailableLevels(actives);
        }
        const structureRes = await fetch('/api/school/structure-flat');
        if (structureRes.ok) {
          const flat = await structureRes.json();
          setSchoolStructure(flat || {});
          // @ts-ignore
          const classesOfLevel = (lvl: string) => (flat?.[lvl] || []);
          setAvailableClasses(level === 'all' ? [] : classesOfLevel(level));
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!schoolYear) return;
      setIsLoading(true);
      try {
        // Construire l'URL avec filtres côté serveur
        const params = new URLSearchParams();
        params.set('schoolYear', schoolYear);
        if (level && level !== 'all') params.set('level', level);
        if (klass && klass !== 'all') params.set('className', klass);
        const res = await fetch(`/api/finance/payment-report?${params.toString()}`);
        const data = await res.json();
        console.debug('[finance-payments] fetched data:', data);
        const source = Array.isArray(data) ? data : (data?.payments || []);
        const rows = (Array.isArray(source) ? source : []).map((p: any) => ({
          id: p.id,
          studentId: p.studentId,
          studentName: p.studentName || p.student?.name || p.nom || p.prenom || '',
          class: p.class || p.className || p.classe || '',
          schoolYear: p.schoolYear || p.annee || '',
          date: p.date,
          amount: Number(p.amount),
          method: p.method,
          reason: p.reason,
          cashier: p.cashier || '',
          cashierUsername: p.cashierUsername || p.cashier_user || '',
          installmentsPaid: p.installmentsPaid || p.installments || null,
          receiptNumber: p.receiptNumber || p.id || '',
        })) as PaymentRow[];
        console.debug('[finance-payments] mapped rows count:', rows.length, rows.slice(0,5));
        setPayments(rows);
      } catch (err) {
        console.error('[finance-payments] fetch error:', err);
        setPayments([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [schoolYear]);

  // Appliquer filtres
  useEffect(() => {
    let out = [...payments];
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter(p => (p.studentName || '').toLowerCase().includes(q) || (p.studentId || '').toLowerCase().includes(q) || (p.reason || '').toLowerCase().includes(q));
    }
    if (receiptId.trim()) {
      const r = receiptId.toLowerCase();
      out = out.filter(p => (p.id || '').toLowerCase().includes(r));
    }
    if (fromDate) {
      const from = new Date(fromDate).getTime();
      out = out.filter(p => new Date(p.date).getTime() >= from);
    }
    if (toDate) {
      const to = new Date(toDate).getTime();
      out = out.filter(p => new Date(p.date).getTime() <= to);
    }
    if (level && level !== 'all') {
      // Filtrer par classes du niveau (depuis structure cachee ou disponibles)
      const levelClasses = (schoolStructure[level] || availableClasses || []).map(c => String(c).toLowerCase());
      if (levelClasses.length > 0) {
        const set = new Set(levelClasses);
        out = out.filter(p => p.class && set.has(String(p.class).toLowerCase()));
      }
    }
    if (klass && klass !== 'all') {
      out = out.filter(p => (p.class || '').toLowerCase() === klass.toLowerCase());
    }
    setFiltered(out);
    setPage(1);
  }, [payments, query, receiptId, fromDate, toDate, level, klass, availableClasses]);

  // Ajuster classes quand le niveau change
  useEffect(() => {
    // Mettre à jour la liste des classes quand le niveau change, en utilisant la structure en cache
    const classesOfLevel = (lvl: string) => (schoolStructure?.[lvl] || []);
          const cls = level === 'all' ? [] : classesOfLevel(level);
          setAvailableClasses(cls);
          setKlass('all');
  }, [level, schoolStructure]);

  const handleExportPdf = async () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    
    // En-tête du document
    doc.setFontSize(18);
    doc.text('Historique des Paiements', 14, 20);
    
    // Sous-titre avec année scolaire
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Année scolaire: ${schoolYear || currentSchoolYear}`, 14, 28);
    
    // Informations de filtrage
    let filterInfo = [];
    if (level && level !== 'all') filterInfo.push(`Niveau: ${level}`);
    if (klass && klass !== 'all') filterInfo.push(`Classe: ${klass}`);
    if (fromDate) filterInfo.push(`Du: ${new Date(fromDate).toLocaleDateString('fr-FR')}`);
    if (toDate) filterInfo.push(`Au: ${new Date(toDate).toLocaleDateString('fr-FR')}`);
    
    if (filterInfo.length > 0) {
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(`Filtres appliqués: ${filterInfo.join(' | ')}`, 14, 35);
    }
    
    // Date de génération
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 14, 42);
    
    // Préparer les données du tableau avec tous les champs
    const tableData = filtered.map(p => [
      new Date(p.date).toLocaleDateString('fr-FR'),
      p.receiptNumber || p.id,
      p.studentId || '—',
      p.studentName || '—',
      p.class || '—',
      p.cashierUsername || p.cashier || '—',
      `${Number(p.amount).toLocaleString('fr-FR')} XAF`,
      p.method || '—',
      p.reason || '—'
    ]);
    
    // Configuration du tableau optimisé
    const tableConfig = {
      startY: 48,
      head: [['Date', 'Reçu N°', 'ID Élève', 'Nom Élève', 'Classe', 'Caissier', 'Montant', 'Mode', 'Motif']],
      body: tableData,
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
        overflow: 'linebreak',
        halign: 'left'
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 28, halign: 'center' },  // Date (augmenté)
        1: { cellWidth: 32, halign: 'center' },  // Reçu N° (augmenté)
        2: { cellWidth: 25, halign: 'center' },  // ID Élève (augmenté)
        3: { cellWidth: 40, halign: 'left' },    // Nom Élève (augmenté)
        4: { cellWidth: 25, halign: 'center' },  // Classe (augmenté)
        5: { cellWidth: 30, halign: 'left' },    // Caissier (augmenté)
        6: { cellWidth: 35, halign: 'left' },    // Montant (augmenté)
        7: { cellWidth: 22, halign: 'center' },  // Mode (augmenté)
        8: { cellWidth: 45, halign: 'left' }     // Motif (augmenté)
      },
      margin: { top: 48, left: 8, right: 8 },
      pageBreak: 'auto',
      rowPageBreak: 'avoid',
      didDrawPage: function(data: any) {
        // Ajouter numéro de page
        const pageCount = (doc as any).getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Page ${data.pageNumber} sur ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10, { align: 'right' });
      }
    };
    
    // Générer le tableau
    autoTable(doc, tableConfig);
    
    // Pied de page avec statistiques
    const finalY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`Total: ${filtered.length} paiements`, 14, finalY);
    
    const totalAmount = filtered.reduce((sum, p) => sum + Number(p.amount), 0);
    doc.text(`Montant total: ${totalAmount.toLocaleString('fr-FR')} XAF`, 14, finalY + 6);
    
    // Sauvegarder le PDF
    doc.save(`paiements_${schoolYear || currentSchoolYear}_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const openDetails = (p: PaymentRow) => {
    setSelectedPayment(p);
    setDetailOpen(true);
  };

  const closeDetails = () => {
    setDetailOpen(false);
    setSelectedPayment(null);
  };

  const openEdit = (p: PaymentRow) => {
    setEditingPayment(p);
    setEditFields({
      amount: String(p.amount ?? ''),
      method: p.method ?? '',
      reason: p.reason ?? '',
      date: p.date ? new Date(p.date).toISOString().slice(0,16) : ''
    });
    setEditOpen(true);
  };

  const saveEditedPayment = async () => {
    if (!editingPayment) return;

    // Préparer les données pour la confirmation
    setPendingPaymentData({
      payment: editingPayment,
      updatedFields: {
        amount: editFields.amount ? Number(editFields.amount) : editingPayment.amount,
        method: editFields.method || editingPayment.method,
        reason: editFields.reason || editingPayment.reason,
        date: editFields.date ? new Date(editFields.date).toISOString() : editingPayment.date
      }
    });
    setAmountInWords(numberToWords(editFields.amount ? Number(editFields.amount) : editingPayment.amount));
    setShowConfirmationDialog(true);
  };

  const confirmEditedPayment = async () => {
    if (!pendingPaymentData) return;

    const { payment, updatedFields } = pendingPaymentData;
    setIsSubmitting(true);
    setShowConfirmationDialog(false);
    setPendingPaymentData(null);
    setAmountInWords("");

    try {
      const payload: any = { id: payment.id };
      if (updatedFields.amount !== payment.amount) payload.amount = updatedFields.amount;
      if (updatedFields.method !== payment.method) payload.method = updatedFields.method;
      if (updatedFields.reason !== payment.reason) payload.reason = updatedFields.reason;
      if (updatedFields.date !== payment.date) payload.date = updatedFields.date;

      const res = await fetch('/api/finance/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Échec de la mise à jour');

      // Générer automatiquement un reçu de paiement
      await generatePaymentReceipt(payment, payload);

      // rafraichir la liste
      setEditOpen(false);
      setEditingPayment(null);
      // Forcer un rechargement simple: relancer le useEffect de schoolYear
      setSchoolYear(prev => `${prev}`);
    } catch (e) {
      console.error('Erreur mise à jour paiement:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fonction pour convertir un nombre en lettres (simplifiée pour le français)
  const numberToWords = (num: number): string => {
    const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];

    if (num === 0) return 'zéro';

    let words = '';
    let n = Math.floor(num);

    if (n >= 1000000) {
      words += numberToWords(Math.floor(n / 1000000)) + ' million ';
      n %= 1000000;
    }

    if (n >= 1000) {
      words += numberToWords(Math.floor(n / 1000)) + ' mille ';
      n %= 1000;
    }

    if (n >= 100) {
      words += units[Math.floor(n / 100)] + ' cent ';
      n %= 100;
    }

    if (n >= 20) {
      words += tens[Math.floor(n / 10)];
      if (n % 10 > 0) {
        words += '-' + units[n % 10];
      }
    } else if (n >= 10) {
      words += teens[n - 10];
    } else if (n > 0) {
      words += units[n];
    }

    return words.trim();
  };

  // Fonction pour générer automatiquement un reçu de paiement
  const generatePaymentReceipt = async (payment: PaymentRow, updatedFields: any) => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      
      // En-tête du reçu de paiement (format différent du reçu de tranche)
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text('REÇU DE PAIEMENT', 105, 30, { align: 'center' });
      
      // Informations de l'établissement
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text('ÉTABLISSEMENT SCOLAIRE', 105, 45, { align: 'center' });
      doc.text('Yaoundé, Cameroun', 105, 52, { align: 'center' });
      
      // Séparateur
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 60, 190, 60);
      
      // Numéro de reçu
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(`Reçu N°: ${payment.receiptNumber || payment.id}`, 20, 80);
      
      // Date de paiement
      const paymentDate = updatedFields.date ? new Date(updatedFields.date) : new Date(payment.date);
      doc.text(`Date: ${paymentDate.toLocaleDateString('fr-FR')}`, 20, 90);
      
      // Informations de l'élève
      doc.text(`Élève: ${payment.studentName || '—'}`, 20, 105);
      doc.text(`ID: ${payment.studentId}`, 20, 115);
      doc.text(`Classe: ${payment.class || '—'}`, 20, 125);
      doc.text(`Année scolaire: ${payment.schoolYear || schoolYear}`, 20, 140);
      
      // Détails du paiement
      doc.setFontSize(16);
      doc.setTextColor(0, 100, 0);
      doc.text(`Montant payé: ${Number(updatedFields.amount || payment.amount).toLocaleString('fr-FR')} XAF`, 20, 160);
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Mode de paiement: ${updatedFields.method || payment.method || '—'}`, 20, 175);
      doc.text(`Motif: ${updatedFields.reason || payment.reason || '—'}`, 20, 185);
      
      // Informations du caissier
      doc.text(`Caissier: ${payment.cashierUsername || payment.cashier || '—'}`, 20, 200);
      
      // Séparateur
      doc.line(20, 210, 190, 210);
      
      // Note importante
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text('Ce reçu confirme le paiement effectué. Conservez-le précieusement.', 105, 220, { align: 'center' });
      doc.text('Format différent du reçu de tranche pour éviter toute confusion.', 105, 227, { align: 'center' });
      
      // Code de vérification
      const verificationCode = `VER-${payment.id.slice(-8)}-${Date.now().toString(36).toUpperCase()}`;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Code de vérification: ${verificationCode}`, 105, 240, { align: 'center' });
      
      // Générer le nom de fichier
      const fileName = `recu_paiement_${payment.studentId}_${paymentDate.toISOString().slice(0,10)}.pdf`;
      
      // Afficher la prévisualisation au lieu de télécharger automatiquement
      const pdfDataUrl = doc.output('datauristring');
      setReceiptPreview({ dataUrl: pdfDataUrl, fileName });
      setReceiptPreviewOpen(true);
      
      console.log('Reçu de paiement généré, prévisualisation affichée:', fileName);
    } catch (error) {
      console.error('Erreur lors de la génération du reçu:', error);
    }
  };

  // Fonction pour télécharger le reçu
  const downloadReceipt = () => {
    if (!receiptPreview) return;
    
    // Créer un lien de téléchargement
    const link = document.createElement('a');
    link.href = receiptPreview.dataUrl;
    link.download = receiptPreview.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Fermer la prévisualisation
    setReceiptPreviewOpen(false);
    setReceiptPreview(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Historique des Paiements</CardTitle>
            <CardDescription>Liste de tous les paiements par année scolaire, avec filtres et export PDF</CardDescription>
          </div>

          {/* Détails du reçu */}
          <Dialog open={detailOpen} onOpenChange={(open) => { if (!open) closeDetails(); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Détails du reçu</DialogTitle>
              </DialogHeader>
              {selectedPayment ? (
                <div className="space-y-2">
                  <div><strong>Reçu N°:</strong> {selectedPayment.receiptNumber || selectedPayment.id}</div>
                  <div><strong>Élève:</strong> {selectedPayment.studentName || '—'} ({selectedPayment.studentId})</div>
                  <div><strong>Date:</strong> {new Date(selectedPayment.date).toLocaleString('fr-FR')}</div>
                  <div><strong>Montant:</strong> {Number(selectedPayment.amount).toLocaleString('fr-FR')} XAF</div>
                  <div><strong>Mode:</strong> {selectedPayment.method || '—'}</div>
                  <div><strong>Motif:</strong> {selectedPayment.reason || '—'}</div>
                  <div><strong>Caissier:</strong> {selectedPayment.cashierUsername || selectedPayment.cashier || '—'}</div>
                  {/* Installments Paid retiré pour simplifier l'affichage */}
                </div>
              ) : (
                <div>Aucun paiement sélectionné</div>
              )}
              <DialogFooter>
                <div className="flex justify-end">
                  <Button onClick={closeDetails}>Fermer</Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <div className="flex gap-2">
            <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={handleExportPdf}><Printer className="h-4 w-4 mr-2"/> Imprimer</Button>
          </div>
        </CardHeader>
  <CardContent className="space-y-4 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="space-y-1 md:col-span-2">
              <Label>Année scolaire</Label>
              <SchoolYearSelect
                value={schoolYear}
                onValueChange={setSchoolYear}
                availableYears={schoolYears}
                currentSchoolYear={currentSchoolYear}
                placeholder="Sélectionner l'année scolaire"
                className="w-full"
              />
            </div>
            <div className="space-y-1 md:col-span-1">
              <Label>Niveau</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger><SelectValue placeholder="Tous les niveaux"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {availableLevels.map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 md:col-span-1">
              <Label>Classe</Label>
              <Select value={klass} onValueChange={setKlass}>
                <SelectTrigger><SelectValue placeholder="Toutes les classes"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {availableClasses.map(c => (
                    <SelectItem key={c} value={`${c}`}>{`${c}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 md:col-span-1">
              <Label>Du</Label>
              <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>
            <div className="space-y-1 md:col-span-1">
              <Label>Au</Label>
              <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
            <div className="space-y-1 md:col-span-3">
              <Label>Reçu N°</Label>
              <Input value={receiptId} onChange={e => setReceiptId(e.target.value)} placeholder="Ex: RCPT-00123" />
            </div>
            <div className="space-y-1 md:col-span-3">
              <Label>Recherche</Label>
              <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Élève, ID, motif..." />
            </div>
          </div>

          <Separator />

          <div className="relative z-50 bg-white border rounded-lg overflow-auto max-h-[55vh]">
            {isLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8"/></div>
            ) : (
              <div className="w-full overflow-auto">
                <Table className="w-full table-auto text-xs">
                  <TableHeader>
                    <TableRow className="bg-muted/60">
                      <TableHead className="py-1 px-2 w-24">Date</TableHead>
                      <TableHead className="py-1 px-2 w-32">Reçu N°</TableHead>
                      <TableHead className="py-1 px-2 w-40">Nom</TableHead>
                      <TableHead className="py-1 px-2 w-32">Caissier</TableHead>
                      <TableHead className="text-right py-1 px-1 w-20">Montant</TableHead>
                      <TableHead className="py-1 px-2 w-16">Mode</TableHead>
                      <TableHead className="py-1 px-2 w-28">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map(p => (
                      <TableRow key={p.id} className="hover:bg-muted/30">
                        <TableCell className="py-1 px-2 whitespace-nowrap">{new Date(p.date).toLocaleString('fr-FR')}</TableCell>
                        <TableCell title={p.receiptNumber || p.id} className="py-1 px-2 whitespace-nowrap">{p.receiptNumber || p.id}</TableCell>
                        <TableCell className="py-1 px-2 max-w-[160px] whitespace-nowrap truncate">{p.studentName || '—'}</TableCell>
                        <TableCell className="py-1 px-2 max-w-[150px] whitespace-nowrap truncate">{p.cashierUsername || p.cashier || '—'}</TableCell>
                        <TableCell className="py-1 px-1 text-right whitespace-nowrap font-semibold text-emerald-700">{Number(p.amount).toLocaleString('fr-FR')} XAF</TableCell>
                        <TableCell className="py-1 px-1 whitespace-nowrap">
                          {p.method ? (
                            <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium bg-blue-50 border-blue-200 text-blue-700">
                              {p.method}
                            </span>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="py-1 px-1">
                          <div className="flex gap-1 whitespace-nowrap">
                            <Button size="sm" className="bg-sky-600 text-white hover:bg-sky-700" onClick={() => openDetails(p)}>Détails</Button>
                            <Button size="sm" className="bg-amber-600 text-white hover:bg-amber-700" onClick={() => openEdit(p)}>Modifier</Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRowReceiptData({
                                  receiptId: p.receiptNumber || p.id,
                                  studentId: p.studentId,
                                  studentName: p.studentName || '—',
                                  class: p.class || '—',
                                  amount: Number(p.amount || 0).toLocaleString('fr-FR'),
                                  date: p.date,
                                  cashier: p.cashierUsername || p.cashier || '—',
                                  cashierUsername: p.cashierUsername || undefined,
                                  reason: p.reason || 'Paiement',
                                });
                                setShowRowReceipt(true);
                              }}
                              title="Imprimer le reçu"
                            >
                              <Printer className="h-4 w-4"/>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {paginated.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Aucun paiement trouvé</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-muted-foreground">
              Affichage de {(filtered.length === 0 ? 0 : (page - 1) * rowsPerPage + 1)} à {Math.min(page * rowsPerPage, filtered.length)} sur {filtered.length} paiements
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">Lignes</span>
                <Select value={`${rowsPerPage}`} onValueChange={v => { setRowsPerPage(Number(v)); setPage(1); }}>
                  <SelectTrigger className="h-8 w-[80px]"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50, 100].map(v => <SelectItem key={v} value={`${v}`}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm">Page {page} / {totalPages}</div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Précédent</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Suivant</Button>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
      {/* Impression silencieuse du reçu pour une ligne (Historique des Paiements) */}
      {showRowReceipt && rowReceiptData && (
        <div style={{ position: 'fixed', left: -99999, top: -99999, width: 0, height: 0, overflow: 'hidden' }}>
          <RecuPaiement
            receiptId={rowReceiptData.receiptId}
            studentId={rowReceiptData.studentId}
            studentName={rowReceiptData.studentName}
            class={rowReceiptData.class}
            amount={rowReceiptData.amount}
            date={rowReceiptData.date}
            cashier={rowReceiptData.cashier}
            cashierUsername={rowReceiptData.cashierUsername}
            reason={rowReceiptData.reason}
            autoPrint
            onPrinted={() => setShowRowReceipt(false)}
          />
        </div>
      )}
      {/* Dialog d'édition */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le paiement</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {editingPayment && (
              <div className="md:col-span-2 text-sm text-muted-foreground">
                Élève: <span className="font-medium text-foreground">{editingPayment.studentName || '—'}</span> — Classe: <span className="font-medium text-foreground">{editingPayment.class || '—'}</span>
              </div>
            )}
            <div className="space-y-1">
              <Label>Montant</Label>
              <Input value={editFields.amount ?? ''} onChange={e => setEditFields(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Méthode</Label>
              <Input value={editFields.method ?? ''} onChange={e => setEditFields(f => ({ ...f, method: e.target.value }))} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Motif</Label>
              <Input value={editFields.reason ?? ''} onChange={e => setEditFields(f => ({ ...f, reason: e.target.value }))} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Date</Label>
              <Input type="datetime-local" value={editFields.date ?? ''} onChange={e => setEditFields(f => ({ ...f, date: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Annuler</Button>
              <Button onClick={saveEditedPayment}>Enregistrer</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Boîte de dialogue de confirmation */}
      <Dialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la modification du paiement</DialogTitle>
          </DialogHeader>
          {pendingPaymentData && (
            <div className="space-y-4">
              <div>
                <strong>Élève:</strong> {pendingPaymentData.payment.studentName || '—'}
              </div>
              <div>
                <strong>Montant en chiffres:</strong> {pendingPaymentData.updatedFields.amount.toLocaleString('fr-FR')} XAF
              </div>
              <div>
                <strong>Montant en lettres:</strong> {amountInWords} francs CFA
              </div>
              <div>
                <strong>Mode de paiement:</strong> {pendingPaymentData.updatedFields.method || '—'}
              </div>
              <div>
                <strong>Motif:</strong> {pendingPaymentData.updatedFields.reason || '—'}
              </div>
              <div className="text-sm text-muted-foreground">
                Voulez-vous vraiment modifier ce paiement ?
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmationDialog(false)}>
              Annuler
            </Button>
            <Button onClick={confirmEditedPayment} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue de prévisualisation du reçu */}
      <Dialog open={receiptPreviewOpen} onOpenChange={setReceiptPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Prévisualisation du Reçu de Paiement</DialogTitle>
          </DialogHeader>
          {receiptPreview && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Nom du fichier: <span className="font-mono">{receiptPreview.fileName}</span>
              </div>
              
              {/* Prévisualisation du PDF */}
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  src={receiptPreview.dataUrl}
                  width="100%"
                  height="500"
                  title="Prévisualisation du reçu"
                  className="border-0"
                />
              </div>
              
              <div className="text-xs text-muted-foreground text-center">
                <p>Ce reçu confirme le paiement effectué avec un format différent du reçu de tranche.</p>
                <p>Cliquez sur "Télécharger" pour enregistrer le fichier sur votre ordinateur.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <div className="flex justify-between w-full">
              <Button variant="outline" onClick={() => setReceiptPreviewOpen(false)}>
                Fermer
              </Button>
              <Button onClick={downloadReceipt} className="bg-green-600 hover:bg-green-700">
                <Download className="h-4 w-4 mr-2" />
                Télécharger le Reçu
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}




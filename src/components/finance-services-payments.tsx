"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Student } from "@/services/studentService";
import jsPDF from 'jspdf';
import { RecuPaiement } from './recu-paiement';
import { PrintDossierAfterPayment } from './dossier-financier-pdf';

type ServiceItem = { id: string; name: string; description?: string; amount: number; isActive: boolean };
type ServicePayment = {
  id: string;
  studentId: string;
  serviceId: string;
  serviceName: string;
  amount: number;
  date: string;
  method: string;
  cashier?: string;
  cashierUsername?: string;
  schoolYear: string;
};

export function FinanceServicesPayments({ student, schoolYear }: { student: Student; schoolYear: string }) {
  const { toast } = useToast();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [payments, setPayments] = useState<ServicePayment[]>([]);
  const [selectedService, setSelectedService] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<string>("Espèces");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serviceReceiptData, setServiceReceiptData] = useState<any | null>(null);
  const [showServiceReceipt, setShowServiceReceipt] = useState(false);
  const [showDossierDialog, setShowDossierDialog] = useState(false);
  const [dossierProps, setDossierProps] = useState<any | null>(null);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState<any | null>(null);
  const [amountInWords, setAmountInWords] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const s = await fetch(`/api/finance/services?schoolYear=${encodeURIComponent(schoolYear)}`);
        if (!s.ok) throw new Error("Erreur de chargement des services");
        const list = await s.json();
        const raw = Array.isArray(list) ? list : (Array.isArray(list?.data) ? list.data : []);
        // Normaliser: price -> amount et valeurs par défaut
        const normalized: ServiceItem[] = raw.map((it: any) => ({
          id: String(it.id),
          name: String(it.name || ''),
          description: it.description || '',
          amount: Number(it.amount ?? it.price ?? 0),
          isActive: Boolean(it.isActive ?? true),
        }));
        setServices(normalized);

        const p = await fetch(`/api/finance/service-payments?studentId=${student.id}&schoolYear=${schoolYear}`);
        if (!p.ok) throw new Error("Erreur de chargement des paiements services");
        const plist = await p.json();
        const parr = Array.isArray(plist) ? plist : (Array.isArray(plist?.data) ? plist.data : []);
        setPayments(parr);
      } catch (e) {
        toast({ variant: "destructive", title: "Finance - Services", description: e instanceof Error ? e.message : String(e) });
      }
    })();
  }, [student.id, schoolYear, toast]);

  const activeServices = useMemo(() => services.filter(s => s.isActive), [services]);

  const handleAddPayment = async () => {
    if (!selectedService) {
      toast({ variant: "destructive", title: "Validation", description: "Sélectionnez un service" });
      return;
    }
    const service = services.find(s => s.id === selectedService);
    const parsedAmount = parseFloat((amount || "").replace(/\s/g, '').replace(',', '.'));
    if (!service || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ variant: "destructive", title: "Montant invalide", description: "Saisissez un montant valide" });
      return;
    }
    // Validation: ne pas dépasser le montant configuré pour le service
    if (parsedAmount > service.amount) {
      toast({ variant: "destructive", title: "Montant supérieur", description: `Le montant ne peut pas dépasser ${service.amount.toLocaleString('fr-FR')} XAF pour ce service` });
      return;
    }

    // Préparer les données pour la confirmation
    setPendingPaymentData({
      service,
      parsedAmount,
      method
    });
    setAmountInWords(numberToWords(parsedAmount));
    setShowConfirmationDialog(true);
  };

  const confirmPayment = async () => {
    if (!pendingPaymentData) return;

    const { service, parsedAmount, method } = pendingPaymentData;
    setIsSubmitting(true);
    setShowConfirmationDialog(false);
    setPendingPaymentData(null);
    setAmountInWords("");

    try {
      const body = {
        studentId: student.id,
        schoolYear,
        serviceId: service.id,
        amount: parsedAmount,
        method,
      };
      const res = await fetch("/api/finance/service-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Échec de l'enregistrement du paiement");
      const created = await res.json();
      setPayments(p => [created, ...p]);
      setAmount("");
      toast({ title: "Paiement enregistré", description: `${service.name} - ${parsedAmount.toLocaleString()} XAF` });

      // Déclencher impression du reçu pour services (même style)
      setServiceReceiptData({
        receiptId: created.id,
        studentId: student.id,
        studentName: `${student.prenom} ${student.nom}`,
        class: student.classe,
        amount: Number(created.amount).toLocaleString('fr-FR'),
        date: new Date(created.date || Date.now()).toLocaleDateString('fr-FR'),
        cashier: created.cashier || 'Système',
        cashierUsername: created.cashierUsername || 'system',
        reason: created.serviceName ? `Service - ${created.serviceName}` : 'Service',
      });
      setShowServiceReceipt(true);
    } catch (e) {
      toast({ variant: "destructive", title: "Erreur", description: e instanceof Error ? e.message : String(e) });
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

  const generateFinancialDossierPdf = async () => {
    try {
      // Charger données financières consolidées
      const scholRes = await fetch(`/api/finance/payments?studentId=${encodeURIComponent(student.id)}&schoolYear=${encodeURIComponent(schoolYear)}`);
      const schol = scholRes.ok ? await scholRes.json() : [];
      const servRes = await fetch(`/api/finance/service-payments?studentId=${encodeURIComponent(student.id)}&schoolYear=${encodeURIComponent(schoolYear)}`);
      const servJson = servRes.ok ? await servRes.json() : { data: [] };
      const services = Array.isArray(servJson) ? servJson : (Array.isArray(servJson?.data) ? servJson.data : []);

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;

      doc.setFont('times', 'bold');
      doc.setFontSize(14);
      doc.text("Dossier financier de l'élève", pageWidth / 2, 20, { align: 'center' });
      doc.setFont('times', 'normal');
      doc.setFontSize(11);
      doc.text(`${student.prenom} ${student.nom} • Matricule: ${student.id}`, pageWidth / 2, 28, { align: 'center' });
      doc.text(`Classe: ${student.classe} • Année: ${schoolYear}`, pageWidth / 2, 34, { align: 'center' });

      // Résumé
      const totalSchol = (Array.isArray(schol) ? schol : []).reduce((s, p: any) => s + Number(p.amount || 0), 0);
      const totalServ = services.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
      const totalAll = totalSchol + totalServ;
      doc.setFont('times', 'bold');
      doc.text('Résumé', margin, 46);
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.text(`Total scolarité payé: ${totalSchol.toLocaleString('fr-FR')} XAF`, margin, 52);
      doc.text(`Total services payé: ${totalServ.toLocaleString('fr-FR')} XAF`, margin, 58);
      doc.text(`Total payé: ${totalAll.toLocaleString('fr-FR')} XAF`, margin, 64);

      // Tableau paiements (consolidé)
      const rows = [
        ...(Array.isArray(schol) ? schol : []).map((p: any) => ({
          date: new Date(p.date).toLocaleDateString('fr-FR'),
          source: 'Scolarité',
          label: p.reason || 'Paiement scolarité',
          method: p.method || '—',
          amount: Number(p.amount || 0),
        })),
        ...services.map((p: any) => ({
          date: new Date(p.date).toLocaleDateString('fr-FR'),
          source: 'Service',
          label: p.serviceName || 'Service',
          method: p.method || '—',
          amount: Number(p.amount || 0),
        })),
      ].sort((a, b) => new Date(b.date.split('/').reverse().join('-')).getTime() - new Date(a.date.split('/').reverse().join('-')).getTime());

      let y = 74;
      doc.setFont('times', 'bold'); doc.text('Paiements', margin, y); y += 6;
      doc.setFont('times', 'normal');
      doc.setFontSize(9);
      // En-têtes
      doc.text('Date', margin, y);
      doc.text('Source', margin + 28, y);
      doc.text('Libellé', margin + 60, y);
      doc.text('Mode', margin + 130, y);
      doc.text('Montant', pageWidth - margin, y, { align: 'right' });
      y += 4; doc.line(margin, y, pageWidth - margin, y); y += 5;
      rows.forEach((r) => {
        if (y > 280) { doc.addPage(); y = 20; }
        doc.text(r.date, margin, y);
        doc.text(r.source, margin + 28, y);
        doc.text(r.label, margin + 60, y);
        doc.text(r.method, margin + 130, y);
        doc.text(r.amount.toLocaleString('fr-FR') + ' XAF', pageWidth - margin, y, { align: 'right' });
        y += 6;
      });

      doc.save(`dossier-financier-${student.id}-${schoolYear}.pdf`);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Impression dossier financier', description: e instanceof Error ? e.message : String(e) });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Services et paiements</CardTitle>
      </CardHeader>
      <CardContent>
        {showServiceReceipt && serviceReceiptData && (
          <div style={{ position: 'fixed', left: -99999, top: -99999, width: 0, height: 0, overflow: 'hidden' }}>
            <RecuPaiement
              receiptId={serviceReceiptData.receiptId}
              studentId={serviceReceiptData.studentId}
              studentName={serviceReceiptData.studentName}
              class={serviceReceiptData.class}
              amount={serviceReceiptData.amount}
              date={serviceReceiptData.date}
              cashier={serviceReceiptData.cashier}
              cashierUsername={serviceReceiptData.cashierUsername}
              reason={serviceReceiptData.reason}
              autoPrint
              onPrinted={async () => {
                try {
                  setShowServiceReceipt(false);
                  // Charger les données requises pour le dossier
                  const [schoolRes, paymentsRes, feeRes] = await Promise.all([
                    fetch('/api/school/info'),
                    fetch(`/api/finance/payments?studentId=${encodeURIComponent(student.id)}&schoolYear=${encodeURIComponent(schoolYear)}`),
                    fetch('/api/finance/fee-structure')
                  ]);
                  const schoolInfo = schoolRes.ok ? await schoolRes.json() : null;
                  const scholPayments = paymentsRes.ok ? await paymentsRes.json() : [];
                  const feeStructure = feeRes.ok ? await feeRes.json() : [];

                  // Le paiement courant (service) comme "payment"
                  const currentPayment = {
                    id: serviceReceiptData.receiptId,
                    amount: Number(String(serviceReceiptData.amount).replace(/\s/g, '').replace(/\./g, '').replace(',', '.')) || 0,
                    date: new Date().toISOString(),
                    receiptNumber: serviceReceiptData.receiptId,
                    reason: serviceReceiptData.reason,
                  };
                  setDossierProps({
                    student,
                    payment: currentPayment,
                    payments: Array.isArray(scholPayments) ? scholPayments : [],
                    feeStructure,
                    schoolInfo,
                    autoOpen: true,
                    showButton: false,
                    onPrinted: () => setShowDossierDialog(false),
                    onClose: () => setShowDossierDialog(false)
                  });
                  setShowDossierDialog(true);
                } catch (err) {
                  // Fallback silencieux
                }
              }}
            />
          </div>
        )}
        {showDossierDialog && dossierProps && (
          <PrintDossierAfterPayment {...dossierProps} />
        )}
        {/* Boîte de dialogue de confirmation */}
        <Dialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer le paiement</DialogTitle>
            </DialogHeader>
            {pendingPaymentData && (
              <div className="space-y-4">
                <div>
                  <strong>Service:</strong> {pendingPaymentData.service.name}
                </div>
                <div>
                  <strong>Montant en chiffres:</strong> {pendingPaymentData.parsedAmount.toLocaleString('fr-FR')} XAF
                </div>
                <div>
                  <strong>Montant en lettres:</strong> {amountInWords} francs CFA
                </div>
                <div>
                  <strong>Mode de paiement:</strong> {pendingPaymentData.method}
                </div>
                <div className="text-sm text-muted-foreground">
                  Voulez-vous vraiment enregistrer ce paiement ?
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmationDialog(false)}>
                Annuler
              </Button>
              <Button onClick={confirmPayment} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Service</label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un service" />
              </SelectTrigger>
              <SelectContent>
                {activeServices.map(s => {
                  const amt = isFinite(Number(s.amount)) ? Number(s.amount) : 0;
                  return (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({amt.toLocaleString('fr-FR')} XAF)
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Montant</label>
            <Input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Ex: 5 000" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Mode</label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Espèces">Espèces</SelectItem>
                <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                <SelectItem value="Virement">Virement</SelectItem>
                <SelectItem value="Chèque">Chèque</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={handleAddPayment} disabled={isSubmitting}>Enregistrer le paiement</Button>
        </div>
        <Separator className="my-4" />
        <div className="space-y-2">
          <div className="text-sm font-semibold">Paiements enregistrés</div>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Service</th>
                  <th className="text-right p-2">Montant</th>
                  <th className="text-left p-2">Mode</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td className="p-3 text-center" colSpan={4}>Aucun paiement</td></tr>
                ) : payments.map(p => (
                  <tr key={p.id} className="border-t">
                    <td className="p-2">{new Date(p.date).toLocaleDateString('fr-FR')}</td>
                    <td className="p-2">{p.serviceName}</td>
                    <td className="p-2 text-right">{Number(p.amount).toLocaleString()} XAF</td>
                    <td className="p-2">{p.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default FinanceServicesPayments;



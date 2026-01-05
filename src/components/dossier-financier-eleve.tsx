"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 
import { X, Calendar, Eye, Printer, ArrowLeft, Wallet, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { RecuPaiement } from './recu-paiement';

interface StudentFinancialDetails {
  student: {
    id: string;
    nom: string;
    prenom: string;
    classe: string;
    anneeScolaire: string;
  };
  summary: {
    totalDue: number;
    totalPaid: number;
    outstanding: number;
    paymentRate: number;
  };
  payments: Array<{
    id: string;
    date: string;
    amount: number;
    method: string;
    reason: string;
    receiptNumber: string;
  }>;
  feeStructure: Array<{
    id: string;
    name: string;
    amount: number;
    dueDate: string;
    status: 'payée' | 'en_attente' | 'en_retard';
    paidAmount: number;
    remainingAmount: number;
  }>;
}

interface DossierFinancierEleveProps {
  studentId: string;
  schoolYear: string;
  onClose: () => void;
  onDataChange?: () => void;
}

export default function DossierFinancierEleve({ studentId, schoolYear, onClose, onDataChange }: DossierFinancierEleveProps) {
  const { toast } = useToast();
    const [data, setData] = useState<StudentFinancialDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInstallment, setSelectedInstallment] = useState<string>('');
  const [newDueDate, setNewDueDate] = useState<string>('');
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showInstallmentReceipt, setShowInstallmentReceipt] = useState(false);
  const [installmentReceiptData, setInstallmentReceiptData] = useState<any>(null);
  const [editPaymentOpen, setEditPaymentOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any | null>(null);
  const [editFields, setEditFields] = useState<{ amount?: string; method?: string; reason?: string; date?: string }>({});
  // Impression par paiement
  const [showPaymentReceipt, setShowPaymentReceipt] = useState(false);
  const [paymentReceiptData, setPaymentReceiptData] = useState<any | null>(null);

  useEffect(() => {
    fetchStudentFinancialDetails();
  }, [studentId, schoolYear]);

  // Générer le QR code au chargement des données
  useEffect(() => {
    if (data) {
      const generateQRCode = async () => {
        try {
          const QRCode = (await import('qrcode')).default;
          const qrData = `Dossier Financier\nÉlève: ${data.student.prenom} ${data.student.nom}\nMatricule: ${data.student.id}\nClasse: ${data.student.classe}\nAnnée: ${data.student.anneeScolaire}\nDate: ${new Date().toLocaleDateString('fr-FR')}`;
          const url = await QRCode.toDataURL(qrData, { errorCorrectionLevel: 'H' });
          setQrCodeUrl(url);
        } catch (error) {
          console.error('Erreur lors de la génération du QR code:', error);
        }
      };
      generateQRCode();
    }
  }, [data]);



  const handlePrintInstallmentReceipt = (installment: any) => {
    if (installment.status === 'payée' && data) {
      // Trouver le paiement correspondant à cette tranche
      const payment = data.payments.find(p => p.reason === installment.name);
      
      setInstallmentReceiptData({
        receiptId: payment?.receiptNumber || `REC-${Date.now()}`,
        studentId: data.student.id,
        studentName: `${data.student.prenom} ${data.student.nom}`,
        class: data.student.classe,
        amount: Number(installment.paidAmount || 0).toLocaleString('fr-FR'),
        date: payment?.date || new Date().toISOString(),
        cashier: 'Administration',
        cashierUsername: 'admin',
        reason: installment.name
      });
      setShowInstallmentReceipt(true);
    }
  };

  const handleExtendDueDate = async () => {
    if (!selectedInstallment || !newDueDate) {
      toast({
        variant: 'destructive',
        title: "Erreur",
        description: "Veuillez sélectionner une tranche et une nouvelle date."
      });
      return;
    }

    try {
      const response = await fetch('/api/finance/extend-installment-due-date', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          installmentId: selectedInstallment,
          newDueDate
        }),
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Date limite prolongée avec succès."
        });
        setShowExtendDialog(false);
        setSelectedInstallment('');
        setNewDueDate('');
        // Rafraîchir les données
        fetchStudentFinancialDetails();
        // Notifier le composant parent pour rafraîchir les données
        if (onDataChange) {
          onDataChange();
        }
      } else {
        throw new Error('Erreur lors de la prolongation');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: "Erreur",
        description: "Impossible de prolonger la date limite."
      });
    }
  };

  const openEditPayment = (p: any) => {
    setEditingPayment(p);
    setEditFields({
      amount: String(p.amount ?? ''),
      method: p.method ?? '',
      reason: p.reason ?? '',
      date: p.date ? new Date(p.date).toISOString().slice(0,16) : '' // input type=datetime-local
    });
    setEditPaymentOpen(true);
  };

  const saveEditedPayment = async () => {
    if (!editingPayment) return;
    try {
      const payload: any = { id: editingPayment.id };
      if (editFields.amount) payload.amount = Number(editFields.amount);
      if (editFields.method) payload.method = editFields.method;
      if (typeof editFields.reason !== 'undefined') payload.reason = editFields.reason;
      if (editFields.date) payload.date = new Date(editFields.date).toISOString();

      const res = await fetch('/api/finance/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Échec de la mise à jour');

      toast({ title: 'Paiement mis à jour', description: 'Les informations du paiement ont été modifiées.' });
      setEditPaymentOpen(false);
      setEditingPayment(null);
      await fetchStudentFinancialDetails();
      onDataChange && onDataChange();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour le paiement.' });
    }
  };


  const fetchStudentFinancialDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/finance/student-details?studentId=${studentId}&schoolYear=${schoolYear}`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données');
      }
      const result = await response.json();
      setData(result);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: "Erreur",
        description: "Impossible de charger les détails financiers de l'élève."
      });
    } finally {
      setLoading(false);
    }
  };



  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'payée':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Payée</Badge>;
      case 'en_retard':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />En retard</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête avec informations de l'élève */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{data.student.nom} {data.student.prenom}</h2>
          <p className="text-sm text-muted-foreground">
            {data.student.classe} - {data.student.anneeScolaire}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Résumé financier */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Dû</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg font-bold">{data.summary?.totalDue?.toLocaleString('fr-FR') || '0'} XAF</div>
          </CardContent>
        </Card>
        <Card className="p-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Payé</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg font-bold text-green-600">{data.summary?.totalPaid?.toLocaleString('fr-FR') || '0'} XAF</div>
          </CardContent>
        </Card>
        <Card className="p-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Solde</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg font-bold text-red-600">{data.summary?.outstanding?.toLocaleString('fr-FR') || '0'} XAF</div>
          </CardContent>
        </Card>
        <Card className="p-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taux de Paiement</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg font-bold">{data.summary?.paymentRate?.toFixed(1) || '0'}%</div>
            <Progress value={data.summary?.paymentRate || 0} className="h-2 mt-1" />
          </CardContent>
        </Card>
      </div>

      {/* Structure tarifaire et tranches */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Structure Tarifaire</CardTitle>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowExtendDialog(true)}
                             disabled={!Array.isArray(data.feeStructure) || data.feeStructure.every(item => item.status === 'payée')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Prolonger une date
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Tranche</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="text-right">Payé</TableHead>
                <TableHead className="text-right">Reste</TableHead>
                <TableHead>Date Limite</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
                         <TableBody>
               {Array.isArray(data.feeStructure) ? data.feeStructure.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                                     <TableCell className="text-right">{item.amount?.toLocaleString('fr-FR')} XAF</TableCell>
                   <TableCell className="text-right text-green-600">{item.paidAmount?.toLocaleString('fr-FR')} XAF</TableCell>
                   <TableCell className="text-right text-red-600">{item.remainingAmount?.toLocaleString('fr-FR')} XAF</TableCell>
                  <TableCell>{new Date(item.dueDate).toLocaleDateString('fr-FR')}</TableCell>
                                   <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-center">
                    {/* Impression par tranche retirée: impression désormais par paiement */}
                  </TableCell>
               </TableRow>
             )) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

             {/* Historique des paiements */}
       <Card>
         <CardHeader className="pb-3">
           <CardTitle className="text-base">5 Derniers Paiements</CardTitle>
         </CardHeader>
        <CardContent className="pt-0">
          {data.payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reçu N°</TableHead>
                  <TableHead>Motif</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{new Date(payment.date).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>{payment.receiptNumber}</TableCell>
                    <TableCell>{payment.reason}</TableCell>
                    <TableCell>{payment.method}</TableCell>
                                         <TableCell className="text-right font-medium">{payment.amount?.toLocaleString('fr-FR')} XAF</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditPayment(payment)} className="h-8 px-2">Modifier</Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2"
                          onClick={() => {
                            setInstallmentReceiptData({
                              receiptId: payment.id || payment.receiptNumber || `REC-${Date.now()}`,
                              studentId: data.student.id,
                              studentName: `${data.student.prenom} ${data.student.nom}`,
                              class: data.student.classe,
                              amount: Number(payment.amount || 0).toLocaleString('fr-FR'),
                              date: payment.date || new Date().toISOString(),
                              cashier: 'Administration',
                              cashierUsername: 'admin',
                              reason: payment.reason || 'Paiement',
                            });
                            setShowInstallmentReceipt(true);
                          }}
                          title="Imprimer le reçu"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucun paiement enregistré</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogue pour prolonger la date limite */}
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Prolonger la Date Limite</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="installment">Sélectionner la tranche</Label>
              <Select value={selectedInstallment} onValueChange={setSelectedInstallment}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une tranche..." />
                </SelectTrigger>
                <SelectContent>
                                     {Array.isArray(data.feeStructure) ? data.feeStructure
                     .filter(item => item.status !== 'payée')
                     .map((item) => (
                                                                      <SelectItem key={item.id} value={item.id}>
                           {item.name} - {item.remainingAmount?.toLocaleString('fr-FR')} XAF restant
                         </SelectItem>
                     )) : null}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="newDueDate">Nouvelle date limite</Label>
              <Input
                type="date"
                id="newDueDate"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowExtendDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleExtendDueDate} disabled={!selectedInstallment || !newDueDate}>
                Confirmer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Impression silencieuse du reçu de tranche */}
      {showInstallmentReceipt && installmentReceiptData && (
        <div style={{ position: 'fixed', left: -99999, top: -99999, width: 0, height: 0, overflow: 'hidden' }}>
          <RecuPaiement
            receiptId={installmentReceiptData.receiptId}
            studentId={installmentReceiptData.studentId}
            studentName={installmentReceiptData.studentName}
            class={installmentReceiptData.class}
            amount={installmentReceiptData.amount}
            date={installmentReceiptData.date}
            cashier={installmentReceiptData.cashier}
            cashierUsername={installmentReceiptData.cashierUsername}
            reason={installmentReceiptData.reason}
            autoPrint
            onPrinted={() => setShowInstallmentReceipt(false)}
          />
        </div>
      )}

      {/* Dialog édition paiement */}
      <Dialog open={editPaymentOpen} onOpenChange={setEditPaymentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le paiement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Montant</Label>
              <Input type="number" value={editFields.amount ?? ''} onChange={(e) => setEditFields({ ...editFields, amount: e.target.value })} />
            </div>
            <div>
              <Label>Motif</Label>
              <Input value={editFields.reason ?? ''} onChange={(e) => setEditFields({ ...editFields, reason: e.target.value })} />
            </div>
            <div>
              <Label>Mode de paiement</Label>
              <Select value={editFields.method ?? ''} onValueChange={(v) => setEditFields({ ...editFields, method: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Espèces">Espèces</SelectItem>
                  <SelectItem value="MTN MoMo">MTN MoMo</SelectItem>
                  <SelectItem value="Orange Money">Orange Money</SelectItem>
                  <SelectItem value="Chèque">Chèque</SelectItem>
                  <SelectItem value="Virement">Virement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date et heure</Label>
              <Input type="datetime-local" value={editFields.date ?? ''} onChange={(e) => setEditFields({ ...editFields, date: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditPaymentOpen(false)}>Annuler</Button>
              <Button onClick={saveEditedPayment}>Enregistrer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
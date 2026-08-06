"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  Plus,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Filter,
  Search,
  Eye,
  RefreshCw,
  Calendar,
  Building,
  UserCheck,
  AlertCircle,
  FileDown,
  DollarSign,
  TrendingUp,
  Trash2,
  Check,
  X,
  Printer,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ExpenseRequest, ExpenseItem } from '@/db/services/expenseDb';
import { generateExpensePdf } from '@/components/expense-pdf';

interface ExpenseManagerProps {
  role: string;
  currentUser?: any;
  schoolInfo?: any;
}

const RUBRIQUES = [
  { id: '101-MP', label: '101-MP : Salaires et primes' },
  { id: '102-MP', label: '102-MP : Matériel scolaire, eau et électricité' },
  { id: '103-MP', label: '103-MP : Cours de vacances et campagnes promo' },
  { id: '104-MP', label: '104-MP : Fête, sorties et réunions des parents' },
  { id: '105-MP', label: '105-MP : Bassin, inspection et formations' },
  { id: 'Autre', label: 'Autre (préciser)' },
];

const DOCUMENTS_JOINTS = [
  'Budget prévisionnel',
  'Devis / Factures pro forma',
  'PV de réunion du comité de gestion',
  "Rapport d'activités précédent (si applicable)",
  'Autre',
];

export default function ExpenseManager({ role, currentUser, schoolInfo }: ExpenseManagerProps) {
  const { toast } = useToast();
  const isAdmin = ['Admin', 'Direction', 'Comptable'].includes(role);

  const [requests, setRequests] = useState<ExpenseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('toutes');

  // Modals state
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [openApproveModal, setOpenApproveModal] = useState(false);
  const [openRejectModal, setOpenRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ExpenseRequest | null>(null);

  // Form State for creation
  const [subjectCategory, setSubjectCategory] = useState(RUBRIQUES[0].label);
  const [subjectOther, setSubjectOther] = useState('');
  const [justificationDocs, setJustificationDocs] = useState<string[]>(['Budget prévisionnel']);
  const [justificationOther, setJustificationOther] = useState('');
  const [amountRequested, setAmountRequested] = useState('');
  const [desiredDate, setDesiredDate] = useState('');
  const [justificationText, setJustificationText] = useState('');
  const [location, setLocation] = useState('Yaoundé');
  const [items, setItems] = useState<ExpenseItem[]>([
    { description: '', supplier1: '', price1: 0, supplier2: '', price2: 0, supplier3: '', price3: 0 }
  ]);
  const [submitting, setSubmitting] = useState(false);

  // Form State for Admin Approval
  const [approveAmount, setApproveAmount] = useState('');
  const [directorComments, setDirectorComments] = useState('Avis Favorable - Budget disponible');
  const [foundationComments, setFoundationComments] = useState('Paiement et déblocage autorisés');

  // Form State for Admin Rejection
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/finance/expense-requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : []);
      }

      const statsRes = await fetch('/api/finance/expense-requests?stats=true');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des demandes:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les demandes de dépenses', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAddItem = () => {
    setItems(prev => [...prev, { description: '', supplier1: '', price1: 0, supplier2: '', price2: 0, supplier3: '', price3: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ExpenseItem, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const calculateItemsTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const p1 = Number(item.price1) || 0;
      const p2 = Number(item.price2) || 0;
      const p3 = Number(item.price3) || 0;
      return sum + (p1 > 0 ? p1 : (p2 > 0 ? p2 : p3));
    }, 0);
  }, [items]);

  const handleToggleDoc = (docName: string) => {
    setJustificationDocs(prev =>
      prev.includes(docName) ? prev.filter(d => d !== docName) : [...prev, docName]
    );
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountRequested || Number(amountRequested) <= 0) {
      toast({ title: 'Champ requis', description: 'Veuillez saisir un montant sollicité valide', variant: 'destructive' });
      return;
    }
    if (!desiredDate) {
      toast({ title: 'Champ requis', description: 'Veuillez sélectionner la date souhaitée', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        subjectCategory,
        subjectOther: subjectCategory === 'Autre (préciser)' ? subjectOther : null,
        justificationDocs,
        justificationOther,
        amountRequested: Number(amountRequested),
        desiredDate,
        justificationText,
        location,
        items,
        applicantName: currentUser?.fullName || currentUser?.username || 'Demandeur',
        applicantRole: role,
        schoolYear: schoolInfo?.currentSchoolYear || '2025-2026',
      };

      const res = await fetch('/api/finance/expense-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({ title: 'Succès', description: 'Votre demande de dépense a été soumise avec succès.' });
        setOpenCreateModal(false);
        // Reset form
        setAmountRequested('');
        setJustificationText('');
        setItems([{ description: '', supplier1: '', price1: 0, supplier2: '', price2: 0, supplier3: '', price3: 0 }]);
        fetchRequests();
      } else {
        const err = await res.json();
        toast({ title: 'Erreur', description: err.error || 'Échec de création', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/finance/expense-requests/${selectedRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'VALIDE',
          amountApproved: Number(approveAmount) || selectedRequest.amountRequested,
          directorAvisComments: directorComments,
          foundationAvisComments: foundationComments,
        }),
      });

      if (res.ok) {
        toast({ title: 'Demande Validée !', description: 'Le déblocage des fonds et le numéro d\'autorisation ont été générés.' });
        setOpenApproveModal(false);
        fetchRequests();
      } else {
        const err = await res.json();
        toast({ title: 'Erreur', description: err.error || 'Erreur lors de la validation', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    if (!rejectionReason) {
      toast({ title: 'Motif requis', description: 'Veuillez entrer le motif du refus.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/finance/expense-requests/${selectedRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'REFUSE',
          rejectionReason,
        }),
      });

      if (res.ok) {
        toast({ title: 'Demande Refusée', description: 'La demande de dépense a été refusée.' });
        setOpenRejectModal(false);
        fetchRequests();
      } else {
        const err = await res.json();
        toast({ title: 'Erreur', description: err.error || 'Erreur lors du refus', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = (req: ExpenseRequest) => {
    try {
      const doc = generateExpensePdf({ request: req, schoolInfo });
      doc.save(`formulaire-deblocage-${req.authorizationNumber || req.requestNumber}.pdf`);
      toast({ title: 'Téléchargement réussi', description: 'Le document PDF officiel a été généré.' });
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Erreur PDF', description: 'Impossible de générer le document PDF', variant: 'destructive' });
    }
  };

  const handleExportCsv = () => {
    if (filteredRequests.length === 0) return;
    const headers = ['N° Demande', 'N° Autorisation', 'Demandeur', 'Rôle', 'Rubrique', 'Montant Sollicité', 'Montant Accordé', 'Statut', 'Date Souhaitée', 'Date Création'];
    const rows = filteredRequests.map(r => [
      r.requestNumber,
      r.authorizationNumber || '-',
      `"${r.applicantName}"`,
      r.applicantRole,
      `"${r.subjectCategory}"`,
      r.amountRequested,
      r.amountApproved || 0,
      r.status,
      r.desiredDate,
      r.requestDate
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rapport-depenses-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const matchSearch =
        r.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.authorizationNumber && r.authorizationNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        r.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.subjectCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.justificationText && r.justificationText.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchCategory = categoryFilter === 'all' || r.subjectCategory.includes(categoryFilter);

      return matchSearch && matchStatus && matchCategory;
    });
  }, [requests, searchTerm, statusFilter, categoryFilter]);

  const pendingRequests = useMemo(() => {
    return requests.filter(r => r.status === 'EN_ATTENTE');
  }, [requests]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 rounded-xl border shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-lg">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                Gestion des Dépenses & Déblocages de Fonds
              </h1>
              <p className="text-sm text-muted-foreground">
                Soumettez, suivez et validez les formulaires officiels de déblocage de fonds.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => {
              setDesiredDate(new Date().toISOString().split('T')[0]);
              setOpenCreateModal(true);
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nouvelle Demande
          </Button>

          {isAdmin && (
            <Button
              variant="outline"
              onClick={handleExportCsv}
              className="flex items-center gap-2 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
            >
              <FileDown className="h-4 w-4" />
              Exporter Rapport CSV
            </Button>
          )}

          <Button variant="ghost" size="icon" onClick={fetchRequests} title="Actualiser">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Demandes Totales</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{stats?.totalCount ?? requests.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Dossiers enregistrés</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase">En Attente</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {stats?.pendingCount ?? pendingRequests.length}
            </div>
            <div className="text-xs font-medium text-amber-700 dark:text-amber-300 mt-1">
              {(stats?.totalPending ?? 0).toLocaleString()} XAF sollicités
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Validées & Débloquées</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {stats?.approvedCount ?? requests.filter(r => r.status === 'VALIDE').length}
            </div>
            <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mt-1">
              {(stats?.totalApproved ?? 0).toLocaleString()} XAF débloqués
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Refusées</CardTitle>
            <XCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {stats?.rejectedCount ?? requests.filter(r => r.status === 'REFUSE').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Dossiers rejetés</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList className="grid grid-cols-2 sm:flex sm:w-auto">
            <TabsTrigger value="toutes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Toutes les Demandes ({filteredRequests.length})
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="validation" className="flex items-center gap-2 relative">
                <ShieldCheck className="h-4 w-4" />
                À Valider
                {pendingRequests.length > 0 && (
                  <Badge className="ml-1 px-1.5 py-0.2 text-[10px] bg-amber-500 text-white rounded-full">
                    {pendingRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
            )}
            <TabsTrigger value="rapports" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Rapports Financiers
            </TabsTrigger>
          </TabsList>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher N°, demandeur, rubrique..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] text-xs">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                <SelectItem value="VALIDE">Validées</SelectItem>
                <SelectItem value="REFUSE">Refusées</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tab 1: Toutes les Demandes */}
        <TabsContent value="toutes">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Historique des Demandes de Dépense</CardTitle>
              <CardDescription>Liste exhaustive des formulaires de déblocage créés.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-lg">
                  <Wallet className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <h3 className="text-base font-semibold">Aucune demande trouvée</h3>
                  <p className="text-sm text-muted-foreground mt-1">Créez votre première demande de déblocage de fonds.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° Demande / Auth</TableHead>
                        <TableHead>Demandeur</TableHead>
                        <TableHead>Rubrique / Objet</TableHead>
                        <TableHead className="text-right">Montant Sollicité</TableHead>
                        <TableHead className="text-right">Montant Accordé</TableHead>
                        <TableHead className="text-center">Statut</TableHead>
                        <TableHead className="text-center">Date Souhaitée</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map(req => (
                        <TableRow key={req.id}>
                          <TableCell className="font-mono text-xs">
                            <div className="font-bold text-foreground">{req.requestNumber}</div>
                            {req.authorizationNumber && (
                              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300">
                                {req.authorizationNumber}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-sm">{req.applicantName}</div>
                            <div className="text-xs text-muted-foreground">{req.applicantRole}</div>
                          </TableCell>
                          <TableCell className="max-w-[220px] truncate text-xs">
                            <span className="font-medium">{req.subjectCategory}</span>
                            {req.subjectOther && <span className="block text-muted-foreground italic">{req.subjectOther}</span>}
                          </TableCell>
                          <TableCell className="text-right font-bold text-sm">
                            {req.amountRequested.toLocaleString()} XAF
                          </TableCell>
                          <TableCell className="text-right font-bold text-sm text-emerald-600 dark:text-emerald-400">
                            {req.amountApproved ? `${req.amountApproved.toLocaleString()} XAF` : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            {req.status === 'VALIDE' && (
                              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white">Validée</Badge>
                            )}
                            {req.status === 'EN_ATTENTE' && (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300">En attente</Badge>
                            )}
                            {req.status === 'REFUSE' && (
                              <Badge variant="destructive">Refusée</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-xs">
                            {req.desiredDate}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedRequest(req);
                                  setOpenDetailModal(true);
                                }}
                                title="Voir détails"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                onClick={() => handleDownloadPdf(req)}
                                title="Télécharger le Formulaire / Reçu PDF"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Reçu PDF
                              </Button>

                              {isAdmin && req.status === 'EN_ATTENTE' && (
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                                  onClick={() => {
                                    setSelectedRequest(req);
                                    setApproveAmount(req.amountRequested.toString());
                                    setOpenApproveModal(true);
                                  }}
                                >
                                  Valider
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Admin Queue */}
        {isAdmin && (
          <TabsContent value="validation">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-500" />
                  File de Validation Administrateur
                </CardTitle>
                <CardDescription>
                  Examinez et validez ou refusez les demandes de déblocage de fonds soumises.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-foreground">Aucune demande en attente de validation.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map(req => (
                      <div key={req.id} className="p-4 border rounded-xl bg-card hover:border-primary/50 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base">{req.requestNumber}</span>
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">En attente</Badge>
                            <span className="text-xs text-muted-foreground">| Soumis le {req.requestDate}</span>
                          </div>
                          <div className="text-sm font-semibold text-foreground">
                            {req.applicantName} <span className="text-xs font-normal text-muted-foreground">({req.applicantRole})</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Rubrique : <strong className="text-foreground">{req.subjectCategory}</strong>
                          </div>
                          {req.justificationText && (
                            <p className="text-xs italic bg-muted/50 p-2 rounded border mt-2 max-w-2xl">
                              "{req.justificationText}"
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full md:w-auto">
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Montant sollicité</div>
                            <div className="text-lg font-black text-blue-600 dark:text-blue-400">
                              {req.amountRequested.toLocaleString()} XAF
                            </div>
                            <div className="text-[11px] text-muted-foreground">Pour le {req.desiredDate}</div>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-rose-600 border-rose-300 hover:bg-rose-50 flex-1 sm:flex-initial"
                              onClick={() => {
                                setSelectedRequest(req);
                                setOpenRejectModal(true);
                              }}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Refuser
                            </Button>

                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-initial"
                              onClick={() => {
                                setSelectedRequest(req);
                                setApproveAmount(req.amountRequested.toString());
                                setOpenApproveModal(true);
                              }}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Valider & Débloquer
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownloadPdf(req)}
                              title="Aperçu Formulaire PDF"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Tab 3: Rapports & Statistiques */}
        <TabsContent value="rapports">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Rapports & Analyse Financière des Dépenses</CardTitle>
              <CardDescription>Répartition par rubrique, statut et historisation des fonds engagés.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border rounded-xl space-y-3 bg-muted/20">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    Répartition par Rubriques Budgétaires
                  </h4>
                  <div className="space-y-2">
                    {stats?.categoryStats && Object.keys(stats.categoryStats).length > 0 ? (
                      Object.entries(stats.categoryStats).map(([cat, val]: any) => (
                        <div key={cat} className="flex justify-between items-center text-xs p-2 border-b">
                          <span className="font-medium truncate max-w-[200px]">{cat}</span>
                          <div className="text-right">
                            <span className="font-bold text-blue-600 dark:text-blue-400">{val.requested.toLocaleString()} XAF</span>
                            <span className="text-muted-foreground block text-[10px]">Accordé : {val.approved.toLocaleString()} XAF ({val.count} demande(s))</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">Aucune donnée disponible.</p>
                    )}
                  </div>
                </div>

                <div className="p-4 border rounded-xl space-y-3 bg-muted/20">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    Rapport Officiel du Dossier Financier
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Générez un bilan consolidé des dépense débloquées avec signatures et autorisations pour les archives comptables.
                  </p>
                  <div className="pt-4 flex flex-col gap-2">
                    <Button onClick={handleExportCsv} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2">
                      <FileDown className="h-4 w-4" />
                      Télécharger le Rapport Financier CSV
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal 1: Creation Form */}
      <Dialog open={openCreateModal} onOpenChange={setOpenCreateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Nouveau Formulaire de Demande de Déblocage de Fonds
            </DialogTitle>
            <DialogDescription>
              Remplissez ce formulaire dynamique conformément au modèle institutionnel Phoenix.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded-lg bg-muted/10">
              {/* Box 1: Rubrique */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-blue-700 dark:text-blue-400">1. Objet/rubrique de la Demande</Label>
                <Select value={subjectCategory} onValueChange={setSubjectCategory}>
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RUBRIQUES.map(r => (
                      <SelectItem key={r.id} value={r.label} className="text-xs">{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {subjectCategory === 'Autre (préciser)' && (
                  <Input
                    placeholder="Précisez l'objet..."
                    value={subjectOther}
                    onChange={e => setSubjectOther(e.target.value)}
                    className="text-xs mt-2"
                  />
                )}
              </div>

              {/* Box 2: Documents */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-blue-700 dark:text-blue-400">2. Documents justificatifs joints</Label>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {DOCUMENTS_JOINTS.map(doc => (
                    <div key={doc} className="flex items-center space-x-2">
                      <Checkbox
                        id={`doc-${doc}`}
                        checked={justificationDocs.includes(doc)}
                        onCheckedChange={() => handleToggleDoc(doc)}
                      />
                      <label htmlFor={`doc-${doc}`} className="text-xs leading-none cursor-pointer">
                        {doc}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Box 3: Montant & Date */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-blue-700 dark:text-blue-400">3. Montant Sollicité & Date</Label>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Montant demandé (XAF)</Label>
                  <Input
                    type="number"
                    placeholder="ex: 150000"
                    value={amountRequested}
                    onChange={e => setAmountRequested(e.target.value)}
                    className="text-sm font-bold"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Date souhaitée pour le déblocage</Label>
                  <Input
                    type="date"
                    value={desiredDate}
                    onChange={e => setDesiredDate(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Justification Text */}
            <div className="space-y-2">
              <Label className="text-xs font-bold">4. Justification & Motif de la Demande</Label>
              <Textarea
                placeholder="Explication brève du motif de la demande, contexte en cas de dépassement..."
                value={justificationText}
                onChange={e => setJustificationText(e.target.value)}
                rows={2}
                className="text-xs"
              />
            </div>

            {/* Dynamic Items Table */}
            <div className="space-y-2 border p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-bold uppercase">Tableau des Dépenses & Offres Fournisseurs</Label>
                <Button type="button" size="sm" variant="outline" onClick={handleAddItem} className="text-xs flex items-center gap-1">
                  <Plus className="h-3.5 w-3.5" /> Ligne dépense
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Intitulé de la dépense</TableHead>
                      <TableHead>Fournisseur 1</TableHead>
                      <TableHead>Prix 1 (XAF)</TableHead>
                      <TableHead>Fournisseur 2</TableHead>
                      <TableHead>Prix 2 (XAF)</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Input
                            placeholder="Intitulé"
                            value={item.description}
                            onChange={e => handleItemChange(idx, 'description', e.target.value)}
                            className="text-xs h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Fournisseur A"
                            value={item.supplier1 || ''}
                            onChange={e => handleItemChange(idx, 'supplier1', e.target.value)}
                            className="text-xs h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            placeholder="0"
                            value={item.price1 || ''}
                            onChange={e => handleItemChange(idx, 'price1', Number(e.target.value))}
                            className="text-xs h-8 font-semibold"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Fournisseur B"
                            value={item.supplier2 || ''}
                            onChange={e => handleItemChange(idx, 'supplier2', e.target.value)}
                            className="text-xs h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            placeholder="0"
                            value={item.price2 || ''}
                            onChange={e => handleItemChange(idx, 'price2', Number(e.target.value))}
                            className="text-xs h-8"
                          />
                        </TableCell>
                        <TableCell>
                          {items.length > 1 && (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => handleRemoveItem(idx)}
                              className="h-8 w-8 text-rose-500 hover:bg-rose-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {calculateItemsTotal > 0 && (
                <div className="text-right text-xs font-bold text-blue-600 pt-1">
                  Total calculé des dépenses : {calculateItemsTotal.toLocaleString()} XAF
                </div>
              )}
            </div>

            {/* Engagement */}
            <div className="bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-900 space-y-2">
              <Label className="text-xs font-bold text-blue-800 dark:text-blue-300">Engagement du Demandeur</Label>
              <p className="text-[11px] text-muted-foreground italic">
                Je soussigné(e) <strong>{currentUser?.fullName || currentUser?.username || 'Demandeur'}</strong> atteste que les informations fournies sont exactes et que les fonds seront utilisés conformément à l'objet précisé.
              </p>
              <div className="flex gap-4 items-center pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Fait à :</span>
                  <Input
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="text-xs h-7 w-32"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenCreateModal(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground font-semibold">
                {submitting ? 'Envoi en cours...' : 'Soumettre la Demande à l\'Administration'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Admin Approval */}
      <Dialog open={openApproveModal} onOpenChange={setOpenApproveModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-emerald-600 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Validation & Déblocage de Fonds
            </DialogTitle>
            <DialogDescription>
              Approuvez la demande {selectedRequest?.requestNumber} et attribuez le numéro d'autorisation officiel.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 bg-muted rounded-lg text-xs space-y-1">
              <div>Demandeur : <strong>{selectedRequest?.applicantName}</strong></div>
              <div>Rubrique : <strong>{selectedRequest?.subjectCategory}</strong></div>
              <div>Montant Sollicité : <strong className="text-blue-600">{selectedRequest?.amountRequested.toLocaleString()} XAF</strong></div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Montant Accordé (XAF)</Label>
              <Input
                type="number"
                value={approveAmount}
                onChange={e => setApproveAmount(e.target.value)}
                className="font-bold text-emerald-600"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Avis du Directeur</Label>
              <Input
                value={directorComments}
                onChange={e => setDirectorComments(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Avis de la Fondation / Direction</Label>
              <Input
                value={foundationComments}
                onChange={e => setFoundationComments(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenApproveModal(false)}>Annuler</Button>
            <Button onClick={handleApprove} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              {submitting ? 'Validation...' : 'Confirmer la Validation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 3: Admin Rejection */}
      <Dialog open={openRejectModal} onOpenChange={setOpenRejectModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Refus de la Demande
            </DialogTitle>
            <DialogDescription>
              Veuillez indiquer le motif du refus pour {selectedRequest?.requestNumber}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label className="text-xs font-bold">Motif du Refus</Label>
            <Textarea
              placeholder="Expliquez la raison du rejet (ex: budget insuffisant, justification incomplète...)"
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              rows={3}
              className="text-xs"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenRejectModal(false)}>Annuler</Button>
            <Button onClick={handleReject} disabled={submitting} variant="destructive">
              {submitting ? 'Traitement...' : 'Confirmer le Refus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 4: View Details */}
      <Dialog open={openDetailModal} onOpenChange={setOpenDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center justify-between">
              <span>Détails Demande : {selectedRequest?.requestNumber}</span>
              {selectedRequest?.authorizationNumber && (
                <Badge className="bg-emerald-600">{selectedRequest.authorizationNumber}</Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 text-xs py-2">
              <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-lg">
                <div>Demandeur : <strong>{selectedRequest.applicantName}</strong> ({selectedRequest.applicantRole})</div>
                <div>Statut : <strong className="uppercase">{selectedRequest.status}</strong></div>
                <div>Rubrique : <strong>{selectedRequest.subjectCategory}</strong></div>
                <div>Montant Sollicité : <strong className="text-blue-600">{selectedRequest.amountRequested.toLocaleString()} XAF</strong></div>
                <div>Date Souhaitée : <strong>{selectedRequest.desiredDate}</strong></div>
                <div>Date Soumission : <strong>{selectedRequest.requestDate}</strong></div>
              </div>

              {selectedRequest.justificationText && (
                <div>
                  <div className="font-bold mb-1">Justification :</div>
                  <p className="p-2 border rounded bg-muted/30 italic">{selectedRequest.justificationText}</p>
                </div>
              )}

              {selectedRequest.items && selectedRequest.items.length > 0 && (
                <div>
                  <div className="font-bold mb-1">Tableau des Dépenses :</div>
                  <Table className="border">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dépense</TableHead>
                        <TableHead>Fournisseur 1</TableHead>
                        <TableHead>Prix 1</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedRequest.items.map((it, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{it.description || '-'}</TableCell>
                          <TableCell>{it.supplier1 || '-'}</TableCell>
                          <TableCell>{it.price1 ? `${it.price1.toLocaleString()} XAF` : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => handleDownloadPdf(selectedRequest)}>
                  <Download className="h-4 w-4 mr-1" /> Télécharger Reçu PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

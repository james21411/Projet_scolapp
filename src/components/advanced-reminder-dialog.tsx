 "use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  Clock3,
  DollarSign,
  Download,
  FileWarning,
  Info,
  Loader2,
  Printer,
  TrendingDown,
  Users,
  AlertOctagon,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Calendar,
  FileText,
  Shield,
  Target,
  BarChart3,
  Filter,
  Search,
  RefreshCw,
  Settings,
  Zap,
  AlertCircle as AlertCircleIcon,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface AdvancedReminderDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  schoolYear: string;
  allStudents: any[];
  onGenerateCoupons: (filters: any) => void;
}

interface Alert {
  type: 'critical' | 'warning' | 'info';
  message: string;
  action: string;
  icon: any;
  priority: number;
  affectedStudents: number;
  description?: string;
  recommendations?: string[];
}

interface StudentFinancialData {
  studentId: string;
  name: string;
  class: string;
  outstanding: number;
  totalDue: number;
  installments: any[];
  lastPaymentDate?: string;
  daysLate: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  paymentRate: number;
  extendedDueDates?: any[];
  selected?: boolean;
  configRiskName?: string;
  configRiskColor?: string;
  parentInfo?: {
    nom: string;
    prenom: string;
    telephone: string;
    email: string;
    profession: string;
  };
  parentInfo2?: {
    nom: string;
    prenom: string;
    telephone: string;
    email: string;
    profession: string;
  };
}

interface CouponTemplate {
  id: string;
  name: string;
  description: string;
  type: 'normal' | 'warning' | 'urgent' | 'legal';
  content: string;
  conditions: string[];
}

export function AdvancedReminderDialog({
  isOpen,
  onOpenChange,
  schoolYear,
  allStudents,
  onGenerateCoupons
}: AdvancedReminderDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // États pour les filtres
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [reminderType, setReminderType] = useState<'all' | 'class' | 'student' | 'risk'>('all');
  // Niveaux de risque configurables par pourcentage payé
  const [riskSettings, setRiskSettings] = useState<{ levels: { name: string; min: number; max: number; color: string }[] }>({ levels: [] });
  const [riskLevel, setRiskLevel] = useState<string>('all');
  const [daysLateFilter, setDaysLateFilter] = useState<number>(0);
  const [amountFilter, setAmountFilter] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // États pour les alertes et processus
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'warning' | 'info' | 'critical'>('info');
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [showDecisionDialog, setShowDecisionDialog] = useState(false);
  const [decisionData, setDecisionData] = useState<any>(null);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [processStep, setProcessStep] = useState<number>(0);
  
  // États pour les données
  const [insolventStudents, setInsolventStudents] = useState<StudentFinancialData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [schoolStructure, setSchoolStructure] = useState<any>({});
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [expandedAlerts, setExpandedAlerts] = useState<string[]>([]);
  const [selectedCouponTemplate, setSelectedCouponTemplate] = useState<string>('normal');
  const [generatedCoupons, setGeneratedCoupons] = useState<any[]>([]);
  const [showCouponsDialog, setShowCouponsDialog] = useState(false); // Nouveau dialogue pour les coupons
  
  // États pour les templates de coupons
  const [couponTemplates] = useState<CouponTemplate[]>([
    {
      id: 'normal',
      name: 'Rappel Standard',
      description: 'Rappel simple pour paiement en retard',
      type: 'normal',
      content: `{schoolName}

COUPON DE RAPPEL

Élève: {studentName}
Matricule: {studentId} | Classe: {className}

Nous vous rappelons que les tranches suivantes sont dues :

{installments}

Solde Total Impayé: {outstanding} XAF

La Direction`,
      conditions: ['Montant impayé > 0']
    },
    {
      id: 'warning',
      name: 'Avertissement',
      description: 'Avertissement pour retard important',
      type: 'warning',
      content: `{schoolName}

AVERTISSEMENT - COUPON DE RAPPEL

Élève: {studentName}
Matricule: {studentId} | Classe: {className}

Nous vous rappelons que les tranches suivantes sont dues :

{installments}

Solde Total Impayé: {outstanding} XAF

ATTENTION: Régularisation immédiate requise.

La Direction`,
      conditions: ['Retard > 30 jours', 'Montant impayé > 50000']
    },
    {
      id: 'urgent',
      name: 'Urgent',
      description: 'Rappel urgent pour situation critique',
      type: 'urgent',
      content: `{schoolName}

URGENT - COUPON DE RAPPEL

Élève: {studentName}
Matricule: {studentId} | Classe: {className}

Nous vous rappelons que les tranches suivantes sont dues :

{installments}

Solde Total Impayé: {outstanding} XAF

SITUATION CRITIQUE: Régularisation immédiate.

La Direction`,
      conditions: ['Retard > 60 jours', 'Montant impayé > 100000']
    },
    {
      id: 'legal',
      name: 'Avis Légal',
      description: 'Avis légal pour situation très critique',
      type: 'legal',
      content: `{schoolName}

AVIS LÉGAL - COUPON DE RAPPEL

Élève: {studentName}
Matricule: {studentId} | Classe: {className}

Nous vous rappelons que les tranches suivantes sont dues :

{installments}

Solde Total Impayé: {outstanding} XAF

AVIS LÉGAL: Procédure de recouvrement engagée.

La Direction`,
      conditions: ['Retard > 90 jours', 'Montant impayé > 150000']
    }
  ]);
  
  // Charger la structure de l'école et les informations de l'établissement
  useEffect(() => {
    console.log('🔍 Chargement de la structure de l\'école');
    fetch('/api/school/structure-flat')
      .then(response => response.json())
      .then(data => {
        console.log('🔍 Structure reçue:', data);
        console.log('🔍 Niveaux disponibles:', Object.keys(data || {}));
        if (data) {
          Object.entries(data).forEach(([level, classes]: [string, any]) => {
            console.log(`🔍 Classes pour ${level}:`, classes);
          });
        }
        setSchoolStructure(data);
      })
      .catch(error => {
        console.error('❌ Erreur lors du chargement de la structure:', error);
      });

    // Charger les informations de l'établissement
    fetch('/api/school/info')
      .then(response => response.json())
      .then(data => {
        console.log('🔍 Informations de l\'établissement reçues:', data);
        setSchoolInfo(data);
      })
      .catch(error => {
        console.error('❌ Erreur lors du chargement des informations de l\'établissement:', error);
      });
    // Charger les niveaux de risque configurables
    fetch('/api/finance/risk-settings')
      .then(res => res.json())
      .then(data => setRiskSettings(data))
      .catch(err => console.error('❌ Erreur risk-settings:', err));
  }, []);
  
  const allLevels = useMemo(() => {
    return Object.keys(schoolStructure || {});
  }, [schoolStructure]);
  
  const availableClasses = useMemo(() => {
    if (!selectedLevel) return [];
    return schoolStructure[selectedLevel] || [];
  }, [selectedLevel, schoolStructure]);
  
  // Charger les élèves insolvables avec analyse de risque avancée
  const loadInsolventStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Chargement des élèves insolvables pour l\'année:', schoolYear);
      
      const response = await fetch(`/api/finance/students-with-balance?schoolYear=${schoolYear}`);
      const data = await response.json();
      
      console.log('🔍 Données reçues:', data);
      console.log('🔍 Nombre d\'élèves:', data.length);
      
      // Debug: Afficher quelques exemples d'élèves
      if (data.length > 0) {
        console.log('🔍 Exemple d\'élève:', data[0]);
        console.log('🔍 Classes disponibles dans les données:', [...new Set(data.map((s: any) => s.class))]);
      }
      
      // Analyser le niveau de risque pour chaque élève avec logique avancée
      const enrichedData = data.map((student: any) => {
        const daysLate = student.installments?.reduce((max: number, inst: any) => {
          if (inst.status === 'en_retard') {
            const days = Math.floor((new Date().getTime() - new Date(inst.dueDate).getTime()) / (1000 * 60 * 60 * 24));
            return Math.max(max, days);
          }
          return max;
        }, 0) || 0;
        
        const outstandingAmount = student.outstanding || 0;
        const totalDue = student.totalDue || 0;
        const paymentRate = totalDue > 0 ? ((totalDue - outstandingAmount) / totalDue) * 100 : 0;
        // Déterminer le niveau de risque configuré basé sur paymentRate
        let configRiskName: string | undefined;
        let configRiskColor: string | undefined;
        const cfg = (riskSettings?.levels || []).find(l => paymentRate >= l.min && paymentRate < l.max);
        if (cfg) {
          configRiskName = cfg.name;
          configRiskColor = cfg.color;
        }
        
        // Vérifier les échéances prolongées
        const extendedDueDates = student.installments?.filter((i: any) => 
          i.extendedDueDate && i.extendedDueDate !== i.dueDate
        ) || [];
        
        // Déterminer le niveau de risque avec logique avancée
        let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
        let riskScore = 0;
        
        // Facteurs de risque
        if (daysLate > 90) riskScore += 100;
        else if (daysLate > 60) riskScore += 80;
        else if (daysLate > 30) riskScore += 60;
        else if (daysLate > 15) riskScore += 40;
        else if (daysLate > 7) riskScore += 20;
        
        if (outstandingAmount > 300000) riskScore += 100;
        else if (outstandingAmount > 200000) riskScore += 80;
        else if (outstandingAmount > 100000) riskScore += 60;
        else if (outstandingAmount > 50000) riskScore += 40;
        else if (outstandingAmount > 25000) riskScore += 20;
        
        if (paymentRate < 10) riskScore += 50;
        else if (paymentRate < 25) riskScore += 30;
        else if (paymentRate < 50) riskScore += 15;
        
        if (extendedDueDates.length > 2) riskScore += 30;
        else if (extendedDueDates.length > 0) riskScore += 15;
        
        // Classification du risque
        if (riskScore >= 150) riskLevel = 'critical';
        else if (riskScore >= 100) riskLevel = 'high';
        else if (riskScore >= 50) riskLevel = 'medium';
        else riskLevel = 'low';
        
        return {
          ...student,
          daysLate,
          riskLevel,
          paymentRate,
          extendedDueDates,
          riskScore,
          selected: false,
          configRiskName,
          configRiskColor
        };
      });
      
      setInsolventStudents(enrichedData);
    } catch (error) {
      toast({ variant: 'destructive', title: "Erreur", description: "Impossible de charger les données des insolvables." });
    } finally {
      setIsLoading(false);
    }
  }, [schoolYear, toast]);
  
  useEffect(() => {
    if (isOpen) {
      loadInsolventStudents();
    }
  }, [isOpen, loadInsolventStudents]);
  
  // Filtrer les élèves selon les sélections avancées
  const filteredInsolvents = useMemo(() => {
    let filtered = insolventStudents;
    
    // Filtre par type de rappel
    if (reminderType === 'class' && selectedClass) {
      filtered = filtered.filter(s => s.class === selectedClass);
    } else if (reminderType === 'student' && selectedStudent) {
      filtered = filtered.filter(s => s.studentId === selectedStudent);
    } else if (reminderType === 'risk') {
      filtered = filtered.filter(s => riskLevel === 'all' || s.configRiskName === riskLevel);
    }
    
    // Filtres avancés
    if (daysLateFilter > 0) {
      filtered = filtered.filter(s => s.daysLate >= daysLateFilter);
    }
    
    if (amountFilter > 0) {
      filtered = filtered.filter(s => (s.outstanding || 0) >= amountFilter);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.class.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [insolventStudents, reminderType, selectedClass, selectedStudent, riskLevel, daysLateFilter, amountFilter, searchQuery]);
  
  // Analyser les alertes avancées avec recommandations
  const analyzeAlerts = useCallback((): Alert[] => {
    const alerts: Alert[] = [];
    
    // Alertes critiques (plus de 60 jours de retard)
    const criticalCases = filteredInsolvents.filter(s => s.riskLevel === 'critical');
    if (criticalCases.length > 0) {
      alerts.push({
        type: 'critical',
        message: `${criticalCases.length} élève(s) en situation critique`,
        action: 'IMMEDIATE_LEGAL_ACTION_REQUIRED',
        icon: AlertOctagon,
        priority: 1,
        affectedStudents: criticalCases.length,
        description: 'Ces élèves nécessitent une intervention immédiate avec procédure légale.',
        recommendations: [
          'Engager une procédure légale immédiatement',
          'Contacter les parents par tous les moyens disponibles',
          'Préparer un dossier pour les autorités compétentes',
          'Mettre en place un plan de recouvrement spécial'
        ]
      });
    }
    
    // Alertes pour montants élevés
    const highAmountCases = filteredInsolvents.filter(s => (s.outstanding || 0) > 150000);
    if (highAmountCases.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${highAmountCases.length} élève(s) avec des montants très élevés (>150k XAF)`,
        action: 'PRIORITY_COLLECTION_STRATEGY',
        icon: DollarSign,
        priority: 2,
        affectedStudents: highAmountCases.length,
        description: 'Ces montants élevés nécessitent une stratégie de recouvrement prioritaire.',
        recommendations: [
          'Établir un plan de paiement échelonné',
          'Proposer des facilités de paiement',
          'Organiser des rencontres avec les parents',
          'Mettre en place un suivi hebdomadaire'
        ]
      });
    }
    
    // Alertes pour échéances prolongées
    const extendedCases = filteredInsolvents.filter(s => 
      s.extendedDueDates && s.extendedDueDates.length > 0
    );
    if (extendedCases.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${extendedCases.length} élève(s) avec échéances prolongées`,
        action: 'REVIEW_EXTENSION_POLICY',
        icon: Clock3,
        priority: 3,
        affectedStudents: extendedCases.length,
        description: 'Ces élèves ont bénéficié d\'échéances prolongées, nécessitant une révision de la politique.',
        recommendations: [
          'Réviser la politique d\'extension des échéances',
          'Établir des conditions plus strictes pour les extensions',
          'Mettre en place un suivi renforcé',
          'Préparer des mesures de recouvrement'
        ]
      });
    }
    
    // Alertes pour nouveaux retards
    const newLateCases = filteredInsolvents.filter(s => s.daysLate <= 7 && s.daysLate > 0);
    if (newLateCases.length > 0) {
      alerts.push({
        type: 'info',
        message: `${newLateCases.length} élève(s) récemment en retard`,
        action: 'SEND_GENTLE_REMINDERS',
        icon: Bell,
        priority: 4,
        affectedStudents: newLateCases.length,
        description: 'Ces élèves viennent de passer en retard, nécessitant des rappels doux.',
        recommendations: [
          'Envoyer des rappels amicaux',
          'Contacter les parents par téléphone',
          'Proposer des facilités de paiement',
          'Programmer un suivi dans 7 jours'
        ]
      });
    }
    
    // Alertes pour taux de paiement très bas
    const lowPaymentCases = filteredInsolvents.filter(s => s.paymentRate < 20);
    if (lowPaymentCases.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${lowPaymentCases.length} élève(s) avec très faible taux de paiement (<20%)`,
        action: 'INTENSIVE_FOLLOW_UP',
        icon: TrendingDown,
        priority: 5,
        affectedStudents: lowPaymentCases.length,
        description: 'Ces élèves ont un très faible taux de paiement, nécessitant un suivi intensif.',
        recommendations: [
          'Organiser des rencontres individuelles',
          'Analyser les causes du non-paiement',
          'Proposer des solutions adaptées',
          'Mettre en place un suivi quotidien'
        ]
      });
    }
    
    return alerts.sort((a, b) => a.priority - b.priority);
  }, [filteredInsolvents]);
  
  const alerts = analyzeAlerts();
  
  // Calculer les statistiques avancées
  const statistics = useMemo(() => {
    const totalOutstanding = filteredInsolvents.reduce((sum, s) => sum + (s.outstanding || 0), 0);
    const averageDaysLate = filteredInsolvents.reduce((sum, s) => sum + s.daysLate, 0) / Math.max(filteredInsolvents.length, 1);
    const criticalCount = filteredInsolvents.filter(s => s.riskLevel === 'critical').length;
    const highRiskCount = filteredInsolvents.filter(s => s.riskLevel === 'high').length;
    const mediumRiskCount = filteredInsolvents.filter(s => s.riskLevel === 'medium').length;
    const lowRiskCount = filteredInsolvents.filter(s => s.riskLevel === 'low').length;
    const averagePaymentRate = filteredInsolvents.reduce((sum, s) => sum + s.paymentRate, 0) / Math.max(filteredInsolvents.length, 1);
    
    return {
      totalOutstanding,
      averageDaysLate: Math.round(averageDaysLate),
      criticalCount,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
      totalStudents: filteredInsolvents.length,
      averagePaymentRate: Math.round(averagePaymentRate)
    };
  }, [filteredInsolvents]);
  
  // Gestion de la sélection multiple
  const handleSelectAll = () => {
    const allIds = filteredInsolvents.map(s => s.studentId);
    setSelectedStudents(allIds);
    setInsolventStudents(prev => prev.map(s => ({ ...s, selected: allIds.includes(s.studentId) })));
  };
  
  const handleDeselectAll = () => {
    setSelectedStudents([]);
    setInsolventStudents(prev => prev.map(s => ({ ...s, selected: false })));
  };
  
  const handleSelectStudent = (studentId: string, selected: boolean) => {
    if (selected) {
      setSelectedStudents(prev => [...prev, studentId]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
    }
    setInsolventStudents(prev => prev.map(s => 
      s.studentId === studentId ? { ...s, selected } : s
    ));
  };
  
  // Générer les coupons avec processus décisionnel avancé
  const handleGenerateCoupons = () => {
    const studentsToProcess = selectedStudents.length > 0 
      ? filteredInsolvents.filter(s => selectedStudents.includes(s.studentId))
      : filteredInsolvents;
    
    if (studentsToProcess.length === 0) {
      setAlertMessage("Aucun élève sélectionné pour la génération de coupons.");
      setAlertType('warning');
      setShowAlertDialog(true);
      return;
    }
    
    // Vérifier s'il y a des cas critiques qui nécessitent une attention spéciale
    const criticalCases = studentsToProcess.filter(s => s.riskLevel === 'critical');
    const highRiskCases = studentsToProcess.filter(s => s.riskLevel === 'high');
    
    if (criticalCases.length > 0) {
      setDecisionData({
        type: 'critical_cases',
        message: `${criticalCases.length} élève(s) en situation critique détecté(s). Voulez-vous appliquer des mesures spéciales ?`,
        actions: [
          { label: 'Générer coupons normaux', value: 'normal' },
          { label: 'Générer coupons avec avertissement spécial', value: 'warning' },
          { label: 'Générer coupons d\'urgence', value: 'urgent' },
          { label: 'Générer coupons légaux', value: 'legal' }
        ],
        students: studentsToProcess
      });
      setShowDecisionDialog(true);
      return;
    }
    
    if (highRiskCases.length > 0) {
      setDecisionData({
        type: 'high_risk_cases',
        message: `${highRiskCases.length} élève(s) à risque élevé détecté(s). Recommandation de coupons avec avertissement.`,
        actions: [
          { label: 'Générer coupons normaux', value: 'normal' },
          { label: 'Générer coupons avec avertissement', value: 'warning' },
          { label: 'Générer coupons d\'urgence', value: 'urgent' }
        ],
        students: studentsToProcess
      });
      setShowDecisionDialog(true);
      return;
    }
    
    generateCoupons('normal', studentsToProcess);
  };
  
  const generateCoupons = (type: string, students: StudentFinancialData[] = filteredInsolvents) => {
    const coupons = students.map(student => {
      const template = couponTemplates.find(t => t.id === selectedCouponTemplate) || couponTemplates[0];
      
      // Trouver la tranche impayée la plus critique (la plus ancienne ou la plus urgente)
      let criticalInstallment = null;
      if (student.installments && student.installments.length > 0) {
        const unpaidInstallments = student.installments.filter(inst => inst.balance > 0);
        if (unpaidInstallments.length > 0) {
          // Prioriser par date d'échéance (la plus ancienne en premier)
          criticalInstallment = unpaidInstallments.sort((a, b) => {
            const dateA = new Date(a.extendedDueDate || a.dueDate);
            const dateB = new Date(b.extendedDueDate || b.dueDate);
            return dateA.getTime() - dateB.getTime();
          })[0];
        }
      }
      
      // Générer le contenu du coupon avec une seule tranche
      let content = template.content;
      
      // Remplacer le nom de l'établissement
      const schoolName = schoolInfo?.name || 'Établissement Scolaire';
      content = content.replace('{schoolName}', schoolName);
      
      content = content.replace('{studentName}', student.name);
      content = content.replace('{className}', student.class);
      
      // Ajouter les informations des parents
      let parentContact = 'Contact non disponible';
      if (student.parentInfo) {
        parentContact = `${student.parentInfo.nom} ${student.parentInfo.prenom} - ${student.parentInfo.telephone}`;
      } else if (student.parentInfo2) {
        parentContact = `${student.parentInfo2.nom} ${student.parentInfo2.prenom} - ${student.parentInfo2.telephone}`;
      }
      
      content = content.replace('{parentContact}', parentContact);
      
      // Ajouter les informations de la tranche critique uniquement
      if (criticalInstallment) {
        const dueDate = new Date(criticalInstallment.extendedDueDate || criticalInstallment.dueDate);
        const isOverdue = dueDate < new Date();
        
        // Extraire le numéro de tranche de manière plus robuste
        let trancheNumber = '1'; // Par défaut
        if (criticalInstallment.name) {
          // Essayer d'extraire le numéro depuis le nom de la tranche
          const nameMatch = criticalInstallment.name.match(/tranche\s*(\d+)/i);
          if (nameMatch) {
            trancheNumber = nameMatch[1];
          }
        } else if (criticalInstallment.id && typeof criticalInstallment.id === 'string') {
          // Si pas de nom, essayer depuis l'ID
          const idMatch = criticalInstallment.id.match(/tranche(\d+)/i);
          if (idMatch) {
            trancheNumber = idMatch[1];
          } else {
            // Fallback pour les anciens IDs avec timestamp
            const timestampMatch = criticalInstallment.id.match(/(\d+)/);
            if (timestampMatch) {
              const num = parseInt(timestampMatch[1]);
              if (num < 1000) { // Si c'est un petit nombre, c'est probablement un numéro de tranche
                trancheNumber = num.toString();
              }
            }
          }
        }
        
        const installmentInfo = `Tranche ${trancheNumber}: Il reste à payer ${criticalInstallment.balance.toLocaleString()} XAF (Échéance: ${dueDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })})`;
        
        content = content.replace('{installments}', installmentInfo);
        content = content.replace('{outstanding}', criticalInstallment.balance.toLocaleString());
        content = content.replace('{studentId}', student.studentId);
        content = content.replace('{totalDue}', student.totalDue.toLocaleString());
        content = content.replace('{paymentRate}', student.paymentRate.toFixed(1));
      } else {
        // Si aucune tranche impayée, utiliser les informations générales
        content = content.replace('{installments}', 'Aucune tranche impayée');
        content = content.replace('{outstanding}', student.outstanding.toLocaleString());
        content = content.replace('{studentId}', student.studentId);
        content = content.replace('{totalDue}', student.totalDue.toLocaleString());
        content = content.replace('{paymentRate}', student.paymentRate.toFixed(1));
      }
      
      return {
        studentId: student.studentId,
        studentName: student.name,
        className: student.class,
        content,
        type: template.type,
        parentContact,
        criticalInstallment,
        generatedAt: new Date().toISOString()
      };
    });
    
    const filters = {
      level: selectedLevel,
      class: selectedClass,
      student: selectedStudent,
      type: reminderType,
      riskLevel,
      daysLateFilter,
      amountFilter,
      couponType: type,
      count: students.length,
      selectedStudents: students.map(s => s.studentId),
      template: selectedCouponTemplate,
      coupons
    };
    
    setGeneratedCoupons(coupons);
    setShowCouponsDialog(true); // Utiliser un dialogue séparé au lieu de showCoupons
    onGenerateCoupons(filters);
    toast({ 
      title: "Coupons générés", 
      description: `${students.length} coupon(s) créé(s) avec le type: ${type}` 
    });
  };
  
  // Gestion des alertes
  const handleAlertAction = (alert: Alert) => {
    setAlertMessage(alert.description || alert.message);
    setAlertType(alert.type);
    setPendingAction(alert.action);
    setShowAlertDialog(true);
  };
  
  const handleAlertExpand = (alertId: string) => {
    setExpandedAlerts(prev => 
      prev.includes(alertId) 
        ? prev.filter(id => id !== alertId)
        : [...prev, alertId]
    );
  };
  
  // Impression avancée
  const handlePrint = () => {
    const printContent = printRef.current;
    if (printContent) {
      const printWindow = window.open('', '', 'height=800,width=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Rapport Avancé - Coupons de Rappel</title>');
        printWindow.document.write(`
          <style>
            body { font-family: sans-serif; margin: 10px; }
            .report-header { text-align: center; margin-bottom: 20px; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
            .stat-card { border: 1px solid #ddd; padding: 10px; text-align: center; }
            .alert-section { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 10px 0; border-radius: 5px; }
            .coupon-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .coupon { border: 1px dashed #777; padding: 10px; font-size: 10px; line-height: 1.4; break-inside: avoid; }
            .coupon-header { text-align: center; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 5px; }
            .coupon-content { font-size: 9px; }
            .installment-details { background: #f5f5f5; padding: 5px; margin: 5px 0; border-radius: 3px; }
            .risk-badge { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 8px; font-weight: bold; }
            .risk-critical { background: #fee; color: #c00; }
            .risk-high { background: #fff3cd; color: #856404; }
            .risk-medium { background: #d1ecf1; color: #0c5460; }
            .risk-low { background: #d4edda; color: #155724; }
            .student-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            .student-table th, .student-table td { border: 1px solid #ddd; padding: 5px; font-size: 9px; }
            .student-table th { background: #f5f5f5; font-weight: bold; }
            @media print { .no-print { display: none; } }
          </style>
        `);
        printWindow.document.write('</head><body>');
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
      }
    }
  };
  
  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return <AlertOctagon className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <AlertCircle className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gestion Avancée des Coupons et Insolvables
          </DialogTitle>
          <DialogDescription>
            Module intelligent pour la gestion des rappels de paiement avec analyse de risque et alertes avancées
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6" ref={printRef}>
          {/* Filtres avancés */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtres et Sélections Avancées
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Type de rappel */}
              <div className="space-y-3">
                <Label className="font-semibold">Type de Rappel</Label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="all"
                      name="reminderType"
                      value="all"
                      checked={reminderType === 'all'}
                      onChange={(e) => setReminderType(e.target.value as any)}
                    />
                    <Label htmlFor="all">Tout l'établissement</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="class"
                      name="reminderType"
                      value="class"
                      checked={reminderType === 'class'}
                      onChange={(e) => setReminderType(e.target.value as any)}
                    />
                    <Label htmlFor="class">Classe spécifique</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="student"
                      name="reminderType"
                      value="student"
                      checked={reminderType === 'student'}
                      onChange={(e) => setReminderType(e.target.value as any)}
                    />
                    <Label htmlFor="student">Élève spécifique</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="risk"
                      name="reminderType"
                      value="risk"
                      checked={reminderType === 'risk'}
                      onChange={(e) => setReminderType(e.target.value as any)}
                    />
                    <Label htmlFor="risk">Par niveau de risque</Label>
                  </div>
                </div>
              </div>
              
              {/* Filtres spécifiques */}
              {reminderType === 'class' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Niveau</Label>
                    <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                      <SelectTrigger><SelectValue placeholder="Choisir un niveau..."/></SelectTrigger>
                      <SelectContent>
                        {allLevels.map((l: string) => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-muted-foreground mt-1">
                      Niveaux disponibles: {allLevels.length}
                    </div>
                  </div>
                  <div>
                    <Label>Classe</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass} disabled={!selectedLevel}>
                      <SelectTrigger><SelectValue placeholder="Choisir une classe..."/></SelectTrigger>
                      <SelectContent>
                        {availableClasses.map((c: string) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-muted-foreground mt-1">
                      Classes disponibles: {availableClasses.length}
                    </div>
                  </div>
                </div>
              )}
              
              {reminderType === 'student' && (
                <div>
                  <Label>Élève</Label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger><SelectValue placeholder="Choisir un élève..."/></SelectTrigger>
                    <SelectContent>
                      {insolventStudents.map((s, index) => (
                        <SelectItem key={s.studentId || `student-${index}`} value={s.studentId}>
                          {s.name} - {s.class} ({s.riskLevel})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {reminderType === 'risk' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Niveau de risque</Label>
                    <Select value={riskLevel} onValueChange={(value: string) => setRiskLevel(value)}>
                      <SelectTrigger><SelectValue placeholder="Tous les niveaux"/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les niveaux</SelectItem>
                        {(riskSettings.levels || []).map((l, idx) => (
                          <SelectItem key={`${l.name}-${idx}`} value={l.name}>{l.name} ({l.min}-{l.max}%)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Jours de retard minimum</Label>
                    <Select value={daysLateFilter.toString()} onValueChange={(v) => setDaysLateFilter(parseInt(v))}>
                      <SelectTrigger><SelectValue placeholder="Tous"/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Tous</SelectItem>
                        <SelectItem value="7">7+ jours</SelectItem>
                        <SelectItem value="15">15+ jours</SelectItem>
                        <SelectItem value="30">30+ jours</SelectItem>
                        <SelectItem value="60">60+ jours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              
              {/* Filtres supplémentaires */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Montant minimum impayé (XAF)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={amountFilter}
                    onChange={(e) => setAmountFilter(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Recherche</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nom, matricule, classe..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label>Template de coupon</Label>
                  <Select value={selectedCouponTemplate} onValueChange={setSelectedCouponTemplate}>
                    <SelectTrigger><SelectValue placeholder="Choisir un template"/></SelectTrigger>
                    <SelectContent>
                      {couponTemplates.map((template, index) => (
                        <SelectItem key={template.id || `template-${index}`} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Alertes et recommandations avancées */}
          {alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Alertes et Recommandations Avancées
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {alerts.map((alert, index) => (
                  <Collapsible key={`alert-${index}-${alert.type}`}>
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <alert.icon className={`h-5 w-5 ${
                            alert.type === 'critical' ? 'text-red-500' :
                            alert.type === 'warning' ? 'text-orange-500' : 'text-blue-500'
                          }`} />
                          <div>
                            <div className="font-semibold">{alert.message}</div>
                            <div className="text-sm text-muted-foreground">
                              {alert.affectedStudents} élève(s) concerné(s)
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={alert.type === 'critical' ? 'destructive' : 'secondary'}>
                            {alert.action}
                          </Badge>
                          <ChevronDown className="h-4 w-4" />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-3 bg-muted/30 rounded-lg mt-2">
                      <div className="space-y-2">
                        <p className="text-sm">{alert.description}</p>
                        {alert.recommendations && (
                          <div>
                            <div className="font-semibold text-sm mb-2">Recommandations :</div>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                              {alert.recommendations.map((rec, idx) => (
                                <li key={`rec-${index}-${idx}`}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAlertAction(alert)}
                        >
                          Appliquer les recommandations
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </CardContent>
            </Card>
          )}
          
          {/* Statistiques avancées */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Statistiques et Analyses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{statistics.criticalCount}</div>
                  <div className="text-sm text-muted-foreground">Critiques</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{statistics.highRiskCount}</div>
                  <div className="text-sm text-muted-foreground">Risque Élevé</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{statistics.mediumRiskCount}</div>
                  <div className="text-sm text-muted-foreground">Risque Moyen</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{statistics.lowRiskCount}</div>
                  <div className="text-sm text-muted-foreground">Risque Faible</div>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold">{statistics.totalStudents}</div>
                  <div className="text-sm text-muted-foreground">Total Élèves</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-red-600">
                    {statistics.totalOutstanding.toLocaleString()} XAF
                  </div>
                  <div className="text-sm text-muted-foreground">Total Impayé</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold">{statistics.averageDaysLate}</div>
                  <div className="text-sm text-muted-foreground">Jours de Retard Moyen</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Liste des élèves avec sélection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Liste des Élèves Insolvables ({filteredInsolvents.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleSelectAll}>
                    <CheckSquare className="h-4 w-4 mr-1" />
                    Tout sélectionner
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleDeselectAll}>
                    <Square className="h-4 w-4 mr-1" />
                    Tout désélectionner
                  </Button>
                </div>
              </div>
              {/* Debug info pour vérifier les filtres */}
              <div className="text-xs text-muted-foreground mt-2">
                <div>Type de rappel: {reminderType}</div>
                {reminderType === 'class' && (
                  <div>Classe sélectionnée: {selectedClass || 'Aucune'}</div>
                )}
                {reminderType === 'student' && (
                  <div>Élève sélectionné: {selectedStudent || 'Aucun'}</div>
                )}
                {reminderType === 'risk' && (
                  <div>Niveau de risque: {riskLevel}</div>
                )}
                <div>Total élèves insolvables: {insolventStudents.length}</div>
                <div>Élèves filtrés: {filteredInsolvents.length}</div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Chargement des données...</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredInsolvents.map((student, index) => (
                    <div key={student.studentId || `student-${index}`} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30">
                      <Checkbox
                        checked={student.selected || false}
                        onCheckedChange={(checked) => handleSelectStudent(student.studentId, checked as boolean)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{student.name}</div>
                          <Badge variant="outline">{student.class}</Badge>
                          <Badge className={getRiskBadgeColor(student.riskLevel)}>
                            {getRiskIcon(student.riskLevel)}
                            {student.riskLevel}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {student.daysLate} jours de retard • {student.outstanding?.toLocaleString()} XAF impayé
                        </div>
                        {/* Informations des parents */}
                        {(student.parentInfo || student.parentInfo2) && (
                          <div className="text-xs text-blue-600 mt-1">
                            <div className="font-medium">Contact Parent:</div>
                            {student.parentInfo ? (
                              <div>
                                {student.parentInfo.nom} {student.parentInfo.prenom} - {student.parentInfo.telephone}
                                {student.parentInfo.email && ` (${student.parentInfo.email})`}
                              </div>
                            ) : student.parentInfo2 ? (
                              <div>
                                {student.parentInfo2.nom} {student.parentInfo2.prenom} - {student.parentInfo2.telephone}
                                {student.parentInfo2.email && ` (${student.parentInfo2.email})`}
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {student.outstanding?.toLocaleString()} XAF
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {student.paymentRate.toFixed(1)}% payé
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Coupons générés */}
          {showCouponsDialog && generatedCoupons.length > 0 && (
            <Dialog open={showCouponsDialog} onOpenChange={setShowCouponsDialog}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Coupons Générés ({generatedCoupons.length})
                  </DialogTitle>
                </DialogHeader>
                <DialogDescription>
                  Liste des coupons générés pour les élèves sélectionnés.
                </DialogDescription>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {generatedCoupons.map((coupon, index) => (
                    <div key={`${coupon.studentId}-${index}`} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm">{coupon.studentName}</h4>
                        <Badge variant="outline" className="text-xs">
                          {coupon.className}
                        </Badge>
                      </div>
                      <div className="text-xs space-y-1">
                        <div><strong>Contact:</strong> {coupon.parentContact}</div>
                        <div><strong>Type:</strong> {coupon.type}</div>
                        <div className="mt-2 p-2 bg-white rounded border text-xs whitespace-pre-wrap">
                          {coupon.content}
                        </div>
                        {coupon.criticalInstallment && (
                          <div className="mt-2 p-2 bg-yellow-100 rounded border text-xs">
                            <strong>Tranche Critique:</strong>
                            <div>{coupon.criticalInstallment.id}</div>
                            <div>Montant: {coupon.criticalInstallment.balance.toLocaleString()} XAF</div>
                            <div>Échéance: {new Date(coupon.criticalInstallment.extendedDueDate || coupon.criticalInstallment.dueDate).toLocaleDateString()}</div>
                            <div>Statut: {new Date() > new Date(coupon.criticalInstallment.extendedDueDate || coupon.criticalInstallment.dueDate) ? 'EN RETARD' : 'EN COURS'}</div>
                            <div>Jours de retard: {new Date() > new Date(coupon.criticalInstallment.extendedDueDate || coupon.criticalInstallment.dueDate) ? Math.floor((new Date().getTime() - new Date(coupon.criticalInstallment.extendedDueDate || coupon.criticalInstallment.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      const printWindow = window.open('', '', 'height=800,width=800');
                      if (printWindow) {
                        printWindow.document.write('<html><head><title>Coupons de Rappel</title>');
                        printWindow.document.write(`
                          <style>
                            body { 
                              font-family: 'Times New Roman', serif; 
                              margin: 15px; 
                              font-size: 12px;
                              line-height: 1.2;
                            }
                            .coupon { 
                              border: 2px solid #000; 
                              padding: 20px; 
                              margin: 15px 0; 
                              page-break-inside: avoid;
                              width: 100%;
                              max-width: 100%;
                              box-sizing: border-box;
                              min-height: 200px;
                            }
                            .coupon-header { 
                              text-align: center; 
                              font-weight: bold; 
                              font-size: 16px;
                              border-bottom: 2px solid #000; 
                              padding-bottom: 10px; 
                              margin-bottom: 15px;
                              text-transform: uppercase;
                              letter-spacing: 1px;
                            }
                            .coupon-content { 
                              font-size: 11px; 
                              line-height: 1.4;
                              white-space: pre-line;
                              word-wrap: break-word;
                              overflow-wrap: break-word;
                              text-align: left;
                            }
                            .coupon-content p {
                              margin: 6px 0;
                              padding: 0;
                              line-height: 1.4;
                              text-align: left;
                            }
                            .coupon-content strong {
                              font-weight: bold;
                              display: inline;
                            }
                            .installment-info {
                              background: #f8f8f8;
                              padding: 10px;
                              margin: 10px 0;
                              border: 1px solid #ddd;
                              border-radius: 4px;
                              font-size: 10px;
                            }
                            .contact-info {
                              margin: 8px 0;
                              padding: 5px;
                              border-left: 3px solid #000;
                              padding-left: 10px;
                            }
                            h1 {
                              text-align: center;
                              font-size: 18px;
                              font-weight: bold;
                              margin-bottom: 20px;
                              text-transform: uppercase;
                            }
                            @media print { 
                              .no-print { display: none; }
                              .coupon { 
                                page-break-inside: avoid;
                                break-inside: avoid;
                                margin: 10px 0;
                              }
                              body {
                                margin: 10px;
                              }
                            }
                          </style>
                        `);
                        printWindow.document.write('</head><body>');
                        printWindow.document.write('<h1>Coupons de Rappel</h1>');
                        generatedCoupons.forEach((coupon, index) => {
                          // Structurer le contenu du coupon de manière plus claire
                          const formattedContent = coupon.content
                            .split('\n')
                            .map((line: string) => line.trim())
                            .filter((line: string) => line.length > 0)
                            .map((line: string) => {
                              // Si la ligne contient des informations importantes, les formater
                              if (line.includes('Élève:') || line.includes('Matricule:') || line.includes('Classe:')) {
                                return `<p style="margin: 4px 0; padding: 0; font-weight: normal;">${line}</p>`;
                              } else if (line.includes('Tranche') || line.includes('Solde Total')) {
                                return `<p style="margin: 6px 0; padding: 0; font-weight: bold; background: #f0f0f0; padding: 4px;">${line}</p>`;
                              } else if (line.includes('La Direction')) {
                                return `<p style="margin: 8px 0; padding: 0; text-align: center; font-weight: bold; font-style: italic;">${line}</p>`;
                              } else {
                                return `<p style="margin: 3px 0; padding: 0;">${line}</p>`;
                              }
                            })
                            .join('');
                          
                          const schoolName = schoolInfo?.name || 'Établissement Scolaire';
                          printWindow.document.write(`
                            <div class="coupon">
                              <div class="coupon-header">
                                ${schoolName} - COUPON DE RAPPEL
                              </div>
                              <div class="coupon-content">
                                ${formattedContent}
                              </div>
                            </div>
                          `);
                        });
                        printWindow.document.write('</body></html>');
                        printWindow.document.close();
                        setTimeout(() => {
                          printWindow.focus();
                          printWindow.print();
                          printWindow.close();
                        }, 500);
                      }
                    }}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimer les Coupons
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCouponsDialog(false)}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Masquer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Actions et Génération
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Button 
                  onClick={handleGenerateCoupons}
                  disabled={filteredInsolvents.length === 0}
                  className="flex-1"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Générer les Coupons ({selectedStudents.length > 0 ? selectedStudents.length : filteredInsolvents.length})
                </Button>
                <Button variant="outline" onClick={() => loadInsolventStudents()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Dialogues d'alerte et de décision */}
        <AlertDialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
          <AlertDialogContent className="max-w-md mx-auto">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {alertType === 'critical' ? 'Action Critique Requise' : 
                 alertType === 'warning' ? 'Avertissement' : 'Information'}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                {alertMessage}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowAlertDialog(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button 
                onClick={() => {
                  if (pendingAction) {
                    // Traiter l'action en attente
                    console.log('Action en cours:', pendingAction);
                  }
                  setShowAlertDialog(false);
                }}
                className="flex-1"
              >
                Confirmer
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* Dialogue de décision */}
        <AlertDialog open={showDecisionDialog} onOpenChange={setShowDecisionDialog}>
          <AlertDialogContent className="max-w-md mx-auto">
            <AlertDialogHeader>
              <AlertDialogTitle>Décision Requise</AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                {decisionData?.message}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex flex-col gap-3 py-4">
              {decisionData?.actions?.map((action: any, index: number) => (
                <Button
                  key={`action-${index}-${action.value || action.label}`}
                  variant={index === 0 ? "default" : "outline"}
                  onClick={() => {
                    generateCoupons(action.value, decisionData.students);
                    setShowDecisionDialog(false);
                  }}
                  className="w-full justify-start"
                >
                  {action.label}
                </Button>
              ))}
              <Button 
                variant="outline" 
                onClick={() => setShowDecisionDialog(false)}
                className="w-full justify-start"
              >
                Annuler
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
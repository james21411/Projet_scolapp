 "use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  Calendar, 
  Phone, 
  Mail, 
  User, 
  GraduationCap,
  DollarSign,
  Clock,
  Eye,
  Printer,
  Download,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface InsolventStudent {
  studentId: string;
  name: string;
  class: string;
  totalPaid: number;
  outstanding: number;
  totalDue: number;
  lastPaymentDate?: string;
  daysLate: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  paymentRate: number;
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
  installments?: Array<{
    id: string;
    name: string;
    amount: number;
    dueDate: string;
    status: string;
    balance: number;
    paid: number;
    extendedDueDate?: string;
  }>;
}

interface InsolventListProps {
  schoolYear: string;
  onClose: () => void;
  onViewStudentDetails?: (studentId: string) => void;
}

// Fonction utilitaire pour normaliser les noms des tranches
const normalizeTrancheName = (name: string): string => {
  if (name?.includes('1ère')) return 'Tranche 1';
  if (name?.includes('2ème')) return 'Tranche 2';
  if (name?.includes('3ème')) return 'Tranche 3';
  if (name?.includes('4ème')) return 'Tranche 4';
  if (name?.includes('5ème')) return 'Tranche 5';
  return name;
};

export default function InsolventList({ schoolYear, onClose, onViewStudentDetails }: InsolventListProps) {
  const { toast } = useToast();
  const [insolventStudents, setInsolventStudents] = useState<InsolventStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedTranche, setSelectedTranche] = useState<string>('all');
  const [schoolStructure, setSchoolStructure] = useState<{ levels: { [key: string]: { classes: string[] } } } | null>(null);
  
  // Niveaux éducatifs disponibles
  const [educationalLevels, setEducationalLevels] = useState([
    { value: 'all', label: 'Tous les niveaux' },
    { value: 'maternelle', label: 'Maternelle' },
    { value: 'primaire', label: 'Primaire' },
    { value: 'secondaire', label: 'Secondaire' }
  ]);

  // Charger les niveaux actifs
  useEffect(() => {
    const loadActiveLevels = async () => {
      try {
        const response = await fetch('/api/school/levels');
        const result = await response.json();
        if (result.success) {
          const levels = result.levels || result.data || [];
          const activeLevels = levels
            .filter((level: any) => level.isActive)
            .map((level: any) => ({
              value: level.name.toLowerCase(),
              label: level.name
            }));
          
          // Ajouter "Tous les niveaux" au début
          setEducationalLevels([
            { value: 'all', label: 'Tous les niveaux' },
            ...activeLevels
          ]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des niveaux actifs:', error);
      }
    };
    
    loadActiveLevels();
  }, []);
  const [sortBy, setSortBy] = useState<'outstanding' | 'daysLate' | 'name'>('outstanding');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<InsolventStudent | null>(null);

  useEffect(() => {
    fetchInsolventStudents();
  }, [schoolYear]);

  // Charger la structure de l'école
  useEffect(() => {
    const loadSchoolStructure = async () => {
      try {
        const res = await fetch('/api/school/structure-flat');
        if (!res.ok) throw new Error('Erreur lors du chargement de la structure');
        const structure = await res.json();
        setSchoolStructure(structure);
      } catch (e) {
        console.error('Erreur lors du chargement de la structure:', e);
        setSchoolStructure(null);
      }
    };
    loadSchoolStructure();
  }, []);

  const fetchInsolventStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/finance/students-with-balance?schoolYear=${schoolYear}`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données');
      }
      const data = await response.json();
      
      // Enrichir les données avec des informations supplémentaires
      const enrichedData = data.map((student: any) => ({
        ...student,
        daysLate: student.daysLate || calculateDaysOverdue(student.lastPaymentDate),
        installments: student.installments || []
      }));

      // Filtrer seulement les élèves avec des impayés
      const insolventOnly = enrichedData.filter((student: any) => 
        student.outstanding > 0 && student.installments && 
        student.installments.some((inst: any) => inst.status !== 'payée')
      );

      setInsolventStudents(insolventOnly);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: "Erreur",
        description: "Impossible de charger la liste des insolvables."
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysOverdue = (lastPaymentDate?: string): number => {
    if (!lastPaymentDate) return 0;
    const lastPayment = new Date(lastPaymentDate);
    const today = new Date();
    const diffTime = today.getTime() - lastPayment.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Fonction pour déterminer le niveau éducatif d'une classe
  const getEducationalLevel = (className: string): string => {
    // Si on a la structure de l'école, l'utiliser
    if (schoolStructure) {
      for (const [level, classes] of Object.entries(schoolStructure)) {
        if (Array.isArray(classes) && classes.includes(className)) {
          return level.toLowerCase();
        }
      }
    }
    
    // Fallback: logique basée sur les mots-clés si la structure n'est pas disponible
    const classLower = className.toLowerCase();
    
    if (classLower.includes('maternelle') || classLower.includes('petite') || classLower.includes('moyenne') || classLower.includes('grande')) {
      return 'maternelle';
    } else if (classLower.includes('primaire') || classLower.includes('cp') || classLower.includes('ce') || classLower.includes('cm')) {
      return 'primaire';
    } else if (classLower.includes('secondaire') || classLower.includes('6ème') || classLower.includes('5ème') || 
               classLower.includes('4ème') || classLower.includes('3ème') || classLower.includes('2nde') || 
               classLower.includes('1ère') || classLower.includes('terminale') || classLower.includes('tc')) {
      return 'secondaire';
    }
    
    return 'secondaire'; // Par défaut
  };

  const getOverdueBadge = (days: number) => {
    if (days > 90) return <Badge variant="destructive">Très en retard ({days}j)</Badge>;
    if (days > 60) return <Badge className="bg-orange-100 text-orange-800">En retard ({days}j)</Badge>;
    if (days > 30) return <Badge className="bg-yellow-100 text-yellow-800">Attention ({days}j)</Badge>;
    return <Badge variant="secondary">Normal</Badge>;
  };

  const getAmountColor = (amount: number) => {
    if (amount > 100000) return 'text-red-600 font-bold';
    if (amount > 50000) return 'text-orange-600 font-semibold';
    return 'text-yellow-600';
  };

  const filteredStudents = insolventStudents
    .filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          student.studentId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClass = !selectedClass || selectedClass === 'all' || student.class === selectedClass;
      const matchesLevel = !selectedLevel || selectedLevel === 'all' || 
        getEducationalLevel(student.class) === selectedLevel;
      const matchesTranche = !selectedTranche || selectedTranche === 'all' || 
        student.installments?.some(inst => normalizeTrancheName(inst.name) === selectedTranche && inst.status !== 'payée');
      return matchesSearch && matchesClass && matchesLevel && matchesTranche;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'outstanding':
          comparison = b.outstanding - a.outstanding;
          break;
        case 'daysLate':
          comparison = (b.daysLate || 0) - (a.daysLate || 0);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
      }
      return sortOrder === 'desc' ? comparison : -comparison;
    });

  const handleViewStudentDetails = (student: InsolventStudent) => {
    if (onViewStudentDetails) {
      onViewStudentDetails(student.studentId);
    } else {
      setSelectedStudent(student);
      setShowStudentDetails(true);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=800,width=1200');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Liste des Élèves Insolvables</title>');
      printWindow.document.write(`
        <style>
          body { 
            font-family: 'Times New Roman', serif; 
            margin: 20px; 
            font-size: 12px;
            line-height: 1.4;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
          }
          .header h1 {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            text-transform: uppercase;
          }
          .header p {
            margin: 5px 0;
            font-size: 12px;
          }
          .filters {
            margin: 20px 0;
            padding: 10px;
            border: 1px solid #ccc;
            background-color: #f9f9f9;
          }
          .filters h3 {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
            text-decoration: underline;
          }
          .filter-info {
            display: inline-block;
            margin: 2px 10px 2px 0;
            font-size: 11px;
          }
          .table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px; 
            border: 1px solid #000;
          }
          .table th, .table td { 
            border: 1px solid #000; 
            padding: 6px; 
            text-align: left; 
            font-size: 11px;
          }
          .table th { 
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
          }
          .overdue { color: #000; font-weight: bold; }
          .warning { color: #000; font-weight: bold; }
          .normal { color: #000; }
          .amount-high { color: #000; font-weight: bold; }
          .amount-medium { color: #000; font-weight: bold; }
          .amount-low { color: #000; }
          @media print { 
            .no-print { display: none; }
          }
        </style>
      `);
      printWindow.document.write('</head><body>');
      printWindow.document.write(`
        <div class="header">
          <h1>LISTE DES ÉLÈVES INSOLVABLES</h1>
          <p>Année scolaire: ${schoolYear}</p>
          <p>Date: ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>
        
        <div class="filters">
          <h3>INFORMATIONS DE FILTRAGE:</h3>
          <div>
            <span class="filter-info"><strong>Niveau:</strong> ${selectedLevel !== 'all' ? educationalLevels.find(l => l.value === selectedLevel)?.label : 'Tous les niveaux'}</span>
            <span class="filter-info"><strong>Classe:</strong> ${selectedClass !== 'all' ? selectedClass : 'Toutes les classes'}</span>
            <span class="filter-info"><strong>Tranche:</strong> ${selectedTranche !== 'all' ? selectedTranche : 'Toutes les tranches'}</span>
          </div>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>Matricule</th>
              <th>Nom & Prénom</th>
              <th>Classe</th>
              <th>Total Payé</th>
              <th>Solde Restant</th>
              <th>Jours de Retard</th>
              <th>Contact</th>
            </tr>
          </thead>
          <tbody>
            ${filteredStudents.map(student => `
              <tr>
                <td>${student.studentId}</td>
                <td>${student.name}</td>
                <td>${student.class}</td>
                <td>${student.totalPaid?.toLocaleString('fr-FR')} XAF</td>
                <td class="${getAmountColor(student.outstanding).replace('text-', '').replace('font-', '')}">${student.outstanding?.toLocaleString('fr-FR')} XAF</td>
                <td class="${student.daysLate > 60 ? 'overdue' : student.daysLate > 30 ? 'warning' : 'normal'}">${student.daysLate || 0} jours</td>
                <td>${student.parentInfo?.telephone || student.parentInfo2?.telephone || 'Non renseigné'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const handleExportCSV = () => {
    // Créer le contenu CSV avec plus d'informations
    const headers = [
      'Matricule',
      'Nom & Prénom',
      'Classe',
      'Total Payé (XAF)',
      'Solde Restant (XAF)',
      'Montant Total Dû (XAF)',
      'Taux de Paiement (%)',
      'Jours de Retard',
      'Niveau de Risque',
      'Contact Parent',
      'Email Parent',
      'Profession Parent',
      'Contact Parent 2',
      'Email Parent 2',
      'Profession Parent 2'
    ];
    
    const csvContent = [
      headers.join(','),
      ...filteredStudents.map(student => [
        student.studentId,
        `"${student.name}"`,
        student.class,
        student.totalPaid?.toLocaleString('fr-FR'),
        student.outstanding?.toLocaleString('fr-FR'),
        (student.totalDue || 0).toLocaleString('fr-FR'),
        (student.paymentRate || 0).toFixed(1),
        student.daysLate || 0,
        (student.riskLevel || 'low').toUpperCase(),
        `"${student.parentInfo?.telephone || ''}"`,
        `"${student.parentInfo?.email || ''}"`,
        `"${student.parentInfo?.profession || ''}"`,
        `"${student.parentInfo2?.telephone || ''}"`,
        `"${student.parentInfo2?.email || ''}"`,
        `"${student.parentInfo2?.profession || ''}"`
      ].join(','))
    ].join('\n');
    
    // Ajouter les détails des tranches dans un second fichier
    const installmentHeaders = [
      'Matricule',
      'Nom Élève',
      'Classe',
      'Tranche',
      'Montant Tranche (XAF)',
      'Montant Payé (XAF)',
      'Solde Restant (XAF)',
      'Date d\'Échéance',
      'Statut',
      'Jours de Retard'
    ];
    
    const installmentData: any[] = [];
    filteredStudents.forEach(student => {
      if (student.installments) {
        student.installments.forEach(inst => {
          if (inst.balance > 0) {
            const dueDate = new Date(inst.dueDate);
            const daysLate = Math.max(0, Math.floor((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
            
            installmentData.push([
              student.studentId,
              `"${student.name}"`,
              student.class,
              `"${inst.name}"`,
              inst.amount.toLocaleString('fr-FR'),
              inst.paid.toLocaleString('fr-FR'),
              inst.balance.toLocaleString('fr-FR'),
              dueDate.toLocaleDateString('fr-FR'),
              inst.status,
              daysLate
            ]);
          }
        });
      }
    });
    
    const installmentCsvContent = [
      installmentHeaders.join(','),
      ...installmentData.map(row => row.join(','))
    ].join('\n');
    
    // Créer et télécharger les fichiers
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const fileName = selectedClass !== 'all' 
      ? `rapport_insolvables_${selectedClass}_${schoolYear}_${new Date().toISOString().split('T')[0]}.csv`
      : `rapport_insolvables_${schoolYear}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Télécharger le fichier des tranches
    const installmentBlob = new Blob([installmentCsvContent], { type: 'text/csv;charset=utf-8;' });
    const installmentLink = document.createElement('a');
    const installmentUrl = URL.createObjectURL(installmentBlob);
    installmentLink.setAttribute('href', installmentUrl);
    const installmentFileName = selectedClass !== 'all' 
      ? `tranches_impayees_${selectedClass}_${schoolYear}_${new Date().toISOString().split('T')[0]}.csv`
      : `tranches_impayees_${schoolYear}_${new Date().toISOString().split('T')[0]}.csv`;
    installmentLink.setAttribute('download', installmentFileName);
    installmentLink.style.visibility = 'hidden';
    document.body.appendChild(installmentLink);
    installmentLink.click();
    document.body.removeChild(installmentLink);
    
    toast({
      title: "Rapports CSV exportés",
      description: "Les fichiers CSV ont été téléchargés avec succès (élèves + tranches)."
    });
  };

  const handleDownloadPDF = () => {
    // Créer un nouveau document PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    let currentY = 20;
    
    // En-tête administratif
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RAPPORT FINANCIER COMPLET', 105, currentY, { align: 'center' });
    currentY += 8;
    
    pdf.setFontSize(14);
    pdf.text('LISTE DES ÉLÈVES INSOLVABLES', 105, currentY, { align: 'center' });
    currentY += 10;
    
    // Informations de base
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Établissement: ScolApp Visuel Academy`, 20, currentY);
    currentY += 5;
    pdf.text(`Année scolaire: ${schoolYear}`, 20, currentY);
    currentY += 5;
    pdf.text(`Date de génération: ${new Date().toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, 20, currentY);
    currentY += 8;
    
    // Statistiques globales
    const totalOutstanding = filteredStudents.reduce((sum, student) => sum + student.outstanding, 0);
    const totalPaid = filteredStudents.reduce((sum, student) => sum + student.totalPaid, 0);
    const totalDue = filteredStudents.reduce((sum, student) => sum + (student.totalDue || 0), 0);
    const averageDaysLate = Math.round(filteredStudents.reduce((sum, student) => sum + (student.daysLate || 0), 0) / filteredStudents.length);
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('STATISTIQUES GLOBALES:', 20, currentY);
    currentY += 6;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Nombre d'élèves insolvables: ${filteredStudents.length}`, 25, currentY);
    currentY += 4;
    pdf.text(`Montant total impayé: ${totalOutstanding.toLocaleString('fr-FR')} XAF`, 25, currentY);
    currentY += 4;
    pdf.text(`Montant total payé: ${totalPaid.toLocaleString('fr-FR')} XAF`, 25, currentY);
    currentY += 4;
    pdf.text(`Montant total dû: ${totalDue.toLocaleString('fr-FR')} XAF`, 25, currentY);
    currentY += 4;
    pdf.text(`Taux de paiement moyen: ${((totalPaid / totalDue) * 100).toFixed(1)}%`, 25, currentY);
    currentY += 4;
    pdf.text(`Retard moyen: ${averageDaysLate} jours`, 25, currentY);
    currentY += 8;
    
    // Informations de filtrage
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CRITÈRES DE FILTRAGE:', 20, currentY);
    currentY += 6;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Niveau: ${selectedLevel !== 'all' ? educationalLevels.find(l => l.value === selectedLevel)?.label : 'Tous les niveaux'}`, 25, currentY);
    currentY += 4;
    pdf.text(`Classe: ${selectedClass !== 'all' ? selectedClass : 'Toutes les classes'}`, 25, currentY);
    currentY += 4;
    pdf.text(`Tranche: ${selectedTranche !== 'all' ? selectedTranche : 'Toutes les tranches'}`, 25, currentY);
    currentY += 8;
    
    // Répartition par niveau de risque
    const riskDistribution = {
      critical: filteredStudents.filter(s => (s.riskLevel || 'low') === 'critical').length,
      high: filteredStudents.filter(s => (s.riskLevel || 'low') === 'high').length,
      medium: filteredStudents.filter(s => (s.riskLevel || 'low') === 'medium').length,
      low: filteredStudents.filter(s => (s.riskLevel || 'low') === 'low').length
    };
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RÉPARTITION PAR NIVEAU DE RISQUE:', 20, currentY);
    currentY += 6;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Critique: ${riskDistribution.critical} élèves`, 25, currentY);
    currentY += 4;
    pdf.text(`Élevé: ${riskDistribution.high} élèves`, 25, currentY);
    currentY += 4;
    pdf.text(`Moyen: ${riskDistribution.medium} élèves`, 25, currentY);
    currentY += 4;
    pdf.text(`Faible: ${riskDistribution.low} élèves`, 25, currentY);
    currentY += 8;
    
    // Tableau principal avec plus d'informations
    const tableData = filteredStudents.map(student => [
      student.studentId,
      student.name,
      student.class,
      `${student.totalPaid?.toLocaleString('fr-FR')} XAF`,
      `${student.outstanding?.toLocaleString('fr-FR')} XAF`,
      `${student.daysLate || 0} jours`,
      (student.riskLevel || 'low').toUpperCase(),
      `${(student.paymentRate || 0).toFixed(1)}%`,
      student.parentInfo?.telephone || student.parentInfo2?.telephone || 'Non renseigné'
    ]);
    
    // Créer le tableau avec autoTable
    (pdf as any).autoTable({
      head: [['Matricule', 'Nom & Prénom', 'Classe', 'Total Payé', 'Solde Restant', 'Jours Retard', 'Risque', 'Taux Paiement', 'Contact']],
      body: tableData,
      startY: currentY,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [51, 51, 51],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7,
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
      columnStyles: {
        0: { cellWidth: 18 }, // Matricule
        1: { cellWidth: 30 }, // Nom
        2: { cellWidth: 18 }, // Classe
        3: { cellWidth: 22 }, // Total Payé
        4: { cellWidth: 22 }, // Solde Restant
        5: { cellWidth: 15 }, // Jours Retard
        6: { cellWidth: 12 }, // Risque
        7: { cellWidth: 15 }, // Taux Paiement
        8: { cellWidth: 25 }, // Contact
      },
      didDrawPage: function(data: any) {
  // Ajouter le numéro de page
  pdf.setFontSize(8);
  pdf.text(`Page ${data.pageNumber} sur ${pdf.internal.getNumberOfPages()}`, 105, pdf.internal.pageSize.height - 10, { align: 'center' });
      }
    });
    
    // Ajouter une page pour les détails des tranches si nécessaire
    if (filteredStudents.length > 0) {
      pdf.addPage();
      currentY = 20;
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DÉTAILS DES TRANCHES IMPAYÉES', 105, currentY, { align: 'center' });
      currentY += 15;
      
      // Tableau des tranches impayées
      const installmentData: any[] = [];
      filteredStudents.forEach(student => {
        if (student.installments) {
          student.installments.forEach(inst => {
            if (inst.balance > 0) {
              installmentData.push([
                student.studentId,
                student.name,
                student.class,
                inst.name,
                `${inst.amount.toLocaleString('fr-FR')} XAF`,
                `${inst.balance.toLocaleString('fr-FR')} XAF`,
                `${inst.paid.toLocaleString('fr-FR')} XAF`,
                new Date(inst.dueDate).toLocaleDateString('fr-FR'),
                inst.status
              ]);
            }
          });
        }
      });
      
      if (installmentData.length > 0) {
        (pdf as any).autoTable({
          head: [['Matricule', 'Élève', 'Classe', 'Tranche', 'Montant', 'Reste', 'Payé', 'Échéance', 'Statut']],
          body: installmentData,
          startY: currentY,
          styles: {
            fontSize: 7,
            cellPadding: 2,
          },
          headStyles: {
            fillColor: [51, 51, 51],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 6,
          },
          alternateRowStyles: {
            fillColor: [248, 249, 250],
          },
          columnStyles: {
            0: { cellWidth: 18 }, // Matricule
            1: { cellWidth: 25 }, // Élève
            2: { cellWidth: 15 }, // Classe
            3: { cellWidth: 15 }, // Tranche
            4: { cellWidth: 20 }, // Montant
            5: { cellWidth: 20 }, // Reste
            6: { cellWidth: 20 }, // Payé
            7: { cellWidth: 20 }, // Échéance
            8: { cellWidth: 15 }, // Statut
          },
        });
      }
    }
    
    // Nom du fichier
    const fileName = selectedClass !== 'all' 
      ? `rapport_insolvables_${selectedClass}_${schoolYear}_${new Date().toISOString().split('T')[0]}.pdf`
      : `rapport_insolvables_${schoolYear}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Télécharger le PDF
    pdf.save(fileName);

    toast({
      title: "Rapport PDF généré",
      description: "Le rapport complet a été téléchargé avec succès."
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête administratif */}
      <div className="mb-6">
        <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            LISTE DES ÉLÈVES INSOLVABLES
          </h1>
          <p className="text-gray-600">Année scolaire: {schoolYear}</p>
          <p className="text-gray-600">Date: {new Date().toLocaleDateString('fr-FR')}</p>
        </div>
        
        {/* Informations de filtrage */}
        <div className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Niveau:</strong> {selectedLevel !== 'all' ? educationalLevels.find(l => l.value === selectedLevel)?.label : 'Tous les niveaux'}
            </div>
            <div>
              <strong>Classe:</strong> {selectedClass !== 'all' ? selectedClass : 'Toutes les classes'}
            </div>
            <div>
              <strong>Tranche:</strong> {selectedTranche !== 'all' ? selectedTranche : 'Toutes les tranches'}
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {selectedClass !== 'all' ? `Insolvables ${selectedClass}` : 'Total Insolvables'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-red-600">{filteredStudents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Montant Total Dû</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-red-600">
              {filteredStudents.reduce((sum, student) => sum + student.outstanding, 0).toLocaleString('fr-FR')} XAF
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Moyenne par Élève</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-orange-600">
              {filteredStudents.length > 0 
                ? (filteredStudents.reduce((sum, student) => sum + student.outstanding, 0) / filteredStudents.length).toLocaleString('fr-FR')
                : '0'} XAF
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taux de Paiement Moyen</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-blue-600">
              {filteredStudents.length > 0 
                ? (filteredStudents.reduce((sum, student) => sum + (student.paymentRate || 0), 0) / filteredStudents.length).toFixed(1)
                : '0'}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Retard Moyen</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-yellow-600">
              {filteredStudents.length > 0 
                ? Math.round(filteredStudents.reduce((sum, student) => sum + (student.daysLate || 0), 0) / filteredStudents.length)
                : '0'} jours
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Risque Critique</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-red-600">
              {filteredStudents.filter(s => (s.riskLevel || 'low') === 'critical').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou matricule..."
              className="pl-10 w-full md:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Sélecteur de niveau */}
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder={selectedLevel === 'all' ? "Tous les niveaux" : `Niveau: ${educationalLevels.find(l => l.value === selectedLevel)?.label || selectedLevel}`} />
            </SelectTrigger>
            <SelectContent>
              {educationalLevels.map(level => (
                <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Sélecteur de classe */}
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder={selectedClass === 'all' ? "Toutes les classes" : `Classe: ${selectedClass}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les classes</SelectItem>
              {Array.from(new Set(
                insolventStudents
                  .filter(student => selectedLevel === 'all' || getEducationalLevel(student.class) === selectedLevel)
                  .map(s => s.class)
              )).sort().map(className => (
                <SelectItem key={className} value={className}>{className}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Sélecteur de tranche */}
          <Select value={selectedTranche} onValueChange={setSelectedTranche}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder={selectedTranche === 'all' ? "Toutes les tranches" : `Tranche: ${selectedTranche}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les tranches</SelectItem>
              {Array.from(new Set(
                insolventStudents
                  .filter(student => {
                    if (selectedClass !== 'all' && student.class !== selectedClass) return false;
                    if (selectedLevel !== 'all' && getEducationalLevel(student.class) !== selectedLevel) return false;
                    return true;
                  })
                  .flatMap(s => s.installments?.filter(inst => inst.status !== 'payée').map(inst => normalizeTrancheName(inst.name)) || [])
              )).sort().map(tranche => (
                <SelectItem key={tranche} value={tranche}>{tranche}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPDF}>
            <FileText className="mr-2 h-4 w-4" />
            Télécharger PDF
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* Tableau des insolvables */}
      <div className="border rounded-lg overflow-hidden">
        {selectedClass !== 'all' && (
          <div className="bg-blue-50 p-3 border-b">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">
                Liste spécifique pour la classe: <strong>{selectedClass}</strong>
              </span>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                              <TableHead className="min-w-40">Élève</TableHead>
              <TableHead className="min-w-32">Classe</TableHead>
              <TableHead className="text-right min-w-36">Total Payé</TableHead>
              <TableHead className="text-right min-w-36">Solde Restant</TableHead>
              <TableHead className="text-center min-w-20">Taux</TableHead>
              <TableHead className="text-center min-w-20">Risque</TableHead>
              <TableHead className="text-center min-w-28">Retard</TableHead>
              <TableHead className="min-w-40">Tranches en retard</TableHead>
              <TableHead className="min-w-40">Contact</TableHead>
              <TableHead className="text-center min-w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {filteredStudents.map((student) => (
              <TableRow key={student.studentId} className="hover:bg-muted/30">
                <TableCell>
                  <div>
                    <div className="font-medium">{student.name}</div>
                    <div className="text-xs text-muted-foreground">Matricule: {student.studentId}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    {student.class}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="text-green-600 font-medium">
                    {student.totalPaid?.toLocaleString('fr-FR')} XAF
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className={`font-bold ${getAmountColor(student.outstanding)}`}>
                    {student.outstanding?.toLocaleString('fr-FR')} XAF
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="text-sm font-medium">
                    {(student.paymentRate || 0).toFixed(1)}%
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge 
                    variant={(student.riskLevel || 'low') === 'critical' ? 'destructive' : 
                           (student.riskLevel || 'low') === 'high' ? 'destructive' : 
                           (student.riskLevel || 'low') === 'medium' ? 'secondary' : 'default'}
                    className="text-xs"
                  >
                    {(student.riskLevel || 'low').toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {getOverdueBadge(student.daysLate || 0)}
                </TableCell>
                 <TableCell>
                   <div className="space-y-1">
                     {student.installments?.filter(inst => inst.status !== 'payée').map((inst) => (
                       <div key={`${student.studentId}-${inst.id}`} className="text-xs">
                         <Badge variant="destructive" className="text-xs">
                           {normalizeTrancheName(inst.name)}
                         </Badge>
                       </div>
                     ))}
                   </div>
                 </TableCell>
                 <TableCell>
                   <div className="space-y-1">
                     <div className="flex items-center gap-1 text-xs">
                       <Phone className="h-3 w-3" />
                       {student.parentInfo?.telephone || student.parentInfo2?.telephone || 'Non renseigné'}
                     </div>
                     <div className="flex items-center gap-1 text-xs">
                       <Mail className="h-3 w-3" />
                       {student.parentInfo?.email || student.parentInfo2?.email || 'Non renseigné'}
                     </div>
                   </div>
                 </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewStudentDetails(student)}
                      className="h-8 w-8 p-0"
                      title="Voir les détails"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Dialogue de détails de l'élève */}
      <Dialog open={showStudentDetails} onOpenChange={setShowStudentDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Détails de l'élève insolvable</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-6">
              {/* Informations de l'élève */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informations de l'élève
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Nom & Prénom</div>
                      <div className="font-medium">{selectedStudent.name}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Matricule</div>
                      <div className="font-medium">{selectedStudent.studentId}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Classe</div>
                      <div className="font-medium">{selectedStudent.class}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Année scolaire</div>
                      <div className="font-medium">{schoolYear}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Situation financière */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Situation financière
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedStudent.totalPaid?.toLocaleString('fr-FR')} XAF
                      </div>
                      <div className="text-sm text-muted-foreground">Total Payé</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {selectedStudent.outstanding?.toLocaleString('fr-FR')} XAF
                      </div>
                      <div className="text-sm text-muted-foreground">Solde Restant</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedStudent.totalDue?.toLocaleString('fr-FR')} XAF
                      </div>
                      <div className="text-sm text-muted-foreground">Total Dû</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informations de contact */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Informations de contact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Téléphone</div>
                      <div className="font-medium">{selectedStudent.parentInfo?.telephone || selectedStudent.parentInfo2?.telephone || 'Non renseigné'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Email</div>
                      <div className="font-medium">{selectedStudent.parentInfo?.email || selectedStudent.parentInfo2?.email || 'Non renseigné'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Parent/Tuteur</div>
                      <div className="font-medium">
                        {selectedStudent.parentInfo ? 
                          `${selectedStudent.parentInfo.nom} ${selectedStudent.parentInfo.prenom}` : 
                          selectedStudent.parentInfo2 ? 
                          `${selectedStudent.parentInfo2.nom} ${selectedStudent.parentInfo2.prenom}` : 
                          'Non renseigné'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tranches en retard */}
              {selectedStudent.installments && selectedStudent.installments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Tranches en retard
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tranche</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                          <TableHead>Date Limite</TableHead>
                          <TableHead>Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedStudent.installments
                          .filter(inst => inst.status !== 'payée')
                          .map((installment) => (
                            <TableRow key={installment.id}>
                              <TableCell className="font-medium">{normalizeTrancheName(installment.name)}</TableCell>
                              <TableCell className="text-right">{installment.amount?.toLocaleString('fr-FR')} XAF</TableCell>
                              <TableCell>{new Date(installment.dueDate).toLocaleDateString('fr-FR')}</TableCell>
                              <TableCell>
                                <Badge variant={installment.status === 'en_retard' ? 'destructive' : 'secondary'}>
                                  {installment.status === 'en_retard' ? 'En retard' : 'En attente'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
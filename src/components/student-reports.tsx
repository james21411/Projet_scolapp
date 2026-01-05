"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { SchoolYearSelect } from './ui/school-year-select';
import { Separator } from './ui/separator';
import { 
  Users, 
  GraduationCap, 
  BarChart3, 
  FileText, 
  Download, 
  Printer, 
  Search, 
  Filter,
  TrendingUp,
  TrendingDown,
  UserCheck,
  UserX,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Eye,
  FileDown,
  PieChart,
  Activity,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Student } from '@/services/studentService';
import { getStudentById } from '@/services/studentService';
import { StudentFile } from './tableau-de-bord';
// Type pour SchoolStructure (à définir selon votre structure)
interface SchoolStructure {
  levels: {
    [key: string]: {
      classes: string[];
    };
  };
}

interface StudentReportFilters {
  schoolYear: string;
  level: string;
  class: string;
  status: string;
  gender: string;
  ageRange: string;
  registrationDate: string;
}

interface StudentStatistics {
  totalStudents: number;
  totalClasses: number;
  totalLevels: number;
  averageStudentsPerClass: number;
  genderDistribution: { male: number; female: number };
  statusDistribution: { [key: string]: number };
  levelDistribution: { [key: string]: number };
  classDistribution: { [key: string]: number };
  ageDistribution: { [key: string]: number };
  registrationTrend: { [key: string]: number };
}

interface StudentReportsProps {
  students: Student[];
  schoolStructure: SchoolStructure;
  onExport?: (type: 'pdf' | 'csv', filters: StudentReportFilters) => void;
}

function StudentReports({ students, schoolStructure, onExport }: StudentReportsProps) {
  const { toast } = useToast();
  // Déterminer l'année scolaire en cours par défaut
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  // L'année scolaire commence en septembre (mois 8), donc si on est après août, on est dans la nouvelle année scolaire
  const defaultSchoolYear = currentMonth >= 8 ? `${currentYear}-${currentYear + 1}` : `${currentYear - 1}-${currentYear}`;
  
  const [filters, setFilters] = useState<StudentReportFilters>({
    schoolYear: defaultSchoolYear,
    level: 'all',
    class: 'all',
    status: 'all',
    gender: 'all',
    ageRange: 'all',
    registrationDate: 'all'
  });
  
  const [pendingFilters, setPendingFilters] = useState<StudentReportFilters>({
    schoolYear: defaultSchoolYear,
    level: 'all',
    class: 'all',
    status: 'all',
    gender: 'all',
    ageRange: 'all',
    registrationDate: 'all'
  });
  
  const [isFilterApplied, setIsFilterApplied] = useState(true);
  
  
     const [availableSchoolYears, setAvailableSchoolYears] = useState<string[]>([]);
   const [currentSchoolYear, setCurrentSchoolYear] = useState<string>('');
   const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
   const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

     // Charger les années scolaires disponibles
   useEffect(() => {
     fetch('/api/finance/school-years')
       .then(response => response.json())
       .then(data => {
         setAvailableSchoolYears(data.availableYears || []);
         setCurrentSchoolYear(data.currentSchoolYear || '');
                   // Définir l'année scolaire en cours par défaut
          if (data.currentSchoolYear) {
            setFilters(prev => ({ ...prev, schoolYear: data.currentSchoolYear }));
            setPendingFilters(prev => ({ ...prev, schoolYear: data.currentSchoolYear }));
          }
       })
       .catch(error => {
         console.error('Erreur lors du chargement des années scolaires:', error);
         // Fallback vers l'année actuelle
         const currentYear = new Date().getFullYear();
         const fallbackYear = `${currentYear}-${currentYear + 1}`;
         setCurrentSchoolYear(fallbackYear);
         setAvailableSchoolYears([fallbackYear]);
       });
   }, []);

       // Récupérer l'élève sélectionné quand selectedStudentId change (même logique que dans le tableau de bord)
    const fetchAndSetSelectedStudent = useCallback(async (studentId: string) => {
      const studentData = await getStudentById(studentId);
      setSelectedStudent(studentData);
    }, []);

    useEffect(() => {
      if (selectedStudentId) {
        fetchAndSetSelectedStudent(selectedStudentId);
      } else {
        setSelectedStudent(null);
      }
    }, [selectedStudentId, fetchAndSetSelectedStudent]);


  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Fonction pour calculer l'âge
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Fonction pour mapper les classes aux niveaux en utilisant la vraie structure de la base de données
  const getLevelFromClass = (className: string): string => {
    // Utiliser la vraie structure de la base de données
    for (const [levelName, levelData] of Object.entries(schoolStructure.levels)) {
      if (levelData.classes.includes(className)) {
        return levelName;
      }
    }
    
    // Fallback : si la classe n'est pas trouvée dans la structure, utiliser le mapping automatique
    const classLower = className.toLowerCase();
    
    // Maternelle
    if (classLower.includes('petite') || classLower.includes('moyenne') || classLower.includes('grande')) {
      return 'Maternelle';
    }
    
    // Primaire
    if (classLower.includes('cp') || classLower.includes('ce1') || classLower.includes('ce2') || 
        classLower.includes('cm1') || classLower.includes('cm2')) {
      return 'Primaire';
    }
    
    // Secondaire
    if (classLower.includes('6ème') || classLower.includes('5ème') || classLower.includes('4ème') || 
        classLower.includes('3ème') || classLower.includes('2nde') || classLower.includes('1ère') || 
        classLower.includes('tle')) {
      return 'Secondaire';
    }
    
    // Par défaut, retourner le premier mot de la classe
    return className.split(' ')[0];
  };

  // Fonction pour réinitialiser les filtres
  const handleResetFilters = () => {
    const resetFilters = {
      schoolYear: defaultSchoolYear,
      level: 'all',
      class: 'all',
      status: 'all',
      gender: 'all',
      ageRange: 'all',
      registrationDate: 'all'
    };
    setFilters(resetFilters);
    setPendingFilters(resetFilters);
    setIsFilterApplied(true);
  };

  // Fonction pour appliquer les filtres
  const handleApplyFilters = () => {
    setFilters(pendingFilters);
    setIsFilterApplied(true);
    setCurrentPage(1);
  };

  // Fonction pour gérer les changements de filtres
  const handleFilterChange = (key: keyof StudentReportFilters, value: string) => {
    const newPendingFilters = { ...pendingFilters, [key]: value };
    setPendingFilters(newPendingFilters);
    
    // Si le niveau change, réinitialiser la classe
    if (key === 'level') {
      newPendingFilters.class = 'all';
      setPendingFilters(newPendingFilters);
    }
    
    // Ne pas appliquer automatiquement, attendre le bouton "Appliquer"
    setIsFilterApplied(false);
  };

  // Calculer les statistiques
  const statistics = useMemo((): StudentStatistics => {
    const filteredStudents = students.filter(student => {
      const studentLevel = getLevelFromClass(student.classe);
      
      if (filters.level !== 'all' && studentLevel !== filters.level) return false;
      if (filters.class !== 'all' && student.classe !== filters.class) return false;
      if (filters.status !== 'all' && student.statut !== filters.status) return false;
      if (filters.gender !== 'all' && student.sexe !== filters.gender) return false;
      if (filters.schoolYear !== 'all' && student.anneeScolaire !== filters.schoolYear) return false;
      return true;
    });

    const totalStudents = filteredStudents.length;
    const classes = [...new Set(filteredStudents.map(s => s.classe))];
    const levels = [...new Set(filteredStudents.map(s => getLevelFromClass(s.classe)))];
    
    const genderDistribution = {
      male: filteredStudents.filter(s => s.sexe === 'Masculin').length,
      female: filteredStudents.filter(s => s.sexe === 'Féminin').length
    };

    const statusDistribution = filteredStudents.reduce((acc, student) => {
      acc[student.statut] = (acc[student.statut] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const levelDistribution = filteredStudents.reduce((acc, student) => {
      const level = getLevelFromClass(student.classe);
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const classDistribution = filteredStudents.reduce((acc, student) => {
      acc[student.classe] = (acc[student.classe] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // Calculer la distribution par âge
    const ageDistribution = filteredStudents.reduce((acc, student) => {
      const age = new Date().getFullYear() - new Date(student.dateNaissance).getFullYear();
      const ageGroup = age < 12 ? '11 ans et moins' : 
                      age < 15 ? '12-14 ans' : 
                      age < 18 ? '15-17 ans' : 
                      age < 21 ? '18-20 ans' : '21 ans et plus';
      acc[ageGroup] = (acc[ageGroup] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // Calculer la tendance d'inscription par mois
    const registrationTrend = filteredStudents.reduce((acc, student) => {
      const month = new Date(student.createdAt).toLocaleDateString('fr-FR', { month: 'long' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return {
      totalStudents,
      totalClasses: classes.length,
      totalLevels: levels.length,
      averageStudentsPerClass: totalStudents > 0 ? Math.round(totalStudents / classes.length) : 0,
      genderDistribution,
      statusDistribution,
      levelDistribution,
      classDistribution,
      ageDistribution,
      registrationTrend
    };
  }, [students, filters]);

  // Données filtrées pour les tableaux
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      if (filters.level !== 'all' && getLevelFromClass(student.classe) !== filters.level) return false;
      if (filters.class !== 'all' && student.classe !== filters.class) return false;
      if (filters.status !== 'all' && student.statut !== filters.status) return false;
      if (filters.gender !== 'all' && student.sexe !== filters.gender) return false;
      if (filters.schoolYear !== 'all' && student.anneeScolaire !== filters.schoolYear) return false;
      return true;
    });
  }, [students, filters]);

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredStudents.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredStudents, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);

  // Cette fonction est maintenant remplacée par la nouvelle logique ci-dessus

  const handleExport = async (type: 'pdf' | 'csv') => {
    try {
      toast({ title: 'Export en cours...', description: `Génération du rapport ${type.toUpperCase()}` });
      
      if (type === 'csv') {
        // Générer le CSV
        const headers = ['Nom', 'Prénom', 'Matricule', 'Classe', 'Statut', 'Genre', 'Âge', 'Date d\'inscription', 'Téléphone', 'Email'];
        const csvContent = [
          headers.join(','),
          ...filteredStudents.map(student => [
            student.nom,
            student.prenom,
            student.id,
            student.classe,
            student.statut,
            student.sexe,
            calculateAge(student.dateNaissance),
            new Date(student.createdAt).toLocaleDateString('fr-FR'),
            student.infoParent?.telephone || '',
            student.infoParent?.email || ''
          ].join(','))
        ].join('\n');

        // Créer et télécharger le fichier
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `rapport_eleves_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({ title: 'Export réussi', description: 'Fichier CSV téléchargé avec succès' });
      } else if (type === 'pdf') {
        // Générer le PDF
        const { default: jsPDF } = await import('jspdf');
        const autoTable = await import('jspdf-autotable');
        
        const doc = new jsPDF();
        
        // Titre
        doc.setFontSize(18);
        doc.text('Rapport des Élèves', 14, 22);
        doc.setFontSize(12);
        doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);
        doc.text(`Filtres appliqués: ${Object.entries(filters).filter(([_, v]) => v !== 'all').map(([k, v]) => `${k}: ${v}`).join(', ') || 'Aucun filtre'}`, 14, 37);
        
        // Tableau
        const tableData = filteredStudents.map(student => [
          `${student.nom} ${student.prenom}`,
          student.id,
          student.classe,
          student.statut,
          student.sexe,
          `${calculateAge(student.dateNaissance)} ans`,
          new Date(student.createdAt).toLocaleDateString('fr-FR'),
          student.infoParent?.telephone || 'Non renseigné'
        ]);
        
        autoTable.default(doc, {
          head: [['Nom complet', 'Matricule', 'Classe', 'Statut', 'Genre', 'Âge', 'Date inscription', 'Téléphone']],
          body: tableData,
          startY: 45,
          styles: {
            fontSize: 8,
            cellPadding: 2
          },
          headStyles: {
            fillColor: [66, 139, 202],
            textColor: 255
          }
        });
        
        // Télécharger le PDF
        doc.save(`rapport_eleves_${new Date().toISOString().split('T')[0]}.pdf`);
        
        toast({ title: 'Export réussi', description: 'Fichier PDF téléchargé avec succès' });
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Échec de l\'export' });
    }
  };

  const handleViewStudentDetails = (student: Student) => {
    // Utiliser la même méthode que dans la section liste des élèves
    setSelectedStudentId(student.id);
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Actif': return 'default';
      case 'Pré-inscrit': return 'secondary';
      case 'Inactif': return 'outline';
      case 'Renvoi': return 'destructive';
      case 'Transféré': return 'outline';
      case 'Diplômé': return 'default';
      default: return 'secondary';
    }
  };

  const getGenderIcon = (gender: string) => {
    return gender === 'Masculin' ? '👨' : gender === 'Féminin' ? '👩' : '👤';
  };

                                                                                               // Si un élève est sélectionné, utiliser exactement le même composant StudentFile
       if (selectedStudent) {
         return (
           <div>
             {/* Bouton retour */}
             <div className="mb-4">
               <Button 
                 variant="outline" 
                 size="sm" 
                 onClick={() => setSelectedStudentId(null)}
                 className="flex items-center gap-2"
               >
                 <ChevronLeft className="h-4 w-4" />
                 Retour aux rapports
               </Button>
             </div>
             
             {/* Utiliser exactement le même composant StudentFile que dans tableau-de-bord.tsx */}
             <StudentFile 
               student={selectedStudent}
               onBack={() => setSelectedStudentId(null)}
               onStudentUpdate={() => {
                 // Rafraîchir les données si nécessaire
                 console.log('Élève mis à jour');
               }}
             />
           </div>
         );
       }

   return (
     <div className="space-y-6">
       {/* En-tête avec statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Total Élèves
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statistics.totalStudents}</div>
            <p className="text-blue-100 text-sm">Élèves inscrits</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statistics.totalClasses}</div>
            <p className="text-green-100 text-sm">Classes actives</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Moyenne/Classe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statistics.averageStudentsPerClass}</div>
            <p className="text-purple-100 text-sm">Élèves par classe</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Niveaux
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statistics.totalLevels}</div>
            <p className="text-orange-100 text-sm">Niveaux d'enseignement</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres avancés */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres Avancés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                         <div>
               <Label>Année Scolaire</Label>
                                                               <SchoolYearSelect
                   value={pendingFilters.schoolYear}
                   onValueChange={(value) => handleFilterChange('schoolYear', value)}
                   availableYears={availableSchoolYears}
                   currentSchoolYear={currentSchoolYear}
                   placeholder="Sélectionner l'année"
                 />
             </div>

                         <div>
               <Label>Niveau</Label>
                               <Select value={pendingFilters.level} onValueChange={(value) => handleFilterChange('level', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les niveaux</SelectItem>
                    {Object.keys(schoolStructure.levels || {}).map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>

             <div>
               <Label>Classe</Label>
                               <Select value={pendingFilters.class} onValueChange={(value) => handleFilterChange('class', value)} disabled={pendingFilters.level === 'all'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les classes</SelectItem>
                    {pendingFilters.level !== 'all' && schoolStructure.levels?.[pendingFilters.level]?.classes?.map(className => (
                      <SelectItem key={className} value={className}>{className}</SelectItem>
                    )) || []}
                  </SelectContent>
                </Select>
             </div>

                         <div>
               <Label>Statut</Label>
                               <Select value={pendingFilters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="Actif">Actif</SelectItem>
                    <SelectItem value="Pré-inscrit">Pré-inscrit</SelectItem>
                    <SelectItem value="Inactif">Inactif</SelectItem>
                    <SelectItem value="Renvoi">Renvoi</SelectItem>
                    <SelectItem value="Transféré">Transféré</SelectItem>
                    <SelectItem value="Diplômé">Diplômé</SelectItem>
                  </SelectContent>
                </Select>
             </div>

             <div>
               <Label>Genre</Label>
                               <Select value={pendingFilters.gender} onValueChange={(value) => handleFilterChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="Masculin">Masculin</SelectItem>
                    <SelectItem value="Féminin">Féminin</SelectItem>
                  </SelectContent>
                </Select>
             </div>

             <div>
               <Label>Tranche d'âge</Label>
                               <Select value={pendingFilters.ageRange} onValueChange={(value) => handleFilterChange('ageRange', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les tranches</SelectItem>
                    <SelectItem value="11 ans et moins">11 ans et moins</SelectItem>
                    <SelectItem value="12-13 ans">12-13 ans</SelectItem>
                    <SelectItem value="14-15 ans">14-15 ans</SelectItem>
                    <SelectItem value="16-17 ans">16-17 ans</SelectItem>
                    <SelectItem value="18 ans et plus">18 ans et plus</SelectItem>
                  </SelectContent>
                </Select>
             </div>

             <div>
               <Label>Date d'inscription</Label>
                               <Select value={pendingFilters.registrationDate} onValueChange={(value) => handleFilterChange('registrationDate', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les dates</SelectItem>
                    <SelectItem value="last7days">7 derniers jours</SelectItem>
                    <SelectItem value="last30days">30 derniers jours</SelectItem>
                    <SelectItem value="last90days">90 derniers jours</SelectItem>
                    <SelectItem value="thisYear">Cette année</SelectItem>
                  </SelectContent>
                </Select>
             </div>
          </div>

                                           <div className="flex justify-between items-center mt-4">
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleResetFilters}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Réinitialiser les filtres
                </Button>
                <Button onClick={handleApplyFilters} className="bg-blue-600 hover:bg-blue-700">
                  <Filter className="mr-2 h-4 w-4" />
                  Appliquer les filtres
                </Button>
              </div>
             <div className="flex gap-2">
               <Button variant="outline" onClick={() => handleExport('csv')}>
                 <Download className="mr-2 h-4 w-4" />
                 Exporter CSV
               </Button>
               <Button variant="outline" onClick={() => handleExport('pdf')}>
                 <FileText className="mr-2 h-4 w-4" />
                 Exporter PDF
               </Button>
             </div>
           </div>
        </CardContent>
      </Card>

      {/* Tableau des résultats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Résultats ({filteredStudents.length} élève(s))
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Lignes par page:</Label>
              <Select value={rowsPerPage.toString()} onValueChange={(value) => setRowsPerPage(Number(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Élève</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Genre</TableHead>
                  <TableHead>Âge</TableHead>
                  <TableHead>Date d'inscription</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                                                 <Avatar className="h-8 w-8">
                           <AvatarImage src={student.photoUrl} alt={student.nom} />
                           <AvatarFallback>{student.nom.charAt(0)}{student.prenom.charAt(0)}</AvatarFallback>
                         </Avatar>
                        <div>
                          <div className="font-medium">{student.nom} {student.prenom}</div>
                          <div className="text-sm text-muted-foreground">Matricule: {student.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        {student.classe}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(student.statut)}>
                        {student.statut}
                      </Badge>
                    </TableCell>
                    <TableCell>
                                             <div className="flex items-center gap-2">
                         {getGenderIcon(student.sexe)}
                         <span className="text-sm">{student.sexe}</span>
                       </div>
                    </TableCell>
                    <TableCell>
                      {calculateAge(student.dateNaissance)} ans
                    </TableCell>
                                         <TableCell>
                       {new Date(student.createdAt).toLocaleDateString('fr-FR')}
                     </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs">
                          <Phone className="h-3 w-3" />
                          {student.infoParent?.telephone || 'Non renseigné'}
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <Mail className="h-3 w-3" />
                          {student.infoParent?.email || 'Non renseigné'}
                        </div>
                      </div>
                    </TableCell>
                                         <TableCell className="text-center">
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() => handleViewStudentDetails(student)}
                         className="h-8 w-8 p-0"
                         title="Voir le dossier"
                       >
                         <Eye className="h-4 w-4" />
                       </Button>
                     </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Affichage de {((currentPage - 1) * rowsPerPage) + 1} à {Math.min(currentPage * rowsPerPage, filteredStudents.length)} sur {filteredStudents.length} élève(s)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="h-8 w-8 p-0"
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      
    </div>
  );
}

export default StudentReports;
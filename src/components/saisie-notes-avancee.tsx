'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2, BookOpen, Users, User, Calendar, FileText, Save, AlertCircle,
  CheckCircle, Search, TrendingUp, BarChart3, PieChart, Download,
  Upload, Filter, SortAsc, SortDesc, Eye, EyeOff, Calculator,
  Target, Award, Clock, CheckSquare, Square, Star, RefreshCw, Trash2, Edit,
  FileSpreadsheet, ChevronUp, ChevronDown, Layers, Home
} from 'lucide-react';
import { SchoolYearSelect } from '@/components/ui/school-year-select';
import { useToast } from '@/hooks/use-toast';
import { deduplicateSubjects, logDeduplicationInfo } from '@/utils/subjectUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Student {
  id: string;
  nom: string;
  prenom: string;
  name: string;
  code: string;
  className: string;
  levelName: string;
  schoolYear: string;
  status: string;
  sexe?: string;
}

interface Subject {
  id: string;
  name: string;
  coefficient: number;
  maxScore: number;
  classId: string;
  schoolYear: string;
}

interface EvaluationPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  schoolYear: string;
}

interface Grade {
  studentId: string;
  classId: string;
  schoolYear: string;
  subjectId: string;
  evaluationTypeId: string;
  evaluationPeriodId: string;
  score: number;
  maxScore: number;
  coefficient: number;
  assessment?: string;
  isSaved?: boolean; // Statut de sauvegarde
  originalScore?: number; // Score original pour détecter les modifications
  isModified?: boolean; // Indique si la note a été modifiée
  isCleared?: boolean; // Indique si la note a été effacée
  lastModified?: Date; // Date de dernière modification
}

interface GradeStatistics {
  totalStudents: number;
  gradedStudents: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  excellentRate: number;
}
interface User { id?: string; username?: string; fullName?: string; role?: string }

import { SchoolInfo } from '@/services/schoolInfoService';

export default function SaisieNotesAvancee({ currentUser, role, teacherId, schoolInfo, cachedSubjects, cachedSequences }: {
  currentUser?: User;
  role?: string;
  teacherId?: string,
  schoolInfo?: SchoolInfo | null,
  cachedSubjects?: any[],
  cachedSequences?: any[]
} = {}) {
  const { toast } = useToast();

  // États principaux
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [periods, setPeriods] = useState<EvaluationPeriod[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [selectedEvaluationType, setSelectedEvaluationType] = useState<string>('seq1');
  const [schoolYear, setSchoolYear] = useState<string>('2025-2026');
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [classes, setClasses] = useState<{ id: string, name: string }[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<any[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [existingGrades, setExistingGrades] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showSuccessDialog, setShowSuccessDialog] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [availableLevels, setAvailableLevels] = useState<string[]>([]);
  const [availableSchoolYears, setAvailableSchoolYears] = useState<string[]>([]);
  const [levelsData, setLevelsData] = useState<any[]>([]);
  // Pagination enseignants
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [studentsPerPage, setStudentsPerPage] = useState<number>(10);
  const [resolvedTeacherId, setResolvedTeacherId] = useState<string | null>(null);
  const [triedTeacherFallback, setTriedTeacherFallback] = useState(false);

  // Types d'évaluation simplifiés (6 séquences)
  const evaluationTypes = [
    { id: 'seq1', name: '1ère Séquence', weight: 1.00 },
    { id: 'seq2', name: '2ème Séquence', weight: 1.00 },
    { id: 'seq3', name: '3ème Séquence', weight: 1.00 },
    { id: 'seq4', name: '4ème Séquence', weight: 1.00 },
    { id: 'seq5', name: '5ème Séquence', weight: 1.00 },
    { id: 'seq6', name: '6ème Séquence', weight: 1.00 }
  ];

  // États pour la recherche et pagination
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<'name' | 'score' | 'percentage'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // États pour les fonctionnalités avancées
  const [showStatistics, setShowStatistics] = useState<boolean>(true);
  const [bulkEditMode, setBulkEditMode] = useState<boolean>(false);
  const [bulkScore, setBulkScore] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [gradeFilter, setGradeFilter] = useState<'all' | 'graded' | 'ungraded'>('all');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // États pour la boîte de dialogue d'édition
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [editingStudentId, setEditingStudentId] = useState<string>('');
  const [editingStudentName, setEditingStudentName] = useState<string>('');
  const [editingScore, setEditingScore] = useState<string>('');
  const [editingMaxScore, setEditingMaxScore] = useState<number>(20);

  const isTeacherUser = !!(teacherId || (currentUser && (role === 'Enseignant' || (currentUser.role || '').toLowerCase().includes('enseign'))));

  console.log('🔍 SAISIE NOTES - Vérification rôle enseignant:', {
    teacherId,
    currentUser,
    role,
    isTeacherUser,
    currentUserRole: currentUser?.role,
    roleCheck: role === 'Enseignant' || (currentUser?.role || '').toLowerCase().includes('enseign')
  });
  const getAssignmentsArray = useCallback((val: any): any[] => {
    if (Array.isArray(val)) return val;
    if (val && Array.isArray(val.data)) return val.data;
    return [];
  }, []);
  const normalize = useCallback((s: any): string => {
    if (!s || typeof s !== 'string') return '';
    return s
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/\s+/g, ' ');
  }, []);
  const hasClassAssignment = useMemo(() => {
    if (!isTeacherUser) return true;
    if (!selectedClassId && !selectedClass) return false;
    const arr = getAssignmentsArray(teacherAssignments);
    const classAssignments = arr.filter((a: any) => {
      const byId = a?.classId && a.classId === selectedClassId;
      const byName = a?.className && a.className === selectedClass;
      return byId || byName;
    });
    return classAssignments.length > 0;
  }, [isTeacherUser, teacherAssignments, selectedClassId, selectedClass, getAssignmentsArray]);

  // Fonction pour détecter si une note a été modifiée
  const isGradeModified = (grade: Grade, originalGrade?: any): boolean => {
    if (!originalGrade) return false;
    return grade.score !== originalGrade.score;
  };

  // Fonction pour obtenir le statut détaillé d'une note
  const getGradeStatus = (grade: Grade, originalGrade?: any) => {
    if (!grade) {
      return {
        text: 'Non saisie',
        class: 'bg-gray-50 text-gray-500',
        icon: null
      };
    }

    // Vérifier d'abord si la note a été effacée
    if (grade.isCleared) {
      return {
        text: 'Effacée',
        class: 'bg-red-100 text-red-800',
        icon: '🗑️'
      };
    }

    const isModified = isGradeModified(grade, originalGrade);

    if (grade.isSaved) {
      if (isModified) {
        return {
          text: 'Modifiée',
          class: 'bg-orange-100 text-red-800',
          icon: '🔄'
        };
      } else {
        return {
          text: '', // Masquer le texte "Sauvegardée"
          class: 'bg-green-100 text-green-800',
          icon: '✅'
        };
      }
    } else {
      if (isModified) {
        return {
          text: 'Modifiée (non sauvegardée)',
          class: 'bg-yellow-100 text-yellow-800',
          icon: '⚠️'
        };
      } else {
        return {
          text: 'Non sauvegardée',
          class: 'bg-blue-100 text-blue-800',
          icon: '💾'
        };
      }
    }
  };

  // Calculer les statistiques
  const statistics = useMemo((): GradeStatistics => {
    const currentGrades = grades.filter(g =>
      g.subjectId === selectedSubject && g.evaluationPeriodId === selectedPeriod
    );

    const totalStudents = students.length;
    const gradedStudents = currentGrades.length;
    const scores = currentGrades.map(g => g.score);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

    const subject = subjects.find(s => s.id === selectedSubject);
    const maxScore = subject?.maxScore || 20;
    const passThreshold = maxScore * 0.5; // 50% pour réussir
    const excellentThreshold = maxScore * 0.8; // 80% pour excellent

    const passCount = scores.filter(s => s >= passThreshold).length;
    const excellentCount = scores.filter(s => s >= excellentThreshold).length;

    return {
      totalStudents,
      gradedStudents,
      averageScore: Math.round(averageScore * 100) / 100,
      highestScore,
      lowestScore,
      passRate: totalStudents > 0 ? (passCount / totalStudents) * 100 : 0,
      excellentRate: totalStudents > 0 ? (excellentCount / totalStudents) * 100 : 0
    };
  }, [grades, students, selectedSubject, selectedPeriod, subjects]);

  // Fonction pour sauvegarder les notes dans localStorage
  const saveGradesToLocalStorage = (gradesToSave: Grade[]) => {
    try {
      const key = `grades_${selectedClass}_${selectedSubject}_${selectedPeriod}_${schoolYear}`;
      localStorage.setItem(key, JSON.stringify(gradesToSave));
      console.log('💾 Notes sauvegardées dans localStorage:', key, gradesToSave.length);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde dans localStorage:', error);
    }
  };

  // Fonction pour charger les notes depuis localStorage
  const loadGradesFromLocalStorage = (): Grade[] => {
    try {
      const key = `grades_${selectedClass}_${selectedSubject}_${selectedPeriod}_${schoolYear}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsedGrades = JSON.parse(saved);
        console.log('📦 Notes chargées depuis localStorage:', key, parsedGrades);
        return parsedGrades;
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement depuis localStorage:', error);
    }
    return [];
  };

  // Fonction pour nettoyer les notes du localStorage après sauvegarde
  const clearGradesFromLocalStorage = () => {
    try {
      const key = `grades_${selectedClass}_${selectedSubject}_${selectedPeriod}_${schoolYear}`;
      localStorage.removeItem(key);
      console.log('🗑️ Notes supprimées du localStorage:', key);
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du localStorage:', error);
    }
  };

  // Charger les données initiales
  useEffect(() => {
    loadInitialData();
  }, [schoolInfo, schoolYear]);

  // Gestion du chargement des affectations pour les enseignants
  useEffect(() => {
    const currentUserId = currentUser?.id;
    const currentUserRole = currentUser?.role || role;
    const isTeacher = currentUserRole === 'Enseignant' || role === 'Enseignant';

    // Pour les Admins, on ne bloque pas sur les affectations
    if (!isTeacher) {
      console.log('🔓 SAISIE NOTES - Mode Admin détecté, pas de blocage sur les affectations');
      setIsLoadingAssignments(false);
      setTeacherAssignments([]); // Reset affectations pour éviter tout filtrage résiduel
      return;
    }

    const teacherIdToUse = resolvedTeacherId || teacherId || currentUserId;
    if (!teacherIdToUse) {
      console.warn('⚠️ SAISIE NOTES - Mode enseignant actif mais aucun ID trouvé');
      setIsLoadingAssignments(false);
      return;
    }

    const reloadAssignments = async () => {
      setIsLoadingAssignments(true);
      try {
        console.log('🔍 SAISIE NOTES - Chargement des affectations pour Enseignant:', teacherIdToUse);
        const { getTeacherAssignments } = await import('@/services/personnelService');
        const assignments = await getTeacherAssignments(teacherIdToUse);
        const assignmentsData = assignments as any;
        const assignmentsArray = Array.isArray(assignmentsData) ? assignmentsData : (assignmentsData && Array.isArray(assignmentsData.data) ? assignmentsData.data : []);

        setTeacherAssignments(assignmentsArray);
        console.log('🔍 SAISIE NOTES - Affectations chargées avec succès:', assignmentsArray.length);
      } catch (e) {
        console.error('❌ SAISIE NOTES - Erreur lors du chargement des affectations:', e);
      } finally {
        setIsLoadingAssignments(false);
      }
    };

    reloadAssignments();
  }, [resolvedTeacherId, teacherId, currentUser?.id, role]);

  // Recharger les notes quand on revient à cette section ou change de contexte
  useEffect(() => {
    if (selectedClass && selectedSubject && selectedPeriod) {
      console.log('🔄 Rechargement des notes pour le contexte:', { selectedClass, selectedSubject, selectedPeriod, schoolYear });

      const timer = setTimeout(async () => {
        // CORRECTION : Charger UNIQUEMENT depuis la base de données et utiliser le résultat
        const fetchedGrades = await loadExistingGrades();
        console.log('📊 Notes récupérées de la base:', fetchedGrades);

        // CORRECTION : Utiliser les données fraîchement récupérées pour la logique localStorage
        if (fetchedGrades.length === 0) {
          console.log('📝 Aucune note en base, utilisation du localStorage');
          const localGrades = loadGradesFromLocalStorage();
          if (localGrades.length > 0) {
            setGrades(prev => {
              const otherContextGrades = prev.filter(g =>
                !(g.subjectId === selectedSubject && g.evaluationPeriodId === selectedPeriod)
              );
              return [...otherContextGrades, ...localGrades];
            });
          }
        } else {
          console.log('📝 Notes trouvées en base, nettoyage du localStorage');
          // Nettoyer le localStorage si on a des notes en base
          clearGradesFromLocalStorage();
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [selectedClass, selectedSubject, selectedPeriod, schoolYear]);

  // Charger les matières pour la classe sélectionnée, en filtrant par affectations si nécessaire
  const loadSubjectsForClass = async (classId: string) => {
    if (!classId) {
      setSubjects([]);
      return;
    }

    setIsLoadingSubjects(true);
    setError('');

    try {
      console.log('🔍 LOAD SUBJECTS - Début chargement pour classId:', classId);

      // Filtrage par affectations si Enseignant
      let assignments = [];
      if (isTeacherUser) {
        assignments = getAssignmentsArray(teacherAssignments);
        console.log('🔍 LOAD SUBJECTS - Mode Enseignant, affectations:', assignments.length);

        // Si vide, on ne charge rien (le useEffect parent gère le re-trigger quand chargé)
        if (assignments.length === 0) {
          console.warn('⚠️ LOAD SUBJECTS - Aucune affectation, bloqué');
          setSubjects([]);
          return;
        }
      }

      // 1. Essayer le cache global
      if (cachedSubjects && cachedSubjects.length > 0) {
        let list = cachedSubjects.filter(s => String(s.classId) === String(classId));
        console.log('📦 LOAD SUBJECTS - Cache global utilisé:', list.length);

        if (isTeacherUser) {
          const classAssignments = assignments.filter((a: any) =>
            (a?.classId && String(a.classId) === String(classId)) ||
            (a?.className && a.className === selectedClass)
          );
          const assignedSet = new Set(classAssignments.map((a: any) => normalize(a.subject || a.subjectName)));
          list = list.filter((s: any) => assignedSet.has(normalize(s.name)));
        }

        setSubjects(list);
        if (isTeacherUser && list.length === 0) {
          setError("Aucune matière assignée trouvée pour cette classe.");
        }
        return;
      }

      // 2. Sinon, appel API
      console.log('🌐 LOAD SUBJECTS - Appel API concaténé');
      const resp = await fetch(`/api/subjects?classId=${encodeURIComponent(classId)}&schoolYear=${encodeURIComponent(schoolYear)}`);
      if (!resp.ok) throw new Error('Erreur API sujets');

      const list = await resp.json();
      const allSubjects = Array.isArray(list) ? list : (Array.isArray(list?.data) ? list.data : []);

      let filtered = allSubjects.filter((s: any) => s.isActive === 1 || s.isActive === true);

      if (isTeacherUser) {
        const classAssignments = assignments.filter((a: any) =>
          (a?.classId && String(a.classId) === String(classId)) ||
          (a?.className && a.className === selectedClass)
        );
        const assignedSet = new Set(classAssignments.map((a: any) => normalize(a.subject || a.subjectName)));
        filtered = filtered.filter((s: any) => assignedSet.has(normalize(s.name)));
      }

      setSubjects(filtered.map((s: any) => ({
        id: s.id,
        name: s.name,
        coefficient: s.coefficient || 1,
        maxScore: s.maxScore || 20,
        classId: classId,
        schoolYear
      })));

      if (isTeacherUser && filtered.length === 0) {
        setError("Votre compte n'est pas assigné aux matières de cette classe.");
      }

    } catch (e) {
      console.error('❌ LOAD SUBJECTS ERROR:', e);
      setError('Erreur lors du chargement des matières');
      setSubjects([]);
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  useEffect(() => {
    if (selectedClassId) {
      loadSubjectsForClass(selectedClassId);
    } else {
      setSubjects([]);
    }
  }, [selectedClassId, teacherAssignments, schoolYear]);

  // Sauvegarder les notes dans localStorage quand elles changent
  useEffect(() => {
    if (selectedClass && selectedSubject && selectedPeriod && grades.length > 0) {
      const contextGrades = grades.filter(g =>
        g.subjectId === selectedSubject && g.evaluationPeriodId === selectedPeriod
      );

      if (contextGrades.length > 0) {
        // CORRECTION : Ne sauvegarder que les notes non sauvegardées
        const unsavedGrades = contextGrades.filter(g => !g.isSaved);
        if (unsavedGrades.length > 0) {
          saveGradesToLocalStorage(unsavedGrades);
        }
      }
    }
  }, [grades, selectedClass, selectedSubject, selectedPeriod, schoolYear]);

  // Calculer les élèves à afficher pour la pagination
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  const loadInitialData = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Charger l'année scolaire actuelle et les années disponibles
      const schoolResponse = await fetch('/api/school/info');
      if (!schoolResponse.ok) {
        throw new Error('Impossible de charger les informations de l\'école');
      }
      const schoolInfo = await schoolResponse.json();
      setSchoolYear(schoolInfo.currentSchoolYear || '2025-2026');

      // Charger les années scolaires disponibles
      const yearsResponse = await fetch('/api/finance/school-years');
      if (yearsResponse.ok) {
        const yearsData = await yearsResponse.json();
        setAvailableSchoolYears(yearsData.availableYears || []);
      } else {
        const currentYear = new Date().getFullYear();
        setAvailableSchoolYears([
          `${currentYear - 1}-${currentYear}`,
          `${currentYear}-${currentYear + 1}`,
          `${currentYear + 1}-${currentYear + 2}`
        ]);
      }

      // Charger les niveaux et classes
      console.log('🔍 Chargement des niveaux et classes...');
      const levelsResponse = await fetch('/api/school/levels-with-classes');

      if (levelsResponse.ok) {
        const levelsDataResponse = await levelsResponse.json();

        if (Array.isArray(levelsDataResponse)) {
          setLevelsData(levelsDataResponse);
          const levels = levelsDataResponse.map((level: any) => level.name);
          setAvailableLevels(levels);
        } else {
          setLevelsData([]);
          setAvailableLevels([]);
        }
      } else {
        setLevelsData([]);
        setAvailableLevels([]);
      }

      // Charger les périodes d'évaluation (Séquences)
      const yearToUse = schoolInfo?.currentSchoolYear || schoolYear || '2025-2026';
      if (schoolInfo?.currentSchoolYear) {
        setSchoolYear(schoolInfo.currentSchoolYear);
      }

      if (cachedSequences && cachedSequences.length > 0) {
        console.log(`📦 SaisieNotes: Utilisation du cache (${cachedSequences.length} séquences)`);
        // Filtrer uniquement les séquences actives ET qui sont bien des séquences (pas des trimestres)
        setPeriods(cachedSequences.filter((p: any) => (p.isActive === 1 || p.isActive === true) && String(p.name || '').toLowerCase().includes('séquence')));
      } else {
        const periodsResponse = await fetch(`/api/evaluation-periods/sequences?schoolYear=${encodeURIComponent(yearToUse)}`);
        if (periodsResponse.ok) {
          const segments = await periodsResponse.json();
          const allSegments = Array.isArray(segments) ? segments : [];
          // Filtrer uniquement les séquences actives ET qui sont bien des séquences
          setPeriods(allSegments.filter((p: any) => (p.isActive === 1 || p.isActive === true) && String(p.name || '').toLowerCase().includes('séquence')));
        }
      }

      toast({
        title: "Données chargées",
        description: "Configuration initiale terminée avec succès",
      });

      // Si l'utilisateur est un enseignant, charger ses affectations (même logique que Mes Classes)
      if (teacherId || (currentUser && (role === 'Enseignant' || (currentUser.role || '').toLowerCase().includes('enseign')))) {
        try {
          const tId = teacherId || currentUser?.id;
          console.log('🔍 SAISIE NOTES - Chargement affectations pour teacherId:', tId);
          console.log('🔍 SAISIE NOTES - Utilisation de la logique Mes Classes');

          if (tId) {
            // Utiliser la même logique que Mes Classes : getTeacherAssignments depuis le service
            const { getTeacherAssignments } = await import('@/services/personnelService');
            const assignments = await getTeacherAssignments(tId);
            const assignmentsArray = Array.isArray(assignments) ? assignments : [];

            console.log('🔍 SAISIE NOTES - Affectations chargées via service:', assignmentsArray);
            console.log('🔍 SAISIE NOTES - Nombre d\'affectations:', assignmentsArray.length);

            if (assignmentsArray.length > 0) {
              console.log('🔍 SAISIE NOTES - Détail des affectations:');
              assignmentsArray.forEach((a: any, i: number) => {
                console.log(`🔍 SAISIE NOTES - Affectation ${i + 1}:`, {
                  id: a.id,
                  teacherId: a.teacherId,
                  classId: a.classId,
                  className: a.className,
                  subject: a.subject,
                  subjectName: a.subjectName,
                  isMainTeacher: a.isMainTeacher,
                  hoursPerWeek: a.hoursPerWeek
                });
              });
            } else {
              console.warn('🔍 SAISIE NOTES - ATTENTION: Aucune affectation trouvée pour cet enseignant!');
              console.log('🔍 SAISIE NOTES - Tentative de fallback par username/fullName...');

              // Fallback: si aucune affectation avec teacherId, essayer de résoudre par username/nom
              if (!triedTeacherFallback && currentUser) {
                try {
                  const { getTeachers } = await import('@/services/personnelService');
                  const raw = await getTeachers().catch(() => []);
                  const teachers = Array.isArray(raw) ? raw : (Array.isArray((raw as any)?.data) ? (raw as any).data : []);

                  const match = (teachers as any[]).find((t: any) => {
                    if (currentUser.username && t.username && t.username.toLowerCase() === currentUser.username.toLowerCase()) return true;
                    if (currentUser.fullName && t.fullName && t.fullName.toLowerCase() === currentUser.fullName.toLowerCase()) return true;
                    return false;
                  });

                  if (match?.id && match.id !== tId) {
                    console.log('🔍 SAISIE NOTES - Fallback réussi, nouvel ID trouvé:', match.id);
                    setResolvedTeacherId(match.id);

                    // Recharger avec le nouvel ID
                    const fallbackAssignments = await getTeacherAssignments(match.id);
                    const fallbackArray = Array.isArray(fallbackAssignments) ? fallbackAssignments : [];
                    console.log('🔍 SAISIE NOTES - Affectations après fallback:', fallbackArray);
                    setTeacherAssignments(fallbackArray);
                  } else {
                    console.log('🔍 SAISIE NOTES - Aucun fallback possible');
                  }
                } catch (fallbackError) {
                  console.error('🔍 SAISIE NOTES - Erreur lors du fallback:', fallbackError);
                } finally {
                  setTriedTeacherFallback(true);
                }
              }
            }

            // Si on n'a pas fait de fallback ou si le fallback n'a pas marché, utiliser les affectations normales
            if (!resolvedTeacherId || assignmentsArray.length > 0) {
              setTeacherAssignments(assignmentsArray);
            }
          } else {
            console.warn('🔍 SAISIE NOTES - ATTENTION: Aucun teacherId trouvé pour charger les affectations!');
          }
        } catch (e) {
          console.error('🔍 SAISIE NOTES - Exception lors du chargement des affectations:', e);
        }
      } else {
        console.log('🔍 SAISIE NOTES - Utilisateur non-enseignant, pas de chargement d\'affectations');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données initiales:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors du chargement des données');
      toast({
        title: "Erreur",
        description: "Impossible de charger les données initiales",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les classes quand un niveau est sélectionné
  useEffect(() => {
    if (selectedLevel) {
      const loadClassesForLevel = async () => {
        try {
          setError('');

          const selectedLevelData = levelsData.find((level: any) => level.name === selectedLevel);

          if (selectedLevelData) {
            const levelClasses = selectedLevelData.classes.map((cls: any) => ({ id: cls.id, name: cls.name }));
            setClasses(levelClasses);

            if (levelClasses.length === 0) {
              toast({
                title: "Aucune classe trouvée",
                description: `Aucune classe configurée pour le niveau ${selectedLevel}`,
              });
            }
          } else {
            setClasses([]);
          }
        } catch (error) {
          console.error('Erreur lors du chargement des classes:', error);
          setError('Erreur lors du chargement des classes');
          toast({
            title: "Erreur",
            description: "Impossible de charger les classes",
            variant: "destructive",
          });
        }
      };
      loadClassesForLevel();
    } else {
      setClasses([]);
      setSelectedClass('');
      setSelectedClassId('');
    }
  }, [selectedLevel, levelsData]);

  // Charger les élèves quand une classe est sélectionnée
  useEffect(() => {
    if (selectedClass) {
      loadStudents();
      setGrades([]);
      setExistingGrades([]);
    } else {
      setStudents([]);
      setGrades([]);
      setExistingGrades([]);
    }
  }, [selectedClass, schoolYear]);

  // Charger les matières quand une classe est sélectionnée
  useEffect(() => {
    if (!selectedClassId) {
      setSubjects([]);
      setSelectedSubject('');
      return;
    }

    // Cas 1: Admin ou autre rôle -> On charge tout immédiatement
    if (!isTeacherUser) {
      console.log('🔓 UI - Mode Admin: Chargement immédiat des matières');
      loadSubjects();
      return;
    }

    // Cas 2: Enseignant -> On attend les affectations
    if (isLoadingAssignments) {
      console.log('⏳ UI - Mode Enseignant: Attente des affectations...');
      return;
    }

    // Cas 3: Affectations chargées (même si vides) -> On charge et on laisse loadSubjects filtrer
    console.log('✅ UI - Affectations confirmées, chargement des matières');
    loadSubjects();

  }, [selectedClassId, schoolYear, isTeacherUser, isLoadingAssignments]);

  // Helper: déterminer si un élève est actif selon plusieurs conventions possibles
  const isStudentActive = (stu: any): boolean => {
    if (!stu) return false;
    // Booléens explicites
    if (typeof stu.isActive === 'boolean') return stu.isActive;
    if (typeof stu.active === 'boolean') return stu.active;

    // Statut textuel (divers formats possibles)
    if (stu.status !== undefined && stu.status !== null) {
      const s = String(stu.status).toLowerCase();
      return [
        'active', 'actif', 'a', '1', 'true', 'enabled', 'inscrit'
      ].includes(s) || s.startsWith('act');
    }

    if (stu.state !== undefined && stu.state !== null) {
      const s = String(stu.state).toLowerCase();
      return ['active', 'a', '1', 'true'].includes(s);
    }

    // Si aucune information de statut, on suppose actif (pour compatibilité)
    return true;
  };

  const filterActiveStudents = (arr: any[]) => Array.isArray(arr) ? arr.filter(isStudentActive) : [];

  // Charger les périodes d'évaluation quand l'année scolaire change
  useEffect(() => {
    if (schoolYear) {
      const loadPeriods = async () => {
        try {
          setError('');
          const response = await fetch(`/api/evaluation-periods?schoolYear=${schoolYear}`);
          if (!response.ok) {
            throw new Error('Impossible de charger les périodes d\'évaluation');
          }
          const periodsData = await response.json();
          const sequences = periodsData.filter((period: any) => period.name && period.name.toLowerCase().includes('séquence'));
          // Filtrer uniquement les séquences actives
          const activeSequences = sequences.filter((s: any) => s.isActive === 1 || s.isActive === true);
          setPeriods(activeSequences);

          if (sequences.length === 0) {
            toast({
              title: "Aucune séquence trouvée",
              description: `Aucune séquence configurée pour l'année ${schoolYear}`,
            });
          }
        } catch (error) {
          console.error('Erreur lors du chargement des périodes:', error);
          setError('Erreur lors du chargement des périodes');
          toast({
            title: "Erreur",
            description: "Impossible de charger les périodes d'évaluation",
            variant: "destructive",
          });
        }
      };
      loadPeriods();
    } else {
      setPeriods([]);
    }
  }, [schoolYear]);

  // CORRECTION : Charger les notes existantes sans vider l'état local
  useEffect(() => {
    if (selectedClass && selectedSubject && selectedPeriod) {
      loadExistingGrades();
    } else {
      setExistingGrades([]);
    }
  }, [selectedClass, selectedSubject, selectedPeriod]);

  // CORRECTION : Recharger les notes sauvegardées sans conflit
  useEffect(() => {
    if (selectedClass && selectedSubject && selectedPeriod) {
      console.log('🔍 Contexte changé, notes sauvegardées disponibles');
    }
  }, [selectedClass, selectedSubject, selectedPeriod, selectedClassId, schoolYear]);

  // CORRECTION : Rechargement automatique des notes existantes lors du changement de contexte
  useEffect(() => {
    if (selectedClassId && selectedSubject && selectedPeriod) {
      console.log('🔍 Contexte changé, rechargement des notes existantes...');
      loadExistingGrades();
    }
  }, [selectedClassId, selectedSubject, selectedPeriod]);

  // CORRECTION : Mise à jour de l'affichage et filtres (toujours actif)
  useEffect(() => {
    setFilteredStudents(prev => {
      let filtered = students;
      if (searchTerm.trim() !== '') {
        filtered = filtered.filter(student =>
          student.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.code.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      if (gradeFilter !== 'all') {
        filtered = filtered.filter(student => {
          const grade = getGradeForStudent(student.id);
          if (gradeFilter === 'graded') return grade !== null;
          if (gradeFilter === 'ungraded') return grade === null;
          return true;
        });
      }
      filtered.sort((a, b) => {
        const gradeA = getGradeForStudent(a.id);
        const gradeB = getGradeForStudent(b.id);
        const subject = subjects.find(s => s.id === selectedSubject);
        const maxScore = subject?.maxScore || 20;
        let valueA: any;
        let valueB: any;
        switch (sortField) {
          case 'name':
            valueA = `${a.nom} ${a.prenom}`.toLowerCase();
            valueB = `${b.nom} ${b.prenom}`.toLowerCase();
            break;
          case 'score':
            valueA = gradeA?.score || 0;
            valueB = gradeB?.score || 0;
            break;
          case 'percentage':
            valueA = gradeA ? (gradeA.score / maxScore) * 100 : 0;
            valueB = gradeB ? (gradeB.score / maxScore) * 100 : 0;
            break;
        }
        if (sortDirection === 'asc') return valueA > valueB ? 1 : -1;
        return valueA < valueB ? 1 : -1;
      });
      return filtered;
    });
  }, [grades, students, searchTerm, gradeFilter, sortField, sortDirection, selectedSubject, selectedPeriod, subjects]);

  // NOUVEAU : useEffect pour forcer le rafraîchissement de l'affichage
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('🔄 RefreshTrigger activé, mise à jour forcée de l\'affichage...');
      // Forcer la mise à jour de l'affichage en recalculant filteredStudents
      setFilteredStudents(prev => {
        let filtered = students;

        // Filtre par recherche
        if (searchTerm.trim() !== '') {
          filtered = filtered.filter(student =>
            student.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.code.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        // Filtre par statut des notes
        if (gradeFilter !== 'all') {
          filtered = filtered.filter(student => {
            const grade = getGradeForStudent(student.id);
            if (gradeFilter === 'graded') return grade !== null;
            if (gradeFilter === 'ungraded') return grade === null;
            return true;
          });
        }

        // Tri
        filtered.sort((a, b) => {
          const gradeA = getGradeForStudent(a.id);
          const gradeB = getGradeForStudent(b.id);
          const subject = subjects.find(s => s.id === selectedSubject);
          const maxScore = subject?.maxScore || 20;

          let valueA, valueB;

          switch (sortField) {
            case 'name':
              valueA = `${a.nom} ${a.prenom}`.toLowerCase();
              valueB = `${b.nom} ${b.prenom}`.toLowerCase();
              break;
            case 'score':
              valueA = gradeA?.score || 0;
              valueB = gradeB?.score || 0;
              break;
            case 'percentage':
              valueA = gradeA ? (gradeA.score / maxScore) * 100 : 0;
              valueB = gradeB ? (gradeB.score / maxScore) * 100 : 0;
              break;
          }

          if (sortDirection === 'asc') {
            return valueA > valueB ? 1 : -1;
          } else {
            return valueA < valueB ? 1 : -1;
          }
        });

        return filtered;
      });
    }
  }, [refreshTrigger, students, searchTerm, gradeFilter, sortField, sortDirection, selectedSubject, selectedPeriod, subjects]);

  // CORRECTION : Persistance automatique optimisée pour éviter les rechargements multiples
  useEffect(() => {
    if (selectedClass && selectedSubject && selectedPeriod && schoolYear) {
      console.log('🔄 Persistance automatique : chargement des notes sauvegardées...');

      // Charger les notes depuis la base de données
      const loadPersistedGrades = async () => {
        try {
          await loadExistingGrades();
          console.log('📝 Notes chargées depuis la base de données uniquement');
        } catch (error) {
          console.error('❌ Erreur lors du chargement des notes persistées:', error);
        }
      };

      loadPersistedGrades();
    }
  }, [selectedClass, selectedSubject, selectedPeriod, schoolYear]);

  const loadStudents = async () => {
    try {
      setError('');
      console.log('🔍 Chargement des élèves pour la classe:', selectedClass);

      const url = `/api/students?classId=${selectedClassId}&schoolYear=${schoolYear}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Impossible de charger les élèves: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const activeOnly = filterActiveStudents(data || []);
      console.log(`🔍 Élèves trouvés: ${(data || []).length}, actifs retenus: ${activeOnly.length}`);
      setStudents(activeOnly);
      setCurrentPage(1);

      if (!data || data.length === 0 || activeOnly.length === 0) {
        toast({
          title: "Aucun élève actif trouvé",
          description: `Aucun élève actif trouvé pour la classe ${selectedClass}`,
        });
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des élèves:', error);
      setError('Erreur lors du chargement des élèves');
      toast({
        title: "Erreur",
        description: "Impossible de charger les élèves",
        variant: "destructive",
      });
    }
  };

  // Déléguons l'ancien loadSubjects vers la nouvelle implémentation
  const loadSubjects = async () => {
    await loadSubjectsForClass(selectedClassId);
  };

  // CORRECTION : Fonction simplifiée et corrigée pour charger les notes existantes
  const loadExistingGrades = async () => {
    try {
      setError('');
      console.log('🔍 Chargement des notes existantes...');

      if (!selectedClassId || !selectedSubject || !selectedPeriod || !schoolYear) {
        console.log('⚠️ Paramètres manquants pour le chargement des notes');
        return [];
      }

      const url = `/api/grades/?classId=${selectedClassId}&subjectId=${selectedSubject}&evaluationPeriodId=${selectedPeriod}&schoolYear=${schoolYear}`;
      console.log('🔍 Paramètres de recherche:', { selectedClassId, selectedSubject, selectedPeriod, schoolYear, url });

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Notes récupérées de la base:', data);

      // DEBUG : Analyser la structure des données reçues
      if (data && data.length > 0) {
        console.log('🔍 DEBUG - Structure de la première note:', {
          studentId: data[0].studentId,
          subjectId: data[0].subjectId,
          evaluationPeriodId: data[0].evaluationPeriodId,
          score: data[0].score,
          maxScore: data[0].maxScore,
          types: {
            studentId: typeof data[0].studentId,
            subjectId: typeof data[0].subjectId,
            evaluationPeriodId: typeof data[0].evaluationPeriodId
          }
        });
      }

      // CORRECTION : Mettre à jour existingGrades
      setExistingGrades(data || []);

      // If no grades exist yet for this subject/period, create placeholder grade objects
      // so the UI can render inputs for each student immediately.
      if ((!data || data.length === 0) && students && students.length > 0) {
        // Ne créer des placeholders qu'à partir des élèves actifs déjà chargés
        const activeStudents = filterActiveStudents(students);
        if (!activeStudents || activeStudents.length === 0) {
          console.log('⚠️ Aucune élève actif disponible pour créer des placeholders');
        } else {
          console.log('📝 Aucune note en base pour cette matière - création de placeholders (élèves actifs)');
          const subject = subjects.find(s => s.id === selectedSubject);
          const placeholders: Grade[] = activeStudents.map((stu) => ({
            studentId: stu.id,
            classId: selectedClassId,
            schoolYear,
            subjectId: selectedSubject,
            evaluationTypeId: selectedEvaluationType,
            evaluationPeriodId: selectedPeriod,
            score: 0,
            maxScore: subject?.maxScore || 20,
            coefficient: subject?.coefficient || 1,
            isSaved: false,
            originalScore: undefined,
            isModified: false,
            isCleared: false,
            lastModified: new Date()
          }));

          // Merge placeholders but avoid duplicate entries
          setGrades(prev => {
            const otherContextGrades = prev.filter(g =>
              !(g.subjectId === selectedSubject && g.evaluationPeriodId === selectedPeriod)
            );
            return [...otherContextGrades, ...placeholders];
          });
        }
      }

      // CORRECTION : Fusionner les notes existantes avec les notes locales
      setGrades(prev => {
        // Garder les notes d'autres contextes
        const otherContextGrades = prev.filter(g =>
          !(g.subjectId === selectedSubject && g.evaluationPeriodId === selectedPeriod)
        );

        // Convertir les notes de la base en format local
        const convertedGrades = (data || []).map((grade: any) => ({
          studentId: grade.studentId,
          classId: grade.classId,
          schoolYear: grade.schoolYear,
          subjectId: grade.subjectId,
          evaluationTypeId: grade.evaluationTypeId || grade.evaluationPeriodId,
          evaluationPeriodId: grade.evaluationPeriodId,
          score: grade.score,
          maxScore: grade.maxScore,
          coefficient: grade.coefficient,
          assessment: grade.assessment,
          isSaved: true // CORRECTION : Marquer comme sauvegardée
        }));

        // Garder les notes locales non sauvegardées
        const localUnsavedGrades = prev.filter(g =>
          g.subjectId === selectedSubject &&
          g.evaluationPeriodId === selectedPeriod &&
          !g.isSaved
        );

        // Fusionner en priorisant les notes locales non sauvegardées
        const mergedGrades = [...otherContextGrades, ...convertedGrades, ...localUnsavedGrades];

        // Éliminer les doublons en gardant la priorité aux notes locales
        const uniqueGrades = mergedGrades.filter((grade, index, self) => {
          const firstIndex = self.findIndex(g =>
            g.studentId === grade.studentId &&
            g.subjectId === grade.subjectId &&
            g.evaluationPeriodId === grade.evaluationPeriodId
          );
          return index === firstIndex;
        });

        console.log('🔍 État final des notes après fusion:', uniqueGrades);
        return uniqueGrades;
      });

      return data || [];

    } catch (error) {
      console.error('❌ Erreur lors du chargement des notes existantes:', error);
      setError('Erreur lors du chargement des notes existantes');
      toast({
        title: "Erreur",
        description: "Impossible de charger les notes existantes",
        variant: "destructive",
      });
      return [];
    }
  };

  // CORRECTION : Fonction simplifiée pour récupérer les notes d'un élève
  const getGradeForStudent = (studentId: string) => {
    // Recherche dans l'état local (priorité aux modifications en cours)
    const localGrade = grades.find(g =>
      g.studentId === studentId &&
      g.subjectId === selectedSubject &&
      g.evaluationPeriodId === selectedPeriod
    );

    if (localGrade) {
      return localGrade;
    }

    // Si pas de note locale, chercher dans les notes existantes
    const existingGrade = existingGrades.find(g =>
      g.studentId === studentId &&
      g.subjectId === selectedSubject &&
      g.evaluationPeriodId === selectedPeriod
    );

    if (existingGrade) {
      return {
        studentId: existingGrade.studentId,
        classId: existingGrade.classId,
        schoolYear: existingGrade.schoolYear,
        subjectId: existingGrade.subjectId,
        evaluationTypeId: existingGrade.evaluationTypeId || existingGrade.evaluationPeriodId,
        evaluationPeriodId: existingGrade.evaluationPeriodId,
        score: existingGrade.score,
        maxScore: existingGrade.maxScore,
        coefficient: existingGrade.coefficient,
        assessment: existingGrade.assessment,
        isSaved: true
      };
    }

    return null;
  };

  // CORRECTION : Fonction simplifiée pour la recherche par code matricule
  const getGradeForStudentByCode = (studentId: string) => {
    return getGradeForStudent(studentId);
  };

  const handleGradeChange = (studentId: string, newScore: string) => {
    // Si la note est vide ou invalide, on la traite comme une suppression
    if (!newScore || newScore.trim() === '') {
      handleGradeClear(studentId);
      return;
    }

    const numericScore = parseFloat(newScore);

    if (isNaN(numericScore) || numericScore < 0) {
      // Si la note est invalide, on ne fait rien
      return;
    }

    const subject = subjects.find(s => s.id === selectedSubject);
    if (!subject) return;

    const maxScore = subject.maxScore;

    if (numericScore > maxScore) {
      toast({
        title: "Note invalide",
        description: `La note ne peut pas dépasser ${maxScore}`,
        variant: "destructive",
      });
      return;
    }

    // Trouver l'élève pour obtenir son code matricule
    const student = students.find(s => s.id === studentId);

    // CORRECTION : Chercher la note existante avec l'ID ET le code matricule
    const existingGrade = existingGrades.find(g =>
      (g.studentId === studentId || g.studentId === student?.code) &&
      g.subjectId === selectedSubject &&
      g.evaluationPeriodId === selectedPeriod
    );

    const newGrade: Grade = {
      studentId,
      classId: selectedClassId,
      schoolYear,
      subjectId: selectedSubject,
      evaluationTypeId: selectedEvaluationType,
      evaluationPeriodId: selectedPeriod,
      score: numericScore,
      maxScore,
      coefficient: subject.coefficient,
      isSaved: false,
      originalScore: existingGrade?.score, // Garder le score original
      isModified: existingGrade ? numericScore !== existingGrade.score : true, // Détecter si modifié
      isCleared: false, // Note non effacée
      lastModified: new Date()
    };

    setGrades(prev => {
      // CORRECTION : Chercher dans l'état local avec l'ID ET le code matricule
      const existing = prev.findIndex(g =>
        (g.studentId === studentId || g.studentId === student?.code) &&
        g.subjectId === selectedSubject &&
        g.evaluationPeriodId === selectedPeriod
      );

      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newGrade;
        console.log('✅ Note mise à jour dans l\'état:', updated);
        return updated;
      } else {
        const newGrades = [...prev, newGrade];
        console.log('✅ Nouvelle note ajoutée à l\'état:', newGrades);
        return newGrades;
      }
    });

    console.log('🔄 Note mise à jour sans forcer le refresh');
  };

  // NOUVELLE FONCTION : Effacer explicitement une note
  const handleGradeClear = (studentId: string) => {
    // Trouver l'élève pour obtenir son code matricule
    const student = students.find(s => s.id === studentId);

    // CORRECTION : Chercher la note existante avec l'ID ET le code matricule
    const existingGrade = existingGrades.find(g =>
      (g.studentId === studentId || g.studentId === student?.code) &&
      g.subjectId === selectedSubject &&
      g.evaluationPeriodId === selectedPeriod
    );

    if (existingGrade) {
      // Créer une note "effacée" pour marquer la suppression
      const clearedGrade: Grade = {
        studentId,
        classId: selectedClassId,
        schoolYear,
        subjectId: selectedSubject,
        evaluationTypeId: selectedEvaluationType,
        evaluationPeriodId: selectedPeriod,
        score: 0, // Score à 0 pour indiquer l'effacement
        maxScore: existingGrade.maxScore || 20,
        coefficient: existingGrade.coefficient || 1,
        isSaved: false,
        originalScore: existingGrade.score, // Garder le score original
        isModified: true, // Marquer comme modifiée
        isCleared: true, // Marquer comme effacée
        lastModified: new Date()
      };

      setGrades(prev => {
        // CORRECTION : Chercher dans l'état local avec l'ID ET le code matricule
        const existing = prev.findIndex(g =>
          (g.studentId === studentId || g.studentId === student?.code) &&
          g.subjectId === selectedSubject &&
          g.evaluationPeriodId === selectedPeriod
        );

        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = clearedGrade;
          console.log('🗑️ Note marquée comme effacée:', updated);
          return updated;
        } else {
          const newGrades = [...prev, clearedGrade];
          console.log('🗑️ Nouvelle note effacée ajoutée:', newGrades);
          return newGrades;
        }
      });

      toast({
        title: "Note effacée",
        description: `La note de ${student?.nom || 'l\'élève'} a été marquée pour suppression`,
        variant: "default",
      });

      // Debug: Afficher l'état dans la console
      console.log('🗑️ Note effacée - État:', {
        studentId,
        studentCode: student?.code,
        subjectId: selectedSubject,
        periodId: selectedPeriod,
        isCleared: true,
        score: 0,
        originalScore: existingGrade.score
      });
    } else {
      // CORRECTION : Supprimer de l'état local avec l'ID ET le code matricule
      setGrades(prev => prev.filter(g =>
        !((g.studentId === studentId || g.studentId === student?.code) &&
          g.subjectId === selectedSubject &&
          g.evaluationPeriodId === selectedPeriod)
      ));
    }

    // Forcer la mise à jour de l'affichage
    setRefreshTrigger(prev => prev + 1);
    console.log('🗑️ Note effacée avec refresh forcé');
  };

  // NOUVELLE FONCTION : Restaurer une note effacée
  const handleGradeRestore = (studentId: string) => {
    // Trouver l'élève pour obtenir son code matricule
    const student = students.find(s => s.id === studentId);

    // CORRECTION : Chercher la note effacée avec l'ID ET le code matricule
    const clearedGrade = grades.find(g =>
      (g.studentId === studentId || g.studentId === student?.code) &&
      g.subjectId === selectedSubject &&
      g.evaluationPeriodId === selectedPeriod &&
      g.isCleared
    );

    if (clearedGrade && clearedGrade.originalScore !== undefined) {
      // Restaurer la note avec le score original
      const restoredGrade: Grade = {
        ...clearedGrade,
        score: clearedGrade.originalScore,
        isCleared: false,
        isModified: false,
        lastModified: new Date()
      };

      setGrades(prev => prev.map(g =>
        g === clearedGrade ? restoredGrade : g
      ));

      toast({
        title: "Note restaurée",
        description: `La note de ${student?.nom || 'l\'élève'} a été restaurée`,
        variant: "default",
      });

      console.log('🔄 Note restaurée:', restoredGrade);
    }
  };

  // NOUVELLE FONCTION : Ouvrir la boîte de dialogue d'édition
  const handleGradeEdit = (studentId: string, currentScore: number) => {
    const student = students.find(s => s.id === studentId);
    const subject = subjects.find(s => s.id === selectedSubject);

    if (student && subject) {
      setEditingStudentId(studentId);
      setEditingStudentName(`${student.nom} ${student.prenom}`);
      setEditingScore(currentScore.toString());
      setEditingMaxScore(subject.maxScore);
      setEditDialogOpen(true);
    }
  };

  // NOUVELLE FONCTION : Confirmer la modification de la note
  const handleGradeEditConfirm = async () => {
    if (!editingScore || editingScore.trim() === '') {
      toast({
        title: "Note invalide",
        description: "Veuillez saisir une note valide",
        variant: "destructive",
      });
      return;
    }

    const numericScore = parseFloat(editingScore);

    if (isNaN(numericScore) || numericScore < 0 || numericScore > editingMaxScore) {
      toast({
        title: "Note invalide",
        description: `La note doit être comprise entre 0 et ${editingMaxScore}`,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Utiliser la fonction existante pour mettre à jour la note dans l'état local
      handleGradeChange(editingStudentId, editingScore);

      // Créer la note à sauvegarder
      const student = students.find(s => s.id === editingStudentId);
      const subject = subjects.find(s => s.id === selectedSubject);

      if (!student || !subject) {
        throw new Error('Données d\'élève ou de matière non trouvées');
      }

      const gradeToSave = {
        studentId: editingStudentId,
        classId: selectedClassId,
        schoolYear,
        subjectId: selectedSubject,
        evaluationTypeId: selectedEvaluationType,
        evaluationPeriodId: selectedPeriod,
        score: numericScore,
        maxScore: editingMaxScore,
        coefficient: subject.coefficient,
        recordedBy: 'admin-001' // Utilisateur par défaut
      };

      console.log('💾 Sauvegarde immédiate de la note:', gradeToSave);

      // Sauvegarder immédiatement en base de données
      const response = await fetch('/api/grades/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grades: [gradeToSave],
          recordedBy: 'admin-001'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Note sauvegardée avec succès:', result);

        // Marquer la note comme sauvegardée dans l'état local
        // Mettre à jour l'état local immédiatement
        const numericScore = parseFloat(editingScore);
        setGrades(prev => {
          const filtered = prev.filter(g =>
            !(g.studentId === editingStudentId && g.subjectId === selectedSubject && g.evaluationPeriodId === selectedPeriod)
          );

          const updatedGrade: Grade = {
            studentId: editingStudentId,
            classId: selectedClassId,
            schoolYear,
            subjectId: selectedSubject,
            evaluationTypeId: selectedEvaluationType,
            evaluationPeriodId: selectedPeriod,
            score: numericScore,
            maxScore: editingMaxScore,
            coefficient: subjects.find(s => s.id === selectedSubject)?.coefficient || 1,
            isSaved: true,
            isModified: false,
            isCleared: false,
            lastModified: new Date()
          };

          return [...filtered, updatedGrade];
        });

        // Recharger les notes depuis la base de données
        await loadExistingGrades();

        // Forcer la mise à jour de l'affichage
        setRefreshTrigger(prev => prev + 1);

        toast({
          title: "Note sauvegardée",
          description: `La note de ${editingStudentName} a été mise à jour et sauvegardée`,
          variant: "default",
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || error.details || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de la note:', error);
      toast({
        title: "Erreur",
        description: "La note a été modifiée localement mais n'a pas pu être sauvegardée en base",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);

      // Fermer la boîte de dialogue
      setEditDialogOpen(false);
      setEditingStudentId('');
      setEditingStudentName('');
      setEditingScore('');
      setEditingMaxScore(20);
    }
  };

  const handleBulkGradeChange = () => {
    if (!bulkScore || selectedStudents.size === 0) {
      toast({
        title: "Action invalide",
        description: "Veuillez sélectionner des élèves et saisir une note",
        variant: "destructive",
      });
      return;
    }

    const numericScore = parseFloat(bulkScore);
    const subject = subjects.find(s => s.id === selectedSubject);

    if (!subject) {
      toast({
        title: "Matière non trouvée",
        description: "Impossible de trouver la matière sélectionnée",
        variant: "destructive",
      });
      return;
    }

    if (numericScore < 0 || numericScore > subject.maxScore) {
      toast({
        title: "Note invalide",
        description: `La note doit être comprise entre 0 et ${subject.maxScore}`,
        variant: "destructive",
      });
      return;
    }

    selectedStudents.forEach(studentId => {
      // Trouver l'élève par son ID pour obtenir son code matricule
      const student = students.find(s => s.id === studentId);
      if (student) {
        handleGradeChange(student.id, bulkScore);
      }
    });

    setBulkScore('');
    setSelectedStudents(new Set());
    setBulkEditMode(false);

    toast({
      title: "Notes appliquées",
      description: `${selectedStudents.size} note(s) appliquée(s) avec succès`,
    });
  };

  const toggleStudentSelection = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const selectAllStudents = () => {
    setSelectedStudents(new Set(currentStudents.map(s => s.id))); // On garde l'ID pour la sélection
  };

  const deselectAllStudents = () => {
    setSelectedStudents(new Set());
  };

  // NOUVELLE FONCTION : Télécharger les notes de la classe sélectionnée en PDF avec jsPDF
  const handleDownloadGrades = async () => {
    if (!selectedClass || !selectedSubject || !selectedPeriod) {
      toast({
        title: "Configuration incomplète",
        description: "Veuillez sélectionner une classe, une matière et une période",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // CORRECTION : Éliminer les doublons en priorisant les notes locales
      const localGrades = grades.filter(g =>
        g.subjectId == selectedSubject &&
        g.evaluationPeriodId === selectedPeriod
      );

      const existingGradesForContext = existingGrades.filter(g =>
        g.subjectId == selectedSubject &&
        g.evaluationPeriodId === selectedPeriod
      );

      // Créer un Map pour éliminer les doublons (priorité aux notes locales)
      const uniqueGradesMap = new Map();

      // D'abord ajouter les notes existantes
      existingGradesForContext.forEach(grade => {
        const key = grade.studentId;
        uniqueGradesMap.set(key, grade);
      });

      // Puis remplacer/ajouter les notes locales (priorité)
      localGrades.forEach(grade => {
        const key = grade.studentId;
        uniqueGradesMap.set(key, grade);
      });

      // Convertir le Map en tableau
      const contextGrades = Array.from(uniqueGradesMap.values());

      console.log('🔍 Notes uniques pour export:', contextGrades);

      if (contextGrades.length === 0) {
        toast({
          title: "Aucune note à télécharger",
          description: "Aucune note trouvée pour le contexte sélectionné",
          variant: "destructive",
        });
        return;
      }

      // Préparer les données pour l'export
      const exportData = contextGrades.map((grade, index) => {
        // CORRECTION : Utiliser la même logique que les bulletins
        // grade.studentId contient le nom complet, nous devons trouver l'élève par son nom
        let student = students.find(s =>
          `${s.nom} ${s.prenom}` === grade.studentId ||
          s.id === grade.studentId
        );

        const subject = subjects.find(s => s.id === grade.subjectId);
        const period = periods.find(p => p.id === grade.evaluationPeriodId);

        // DEBUG : Vérifier les données de l'élève
        console.log('🔍 Données élève pour export:', {
          gradeStudentId: grade.studentId,
          foundStudent: student,
          studentId: student?.id,
          studentNom: student?.nom,
          studentPrenom: student?.prenom,
          allStudents: students.map(s => ({ id: s.id, nom: s.nom, prenom: s.prenom, fullName: `${s.nom} ${s.prenom}` }))
        });

        // CORRECTION : Utiliser student.id comme matricule (même logique que les bulletins)
        const matricule = student?.id || 'N/A';

        return {
          matricule: matricule,
          nom: student?.nom || 'N/A',
          prenom: student?.prenom || 'N/A',
          classe: selectedClass,
          matiere: subject?.name || '',
          sequence: period?.name || '',
          note: grade.score,
          maxNote: grade.maxScore,
          coefficient: grade.coefficient,
          pourcentage: ((grade.score / grade.maxScore) * 100).toFixed(2) + '%',
          annee: schoolYear
        };
      });

      console.log('🔍 Données d\'export finales:', exportData);

      // Utiliser jsPDF pour générer un vrai PDF avec le même format que la section finance
      const doc = new jsPDF('l', 'mm', 'a4'); // Landscape pour une meilleure présentation

      let currentY = 20;

      // En-tête administratif (même format que la section finance)
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('RAPPORT DES NOTES - ' + (subjects.find(s => s.id === selectedSubject)?.name || '').toUpperCase(), 148, currentY, { align: 'center' });
      currentY += 8;

      doc.setFontSize(14);
      doc.text('CLASSE: ' + selectedClass.toUpperCase(), 148, currentY, { align: 'center' });
      currentY += 10;

      // Informations de base (sans l'établissement)
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Année scolaire: ${schoolYear}`, 20, currentY);
      currentY += 5;
      doc.text(`Séquence: ${periods.find(p => p.id === selectedPeriod)?.name || ''}`, 20, currentY);
      currentY += 5;
      doc.text(`Matière: ${subjects.find(s => s.id === selectedSubject)?.name || ''}`, 20, currentY);
      currentY += 5;
      doc.text(`Date de génération: ${new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, 20, currentY);
      currentY += 8;


      // Tableau principal avec autoTable (même format que la section finance)
      const tableData = exportData.map(student => [
        student.matricule,
        student.nom,
        student.prenom,
        `${student.note}/${student.maxNote}`,
        `${((student.note / student.maxNote) * 100).toFixed(1)}%`,
        student.coefficient.toString(),
        student.note >= 16 ? 'Excellent' :
          student.note >= 10 ? 'Réussi' : 'Échec'
      ]);

      // Créer le tableau avec autoTable
      autoTable(doc, {
        head: [['Matricule', 'Nom', 'Prénom', 'Note', 'Pourcentage', 'Coef', 'Statut']],
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
          0: { cellWidth: 25 }, // Matricule
          1: { cellWidth: 45 }, // Nom
          2: { cellWidth: 45 }, // Prénom
          3: { cellWidth: 30 }, // Note
          4: { cellWidth: 30 }, // Pourcentage
          5: { cellWidth: 20 }, // Coefficient
          6: { cellWidth: 30 }, // Statut
        },
        didDrawPage: function (data: any) {
          // Ajouter le numéro de page (centré pour le format paysage)
          doc.setFontSize(8);
          doc.text(`Page ${data.pageNumber} sur ${doc.internal.getNumberOfPages()}`, 148, doc.internal.pageSize.height - 10, { align: 'center' });
        }
      });

      // Nom du fichier
      const fileName = `notes_${selectedClass}_${subjects.find(s => s.id === selectedSubject)?.name}_${periods.find(p => p.id === selectedPeriod)?.name}_${schoolYear}.pdf`;

      // Télécharger le PDF
      doc.save(fileName);

      toast({
        title: "Téléchargement réussi",
        description: `${exportData.length} note(s) exportée(s) au format PDF`,
      });

    } catch (error) {
      console.error('❌ Erreur lors du téléchargement:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du téléchargement des notes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGrades = async () => {
    if (!selectedClass || !selectedSubject || !selectedPeriod) {
      toast({
        title: "Configuration incomplète",
        description: "Veuillez sélectionner une classe, une matière et une période",
        variant: "destructive",
      });
      return;
    }

    // Sauvegarder les notes dans localStorage avant l'envoi
    const gradesToSave = grades.filter(g =>
      g.subjectId === selectedSubject &&
      g.evaluationPeriodId === selectedPeriod
    );

    console.log('🔍 Notes à sauvegarder:', gradesToSave);
    console.log('🔍 Contexte actuel:', { selectedClass, selectedSubject, selectedPeriod, selectedClassId, schoolYear });

    saveGradesToLocalStorage(gradesToSave);

    const userId = 'admin-001';

    if (gradesToSave.length === 0) {
      toast({
        title: "Aucune note à sauvegarder",
        description: "Veuillez saisir au moins une note",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('🔍 Sauvegarde des notes...');
      console.log('🔍 Données envoyées à l\'API:', { grades: gradesToSave, recordedBy: userId });

      const response = await fetch('/api/grades/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grades: gradesToSave,
          recordedBy: userId
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Réponse de l\'API:', result);

        // Vérifier s'il y a des erreurs dans les résultats
        const hasErrors = result.results && result.results.some((r: any) => r.action === 'error');

        if (hasErrors) {
          // Il y a des erreurs, ne pas afficher le message de succès
          const errorCount = result.results.filter((r: any) => r.action === 'error').length;
          const successCount = result.results.filter((r: any) => r.action !== 'error').length;

          if (errorCount > 0 && successCount === 0) {
            // Toutes les notes ont échoué
            throw new Error(`${errorCount} note(s) n'ont pas pu être enregistrées`);
          } else if (errorCount > 0) {
            // Certaines notes ont réussi, d'autres ont échoué
            setError(`${successCount} note(s) enregistrées, ${errorCount} note(s) ont échoué`);
            toast({
              title: "Attention",
              description: `${successCount} note(s) enregistrées, ${errorCount} note(s) ont échoué`,
              variant: "destructive",
            });
            return;
          }
        }

        const message = `${result.results?.length || 0} note(s) enregistrée(s) avec succès`;
        setSuccessMessage(message);
        setShowSuccessDialog(true);

        console.log('🔍 Rechargement des notes après sauvegarde...');

        // CORRECTION : Marquer les notes comme sauvegardées dans l'état local
        // Cela permettra au statut de changer correctement
        setGrades(prev => prev.map(grade => {
          if (grade.subjectId === selectedSubject && grade.evaluationPeriodId === selectedPeriod) {
            return { ...grade, isSaved: true };
          }
          return grade;
        }));

        // Nettoyer le localStorage après sauvegarde réussie
        clearGradesFromLocalStorage();
        console.log('🔍 Notes sauvegardées avec succès, statut mis à jour');

        // CORRECTION : Recharger les notes depuis la base de données pour s'assurer de la cohérence
        await loadExistingGrades();

        // CORRECTION : Forcer la mise à jour de l'affichage
        setRefreshTrigger(prev => prev + 1);

        // NOUVEAU : Attendre un peu puis recharger pour voir les notes initialisées à 0
        setTimeout(async () => {
          console.log('🔄 Rechargement final pour voir les notes initialisées...');
          await loadExistingGrades();
          setRefreshTrigger(prev => prev + 1);
        }, 1000);

        // Afficher un message de confirmation
        toast({
          title: "Succès",
          description: `${result.results?.length || 0} note(s) enregistrée(s) avec succès`,
        });
      } else {
        const error = await response.json();
        console.error('❌ Erreur API:', error);
        throw new Error(error.error || error.details || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde des notes');
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde des notes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canSave = selectedClass && selectedSubject && selectedPeriod && grades.length > 0;
  const hasChanges = grades.length > 0;



  return (
    <div className="space-y-6">
      {/* Messages d'erreur et de succès */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* En-tête avec bouton de réduction des filtres */}
      <div className="sticky top-0 z-20 flex justify-between items-center bg-white/95 backdrop-blur-md p-4 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-none">
            <FileSpreadsheet className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Saisie des Notes</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span className="hidden md:inline">{showFilters ? "Masquer les sélecteurs" : "Afficher les sélecteurs"}</span>
          </Button>
        </div>
      </div>

      {/* Sélecteurs */}
      {showFilters && (
        <Card className="border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 rounded-none">
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Sélection de l'année scolaire */}
              <div className="space-y-2">
                <Label htmlFor="year-select" className="text-sm font-medium">Année Scolaire</Label>
                <SchoolYearSelect
                  value={schoolYear}
                  onValueChange={setSchoolYear}
                  availableYears={availableSchoolYears}
                  currentSchoolYear={schoolYear}
                  placeholder="Sélectionner l'année scolaire..."
                  className="h-10"
                />
              </div>

              {/* Sélection de niveau */}
              <div className="space-y-2">
                <Label htmlFor="level-select" className="text-sm font-medium">Niveau</Label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel} disabled={!schoolYear}>
                  <SelectTrigger id="level-select" className="h-10">
                    <SelectValue placeholder="Sélectionner un niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLevels.map((level, index) => (
                      <SelectItem key={`level-${level}-${index}`} value={level}>
                        {index + 1}. {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sélection de classe */}
              <div className="space-y-2">
                <Label htmlFor="class-select" className="text-sm font-medium">Classe</Label>
                <Select
                  value={selectedClassId}
                  onValueChange={(value) => {
                    setSelectedClassId(value);
                    const selectedClassObj = classes.find(c => c.id === value);
                    setSelectedClass(selectedClassObj?.name || '');
                  }}
                  disabled={!selectedLevel}
                >
                  <SelectTrigger id="class-select" className="h-10">
                    <SelectValue placeholder="Sélectionner une classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((classObj, index) => (
                      <SelectItem key={`class-${classObj.id}-${index}`} value={classObj.id}>
                        {classObj.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sélection de matière - RESTAURÉE EN SELECT */}
              <div className="col-span-full md:col-span-1 space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  Matière
                </Label>
                <Select
                  value={selectedSubject}
                  onValueChange={setSelectedSubject}
                  disabled={!selectedClassId || isLoadingSubjects}
                >
                  <SelectTrigger className="w-full h-11 bg-white border-slate-200">
                    <SelectValue placeholder={isLoadingSubjects ? "Chargement des matières..." : "Sélectionner une matière"} />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.length > 0 ? (
                      subjects.map((subject, index) => (
                        <SelectItem key={`subject-${subject.id}-${index}`} value={subject.id}>
                          {subject.name} {subject.coefficient ? `(Coef: ${subject.coefficient})` : ''}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>Aucune matière disponible</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {error && <p className="text-[10px] text-red-500 font-medium px-1">{error}</p>}
              </div>

              {/* Sélection de séquence - RESTAURÉE EN SELECT */}
              <div className="col-span-full md:col-span-1 space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  Séquence
                </Label>
                <Select
                  value={selectedPeriod}
                  onValueChange={setSelectedPeriod}
                  disabled={!selectedClassId || !selectedSubject}
                >
                  <SelectTrigger className="w-full h-11 bg-white border-slate-200">
                    <SelectValue placeholder="Sélectionner une séquence" />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.length > 0 ? (
                      periods.map((period, index) => (
                        <SelectItem key={`period-${period.id}-${index}`} value={period.id}>
                          {period.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>Aucune séquence disponible</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

          </CardContent>
        </Card>
      )}

      {/* Tableau de saisie des notes */}
      {selectedClass && selectedSubject && selectedPeriod && students.length > 0 && (
        <Card className="shadow-none border-slate-200 rounded-none w-full border-x-0 sm:border-x">
          <CardHeader className="sticky top-[60px] z-10 pb-4 bg-white/95 backdrop-blur-md border-b border-slate-100 rounded-none shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="bg-white rounded-none">
                  {students.length} élève(s)
                </Badge>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 rounded-none">
                  {periods.find(p => p.id === selectedPeriod)?.name}
                </Badge>
                {hasChanges && (
                  <Badge variant="default" className="bg-orange-100 text-orange-700 border-orange-200 rounded-none">
                    Modifications non sauvegardées
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="rounded-none"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtres
                </Button>

                <Select value={gradeFilter} onValueChange={(value: 'all' | 'graded' | 'ungraded') => setGradeFilter(value)}>
                  <SelectTrigger className="w-32 h-8 rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="graded">Notés</SelectItem>
                    <SelectItem value="ungraded">Non notés</SelectItem>
                  </SelectContent>
                </Select>

                <div className="w-px h-6 bg-slate-200 mx-1" />

                <Button
                  onClick={handleDownloadGrades}
                  variant="outline"
                  size="sm"
                  className="border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-2 rounded-none"
                  disabled={isLoading || !selectedClass || !selectedSubject}
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Télécharger</span>
                </Button>

                <Button
                  onClick={handleSaveGrades}
                  disabled={!canSave || isLoading}
                  variant="default"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white shadow-sm flex items-center gap-2 rounded-none"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span className="hidden sm:inline">Sauvegarder ({grades.length})</span>
                  <span className="sm:hidden">Enregistrer</span>
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 sm:p-0 space-y-4">
            {/* Filtres avancés */}
            {showAdvancedFilters && (
              <div className="p-4 bg-gray-50 rounded-none space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label className="text-sm">Recherche</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Rechercher un élève..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm">Tri par</Label>
                    <Select value={sortField} onValueChange={(value: 'name' | 'score' | 'percentage') => setSortField(value)}>
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Nom</SelectItem>
                        <SelectItem value="score">Note</SelectItem>
                        <SelectItem value="percentage">Pourcentage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm">Ordre</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                      className="w-32 h-8"
                    >
                      {sortDirection === 'asc' ? <SortAsc className="h-4 w-4 mr-2" /> : <SortDesc className="h-4 w-4 mr-2" />}
                      {sortDirection === 'asc' ? 'Croissant' : 'Décroissant'}
                    </Button>
                  </div>
                </div>

                {bulkEditMode && (
                  <div className="flex items-center gap-4">
                    <Button size="sm" variant="outline" onClick={selectAllStudents}>
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Tout sélectionner
                    </Button>
                    <Button size="sm" variant="outline" onClick={deselectAllStudents}>
                      <Square className="h-4 w-4 mr-2" />
                      Tout désélectionner
                    </Button>
                    <span className="text-sm text-gray-500">
                      {selectedStudents.size} élève(s) sélectionné(s)
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Vue tableau style Excel */}
            {viewMode === 'table' && (
              <div className="border-y border-slate-300 rounded-none overflow-hidden bg-white w-full">
                <div className="bg-slate-100 border-b border-slate-300">
                  <div className="grid grid-cols-12 text-[11px] font-bold text-slate-700 uppercase tracking-tight">
                    {bulkEditMode && <div className="col-span-1 border-r border-slate-300 px-2 py-2 text-center">Sél.</div>}
                    <div className="col-span-1 border-r border-slate-300 px-2 py-2">Matr.</div>
                    <div className={`${bulkEditMode ? "col-span-4" : "col-span-5"} border-r border-slate-300 px-2 py-2`}>Élève</div>
                    <div className="col-span-1 border-r border-slate-300 px-2 py-2 text-center">Sexe</div>
                    <div className="col-span-2 border-r border-slate-300 px-2 py-2 text-center">Note</div>
                    <div className="col-span-1 border-r border-slate-300 px-2 py-2 text-center">Max</div>
                    <div className="col-span-1 border-r border-slate-300 px-2 py-2 text-center">%</div>
                    <div className="col-span-1 px-2 py-2 text-center">Statut</div>
                  </div>
                </div>
                <div className="divide-y">
                  {filteredStudents
                    .slice((currentPage - 1) * studentsPerPage, (currentPage - 1) * studentsPerPage + studentsPerPage)
                    .map((student, index) => {
                      const allGrades = [...grades, ...existingGrades];

                      // Essayer d'abord avec l'ID de l'élève, puis avec le code matricule
                      const studentGrades = allGrades.filter(g =>
                        (g.studentId === student.id || (student.code && g.studentId === student.code)) &&
                        g.subjectId == selectedSubject &&
                        g.evaluationPeriodId === selectedPeriod
                      );

                      // Priorité aux notes locales (modifications en cours)
                      const localGrade = grades.find(g =>
                        (g.studentId === student.id || g.studentId === student.code) &&
                        g.subjectId == selectedSubject &&
                        g.evaluationPeriodId === selectedPeriod
                      );

                      // Note à afficher (priorité aux notes locales)
                      const grade = localGrade || studentGrades[0];

                      // Note originale pour comparaison
                      const originalGrade = existingGrades.find(g =>
                        (g.studentId === student.id || g.studentId === student.code) &&
                        g.subjectId == selectedSubject &&
                        g.evaluationPeriodId === selectedPeriod
                      );

                      const maxScore = subjects.find(s => s.id === selectedSubject)?.maxScore || 20;
                      const percentage = grade ? (grade.score / maxScore) * 100 : 0;

                      const statusInfo = getGradeStatus(grade, originalGrade);

                      const isSelected = selectedStudents.has(student.id);

                      const displayLast = (student.nom || (student.name ? String(student.name).split(' ')[0] : '')) as string;
                      const displayFirst = (student.prenom || (student.name ? String(student.name).split(' ').slice(1).join(' ') : '')) as string;

                      // Déduplication des noms/prénoms si identiques
                      const nameParts = new Set<string>();
                      if (displayLast) nameParts.add(displayLast.trim());
                      if (displayFirst) nameParts.add(displayFirst.trim());
                      const displayName = Array.from(nameParts).join(' ');

                      const sexeRaw = String(student.sexe || '').toLowerCase();
                      const displaySexe = sexeRaw.startsWith('m') ? 'M' : (sexeRaw.startsWith('f') ? 'F' : '-');

                      return (
                        <div key={student.id} className="grid grid-cols-12 items-center text-[11px] hover:bg-slate-50 transition-colors border-b border-slate-200 last:border-b-0">
                          {bulkEditMode && (
                            <div className="col-span-1 border-r border-slate-200 flex justify-center py-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleStudentSelection(student.id)}
                                className="h-4 w-4 rounded-none text-blue-600 focus:ring-blue-500"
                              />
                            </div>
                          )}
                          <div className="col-span-1 border-r border-slate-200 px-2 py-1.5 font-mono text-blue-600 font-bold truncate">
                            {student.id || '---'}
                          </div>
                          <div className={`${bulkEditMode ? "col-span-4" : "col-span-5"} border-r border-slate-200 px-2 py-1.5 font-semibold text-slate-800 truncate`}>
                            {displayName}
                          </div>
                          <div className="col-span-1 border-r border-slate-200 px-2 py-1.5 text-center font-medium text-slate-500">
                            {displaySexe}
                          </div>

                          <div className="col-span-2 border-r border-slate-200 px-2 py-1.5 flex items-center justify-center gap-1">
                            <div className="relative">
                              <Input
                                type="number"
                                min="0"
                                max={maxScore}
                                step="0.1"
                                value={grade?.isCleared ? '' : (grade?.score || '')}
                                onChange={(e) => handleGradeChange(student.id, e.target.value)}
                                className={`w-16 h-8 text-[11px] text-center font-bold px-1 ${grade?.isCleared ? 'border-red-300 bg-red-50 text-red-600' :
                                  grade?.isModified ? 'border-orange-300 bg-orange-50 text-orange-700' :
                                    'border-slate-200'
                                  }`}
                                disabled={grade?.isCleared}
                              />
                              {grade?.isModified && !grade?.isCleared && (
                                <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-orange-500 rounded-none flex items-center justify-center border border-white shadow-sm">
                                  <span className="text-[7px] text-white font-bold">M</span>
                                </div>
                              )}
                            </div>
                            {grade && !grade.isCleared && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleGradeEdit(student.id, grade.score)}
                                className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>

                          <div className="col-span-1 border-r border-slate-200 px-2 py-1.5 text-center text-slate-400 font-medium">
                            / {maxScore}
                          </div>

                          <div className="col-span-1 border-r border-slate-200 px-2 py-1.5 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-none text-[10px] font-bold ${percentage >= 50 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                              }`}>
                              {percentage.toFixed(0)}%
                            </span>
                          </div>

                          <div className="col-span-1 px-2 py-1.5 flex justify-center">
                            <div className={`flex items-center justify-center h-5 w-5 rounded-none ${statusInfo.class} border border-transparent`}>
                              {statusInfo.icon ? (
                                <span className="text-[12px]">
                                  {statusInfo.icon}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Pagination */}
            {filteredStudents && filteredStudents.length > studentsPerPage && (
              <div className="flex items-center justify-between mt-4 text-sm">
                <div>
                  Page {currentPage} sur {Math.ceil(filteredStudents.length / studentsPerPage)}
                </div>
                <div className="flex items-center gap-2">
                  <span>Par page</span>
                  <select className="border rounded-none h-8 px-2 text-sm" value={studentsPerPage} onChange={e => { setStudentsPerPage(parseInt(e.target.value) || 10); setCurrentPage(1); }}>
                    {[5, 10, 15, 20, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Précédent</Button>
                  {Array.from({ length: Math.ceil(filteredStudents.length / studentsPerPage) }, (_, i) => i + 1).map(page => (
                    <Button
                      key={`pg-${page}`}
                      variant={page === currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredStudents.length / studentsPerPage), p + 1))} disabled={currentPage === Math.ceil(filteredStudents.length / studentsPerPage)}>Suivant</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Boîte de dialogue pour modifier une note individuelle */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-none border-slate-300 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-bold">Modifier la note</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Élève</Label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-none text-slate-800 font-medium">
                {editingStudentName}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Note (sur {editingMaxScore})</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max={editingMaxScore}
                value={editingScore}
                onChange={(e) => setEditingScore(e.target.value)}
                className="border-slate-300 focus:ring-blue-500 rounded-none h-12 text-xl font-bold bg-white"
                autoFocus
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="rounded-none border-slate-200 text-slate-600 hover:bg-slate-50 px-6"
            >
              Annuler
            </Button>
            <Button
              onClick={handleGradeEditConfirm}
              disabled={isLoading || !editingScore}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-none px-6 shadow-sm flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Confirmer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Boîte de dialogue de succès */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-[425px] rounded-none border-emerald-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600 font-bold">
              <CheckCircle className="h-5 w-5" />
              Opération réussie
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            <div className="bg-emerald-50 text-emerald-700 p-6 border border-emerald-100 mb-4 inline-block rounded-none shadow-inner">
              <Save className="h-10 w-10 mx-auto" aria-hidden="true" />
            </div>
            <p className="text-slate-600 font-medium">
              Toutes les notes ont été sauvegardées avec succès dans la base de données.
            </p>
          </div>
          <div className="flex justify-center pb-2">
            <Button
              onClick={() => setShowSuccessDialog(false)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px] rounded-none shadow-md"
            >
              D'accord
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
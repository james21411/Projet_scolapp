'use client';

import React, { useState, useEffect } from 'react';
import { SchoolInfo } from '@/services/schoolInfoService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Plus, BookOpen, Copy, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { SchoolYearSelect } from '@/components/ui/school-year-select';
import { deduplicateSubjects, logDeduplicationInfo } from '@/utils/subjectUtils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { getTeacherAssignments } from '@/services/personnelService';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Subject {
  id: string;
  code: string;
  name: string;
  category: string;
  coefficient: number;
  maxScore: number;
  isActive: boolean;
  classId: string;
  schoolYear: string;
}

interface SchoolLevel {
  id: string;
  name: string;
  order: number;
  classes: SchoolClass[];
}

interface SchoolClass {
  id: string;
  name: string;
  order: number;
  levelId: string;
}

export default function GestionMatieresV2({ currentUser, role, schoolInfo, cachedSubjects, onRefresh }: {
  currentUser?: { id?: string; username?: string; fullName?: string };
  role?: string,
  schoolInfo?: SchoolInfo | null,
  cachedSubjects?: Subject[],
  onRefresh?: (year?: string) => Promise<void>
} = {}) {
  // États pour la sélection
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>('');

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch('/api/finance/school-years');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.availableYears)) setAvailableYears(data.availableYears);

          const year = schoolInfo?.currentSchoolYear || data.currentSchoolYear || (data.availableYears?.[0]) || '';
          if (year) {
            setSelectedSchoolYear(year);
            setCurrentSettingsYear(year);
            const prev = getPreviousSchoolYear(year);
            if (prev) setSourceYearForReconduction(prev);
          }
        }
      } catch (err) { }
    }
    init();
  }, [schoolInfo]);
  const [showAllSubjects, setShowAllSubjects] = useState<boolean>(false);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);

  // États pour les données
  const [levels, setLevels] = useState<SchoolLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);

  // États pour les affectations enseignant
  const [teacherAssignments, setTeacherAssignments] = useState<any[]>([]);
  const [isTeacherUser, setIsTeacherUser] = useState<boolean>(false);

  // États pour le modal d'ajout/modification
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [newSubject, setNewSubject] = useState({
    code: '',
    name: '',
    category: '',
    coefficient: 1,
    maxScore: 20,
    isActive: true
  });

  // États pour le modal de copie
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyData, setCopyData] = useState({
    sourceClassId: '',
    targetClassId: '',
    sourceSchoolYear: '',
    targetSchoolYear: '',
    selectedSubjects: [] as string[]
  });

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Années scolaires disponibles (API)
  const [availableYears, setAvailableYears] = useState<string[]>(['2025-2026', '2024-2025', '2023-2024', '2022-2023']);
  const [currentSettingsYear, setCurrentSettingsYear] = useState<string>('2025-2026');
  const [sourceYearForReconduction, setSourceYearForReconduction] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'subjects'>('subjects');

  // États pour le modal de reconduction
  const [showReconductionModal, setShowReconductionModal] = useState(false);
  const [reconductionData, setReconductionData] = useState({
    sourceYear: '',
    targetYear: ''
  });

  // Charger les niveaux et classes
  useEffect(() => {
    loadLevelsAndClasses();
  }, []);

  // Removed redundant school years fetch effect (moved to init)

  // Charger les matières quand la classe change ou quand on active "toutes les matières"
  useEffect(() => {
    if ((selectedClass && selectedSchoolYear && !showAllSubjects) || (showAllSubjects && selectedSchoolYear)) {
      loadSubjects();
    }
  }, [selectedClass, selectedSchoolYear, showAllSubjects, isTeacherUser, teacherAssignments]);

  // Détecter si l'utilisateur est un enseignant et charger ses affectations
  useEffect(() => {
    const teacherUser = !!(currentUser && (role === 'Enseignant' || (role || '').toLowerCase().includes('enseign')));
    setIsTeacherUser(teacherUser);

    if (teacherUser && currentUser?.id) {
      getTeacherAssignments(currentUser.id)
        .then(assignments => {
          setTeacherAssignments(Array.isArray(assignments) ? assignments : []);
        })
        .catch(error => {
          console.error('Erreur lors du chargement des affectations enseignant:', error);
          setTeacherAssignments([]);
        });
    } else {
      setTeacherAssignments([]);
    }
  }, [currentUser, role]);

  const loadLevelsAndClasses = async () => {
    try {
      const response = await fetch('/api/school/classes-with-ids');
      if (response.ok) {
        const data = await response.json();
        // Convertir la structure avec les vrais IDs
        const levelsData = Object.entries(data).map(([levelName, classes]) => ({
          id: levelName.toLowerCase(),
          name: levelName,
          order: 0,
          classes: (classes as any[]).map((cls) => ({
            id: cls.id,
            name: cls.name,
            order: 0,
            levelId: cls.levelId
          }))
        }));
        setLevels(levelsData);
      } else {
        toast.error('Erreur lors du chargement des niveaux et classes');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des niveaux et classes');
    }
  };

  const loadAllSubjects = async () => {
    setLoading(true);
    try {
      // Charger toutes les classes
      const classesResponse = await fetch('/api/school/classes-with-ids');
      if (!classesResponse.ok) {
        toast.error('Erreur lors du chargement des classes');
        return;
      }

      const classesData = await classesResponse.json();
      const allClassIds = Object.values(classesData).flatMap((levelClasses: any) =>
        levelClasses.map((cls: any) => cls.id)
      );

      // Charger les matières pour toutes les classes
      const allSubjectsPromises = allClassIds.map(classId =>
        fetch(`/api/subject-coefficients?classId=${classId}&schoolYear=${selectedSchoolYear}`)
          .then(res => res.ok ? res.json() : [])
          .catch(() => [])
      );

      const allSubjectsData = await Promise.all(allSubjectsPromises);
      const combinedSubjects = allSubjectsData.flat();

      // Déduplication des matières
      let uniqueSubjects = deduplicateSubjects(combinedSubjects);
      logDeduplicationInfo(combinedSubjects, uniqueSubjects, 'GestionMatieresV2-AllSubjects');

      // Appliquer le filtrage par affectations enseignant si nécessaire
      if (isTeacherUser && teacherAssignments.length > 0) {
        const arr = getAssignmentsArray(teacherAssignments);
        // Créer un ensemble des matières assignées avec leurs classes
        const assignedSubjectsWithClasses = new Set<string>();
        arr.forEach((assignment: any) => {
          const subjectName = normalize(assignment.subject || assignment.subjectName);
          const classId = assignment.classId || assignment.className;
          // Créer une clé unique matière-classe
          assignedSubjectsWithClasses.add(`${subjectName}-${classId}`);
        });

        // Filtrer les matières en vérifiant si l'enseignant est assigné à cette matière dans cette classe
        uniqueSubjects = uniqueSubjects.filter((s: Subject) => {
          const subjectKey = `${normalize(s.name)}-${s.classId}`;
          return assignedSubjectsWithClasses.has(subjectKey);
        });
      }

      setAllSubjects(uniqueSubjects);
      setSubjects(uniqueSubjects);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement de toutes les matières');
    } finally {
      setLoading(false);
    }
  };

  const lastRequestRef = React.useRef<number>(0);

  const loadSubjects = async () => {
    if (showAllSubjects) {
      await loadAllSubjects();
      return;
    }

    if (!selectedClass) {
      setSubjects([]);
      return;
    }

    const requestId = ++lastRequestRef.current;

    // Si on a des données en cache pour la bonne année, on les utilise
    if (cachedSubjects && cachedSubjects.length > 0) {
      console.log(`📦 Utilisation du cache global (${cachedSubjects.length} matières)`);
      let filtered = cachedSubjects.filter(s => s.classId === selectedClass);

      // Appliquer le filtrage enseignant
      if (isTeacherUser && teacherAssignments.length > 0) {
        const arr = getAssignmentsArray(teacherAssignments);
        const className = getClassNameById(selectedClass);
        const classAssignments = arr.filter((a: any) => (a?.classId && String(a.classId) === String(selectedClass)) || (a?.className && normalize(a.className) === normalize(className)));
        const assignedSet = new Set<string>(classAssignments.map((a: any) => normalize(a.subject || a.subjectName)));
        filtered = filtered.filter((s: Subject) => assignedSet.has(normalize(s.name)));
      }

      setSubjects(filtered);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/subject-coefficients?classId=${selectedClass}&schoolYear=${selectedSchoolYear}`);

      // Si une nouvelle requête a été lancée entre temps, on ignore celle-ci
      if (requestId !== lastRequestRef.current) return;

      if (response.ok) {
        const data = await response.json();
        let uniqueSubjects = deduplicateSubjects(data);

        // Appliquer le filtrage par affectations enseignant si nécessaire
        if (isTeacherUser && teacherAssignments.length > 0) {
          const arr = getAssignmentsArray(teacherAssignments);
          const className = getClassNameById(selectedClass);

          const classAssignments = arr.filter((a: any) => {
            const byId = a?.classId && String(a.classId) === String(selectedClass);
            const byName = a?.className && normalize(a.className) === normalize(className);
            return byId || byName;
          });

          if (classAssignments.length > 0) {
            const assignedSet = new Set<string>(classAssignments.map((a: any) => normalize(a.subject || a.subjectName)));
            uniqueSubjects = uniqueSubjects.filter((s: Subject) => assignedSet.has(normalize(s.name)));
          } else {
            uniqueSubjects = [];
          }
        } else if (isTeacherUser) {
          // Si on est en mode enseignant mais qu'on n'a pas encore les affectations, 
          // on attend que teacherAssignments arrive via l'autre useEffect
          // pour éviter d'afficher puis vider brusquement
          return;
        }

        setSubjects(uniqueSubjects);
      }
    } catch (error) {
      console.error('Erreur:', error);
      if (requestId === lastRequestRef.current) setSubjects([]);
    } finally {
      if (requestId === lastRequestRef.current) setLoading(false);
    }
  };

  const handleLevelChange = (levelId: string) => {
    setSelectedLevel(levelId);
    setSelectedClass('');
  };

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    setCurrentPage(1);
  };

  const handleAddSubject = async () => {
    console.log('🔍 handleAddSubject appelé');
    console.log('🔍 selectedClass:', selectedClass);
    console.log('🔍 selectedSchoolYear:', selectedSchoolYear);
    console.log('🔍 newSubject:', newSubject);
    console.log('🔍 showSubjectModal avant traitement:', showSubjectModal);

    if (!selectedClass) {
      toast.error('Veuillez sélectionner une classe');
      return;
    }

    if (!newSubject.code || !newSubject.name || !newSubject.category || !newSubject.coefficient || !newSubject.maxScore) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Vérification des doublons de code pour la même classe
    const existingSubject = subjects.find(s =>
      s.code === newSubject.code &&
      s.classId === selectedClass &&
      s.schoolYear === selectedSchoolYear
    );

    if (existingSubject) {
      toast.error(`Une matière avec le code "${newSubject.code}" existe déjà dans cette classe`);
      return;
    }

    try {
      const subjectData = {
        ...newSubject,
        classId: selectedClass,
        schoolYear: selectedSchoolYear
      };

      console.log('🔍 Données envoyées à l\'API:', subjectData);

      const response = await fetch('/api/subject-coefficients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subjectData),
      });

      if (response.ok) {
        const addedSubject = await response.json();
        console.log('🔍 Matière ajoutée avec succès:', addedSubject);
        console.log('🔍 Classe de la matière ajoutée:', addedSubject.classId);
        console.log('🔍 Classe sélectionnée:', selectedClass);

        // Ajouter la nouvelle matière à la liste locale
        setSubjects(prev => [...prev, addedSubject]);

        // Afficher le toast de succès avec confirmation
        toast.success(`✅ Matière "${newSubject.name}" ajoutée avec succès à la classe ${getClassNameById(selectedClass)} !`, {
          duration: 4000,
          description: `La matière a été enregistrée et est maintenant visible dans la liste.`
        });

        console.log('🔍 Fermeture du modal...');

        // Fermer le modal immédiatement
        setShowSubjectModal(false);

        // Réinitialiser le formulaire
        setNewSubject({
          code: '',
          name: '',
          category: '',
          coefficient: 1,
          maxScore: 20,
          isActive: true
        });

        // Recharger les matières localement et rafraîchir le cache global
        if (onRefresh) onRefresh(selectedSchoolYear);
        await loadSubjects();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erreur API:', response.status, errorData);
        toast.error(`Erreur lors de l'ajout: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'ajout de la matière');
    }
  };

  const handleUpdateSubject = async () => {
    if (!editingSubject) return;

    if (!editingSubject.code || !editingSubject.name || !editingSubject.category || !editingSubject.coefficient || !editingSubject.maxScore) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const response = await fetch(`/api/subject-coefficients/${editingSubject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingSubject),
      });

      if (response.ok) {
        const updatedSubject = await response.json();

        // Mettre à jour la liste locale
        setSubjects(prev => prev.map(s =>
          s.id === editingSubject.id ? { ...s, ...updatedSubject } : s
        ));

        // Afficher le toast de succès
        toast.success(`Matière "${editingSubject.name}" modifiée avec succès !`);

        // Fermer le modal
        setShowSubjectModal(false);

        // Réinitialiser l'état d'édition
        setEditingSubject(null);

        // Recharger les matières localement et rafraîchir le cache global
        if (onRefresh) onRefresh(selectedSchoolYear);
        await loadSubjects();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(`Erreur lors de la modification: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la modification de la matière');
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    try {
      const response = await fetch(`/api/subject-coefficients/${subjectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSubjects(subjects.filter(s => s.id !== subjectId));
        if (onRefresh) onRefresh(selectedSchoolYear);
        toast.success('Matière supprimée avec succès');
      } else {
        toast.error('Erreur lors de la suppression de la matière');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression de la matière');
    }
  };

  const resetForm = () => {
    setNewSubject({
      code: '',
      name: '',
      category: '',
      coefficient: 1,
      maxScore: 20,
      isActive: true
    });
    setEditingSubject(null);
  };

  const openEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setShowSubjectModal(true);
  };

  const openAddModal = () => {
    console.log('🔍 openAddModal appelé');
    console.log('🔍 selectedClass:', selectedClass);
    console.log('🔍 selectedSchoolYear:', selectedSchoolYear);
    console.log('🔍 showSubjectModal avant:', showSubjectModal);
    resetForm();
    setShowSubjectModal(true);
    console.log('🔍 showSubjectModal après:', true);
  };

  const openCopyModal = () => {
    setCopyData({
      sourceClassId: selectedClass,
      targetClassId: '',
      sourceSchoolYear: selectedSchoolYear,
      targetSchoolYear: selectedSchoolYear,
      selectedSubjects: []
    });
    setShowCopyModal(true);
  };

  const getClassNameById = (classId: string) => {
    const allClasses = (levels || []).flatMap(level => level.classes);
    const foundClass = allClasses.find(cls => cls.id === classId);
    return foundClass ? foundClass.name : classId;
  };

  const handleCopySubjects = async () => {
    if (!copyData.targetClassId || copyData.selectedSubjects.length === 0) {
      toast.error('Veuillez sélectionner une classe cible et au moins une matière');
      return;
    }

    try {
      const response = await fetch('/api/subject-coefficients/copy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(copyData),
      });

      if (response.ok) {
        toast.success('Matières copiées avec succès');
        setShowCopyModal(false);
        loadSubjects(); // Recharger les matières
      } else {
        toast.error('Erreur lors de la copie des matières');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la copie des matières');
    }
  };



  // Utilitaire: année précédente "2024-2025" -> "2023-2024"
  const getPreviousSchoolYear = (sy: string) => {
    const m = sy.match(/^(\d{4})-(\d{4})$/);
    if (!m) return '';
    const y1 = parseInt(m[1], 10) - 1;
    const y2 = parseInt(m[2], 10) - 1;
    return `${y1}-${y2}`;
  };

  const handleReconductionAllClasses = async () => {
    const { sourceYear, targetYear } = reconductionData;
    if (!sourceYear || !targetYear) {
      toast.error('Veuillez sélectionner les années source et cible');
      return;
    }

    try {
      setLoading(true);
      const resp = await fetch('/api/subjects/copy-to-year', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previousYear: sourceYear, newYear: targetYear })
      });

      const json = await resp.json().catch(() => ({}));
      if (resp.ok) {
        const inserted = json.inserted || 0;
        const updated = json.updated || 0;
        toast.success(json.message || `Reconduction OK: ${inserted} insérées, ${updated} mises à jour`);
        if (selectedSchoolYear === targetYear && selectedClass) await loadSubjects();
        setShowReconductionModal(false);
      } else {
        toast.error(json.error || json.message || 'Erreur lors de la reconduction');
      }
    } catch (e) {
      toast.error('Erreur lors de la reconduction');
    } finally {
      setLoading(false);
    }
  };

  // Nettoyage: plus de gestion de séquences ici

  const getClassesForLevel = (levelId: string) => {
    const level = (levels || []).find(l => l.id === levelId);
    return level ? level.classes : [];
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Scientifique': 'bg-blue-100 text-blue-800',
      'Littéraire': 'bg-green-100 text-green-800',
      'Langues': 'bg-purple-100 text-purple-800',
      'Arts': 'bg-yellow-100 text-yellow-800',
      'Sport': 'bg-orange-100 text-orange-800',
      'Autre': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  // Fonction pour normaliser les chaînes de caractères pour la comparaison
  const normalize = (s: any): string => {
    if (!s || typeof s !== 'string') return '';
    return s
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/\s+/g, ' ');
  };

  // Fonction pour obtenir les affectations sous forme de tableau
  const getAssignmentsArray = (val: any): any[] => {
    if (Array.isArray(val)) return val;
    if (val && Array.isArray(val.data)) return val.data;
    return [];
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = Math.ceil(subjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSubjects = subjects.slice(startIndex, endIndex);

  // Nettoyage: fonctions séquences supprimées de cet écran

  // Nettoyage: fonctions séquences supprimées de cet écran

  // Nettoyage: fonctions séquences supprimées de cet écran

  // Nettoyage


  return (
    <div className="space-y-6">
      {/* En-tête avec sélecteurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Paramètres: Matières, Notes et Séquences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Barre d'onglets (séquences retiré ici, présent dans onglet dédié) */}
            <div className="flex items-center gap-2 border-b pb-2">
              <span className="px-3 py-1 rounded bg-blue-600 text-white">Matières & Notes</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Sélecteur d'année scolaire */}
              <div>
                <Label htmlFor="school-year">Année Scolaire</Label>
                <SchoolYearSelect
                  value={selectedSchoolYear}
                  onValueChange={setSelectedSchoolYear}
                  availableYears={availableYears}
                  currentSchoolYear={currentSettingsYear}
                />
              </div>

              {/* Sélecteur de niveau */}
              <div>
                <Label htmlFor="level-select">Niveau</Label>
                <Select
                  value={selectedLevel}
                  onValueChange={handleLevelChange}
                  disabled={showAllSubjects}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={showAllSubjects ? "Tous les niveaux" : "Sélectionner un niveau"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(levels || []).map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sélecteur de classe */}
              <div>
                <Label htmlFor="class-select">Classe</Label>
                <Select
                  value={selectedClass}
                  onValueChange={handleClassChange}
                  disabled={showAllSubjects}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={showAllSubjects ? "Toutes les classes" : "Sélectionner une classe"} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedLevel && getClassesForLevel(selectedLevel).map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Option pour afficher toutes les matières */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showAllSubjects"
                checked={showAllSubjects}
                onChange={(e) => {
                  setShowAllSubjects(e.target.checked);
                  if (e.target.checked) {
                    setSelectedLevel('');
                    setSelectedClass('');
                  }
                }}
                className="rounded"
              />
              <Label htmlFor="showAllSubjects" className="text-sm">
                Afficher toutes les matières de toutes les classes
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenu principal: onglet Matières */}
      {selectedClass || showAllSubjects ? (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>
                  {showAllSubjects
                    ? "Toutes les Matières"
                    : `Matières de la Classe : ${getClassNameById(selectedClass)}`
                  }
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {subjects.length} matière(s) trouvée(s) pour l'année {selectedSchoolYear}
                  {showAllSubjects && " (toutes les classes)"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    console.log('🔍 Bouton Ajouter cliqué');
                    openAddModal();
                  }}
                  disabled={isTeacherUser}
                  title={isTeacherUser ? "Les enseignants ne peuvent pas ajouter de matières" : ""}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une Matière
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={isTeacherUser}>
                      <MoreHorizontal className="h-4 w-4 mr-2" />
                      Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                      onClick={openCopyModal}
                      disabled={isTeacherUser}
                      className="cursor-pointer"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copier vers une autre classe
                    </DropdownMenuItem>



                    <DropdownMenuItem
                      onClick={() => {
                        setReconductionData({
                          sourceYear: getPreviousSchoolYear(currentSettingsYear) || '',
                          targetYear: currentSettingsYear
                        });
                        setShowReconductionModal(true);
                      }}
                      disabled={isTeacherUser}
                      className="cursor-pointer"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Reconduire toutes les matières
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Chargement...</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Coefficient</TableHead>
                      <TableHead>Note Max</TableHead>
                      <TableHead>Classe</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentSubjects.length === 0 && isTeacherUser ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="text-muted-foreground">
                            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium mb-2">Aucune matière assignée</p>
                            <p className="text-sm">
                              Vous n'êtes pas autorisé à voir les matières de cette classe ou aucune matière ne vous a été assignée pour cette classe.
                            </p>
                            <p className="text-xs mt-2 text-yellow-600">
                              Contactez l'administration pour vérifier vos affectations.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentSubjects.map((subject) => (
                        <TableRow key={subject.id}>
                          <TableCell className="font-mono">{subject.code}</TableCell>
                          <TableCell className="font-medium">{subject.name}</TableCell>
                          <TableCell>
                            <Badge className={getCategoryColor(subject.category)}>
                              {subject.category}
                            </Badge>
                          </TableCell>
                          <TableCell>{subject.coefficient}</TableCell>
                          <TableCell>{subject.maxScore}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {getClassNameById(subject.classId)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={subject.isActive ? "default" : "secondary"}>
                              {subject.isActive ? 'Actif' : 'Inactif'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditModal(subject)}
                                disabled={isTeacherUser}
                                title={isTeacherUser ? "Les enseignants ne peuvent pas modifier les matières" : ""}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={isTeacherUser}
                                    title={isTeacherUser ? "Les enseignants ne peuvent pas supprimer les matières" : ""}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Supprimer la matière</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Êtes-vous sûr de vouloir supprimer la matière "{subject.name}" ?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteSubject(subject.id)}>
                                      Supprimer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Page {currentPage} sur {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        activeTab === 'subjects' ? (
          <Card>
            <CardContent className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {isTeacherUser
                  ? "Vous n'avez aucune matière assignée ou sélectionnez une classe pour voir ses matières"
                  : "Sélectionnez une classe pour voir ses matières ou activez 'Afficher toutes les matières'"
                }
              </p>
            </CardContent>
          </Card>) : null
      )}
      {/* Séquences retiré de cet écran */}

      {/* Modal Ajout/Modification Matière */}
      <Dialog
        open={showSubjectModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowSubjectModal(false);
            // Réinitialiser le formulaire si on ferme manuellement
            if (!editingSubject) {
              setNewSubject({
                code: '',
                name: '',
                category: '',
                coefficient: 1,
                maxScore: 20,
                isActive: true
              });
            }
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSubject ? 'Modifier la Matière' : 'Ajouter une Matière'}
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations de la matière pour la classe {selectedClass ? getClassNameById(selectedClass) : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject-code">Code *</Label>
                <Input
                  id="subject-code"
                  required
                  value={editingSubject?.code || newSubject.code}
                  onChange={(e) => {
                    const code = e.target.value.toUpperCase();
                    if (editingSubject) {
                      setEditingSubject({ ...editingSubject, code });
                    } else {
                      setNewSubject({ ...newSubject, code });
                    }
                  }}
                  placeholder="Ex: MATH"
                />
                {!editingSubject && newSubject.code && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {subjects.find(s => s.code === newSubject.code && s.classId === selectedClass)
                      ? '⚠️ Ce code existe déjà dans cette classe'
                      : '✅ Code disponible'}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="subject-name">Nom *</Label>
                <Input
                  id="subject-name"
                  required
                  value={editingSubject?.name || newSubject.name}
                  onChange={(e) => editingSubject
                    ? setEditingSubject({ ...editingSubject, name: e.target.value })
                    : setNewSubject({ ...newSubject, name: e.target.value })
                  }
                  placeholder="Ex: Mathématiques"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="subject-category">Catégorie *</Label>
                <Select
                  required
                  value={editingSubject?.category || newSubject.category}
                  onValueChange={(value) => editingSubject
                    ? setEditingSubject({ ...editingSubject, category: value })
                    : setNewSubject({ ...newSubject, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Catégorie *" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key="scientifique" value="Scientifique">Scientifique</SelectItem>
                    <SelectItem key="litteraire" value="Littéraire">Littéraire</SelectItem>
                    <SelectItem key="langues" value="Langues">Langues</SelectItem>
                    <SelectItem key="arts" value="Arts">Arts</SelectItem>
                    <SelectItem key="sport" value="Sport">Sport</SelectItem>
                    <SelectItem key="autre" value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subject-coefficient">Coefficient *</Label>
                <Input
                  id="subject-coefficient"
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  value={editingSubject ? editingSubject.coefficient : newSubject.coefficient}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    editingSubject
                      ? setEditingSubject({ ...editingSubject, coefficient: value })
                      : setNewSubject({ ...newSubject, coefficient: value })
                  }}
                />
              </div>
              <div>
                <Label htmlFor="subject-max-score">Note Max *</Label>
                <Input
                  id="subject-max-score"
                  type="number"
                  min="1"
                  required
                  value={editingSubject ? editingSubject.maxScore : newSubject.maxScore}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    editingSubject
                      ? setEditingSubject({ ...editingSubject, maxScore: value })
                      : setNewSubject({ ...newSubject, maxScore: value })
                  }}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="subject-status">Statut</Label>
              <Select
                value={editingSubject ? (editingSubject.isActive ? 'active' : 'inactive') : (newSubject.isActive ? 'active' : 'inactive')}
                onValueChange={(value) => {
                  const isActive = value === 'active';
                  editingSubject
                    ? setEditingSubject({ ...editingSubject, isActive })
                    : setNewSubject({ ...newSubject, isActive })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="active" value="active">Actif</SelectItem>
                  <SelectItem key="inactive" value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowSubjectModal(false)}>
                Annuler
              </Button>
              <Button
                onClick={editingSubject ? handleUpdateSubject : handleAddSubject}
                disabled={!editingSubject && (
                  !newSubject.code ||
                  !newSubject.name ||
                  !newSubject.category ||
                  !!subjects.find(s => s.code === newSubject.code && s.classId === selectedClass)
                )}
              >
                {editingSubject ? 'Modifier' : 'Ajouter'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Copie */}
      <Dialog open={showCopyModal} onOpenChange={setShowCopyModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Copier les Matières</DialogTitle>
            <DialogDescription>
              Sélectionnez les matières à copier vers une autre classe
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Classe Source</Label>
                <Input value={getClassNameById(copyData.sourceClassId)} disabled />
              </div>
              <div>
                <Label>Classe Cible</Label>
                <Select
                  value={copyData.targetClassId}
                  onValueChange={(value) => setCopyData({ ...copyData, targetClassId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {(levels || []).flatMap(level => level.classes).map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Matières à Copier</Label>
              <div className="max-h-60 overflow-y-auto border rounded-md p-3 mt-2">
                {subjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune matière disponible pour cette classe
                  </p>
                ) : (
                  <div className="space-y-2">
                    {subjects.map((subject) => (
                      <div key={subject.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          id={subject.id}
                          checked={copyData.selectedSubjects.includes(subject.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCopyData({
                                ...copyData,
                                selectedSubjects: [...copyData.selectedSubjects, subject.id]
                              });
                            } else {
                              setCopyData({
                                ...copyData,
                                selectedSubjects: copyData.selectedSubjects.filter(id => id !== subject.id)
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <label htmlFor={subject.id} className="text-sm flex-1 cursor-pointer">
                          <div className="font-medium">{subject.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Code: {subject.code} | Catégorie: {subject.category} | Coef: {subject.coefficient}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {subjects.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {copyData.selectedSubjects.length} matière(s) sélectionnée(s) sur {subjects.length}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCopyModal(false)}>
                Annuler
              </Button>
              <Button onClick={handleCopySubjects}>
                Copier
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Reconduction */}
      <Dialog open={showReconductionModal} onOpenChange={setShowReconductionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reconduire les Matières</DialogTitle>
            <DialogDescription>
              Sélectionnez l'année source et l'année cible pour reconduire toutes les matières
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Année Source</Label>
              <Select
                value={reconductionData.sourceYear}
                onValueChange={(value) => setReconductionData({ ...reconductionData, sourceYear: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner l'année source" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Année Cible</Label>
              <SchoolYearSelect
                value={reconductionData.targetYear}
                onValueChange={(value) => setReconductionData({ ...reconductionData, targetYear: value })}
                availableYears={availableYears}
                currentSchoolYear={currentSettingsYear}
              />
            </div>

            <div className="flex justify-between items-center gap-2 pt-4">
              <div className="text-sm text-muted-foreground">
                {reconductionData.sourceYear && reconductionData.targetYear ? (
                  <span>
                    Confirmez la reconduction de toutes les matières de {reconductionData.sourceYear} vers {reconductionData.targetYear}
                  </span>
                ) : null}
              </div>
              <Button variant="outline" onClick={() => setShowReconductionModal(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleReconductionAllClasses}
                disabled={!reconductionData.sourceYear || !reconductionData.targetYear || loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                ) : null}
                Reconduire
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
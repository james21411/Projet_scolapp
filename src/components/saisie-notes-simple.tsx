'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, BookOpen, Users, Calendar, FileText, Save, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  evaluationPeriodId: string;
  score: number;
  maxScore: number;
  coefficient: number;
  assessment?: string;
}

export default function SaisieNotesSimple() {
  const { toast } = useToast();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [periods, setPeriods] = useState<EvaluationPeriod[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [schoolYear, setSchoolYear] = useState<string>('2025-2026');
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [classes, setClasses] = useState<{id: string, name: string}[]>([]);
  const [existingGrades, setExistingGrades] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showSuccessDialog, setShowSuccessDialog] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [availableLevels, setAvailableLevels] = useState<string[]>([]);
  const [availableSchoolYears, setAvailableSchoolYears] = useState<string[]>([]);
  const [levelsData, setLevelsData] = useState<any[]>([]);
  
  // États pour la recherche et pagination
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [studentsPerPage] = useState<number>(5);

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
  }, []);

  // Recharger les notes quand on revient à cette section ou change de contexte
  useEffect(() => {
    if (selectedClass && selectedSubject && selectedPeriod) {
      console.log('🔄 Rechargement des notes pour le contexte:', { selectedClass, selectedSubject, selectedPeriod, schoolYear });
      
      // Recharger les notes après un délai pour s'assurer que tout est prêt
      const timer = setTimeout(async () => {
        // D'abord charger les notes sauvegardées depuis l'API
        await loadExistingGrades();
        await loadSavedGradesForCurrentContext();
        
        // Ensuite charger les notes non sauvegardées depuis localStorage
        const localGrades = loadGradesFromLocalStorage();
        if (localGrades.length > 0) {
          console.log('📝 Fusion des notes locales avec les notes sauvegardées');
          setGrades(prev => {
            // Garder les notes des autres contextes
            const otherContextGrades = prev.filter(g => 
              !(g.subjectId === selectedSubject && g.evaluationPeriodId === selectedPeriod)
            );
            
            // Ajouter les notes locales
            return [...otherContextGrades, ...localGrades];
          });
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [selectedClass, selectedSubject, selectedPeriod, schoolYear]);

  // Sauvegarder les notes dans localStorage quand elles changent
  useEffect(() => {
    if (selectedClass && selectedSubject && selectedPeriod && grades.length > 0) {
      const contextGrades = grades.filter(g => 
        g.subjectId === selectedSubject && g.evaluationPeriodId === selectedPeriod
      );
      
      if (contextGrades.length > 0) {
        saveGradesToLocalStorage(contextGrades);
      }
    }
  }, [grades, selectedClass, selectedSubject, selectedPeriod, schoolYear]);

  // Recharger les notes quand le composant devient visible (quand on revient dans la section)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && selectedClass && selectedSubject && selectedPeriod) {
        console.log('👁️ Composant devenu visible, rechargement des notes...');
        // Recharger les notes après un délai pour s'assurer que tout est prêt
        setTimeout(async () => {
          await loadExistingGrades();
          await loadSavedGradesForCurrentContext();
          
          // Charger les notes non sauvegardées depuis localStorage
          const localGrades = loadGradesFromLocalStorage();
          if (localGrades.length > 0) {
            console.log('📝 Fusion des notes locales avec les notes sauvegardées');
            setGrades(prev => {
              // Garder les notes des autres contextes
              const otherContextGrades = prev.filter(g => 
                !(g.subjectId === selectedSubject && g.evaluationPeriodId === selectedPeriod)
              );
              
              // Ajouter les notes locales
              return [...otherContextGrades, ...localGrades];
            });
          }
        }, 200);
      }
    };

    // Écouter les changements de visibilité
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Recharger aussi quand le composant est monté
    if (selectedClass && selectedSubject && selectedPeriod) {
      handleVisibilityChange();
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedClass, selectedSubject, selectedPeriod, schoolYear]);

  // Filtrer les élèves basé sur la recherche
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student => 
        student.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
    setCurrentPage(1); // Reset à la première page lors d'une recherche
  }, [searchTerm, students]);

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

      // Charger les années scolaires disponibles depuis l'API finance
      const yearsResponse = await fetch('/api/finance/school-years');
      if (yearsResponse.ok) {
        const yearsData = await yearsResponse.json();
        setAvailableSchoolYears(yearsData.availableYears || []);
      } else {
        // Fallback si l'API finance n'est pas disponible
        const currentYear = new Date().getFullYear();
        setAvailableSchoolYears([
          `${currentYear-1}-${currentYear}`,
          `${currentYear}-${currentYear+1}`,
          `${currentYear+1}-${currentYear+2}`
        ]);
      }

             // Charger les niveaux et classes depuis l'API comme dans gestion-matieres-v2
       console.log('🔍 Chargement des niveaux et classes...');
       const classesResponse = await fetch('/api/school/classes');
       console.log('📡 Réponse API classes:', { status: classesResponse.status, ok: classesResponse.ok });
       
       if (classesResponse.ok) {
         const levelsDataResponse = await classesResponse.json();
         console.log('📦 Données des niveaux reçues:', levelsDataResponse);
         
         // Vérifier que levelsDataResponse est un tableau
         if (Array.isArray(levelsDataResponse)) {
           // Stocker les données complètes des niveaux
           setLevelsData(levelsDataResponse);
           
           // Extraire les niveaux disponibles
           const levels = levelsDataResponse.map((level: any) => level.name);
           console.log('📚 Niveaux extraits:', levels);
           setAvailableLevels(levels);
         } else {
           console.error('❌ levelsDataResponse n\'est pas un tableau:', levelsDataResponse);
           setLevelsData([]);
           setAvailableLevels([]);
         }
       } else {
         console.error('❌ Erreur lors du chargement des niveaux');
         setLevelsData([]);
         setAvailableLevels([]);
       }

      // Charger les périodes d'évaluation (séquences seulement)
      const periodsResponse = await fetch(`/api/evaluation-periods?schoolYear=${schoolYear}`);
      if (!periodsResponse.ok) {
        throw new Error('Impossible de charger les périodes d\'évaluation');
      }
      const periodsData = await periodsResponse.json();
      // Filtrer seulement les séquences
      const sequences = periodsData.filter((period: any) => period.name && period.name.includes('Séquence'));
      setPeriods(sequences);

      toast({
        title: "Données chargées",
        description: "Configuration initiale terminée avec succès",
      });

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
      // Charger les classes pour le niveau sélectionné
      const loadClassesForLevel = async () => {
        try {
          setError('');
          
                     // Utiliser les données des niveaux déjà chargées
           console.log('🔍 Chargement des classes pour le niveau:', selectedLevel);
           console.log('📋 Données des niveaux disponibles:', levelsData);
           
           const selectedLevelData = levelsData.find((level: any) => level.name === selectedLevel);
           console.log('🎯 Niveau sélectionné:', selectedLevelData);
           
           if (selectedLevelData) {
             const levelClasses = selectedLevelData.classes.map((cls: any) => ({ id: cls.id, name: cls.name }));
             console.log('📚 Classes trouvées:', levelClasses);
             setClasses(levelClasses);
             
             if (levelClasses.length === 0) {
               console.log('⚠️ Aucune classe trouvée pour ce niveau');
               toast({
                 title: "Aucune classe trouvée",
                 description: `Aucune classe configurée pour le niveau ${selectedLevel}`,
               });
             } else {
               console.log(`✅ ${levelClasses.length} classe(s) chargée(s)`);
             }
           } else {
             console.log('❌ Niveau non trouvé dans les données');
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
        // Vider les notes seulement quand on change de classe
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
    if (selectedClass) {
      loadSubjects();
    } else {
      setSubjects([]);
      setSelectedSubject('');
    }
  }, [selectedClass, schoolYear]);

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
          // Filtrer seulement les séquences
          const sequences = periodsData.filter((period: any) => period.name && period.name.includes('Séquence'));
          setPeriods(sequences);
          
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

           // Charger les notes existantes quand une matière et période sont sélectionnées
    useEffect(() => {
      if (selectedClass && selectedSubject && selectedPeriod) {
        loadExistingGrades();
        // Recharger aussi les notes sauvegardées pour cette matière/période
        loadSavedGradesForCurrentContext();
        // Vider les nouvelles notes pour forcer le rechargement
        setGrades([]);
      } else {
        setExistingGrades([]);
        setGrades([]);
      }
    }, [selectedClass, selectedSubject, selectedPeriod]);

  const loadStudents = async () => {
    try {
      setError('');
      console.log('🔍 Chargement des élèves pour la classe:', selectedClass);
      console.log('📋 Paramètres:', { selectedClass, schoolYear });
      
      // Utiliser le nom de la classe comme dans l'API students
      const url = `/api/students?classId=${selectedClass}&schoolYear=${schoolYear}`;
      console.log('🌐 URL de l\'API:', url);
      
      const response = await fetch(url);
      console.log('📡 Réponse de l\'API:', { status: response.status, ok: response.ok });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur API:', errorText);
        throw new Error(`Impossible de charger les élèves: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('📦 Élèves reçus:', data);
      setStudents(data || []);
      
      if (!data || data.length === 0) {
        console.log('⚠️ Aucun élève trouvé');
        toast({
          title: "Aucun élève trouvé",
          description: `Aucun élève trouvé pour la classe ${selectedClass}`,
        });
      } else {
        console.log(`✅ ${data.length} élève(s) chargé(s)`);
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

  const loadSubjects = async () => {
    try {
      setError('');
      console.log('🔍 Chargement des matières...');
      console.log('📋 Paramètres:', { selectedClass, schoolYear });
      
      const url = `/api/subject-coefficients?classId=${selectedClass}&schoolYear=${schoolYear}`;
      console.log('🌐 URL de l\'API:', url);
      
      const response = await fetch(url);
      console.log('📡 Réponse de l\'API:', { status: response.status, ok: response.ok });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur API:', errorText);
        throw new Error(`Impossible de charger les matières: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('📦 Données reçues:', data);
      setSubjects(data || []);
      
      if (!data || data.length === 0) {
        console.log('⚠️ Aucune matière trouvée');
        toast({
          title: "Aucune matière trouvée",
          description: `Aucune matière configurée pour la classe ${selectedClass}`,
        });
      } else {
        console.log(`✅ ${data.length} matière(s) chargée(s)`);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des matières:', error);
      setError('Erreur lors du chargement des matières');
      toast({
        title: "Erreur",
        description: "Impossible de charger les matières",
        variant: "destructive",
      });
    }
  };

     const loadExistingGrades = async () => {
     try {
       setError('');
       console.log('🔍 Chargement des notes existantes...');
       console.log('📋 Paramètres:', { selectedClass, selectedSubject, selectedPeriod, schoolYear });
       
       const url = `/api/grades?classId=${selectedClass}&subjectId=${selectedSubject}&evaluationPeriodId=${selectedPeriod}&schoolYear=${schoolYear}`;
       console.log('🌐 URL de l\'API:', url);
       
       const response = await fetch(url);
       console.log('📡 Réponse de l\'API:', { status: response.status, ok: response.ok });
       
       if (!response.ok) {
         const errorText = await response.text();
         console.error('❌ Erreur API:', errorText);
         throw new Error(`Impossible de charger les notes existantes: ${response.status} ${errorText}`);
       }
       
       const data = await response.json();
       console.log('📦 Notes existantes reçues:', data);
       setExistingGrades(data || []);
       
       if (!data || data.length === 0) {
         console.log('⚠️ Aucune note existante trouvée');
       } else {
         console.log(`✅ ${data.length} note(s) existante(s) chargée(s)`);
       }
     } catch (error) {
       console.error('❌ Erreur lors du chargement des notes existantes:', error);
       setError('Erreur lors du chargement des notes existantes');
       toast({
         title: "Erreur",
         description: "Impossible de charger les notes existantes",
         variant: "destructive",
       });
     }
   };

               // Charger les notes sauvegardées pour le contexte actuel
     const loadSavedGradesForCurrentContext = async () => {
       try {
         console.log('🔍 Chargement des notes sauvegardées pour le contexte actuel...');
         console.log('📋 Contexte:', { selectedClass, selectedSubject, selectedPeriod, schoolYear });
         
                const url = `/api/grades/?classId=${selectedClass}&subjectId=${selectedSubject}&evaluationPeriodId=${selectedPeriod}&schoolYear=${schoolYear}`;
       const response = await fetch(url);
         
         if (response.ok) {
           const savedGrades = await response.json();
           console.log('📦 Notes sauvegardées reçues:', savedGrades);
           
           // Convertir les notes sauvegardées en format Grade pour l'affichage
           const convertedGrades = savedGrades.map((grade: any) => ({
             studentId: grade.studentId,
             classId: grade.classId,
             schoolYear: grade.schoolYear,
             subjectId: grade.subjectId,
             evaluationPeriodId: grade.evaluationPeriodId,
             score: grade.score,
             maxScore: grade.maxScore,
             coefficient: grade.coefficient,
             assessment: grade.assessment
           }));
           
           // Remplacer complètement les notes pour ce contexte
           setGrades(prev => {
             // Garder les notes des autres contextes
             const otherContextGrades = prev.filter(g => 
               !(g.subjectId === selectedSubject && g.evaluationPeriodId === selectedPeriod)
             );
             
             // Ajouter les nouvelles notes sauvegardées
             return [...otherContextGrades, ...convertedGrades];
           });
           
           console.log(`✅ ${convertedGrades.length} note(s) sauvegardée(s) chargée(s) pour l'affichage`);
         }
       } catch (error) {
         console.error('❌ Erreur lors du chargement des notes sauvegardées:', error);
       }
     };

  const handleGradeChange = (studentId: string, score: string) => {
    const numericScore = parseFloat(score) || 0;
    const subject = subjects.find(s => s.id === selectedSubject);
    
    if (!subject) return;

         // Validation de la note (permettre les décimales)
     if (numericScore < 0 || numericScore > subject.maxScore) {
       toast({
         title: "Note invalide",
         description: `La note doit être comprise entre 0 et ${subject.maxScore}`,
         variant: "destructive",
       });
       return;
     }

         const newGrade: Grade = {
       studentId,
       classId: selectedClass,
       schoolYear,
       subjectId: selectedSubject,
       evaluationPeriodId: selectedPeriod,
       score: numericScore,
       maxScore: subject.maxScore,
       coefficient: subject.coefficient
     };

    setGrades(prev => {
      const existing = prev.findIndex(g => 
        g.studentId === studentId && 
        g.subjectId === selectedSubject && 
        g.evaluationPeriodId === selectedPeriod
      );
      
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newGrade;
        return updated;
      } else {
        return [...prev, newGrade];
      }
    });
  };

           const getGradeForStudent = (studentId: string) => {
      // D'abord chercher dans les nouvelles notes (pour la matière et période actuelles)
      const newGrade = grades.find(g => 
        g.studentId === studentId && 
        g.subjectId === selectedSubject && 
        g.evaluationPeriodId === selectedPeriod
      );
      
      if (newGrade) {
        console.log(`📝 Note trouvée pour ${studentId}: ${newGrade.score}/${newGrade.maxScore}`);
        return newGrade;
      }

      // Sinon chercher dans les notes existantes (pour la matière et période actuelles)
      const existingGrade = existingGrades.find(g => 
        g.studentId === studentId && 
        g.subjectId === selectedSubject && 
        g.evaluationPeriodId === selectedPeriod
      );
      
      if (existingGrade) {
        console.log(`📝 Note existante trouvée pour ${studentId}: ${existingGrade.score}/${existingGrade.maxScore}`);
        return {
          studentId: existingGrade.studentId,
          classId: existingGrade.classId,
          schoolYear: existingGrade.schoolYear,
          subjectId: existingGrade.subjectId,
          evaluationPeriodId: existingGrade.evaluationPeriodId,
          score: existingGrade.score,
          maxScore: existingGrade.maxScore,
          coefficient: existingGrade.coefficient,
          assessment: existingGrade.assessment
        };
      }

      console.log(`❌ Aucune note trouvée pour ${studentId}`);
      return null;
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

    // Vérification de session simplifiée
    const userId = 'admin-001'; // ID utilisateur par défaut pour les tests

    const gradesToSave = grades.filter(g => 
      g.subjectId === selectedSubject && 
      g.evaluationPeriodId === selectedPeriod
    );

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
      console.log('📋 Notes à sauvegarder:', gradesToSave);
      
      const response = await fetch('/api/grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grades: gradesToSave,
          recordedBy: userId
        }),
      });

      console.log('📡 Réponse de l\'API:', { status: response.status, ok: response.ok });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Résultat de la sauvegarde:', result);
        
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
        
        // Nettoyer les notes non sauvegardées du localStorage
        clearGradesFromLocalStorage();
        
        // Recharger les notes existantes après sauvegarde
        await loadExistingGrades();
        
        // Forcer le rechargement des notes sauvegardées dans l'état principal
        const savedGradesResponse = await fetch(`/api/grades?classId=${selectedClass}&subjectId=${selectedSubject}&evaluationPeriodId=${selectedPeriod}&schoolYear=${schoolYear}`);
        if (savedGradesResponse.ok) {
          const savedGrades = await savedGradesResponse.json();
          console.log('📦 Notes sauvegardées rechargées:', savedGrades);
          
          // Convertir les notes sauvegardées en format Grade pour l'affichage
          const convertedGrades = savedGrades.map((grade: any) => ({
            studentId: grade.studentId,
            classId: grade.classId,
            schoolYear: grade.schoolYear,
            subjectId: grade.subjectId,
            evaluationPeriodId: grade.evaluationPeriodId,
            score: grade.score,
            maxScore: grade.maxScore,
            coefficient: grade.coefficient,
            assessment: grade.assessment
          }));
          
          // Remplacer complètement les notes pour ce contexte dans l'état principal
          setGrades(prev => {
            // Garder les notes des autres contextes
            const otherContextGrades = prev.filter(g => 
              !(g.subjectId === selectedSubject && g.evaluationPeriodId === selectedPeriod)
            );
            
            // Ajouter les nouvelles notes sauvegardées
            return [...otherContextGrades, ...convertedGrades];
          });
          
          console.log(`✅ ${convertedGrades.length} note(s) sauvegardée(s) rechargée(s) dans l'état principal`);
        }
        
        toast({
          title: "Succès",
          description: "Notes sauvegardées avec succès",
        });
      } else {
        const error = await response.json();
        console.error('❌ Erreur API:', error);
        console.error('📋 Détails de l\'erreur:', {
          details: error.details,
          code: error.code,
          sqlMessage: error.sqlMessage
        });
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
    <div className="space-y-4">

             {/* Messages d'erreur et de succès */}
       {error && (
         <Alert variant="destructive">
           <AlertCircle className="h-4 w-4" />
           <AlertDescription>{error}</AlertDescription>
         </Alert>
       )}



       {/* Sélecteurs */}
       <Card>
         <CardContent className="space-y-3 pt-3">
           <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                           {/* Sélection de l'année scolaire */}
              <div className="space-y-1">
                <Label htmlFor="year-select" className="text-xs">Année Scolaire</Label>
                <Select value={schoolYear} onValueChange={setSchoolYear}>
                  <SelectTrigger id="year-select" className="h-8 text-sm">
                    <SelectValue placeholder="Année scolaire" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSchoolYears.map((year, index) => (
                      <SelectItem key={`year-${year}-${index}`} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sélection de niveau */}
              <div className="space-y-1">
                <Label htmlFor="level-select" className="text-xs">Niveau</Label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel} disabled={!schoolYear}>
                  <SelectTrigger id="level-select" className="h-8 text-sm">
                    <SelectValue placeholder="Sélectionner un niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLevels.map((level, index) => (
                      <SelectItem key={`level-${level}-${index}`} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

                           {/* Sélection de classe */}
              <div className="space-y-1">
                <Label htmlFor="class-select" className="text-xs">Classe</Label>
                <Select value={selectedClassId} onValueChange={(value) => {
                  setSelectedClassId(value);
                  const selectedClassObj = classes.find(c => c.id === value);
                  setSelectedClass(selectedClassObj?.name || '');
                }} disabled={!selectedLevel}>
                  <SelectTrigger id="class-select" className="h-8 text-sm">
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

             {/* Sélection de matière */}
             <div className="space-y-1">
               <Label htmlFor="subject-select" className="text-xs">Matière</Label>
               <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedClass}>
                 <SelectTrigger id="subject-select" className="h-8 text-sm">
                   <SelectValue placeholder="Sélectionner une matière" />
                 </SelectTrigger>
                 <SelectContent>
                   {subjects.map((subject, index) => (
                     <SelectItem key={`subject-${subject.id}-${index}`} value={subject.id}>
                       {subject.name} (Coef: {subject.coefficient}, Max: {subject.maxScore})
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>

             {/* Sélection de séquence */}
             <div className="space-y-1">
               <Label htmlFor="period-select" className="text-xs">Séquence</Label>
               <Select value={selectedPeriod} onValueChange={setSelectedPeriod} disabled={!selectedSubject}>
                 <SelectTrigger id="period-select" className="h-8 text-sm">
                   <SelectValue placeholder="Sélectionner une séquence" />
                 </SelectTrigger>
                 <SelectContent>
                   {periods.map((period, index) => (
                     <SelectItem key={`period-${period.id}-${index}`} value={period.id}>
                       {period.name}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           </div>


        </CardContent>
      </Card>

             {/* Tableau de saisie des notes */}
        {selectedClass && selectedSubject && selectedPeriod && students.length > 0 && (
         <Card>
           <CardHeader className="pb-3">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <Badge variant="outline">
                   {students.length} élève(s)
                 </Badge>
                 <Badge variant="secondary">
                   {periods.find(p => p.id === selectedPeriod)?.name}
                 </Badge>
                 {hasChanges && (
                   <Badge variant="default">
                     {grades.length} modification(s)
                   </Badge>
                 )}
               </div>
               <Button 
                 onClick={handleSaveGrades} 
                 disabled={!canSave || isLoading}
                 className="flex items-center gap-2"
               >
                 {isLoading ? (
                   <Loader2 className="h-4 w-4 animate-spin" />
                 ) : (
                   <Save className="h-4 w-4" />
                 )}
                 Sauvegarder
               </Button>
             </div>
           </CardHeader>
           <CardContent className="space-y-4">
             {/* Message d'information sur la persistance */}
             <Alert className="bg-blue-50 border-blue-200">
               <AlertCircle className="h-4 w-4 text-blue-600" />
               <AlertDescription className="text-blue-800">
                 💡 Les notes non sauvegardées sont automatiquement conservées. Vous pouvez naviguer dans l'application et revenir sans perdre vos saisies.
               </AlertDescription>
             </Alert>
             {/* Barre de recherche */}
             <div className="flex items-center gap-4">
               <div className="relative flex-1 max-w-md">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                 <Input
                   type="text"
                   placeholder="Rechercher un élève par nom ou matricule..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="pl-10"
                 />
               </div>
               <div className="text-sm text-gray-500">
                 {filteredStudents.length} élève(s) trouvé(s)
               </div>
             </div>

             {/* Tableau compact */}
             <div className="border rounded-lg overflow-hidden">
               <div className="bg-gray-50 px-3 py-2 border-b">
                 <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-700">
                   <div className="col-span-5">Élève</div>
                   <div className="col-span-2 text-center">Note</div>
                   <div className="col-span-2 text-center">Max</div>
                   <div className="col-span-2 text-center">%</div>
                   <div className="col-span-1 text-center">Statut</div>
                 </div>
               </div>
               <div className="divide-y">
                 {currentStudents.map((student, index) => {
                   const grade = getGradeForStudent(student.id);
                   const maxScore = subjects.find(s => s.id === selectedSubject)?.maxScore || 20;
                   const percentage = grade ? (grade.score / maxScore) * 100 : 0;
                   const isNewGrade = grades.some(g => 
                     g.studentId === student.id && 
                     g.subjectId === selectedSubject && 
                     g.evaluationPeriodId === selectedPeriod
                   );
                   
                   return (
                     <div key={student.id} className={`px-3 py-2 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                       <div className="grid grid-cols-12 gap-2 items-center">
                         <div className="col-span-5 font-medium text-sm">
                           {student.nom} {student.prenom}
                         </div>
                         <div className="col-span-2 flex items-center justify-center">
                           <Input
                             type="number"
                             min="0"
                             max={maxScore}
                             step="0.1"
                             value={grade?.score || ''}
                             onChange={(e) => handleGradeChange(student.id, e.target.value)}
                             placeholder="0"
                             className="w-16 h-7 text-xs"
                           />
                         </div>
                         <div className="col-span-2 text-center text-xs text-gray-500">
                           / {maxScore}
                         </div>
                         <div className="col-span-2 text-center">
                           <span className={`inline-block px-1 py-0.5 rounded text-xs font-medium ${
                             percentage >= 50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                           }`}>
                             {percentage.toFixed(1)}%
                           </span>
                         </div>
                         <div className="col-span-1 text-center">
                           <span className={`inline-block px-1 py-0.5 rounded text-xs font-medium ${
                             isNewGrade ? 'bg-blue-100 text-blue-800' :
                             grade ? 'bg-green-100 text-green-800' :
                             'bg-gray-50 text-gray-500'
                           }`}>
                             {isNewGrade ? 'Non sauvegardée' : grade ? 'Sauvegardée' : 'Non saisie'}
                           </span>
                         </div>
                       </div>
                     </div>
                   );
                 })}
               </div>
             </div>

             {/* Pagination */}
             {filteredStudents.length > 0 && (
               <div className="flex items-center justify-between border-t pt-3">
                 <div className="text-xs text-gray-500">
                   Affichage de {indexOfFirstStudent + 1} à {Math.min(indexOfLastStudent, filteredStudents.length)} sur {filteredStudents.length} élève(s)
                   {totalPages > 1 && ` - Page ${currentPage} sur ${totalPages}`}
                 </div>
                 {totalPages > 1 && (
                   <div className="flex items-center gap-2">
                     <Button
                       variant="outline"
                       size="sm"
                       className="h-7 px-2 text-xs"
                       onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                       disabled={currentPage === 1}
                     >
                       Précédent
                     </Button>
                     <Button
                       variant="outline"
                       size="sm"
                       className="h-7 px-2 text-xs"
                       onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                       disabled={currentPage === totalPages}
                     >
                       Suivant
                     </Button>
                   </div>
                 )}
               </div>
             )}
           </CardContent>
         </Card>
       )}

              {/* Message d'aide */}
        {(!selectedClass || !selectedSubject || !selectedPeriod) && (
         <Card>
           <CardContent className="pt-6">
             <div className="text-center text-muted-foreground">
               <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
               <p className="text-lg font-medium mb-2">Configuration requise</p>
               <p className="text-sm">
                 Sélectionnez une classe, une matière et une séquence d'évaluation pour commencer la saisie des notes
               </p>
             </div>
           </CardContent>
         </Card>
       )}

              {/* Message si aucun élève trouvé */}
        {selectedClass && selectedSubject && selectedPeriod && students.length === 0 && (
         <Card>
           <CardContent className="pt-6">
             <div className="text-center text-muted-foreground">
               <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
               <p className="text-lg font-medium mb-2">Aucun élève trouvé</p>
               <p className="text-sm">
                 Aucun élève n'est inscrit dans la classe {selectedClass} pour l'année {schoolYear}
               </p>
             </div>
           </CardContent>
         </Card>
       )}

      {/* Boîte de dialogue de succès */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Sauvegarde réussie
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-lg font-medium text-gray-900 mb-2">
              {successMessage}
            </p>
            <p className="text-sm text-gray-500">
              Les notes ont été enregistrées avec succès dans la base de données.
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowSuccessDialog(false)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
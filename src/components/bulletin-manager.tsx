'use client';

import React, { useState, useEffect } from 'react';
import { SchoolInfo } from '@/services/schoolInfoService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  FileText,
  Download,
  Edit,
  Search,
  CheckCircle,
  AlertCircle,
  Eye,
  Loader2,
  RefreshCw,
  Calculator,
  Filter,
  Settings2,
  ChevronUp,
  ChevronDown,
  Printer,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

import { processClassAdvancement } from "@/services/studentService";
import { SchoolYearSelect } from '@/components/ui/school-year-select';

interface Student {
  id: string;
  nom: string;
  prenom: string;
  sexe: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  classeId: string;
  anneeScolaire: string;
}

interface Subject {
  id: number;
  name: string;
  maxScore?: number;
  coefficient?: number;
}

interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  evaluationPeriodId: string;
  score: number;
  maxScore: number;
  coefficient: number;
  schoolYear: string,
  advancementDecisions: Record<string, any>,
  setAdvancementDecisions: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  seq1?: number;
  seq2?: number;
  periodAverage?: number;
  subjectName?: string;
  subjectCoefficient?: number;
}

// Type pour les notes organisées par élève
interface GradesByStudent {
  [studentId: string]: Grade[];
}

interface EvaluationPeriod {
  id: string;
  name: string;
  type: string;
  order: number;
  startDate: string;
  endDate: string;
  schoolYear: string,
  advancementDecisions: Record<string, any>,
  setAdvancementDecisions: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  isActive?: boolean;
}

interface Bulletin {
  id: string;
  studentId: string;
  classId: string;
  schoolYear: string,
  advancementDecisions: Record<string, any>,
  setAdvancementDecisions: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  evaluationPeriodId: string;
  averageScore: number;
  totalCoefficient: number;
  rank: number;
  totalStudents: number;
  teacherComments: string;
  principalComments: string;
  mention: string;
  issuedAt: string;
  issuedBy: string;
}


// Sous-composant de vue pour le Passage de Classe
function ClassAdvancementView({
  students,
  classes,
  currentClassId,
  schoolYear,
  advancementDecisions,
  setAdvancementDecisions
}: {
  students: any[],
  classes: { id: string, name: string }[],
  currentClassId: string,
  schoolYear: string,
  advancementDecisions: Record<string, any>,
  setAdvancementDecisions: React.Dispatch<React.SetStateAction<Record<string, any>>>
}) {

  const [isLoading, setIsLoading] = React.useState(false);
  const currentClassName = classes.find(c => String(c.id) === String(currentClassId))?.name || '---';
  const availableClasses = classes.map(c => c.name);

  const [annualAverages, setAnnualAverages] = React.useState<Record<string, number>>({});
  const [isAveragesLoading, setIsAveragesLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchAverages = async () => {
      setIsAveragesLoading(true);
      try {
        const response = await fetch(`/api/grades?classId=${encodeURIComponent(currentClassId)}&schoolYear=${schoolYear}`);
        const allGrades = await response.json();
        console.log(`📦 DEBUG ANNUEL: ${allGrades.length} notes reçues`, allGrades.slice(0, 5));

        // Group grades by subject for each student
        const studentGradesGrouped: Record<string, Record<string, { sum: number, count: number, coef: number }>> = {};

        allGrades.forEach((g: any) => {
          if (!studentGradesGrouped[g.studentId]) studentGradesGrouped[g.studentId] = {};
          if (!studentGradesGrouped[g.studentId][g.subjectId]) {
            studentGradesGrouped[g.studentId][g.subjectId] = {
              sum: 0,
              count: 0,
              coef: parseFloat(String(g.subjectCoefficient || g.coefficient)) || 1
            };
          }

          const score = parseFloat(String(g.score)) || 0;
          const maxScore = parseFloat(String(g.maxScore)) || 20;
          const normalized = maxScore > 0 ? (score / maxScore) * 20 : score;

          // Only count if score > 0 (assuming 0 means not yet graded/empty)
          // Actually, let's follow the bulletin logic: if it's in the grade table, it's a mark (even if 0)
          studentGradesGrouped[g.studentId][g.subjectId].sum += normalized;
          studentGradesGrouped[g.studentId][g.subjectId].count += 1;
        });

        const averages: Record<string, number> = {};
        students.forEach(student => {
          const subjectsData = studentGradesGrouped[student.id];
          if (subjectsData) {
            let totalWeighted = 0;
            let totalCoef = 0;

            Object.values(subjectsData).forEach(subj => {
              const subjectAvg = subj.count > 0 ? subj.sum / subj.count : 0;
              totalWeighted += subjectAvg * subj.coef;
              totalCoef += subj.coef;
            });

            if (totalCoef > 0) {
              averages[student.id] = totalWeighted / totalCoef;
            }
          }
        });
        setAnnualAverages(averages);

        console.log("📈 Moyennes annuelles calculées pour le conseil:", averages);

        // Appliquer les décisions basées sur les moyennes
        setAdvancementDecisions(prev => {
          const newDecisions = { ...prev };
          students.forEach(student => {
            if (!newDecisions[student.id]) {
              const avg = averages[student.id];
              const decision = (typeof avg === 'number' && avg >= 10) ? 'pass' : 'repeat';
              newDecisions[student.id] = { decision, targetClass: currentClassName };
            }
          });
          return newDecisions;
        });
      } catch (err) {
        console.error(err);
      }
      setIsAveragesLoading(false);
    };

    if (currentClassId && schoolYear) {
      fetchAverages();
    }
  }, [students, currentClassId, schoolYear, currentClassName]);

  const handleDecisionChange = (studentId: string, decision: 'pass' | 'repeat' | 'exclude') => {
    setAdvancementDecisions(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], decision }
    }));
  };

  const handleTargetClassChange = (studentId: string, targetClass: string) => {
    setAdvancementDecisions(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], targetClass }
    }));
  };

  const handleProcess = async () => {
    setIsLoading(true);
    const updates = students.map(student => {
      const decisionInfo = advancementDecisions[student.id];
      return {
        studentId: student.id,
        newClass: decisionInfo?.decision === 'pass' ? decisionInfo.targetClass : currentClassName,
        hasPassed: decisionInfo?.decision === 'pass'
      };
    });

    try {
      await processClassAdvancement(updates);
      toast.success("Mise à jour des dossiers réussie !");
    } catch (e) {
      toast.error("Échec de la mise à jour des passages.");
    }
    setIsLoading(false);
  };

  const printAnnualBulletin = async (student: any) => {
    try {
      toast.info(`Génération du bulletin annuel pour ${student.nom}...`);
      const response = await fetch('/api/bulletins/generate-annuel-individuel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          classId: currentClassId,
          schoolYear: schoolYear,
          decision: advancementDecisions[student.id]?.decision || 'repeat',
          targetClass: advancementDecisions[student.id]?.targetClass || currentClassName
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Bulletin_Annuel_${student.nom}_${student.prenom}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Bulletin annuel généré !");
      } else {
        toast.error("Erreur lors de la génération.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erreur de connexion.");
    }
  };

  return (
    <div className="border border-slate-200 bg-white rounded-none shadow-sm">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Décision du Conseil de Classe</h2>
          <p className="text-xs text-slate-500 mt-1">Évaluez la moyenne agrégée de chaque étudiant pour définir son passage en classe supérieure ou son redoublement.</p>
        </div>
        <Button
          onClick={handleProcess}
          disabled={isLoading || students.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-none shadow-sm flex items-center gap-2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
          Valider les Passages
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 border-r border-slate-200">Élève</th>
              <th className="px-4 py-3 border-r border-slate-200 text-center w-32">Moy. Agg</th>
              <th className="px-4 py-3 border-r border-slate-200 text-center w-40">Décision</th>
              <th className="px-4 py-3 text-center w-56">Classe Suivante (Si admis)</th>
              <th className="px-4 py-3 text-center w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.length === 0 ? (
              <tr><td colSpan={4} className="p-6 text-center text-slate-500 font-medium text-sm">Veuillez sélectionner une classe active avec des élèves évalués.</td></tr>
            ) : null}
            {students.map(student => {
              const avg = annualAverages[student.id];
              const decision = advancementDecisions[student.id]?.decision || 'repeat';
              const targetClass = advancementDecisions[student.id]?.targetClass || currentClassName;

              return (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2 border-r border-slate-200">
                    <div className="font-bold text-slate-800">{student.nom} {student.prenom}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{student.id}</div>
                  </td>
                  <td className="px-4 py-2 border-r border-slate-200 text-center font-bold">
                    <span className={avg && avg >= 10 ? 'text-green-600' : 'text-red-500'}>
                      {typeof avg === 'number' ? `${avg.toFixed(2)}/20` : '---'}
                    </span>
                  </td>
                  <td className="px-4 py-2 border-r border-slate-200 text-center">
                    <Select value={decision} onValueChange={(val: any) => handleDecisionChange(student.id, val)}>
                      <SelectTrigger className="w-full h-8 rounded-none text-[10px] font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="pass" className="text-green-600 font-bold">A ADMIS(E)</SelectItem>
                        <SelectItem value="repeat" className="text-red-500 font-bold">A REDOUBLER</SelectItem>
                        <SelectItem value="exclude" className="text-slate-500 font-bold">EXCLURE</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <Select disabled={decision !== 'pass'} value={targetClass} onValueChange={(val: any) => handleTargetClassChange(student.id, val)}>
                      <SelectTrigger className="w-full h-8 rounded-none text-[10px] font-medium bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        {availableClasses.map((ac, i) => (
                          <SelectItem key={i} value={ac}>{ac}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => printAnnualBulletin(student)}
                      className="h-8 w-8 p-0 rounded-none border-blue-200 hover:bg-blue-50 text-blue-600"
                      title="Imprimer Bulletin Annuel"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function BulletinManager({ schoolInfo }: { schoolInfo?: SchoolInfo | null }) {
  // États de base
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [schoolYear, setSchoolYear] = useState<string>('2025-2026');

  useEffect(() => {
    if (schoolInfo?.currentSchoolYear) {
      setSchoolYear(schoolInfo.currentSchoolYear);
    }

    fetch('/api/school/years')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setAvailableYears(data.years);
          if (!schoolYear && data.defaultYear) setSchoolYear(data.defaultYear);
        }
      });
  }, [schoolInfo]);

  const [loading, setLoading] = useState(false);
  const currentSchoolYear = schoolYear;

  // Fonction pour obtenir le label dynamique des séquences selon le trimestre
  const getSequenceLabel = (sequenceNumber: number, periodId: string): string => {
    if (!periodId) return `Séquence ${sequenceNumber}`;

    // Trouver la période par son ID pour obtenir son nom
    const period = evaluationPeriods.find(p => p.id === periodId);
    if (!period) return `Séquence ${sequenceNumber}`;

    const periodName = period.name;
    const periodLower = periodName.toLowerCase();

    console.log(`🔍 getSequenceLabel: periodId="${periodId}", periodName="${periodName}", sequenceNumber=${sequenceNumber}`);

    if (periodLower.includes('1er') || periodLower.includes('1er trimestre') || periodLower.includes('1st trimester')) {
      return sequenceNumber === 1 ? '1ère Séquence' : '2ème Séquence';
    } else if (periodLower.includes('2ème') || periodLower.includes('2eme') || periodLower.includes('2nd') || periodLower.includes('2ème trimestre') || periodLower.includes('2nd trimester')) {
      return sequenceNumber === 1 ? '3ème Séquence' : '4ème Séquence';
    } else if (periodLower.includes('3ème') || periodLower.includes('3eme') || periodLower.includes('3rd') || periodLower.includes('3ème trimestre') || periodLower.includes('3rd trimester')) {
      return sequenceNumber === 1 ? '5ème Séquence' : '6ème Séquence';
    }

    // Fallback par défaut
    return `Séquence ${sequenceNumber}`;
  };

  // États des données
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [evaluationPeriods, setEvaluationPeriods] = useState<EvaluationPeriod[]>([]);
  const [grades, setGrades] = useState<GradesByStudent>({});
  const [advancementDecisions, setAdvancementDecisions] = useState<Record<string, { decision: 'pass' | 'repeat' | 'exclude', targetClass: string }>>({});
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [classes, setClasses] = useState<{ id: string, name: string }[]>([]);
  const [availableLevels, setAvailableLevels] = useState<string[]>([]);
  const [levelsData, setLevelsData] = useState<any[]>([]);

  // État pour stocker les vrais rangs calculés
  const [calculatedRanks, setCalculatedRanks] = useState<{
    [studentId: string]: {
      rank: number;
      totalStudents: number;
      average: number;
      totalWeighted: number;
      totalCoefficient: number;
    }
  }>({});

  // État pour déterminer si la période sélectionnée est un trimestre
  const [isTrimester, setIsTrimester] = useState<boolean>(false);

  // État de debug pour forcer les mises à jour
  const [debugTrigger, setDebugTrigger] = useState<number>(0);

  // État pour stocker les rangs par matière récupérés depuis la base de données
  const [subjectRanksFromDB, setSubjectRanksFromDB] = useState<{ [subjectId: string]: { rank: number, totalStudents: number } }>({});
  const [isLoadingSubjectRanks, setIsLoadingSubjectRanks] = useState(false);

  // Fonction pour calculer les vrais rangs (même logique que le modal)
  const calculateTrueRanks = () => {
    if (!selectedClass || !selectedPeriod) return;

    // Trouver la période sélectionnée pour obtenir son nom
    const selectedPeriodData = evaluationPeriods.find(p => p.id === selectedPeriod);
    if (!selectedPeriodData) {
      console.log('⚠️ Période sélectionnée non trouvée pour calculateTrueRanks');
      return;
    }

    // Vérifier si c'est un trimestre
    const periodName = selectedPeriodData.name;
    const isTrimester = periodName.toLowerCase().includes('trim') || periodName.toLowerCase().includes('trimestre');

    console.log(`📝 Type de période: ${isTrimester ? 'TRIMESTRE' : 'SÉQUENCE'} (${periodName})`);

    const studentsWithGrades = students.filter(student => {
      const studentGrades = grades[student.id];
      return studentGrades && studentGrades.length > 0;
    });

    const studentsData = studentsWithGrades.map(student => {
      const studentGrades = grades[student.id] || [];
      let totalWeighted = 0;
      let totalCoefficient = 0;

      if (isTrimester) {
        // Pour les trimestres, calculer sur les moyennes des 2 séquences
        // Les notes contiennent déjà seq1, seq2 et periodAverage calculés par loadGrades
        console.log(`🔍 Calcul trimestre pour ${student.id}:`, studentGrades);

        totalWeighted = studentGrades.reduce((sum: number, grade: any) => {
          // Utiliser periodAverage qui est déjà la moyenne des 2 séquences
          const averageScore = parseFloat(String(grade.periodAverage)) || 0;
          const coefficient = parseFloat(String(grade.coefficient)) || 1;
          const weighted = averageScore * coefficient;

          console.log(`  📊 ${grade.subjectName}: ${averageScore}/20 × ${coefficient} = ${weighted.toFixed(2)}`);

          return sum + weighted;
        }, 0);

        totalCoefficient = studentGrades.reduce((sum: number, grade: any) => {
          return sum + (parseFloat(String(grade.coefficient)) || 1);
        }, 0);

        console.log(`  📈 Total pondéré: ${totalWeighted.toFixed(2)}, Total coefficient: ${totalCoefficient}`);
      } else {
        // Pour les séquences, calculer la moyenne directe
        totalWeighted = studentGrades.reduce((sum: number, grade: any) => {
          const score = parseFloat(String(grade.score)) || 0;
          const maxScore = parseFloat(String(grade.maxScore)) || 20;
          const coefficient = parseFloat(String(grade.coefficient)) || 1;
          const normalizedScore = (score / maxScore) * 20;
          return sum + (normalizedScore * coefficient);
        }, 0);

        totalCoefficient = studentGrades.reduce((sum: number, grade: any) => {
          return sum + (parseFloat(String(grade.coefficient)) || 1);
        }, 0);
      }

      const average = totalCoefficient > 0 ? totalWeighted / totalCoefficient : 0;

      console.log(`📊 Moyenne finale pour ${student.id}: ${average.toFixed(2)}/20`);

      return {
        studentId: student.id,
        average,
        totalWeighted,
        totalCoefficient
      };
    });

    // Trier par moyenne décroissante
    studentsData.sort((a, b) => b.average - a.average);

    // Créer l'objet des rangs
    const ranksData: { [studentId: string]: any } = {};
    studentsData.forEach((studentData, index) => {
      ranksData[studentData.studentId] = {
        rank: index + 1,
        totalStudents: studentsData.length,
        average: studentData.average,
        totalWeighted: studentData.totalWeighted,
        totalCoefficient: studentData.totalCoefficient
      };
    });

    setCalculatedRanks(ranksData);
    console.log('🏆 Vrais rangs calculés:', ranksData);

    // Déclencher une mise à jour de l'affichage
    setDebugTrigger(prev => prev + 1);
  };

  // États pour les modals et l'affichage
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [teacherComments, setTeacherComments] = useState('');
  const [principalComments, setPrincipalComments] = useState('');

  // États pour la recherche et filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showConfig, setShowConfig] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'graded' | 'ungraded'>('all');
  const [currentView, setCurrentView] = useState<'bulletins' | 'advancement'>('bulletins');
  const [sortOrder, setSortOrder] = useState<'alpha_asc' | 'alpha_desc' | 'rank_asc' | 'rank_desc'>('alpha_asc');

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Charger les données initiales
  useEffect(() => {
    loadInitialData();
  }, []);

  // Chargement automatique des périodes d'évaluation
  useEffect(() => {
    if (schoolYear) {
      console.log('🔄 Chargement automatique des périodes d\'évaluation pour l\'année:', schoolYear);
      loadEvaluationPeriods();
      const interval = setInterval(() => {
        console.log('🔄 Rechargement automatique des périodes d\'évaluation...');
        loadEvaluationPeriods();
      }, 120000); // 2 minutes
      return () => clearInterval(interval);
    }
  }, [schoolYear]);

  // Chargement automatique des périodes quand une classe est sélectionnée
  useEffect(() => {
    if (selectedClass && schoolYear) {
      console.log('🔄 Chargement automatique des périodes d\'évaluation pour la classe:', selectedClass);
      loadEvaluationPeriods();
    }
  }, [selectedClass, schoolYear]);

  // Effet pour forcer la mise à jour quand debugTrigger change
  useEffect(() => {
    if (debugTrigger > 0 && selectedClass && selectedPeriod) {
      console.log('🔄 Debug trigger activé, recalcul des rangs...');
      // Le recalcul est déjà fait dans calculateTrueRanks
    }
  }, [debugTrigger, selectedClass, selectedPeriod]);

  // Recalculer automatiquement les rangs quand les notes changent
  useEffect(() => {
    if (Object.keys(grades).length > 0 && selectedPeriod) {
      console.log('🔄 Notes changées, recalcul automatique des rangs...');
      calculateTrueRanks();
      // Réinitialiser la pagination quand les notes changent
      setCurrentPage(1);
    }
  }, [grades, selectedPeriod]);

  // Rafraîchissement automatique des données toutes les 30 secondes
  useEffect(() => {
    if (selectedClass && selectedPeriod && schoolYear) {
      const interval = setInterval(() => {
        console.log('🔄 Rafraîchissement automatique des données...');
        loadGrades();
        loadBulletins();
      }, 30000); // 30 secondes

      return () => clearInterval(interval);
    }
  }, [selectedClass, selectedPeriod, schoolYear]);

  // Rechargement automatique complet des données toutes les 2 minutes
  useEffect(() => {
    if (selectedClass && selectedPeriod && schoolYear) {
      const interval = setInterval(() => {
        console.log('🔄 Rechargement automatique complet des données...');
        reloadAllData();
      }, 120000); // 2 minutes

      return () => clearInterval(interval);
    }
  }, [selectedClass, selectedPeriod, schoolYear]);

  // Recalcul automatique des rangs toutes les 3 minutes
  useEffect(() => {
    if (selectedClass && selectedPeriod && schoolYear) {
      const interval = setInterval(() => {
        console.log('🏆 Recalcul automatique des rangs...');
        recalculateAllRanksForComponent();
      }, 180000); // 3 minutes
      return () => clearInterval(interval);
    }
  }, [selectedClass, selectedPeriod, schoolYear]);

  // Recalcul automatique des rangs quand les données changent
  useEffect(() => {
    if (
      selectedClass &&
      selectedPeriod &&
      Array.isArray(grades) && grades.length > 0 &&
      Array.isArray(students) && students.length > 0 &&
      Array.isArray(subjects) && subjects.length > 0
    ) {
      console.log('🔄 Données mises à jour, recalcul automatique des rangs...');
      recalculateAllRanksForComponent();
    }
  }, [grades, students, subjects, selectedClass, selectedPeriod]);

  // Charger les classes quand un niveau est sélectionné (même logique que saisie-notes-avancee.tsx)
  useEffect(() => {
    if (selectedLevel) {
      const loadClassesForLevel = async () => {
        try {
          const selectedLevelData = levelsData.find((level: any) => level.name === selectedLevel);

          if (selectedLevelData) {
            const levelClasses = selectedLevelData.classes.map((cls: any) => ({ id: cls.id, name: cls.name }));
            setClasses(levelClasses);
            console.log(`✅ Classes chargées pour le niveau ${selectedLevel}:`, levelClasses);

            if (levelClasses.length === 0) {
              toast.error(`Aucune classe configurée pour le niveau ${selectedLevel}`);
            }
          } else {
            setClasses([]);
          }
        } catch (error) {
          console.error('Erreur lors du chargement des classes:', error);
          toast.error('Erreur lors du chargement des classes');
        }
      };
      loadClassesForLevel();
      // Réinitialiser la pagination quand le niveau change
      setCurrentPage(1);
    } else {
      setClasses([]);
      setSelectedClass('');
    }
  }, [selectedLevel, levelsData]);

  // Charger les données quand la classe change
  useEffect(() => {
    if (selectedClass && schoolYear) {
      loadStudents();
      loadSubjects();
      // Ne pas charger les notes ici car on a besoin de la période
      // Réinitialiser la pagination quand la classe change
      setCurrentPage(1);
    }
  }, [selectedClass, schoolYear]);

  // Charger les notes et bulletins quand la période change, puis recalculer automatiquement les rangs
  useEffect(() => {
    if (selectedClass && selectedPeriod && schoolYear) {
      console.log('🔄 Changement de classe/période détecté, chargement automatique...');

      // Réinitialiser la pagination quand la période change
      setCurrentPage(1);

      // Charger les données de base
      Promise.all([
        loadGrades(),
        loadBulletins()
      ]).then(() => {
        // Une fois les données chargées, déclencher automatiquement le recalcul des rangs
        console.log('🏆 Déclenchement automatique du recalcul des rangs...');

        // Utiliser la nouvelle API pour recalculer automatiquement les rangs
        fetch('/api/bulletins/recalculate-ranks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            classId: selectedClass,
            evaluationPeriodId: selectedPeriod,
            schoolYear
          })
        }).then(response => {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error('Erreur lors du recalcul automatique des rangs');
          }
        }).then(result => {
          if (result.success) {
            console.log(`✅ Rangs recalculés automatiquement pour ${result.successCount}/${result.totalStudents} élèves`);
            // Recharger les bulletins pour afficher les nouveaux rangs
            loadBulletins();
          } else {
            console.error('❌ Erreur lors du recalcul automatique des rangs');
          }
        }).catch(error => {
          console.error('❌ Erreur lors du recalcul automatique des rangs:', error);
        });
      });
    }
  }, [selectedClass, selectedPeriod, schoolYear]);

  // Fonction de rechargement complet des données
  const reloadAllData = async () => {
    if (selectedClass && selectedPeriod && schoolYear) {
      console.log('🔄 Rechargement complet des données...');
      setLoading(true);
      try {
        await Promise.all([
          loadStudents(),
          loadSubjects(),
          loadGrades(),
          loadBulletins()
        ]);
        console.log('✅ Données rechargées avec succès');
      } catch (error) {
        console.error('❌ Erreur lors du rechargement:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Fonction de recalcul des rangs (NOUVELLE VERSION FIABLE)
  const recalculateRanks = async () => {
    if (!selectedClass || !selectedPeriod || !schoolYear || !selectedLevel) {
      toast.error('Veuillez sélectionner un niveau, une classe et une période');
      return;
    }

    try {
      setLoading(true);
      console.log('🏆 Recalcul automatique des rangs en cours...');

      // Utiliser la nouvelle API dédiée au recalcul des rangs
      const response = await fetch('/api/bulletins/recalculate-ranks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClass,
          evaluationPeriodId: selectedPeriod,
          schoolYear
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Résultat du recalcul:', result);

        if (result.success) {
          toast.success(`✅ Rangs recalculés avec succès pour ${result.successCount}/${result.totalStudents} élève(s)`);

          // Recharger automatiquement les bulletins pour afficher les nouveaux rangs
          await loadBulletins();

          // Recharger aussi les autres données pour s'assurer de la cohérence
          await Promise.all([
            loadStudents(),
            loadSubjects(),
            loadGrades()
          ]);

          console.log('🔄 Toutes les données ont été rechargées après le recalcul des rangs');
        } else {
          toast.error('❌ Erreur lors du recalcul des rangs');
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Erreur API recalcul des rangs:', errorData);
        toast.error(`Erreur lors du recalcul des rangs: ${errorData.error || 'Erreur inconnue'}`);
      }

    } catch (error) {
      console.error('❌ Erreur lors du recalcul des rangs:', error);
      toast.error('Erreur lors du recalcul des rangs');
    } finally {
      setLoading(false);
    }
  };

  // Fonction de rechargement complet avec recalcul des rangs (NOUVELLE VERSION FIABLE)
  const reloadAllDataWithRanks = async () => {
    if (selectedClass && selectedPeriod && schoolYear && selectedLevel) {
      console.log('🔄 Rechargement complet avec recalcul automatique des rangs...');
      setLoading(true);
      try {
        // Vérifier si c'est un trimestre
        const isTrimester = selectedPeriod.toLowerCase().includes('trim');
        console.log(`📝 Type de période: ${isTrimester ? 'TRIMESTRE' : 'SÉQUENCE'}`);

        // D'abord recharger les données de base
        console.log('📊 1. Rechargement des données de base...');
        await Promise.all([
          loadStudents(),
          loadSubjects(),
          loadGrades() // Cette fonction gère déjà correctement les trimestres vs séquences
        ]);

        if (isTrimester) {
          // Pour les trimestres, charger directement les données des bulletins
          console.log('🏆 2. Chargement direct des données des bulletins pour trimestre...');

          // Charger directement les données des bulletins au lieu de recalculer
          await loadBulletinsData();

          toast.success('✅ Données des bulletins trimestre chargées directement');
        } else {
          // Pour les séquences, utiliser l'API de recalcul automatique
          console.log('🏆 2. Recalcul automatique des rangs pour séquence...');
          const response = await fetch('/api/bulletins/recalculate-ranks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              classId: selectedClass,
              evaluationPeriodId: selectedPeriod,
              schoolYear
            })
          });

          if (response.ok) {
            const result = await response.json();
            console.log('✅ Résultat du recalcul automatique:', result);

            if (result.success) {
              toast.success(`✅ Rangs recalculés automatiquement pour ${result.successCount}/${result.totalStudents} élève(s)`);

              // Recharger les bulletins pour afficher les nouveaux rangs
              await loadBulletins();
            } else {
              toast.error('❌ Erreur lors du recalcul automatique des rangs');
            }
          } else {
            const errorData = await response.json();
            console.error('❌ Erreur API recalcul automatique:', errorData);
            toast.error(`Erreur lors du recalcul automatique: ${errorData.error || 'Erreur inconnue'}`);
          }
        }

        console.log('✅ Rechargement complet terminé avec succès');
      } catch (error) {
        console.error('❌ Erreur lors du rechargement complet:', error);
        toast.error('Erreur lors du rechargement complet');
      } finally {
        setLoading(false);
      }
    }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      console.log('🚀 Chargement des données initiales...');

      // Charger les niveaux et classes (même logique que saisie-notes-avancee.tsx)
      const levelsResponse = await fetch('/api/school/levels-with-classes');
      if (levelsResponse.ok) {
        const levelsDataResponse = await levelsResponse.json();

        if (Array.isArray(levelsDataResponse)) {
          setLevelsData(levelsDataResponse);
          const levels = levelsDataResponse.map((level: any) => level.name);
          setAvailableLevels(levels);
          console.log(`✅ ${levels.length} niveaux chargés:`, levels);
        } else {
          setLevelsData([]);
          setAvailableLevels([]);
        }
      } else {
        setLevelsData([]);
        setAvailableLevels([]);
      }

      // Charger les périodes d'évaluation
      const periodsResponse = await fetch(`/api/evaluation-periods?schoolYear=${schoolYear}`);
      if (periodsResponse.ok) {
        const periodsData = await periodsResponse.json();
        setEvaluationPeriods(periodsData);
        console.log(`✅ ${periodsData.length} périodes d'évaluation chargées`);
      }

      console.log('✅ Données initiales chargées avec succès');
    } catch (error) {
      console.error('Erreur lors du chargement des données initiales:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour trier les périodes d'évaluation dans l'ordre logique
  const sortEvaluationPeriods = (periods: EvaluationPeriod[]) => {
    return periods.sort((a, b) => {
      // Priorité 1: Type de période (Séquence avant Trimestre)
      const aType = a.name.toLowerCase();
      const bType = b.name.toLowerCase();

      const aIsSequence = aType.includes('seq') || aType.includes('séquence');
      const bIsSequence = bType.includes('seq') || bType.includes('séquence');
      const aIsTrimester = aType.includes('trim');
      const bIsTrimester = bType.includes('trim');

      // Séquences en premier
      if (aIsSequence && !bIsSequence) return -1;
      if (!aIsSequence && bIsSequence) return 1;

      // Si les deux sont des séquences, trier par ordre
      if (aIsSequence && bIsSequence) {
        const aOrder = a.order || 0;
        const bOrder = b.order || 0;
        return aOrder - bOrder;
      }

      // Si les deux sont des trimestres, trier par ordre
      if (aIsTrimester && bIsTrimester) {
        const aOrder = a.order || 0;
        const bOrder = b.order || 0;
        return aOrder - bOrder;
      }

      // Ordre par défaut basé sur le nom
      return a.name.localeCompare(b.name);
    });
  };

  const loadEvaluationPeriods = async () => {
    try {
      console.log('🔍 Chargement des périodes d\'évaluation pour l\'année:', schoolYear);

      const response = await fetch(`/api/evaluation-periods?schoolYear=${schoolYear}`);

      if (response.ok) {
        const data = await response.json();
        console.log('📦 Périodes d\'évaluation reçues:', data.length, 'périodes');

        // Trier les périodes dans l'ordre logique
        const sortedPeriods = sortEvaluationPeriods(data);

        // Filtrer les trimestres : ils ne s'affichent que si leurs 2 séquences respectives sont actives (présentes)
        const finalPeriods = sortedPeriods.filter((period: any) => {
          const nameLower = period.name.toLowerCase();
          const isTrimester = nameLower.includes('trim') || nameLower.includes('trimestre');

          if (!isTrimester) return true; // Conserver les séquences

          // Vérifier si les séquences requises sont présentes dans sortedPeriods
          let hasSeq1 = false;
          let hasSeq2 = false;

          if (nameLower.includes('1er') || nameLower.includes('1')) {
            hasSeq1 = sortedPeriods.some((p: any) => p.name.toLowerCase().includes('seq') && (p.name.includes('1') || p.name.toLowerCase().includes('premi')));
            hasSeq2 = sortedPeriods.some((p: any) => p.name.toLowerCase().includes('seq') && (p.name.includes('2') || p.name.toLowerCase().includes('deux')));
          } else if (nameLower.includes('2') || nameLower.includes('deux') || nameLower.includes('snd')) {
            hasSeq1 = sortedPeriods.some((p: any) => p.name.toLowerCase().includes('seq') && (p.name.includes('3') || p.name.toLowerCase().includes('troi')));
            hasSeq2 = sortedPeriods.some((p: any) => p.name.toLowerCase().includes('seq') && (p.name.includes('4') || p.name.toLowerCase().includes('quat')));
          } else if (nameLower.includes('3') || nameLower.includes('troi')) {
            hasSeq1 = sortedPeriods.some((p: any) => p.name.toLowerCase().includes('seq') && (p.name.includes('5') || p.name.toLowerCase().includes('cinq')));
            hasSeq2 = sortedPeriods.some((p: any) => p.name.toLowerCase().includes('seq') && (p.name.includes('6') || p.name.toLowerCase().includes('six')));
          } else {
            // Au cas où ce n'est pas identifié, on affiche par défaut
            return true;
          }

          return hasSeq1 && hasSeq2;
        });

        // Les trimesters et sequences pour le log
        const trimesters = finalPeriods.filter((p: any) => p.name.toLowerCase().includes('trim'));
        const sequences = finalPeriods.filter((p: any) => p.name.toLowerCase().includes('seq'));

        console.log('🏆 Trimestres trouvés (validés):', trimesters.length, trimesters.map((p: any) => p.name));
        console.log('📝 Séquences trouvées:', sequences.length, sequences.map((p: any) => p.name));

        setEvaluationPeriods(finalPeriods);

        // Si aucune période n'est trouvée, afficher un avertissement
        if (data.length === 0) {
          console.warn('⚠️ Aucune période d\'évaluation trouvée pour l\'année:', schoolYear);
          toast.warning(`Aucune période d'évaluation trouvée pour l'année ${schoolYear}`);
        }
      } else {
        console.error('❌ Erreur lors du chargement des périodes:', response.status, response.statusText);
        toast.error('Erreur lors du chargement des périodes d\'évaluation');
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des périodes:', error);
      toast.error('Erreur lors du chargement des périodes d\'évaluation');
    }
  };

  // Helper: déterminer si un élève est actif selon plusieurs conventions possibles
  const isStudentActive = (stu: any): boolean => {
    if (!stu) return false;
    if (typeof stu.isActive === 'boolean') return stu.isActive;
    if (typeof stu.active === 'boolean') return stu.active;

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

    // Par défaut, considérer actif pour compatibilité ascendante
    return true;
  };

  const filterActiveStudents = (arr: any[]) => Array.isArray(arr) ? arr.filter(isStudentActive) : [];

  const loadStudents = async () => {
    try {
      // Utiliser directement l'ID de la classe comme dans la saisie des notes
      console.log('🔍 Chargement des élèves pour la classe ID:', selectedClass);

      const response = await fetch(`/api/students?classId=${encodeURIComponent(selectedClass)}&schoolYear=${schoolYear}`);
      if (response.ok) {
        const data = await response.json();
        const activeOnly = filterActiveStudents(data || []);
        console.log(`📦 Élèves récupérés: ${(data || []).length}, actifs retenus: ${activeOnly.length}`);
        setStudents(activeOnly);
      } else {
        console.error('❌ Erreur lors du chargement des élèves:', response.statusText);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des élèves:', error);
    }
  };

  const loadSubjects = async () => {
    try {
      // Utiliser directement l'ID de la classe comme dans la saisie des notes
      console.log('🔍 Chargement des matières pour la classe ID:', selectedClass);

      const response = await fetch(`/api/subject-coefficients?classId=${encodeURIComponent(selectedClass)}&schoolYear=${schoolYear}`);
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Matières récupérées:', data);

        // Si aucune matière trouvée, essayer de récupérer toutes les matières
        if (!data || data.length === 0) {
          console.log('⚠️ Aucune matière trouvée avec classId, essai de récupération globale');
          const globalResponse = await fetch(`/api/subject-coefficients?schoolYear=${schoolYear}`);
          if (globalResponse.ok) {
            const globalData = await globalResponse.json();
            console.log('📦 Matières globales récupérées:', globalData);
            setSubjects(globalData);
          } else {
            console.error('❌ Erreur lors du chargement des matières globales:', globalResponse.statusText);
            setSubjects([]);
          }
        } else {
          setSubjects(data);
        }
      } else {
        console.error('❌ Erreur lors du chargement des matières:', response.statusText);
        setSubjects([]);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des matières:', error);
      setSubjects([]);
    }
  };

  const loadGrades = async () => {
    if (!selectedPeriod) return;
    try {
      // Use the class ID directly as in note entry
      console.log('🔍 Chargement des notes pour la classe ID:', selectedClass);

      // Vérifier si c'est un trimestre
      const isTrimester = selectedPeriod && selectedPeriod.toLowerCase().includes('trim');

      if (isTrimester) {
        // Pour les trimestres, récupérer les notes des 2 séquences
        console.log('📚 Trimestre détecté, récupération des notes des séquences');

        // Récupérer les IDs des séquences selon le trimestre
        const sequencesResponse = await fetch(`/api/evaluation-periods?schoolYear=${schoolYear}&type=sequence`);
        console.log('🔍 URL de récupération des séquences:', `/api/evaluation-periods?schoolYear=${schoolYear}&type=sequence`);

        if (sequencesResponse.ok) {
          const sequences = await sequencesResponse.json();
          console.log('📝 Séquences trouvées:', sequences);

          if (sequences.length > 0) {
            // Déterminer quelles séquences charger selon le trimestre
            let targetSequences: EvaluationPeriod[] = [];

            // Utiliser la période déjà trouvée
            const selectedPeriodData = evaluationPeriods.find(p => p.id === selectedPeriod);
            if (!selectedPeriodData) {
              console.log('⚠️ Période sélectionnée non trouvée');
              return;
            }

            const periodName = selectedPeriodData.name;
            console.log(`🎯 Période sélectionnée: ID="${selectedPeriod}", Nom="${periodName}"`);

            if (periodName.toLowerCase().includes('1er') || periodName.toLowerCase().includes('1st')) {
              // 1er trimestre : séquences 1 et 2
              targetSequences = sequences.filter((seq: any) => seq.order === 1 || seq.order === 2);
              console.log('📚 1er trimestre → Séquences 1 et 2');
            } else if (periodName.toLowerCase().includes('2ème') || periodName.toLowerCase().includes('2eme') || periodName.toLowerCase().includes('2nd')) {
              // 2ème trimestre : séquences 3 et 4
              targetSequences = sequences.filter((seq: any) => seq.order === 3 || seq.order === 4);
              console.log('📚 2ème trimestre → Séquences 3 et 4');
            } else if (periodName.toLowerCase().includes('3ème') || periodName.toLowerCase().includes('3eme') || periodName.toLowerCase().includes('3rd')) {
              // 3ème trimestre : séquences 5 et 6
              targetSequences = sequences.filter((seq: any) => seq.order === 5 || seq.order === 6);
              console.log('📚 3ème trimestre → Séquences 5 et 6');
            } else {
              console.log('⚠️ Type de trimestre non reconnu:', periodName);
              // Fallback : prendre les 2 premières séquences
              targetSequences = sequences.slice(0, 2);
              console.log('📚 Fallback: 2 premières séquences sélectionnées');
            }

            // Trier les séquences cibles par numéro
            targetSequences.sort((a, b) => a.order - b.order);

            console.log('🎯 Séquences cibles selon le trimestre:', targetSequences.map(s => ({ id: s.id, name: s.name })));

            if (targetSequences.length === 0) {
              console.log('⚠️ Aucune séquence trouvée pour ce trimestre');
              return;
            }

            // Récupérer les notes de la 1ère séquence cible
            const seq1Url = `/api/grades?classId=${encodeURIComponent(selectedClass)}&evaluationPeriodId=${targetSequences[0].id}&schoolYear=${schoolYear}`;
            console.log('🔍 URL 1ère séquence cible:', seq1Url);

            const seq1Response = await fetch(seq1Url);
            console.log('📡 Réponse 1ère séquence cible:', seq1Response.status, seq1Response.statusText);

            if (!seq1Response.ok) {
              console.error('❌ Erreur lors de la récupération des notes de la 1ère séquence:', seq1Response.statusText);
              return;
            }

            const seq1Grades = await seq1Response.json();
            console.log('📊 Notes 1ère séquence cible:', seq1Grades);
            console.log('📊 Nombre de notes récupérées:', seq1Grades.length);

            // Récupérer les notes de la 2ème séquence cible (si disponible)
            let seq2Grades = [];
            if (targetSequences.length > 1) {
              console.log('🔍 Récupération de la 2ème séquence cible...');

              const seq2Response = await fetch(`/api/grades?classId=${encodeURIComponent(selectedClass)}&evaluationPeriodId=${targetSequences[1].id}&schoolYear=${schoolYear}`);
              console.log('📡 Réponse 2ème séquence cible:', seq2Response.status, seq2Response.statusText);

              if (seq2Response.ok) {
                seq2Grades = await seq2Response.json();
                console.log('📊 Notes 2ème séquence cible:', seq2Grades);
                console.log('📊 Nombre de notes récupérées (2ème séquence):', seq2Grades.length);
              } else {
                console.error('❌ Erreur lors de la récupération des notes de la 2ème séquence:', seq2Response.statusText);
              }
            } else {
              console.log('⚠️ Pas de 2ème séquence cible disponible');
            }

            // Organiser par élève et par matière avec seq1 et seq2
            const gradesByStudent: GradesByStudent = {};

            // Identifier les matières qui ont des notes dans la première séquence
            const subjectsWithGrades = new Set();
            seq1Grades.forEach((grade: Grade) => {
              // Convertir en nombre pour correspondre aux IDs des matières
              subjectsWithGrades.add(parseInt(grade.subjectId));
            });

            console.log('📚 Matières avec des notes dans la 1ère séquence:', Array.from(subjectsWithGrades));

            students.forEach(student => {
              gradesByStudent[student.id] = [];
              console.log(`🔍 Traitement de l'élève: ${student.id}`);

              // Utiliser uniquement les matières qui ont des notes dans la 1ère séquence
              subjects.forEach(subject => {
                // Vérifier si cette matière a des notes dans la 1ère séquence
                console.log(`  🔍 Vérification de la matière: ${subject.id} (${subject.name})`);
                if (subjectsWithGrades.has(subject.id)) {
                  console.log(`    ✅ Matière ${subject.id} a des notes dans la 1ère séquence.`);
                  // Chercher la note de la 1ère séquence
                  const seq1Grade = seq1Grades.find((g: Grade) => g.studentId === student.id && parseInt(g.subjectId) === subject.id);
                  // Chercher la note de la 2ème séquence
                  const seq2Grade = seq2Grades.find((g: Grade) => g.studentId === student.id && parseInt(g.subjectId) === subject.id);

                  console.log(`      🔍 Recherche de notes pour ${student.id} - ${subject.id}`);
                  console.log(`        Seq1 Grade trouvé:`, seq1Grade);
                  console.log(`        Seq2 Grade trouvé:`, seq2Grade);

                  // Créer l'objet de note avec seq1 et seq2
                  const combinedGrade: Grade = {
                    id: `combined-${student.id}-${subject.id}`,
                    studentId: student.id,
                    subjectId: String(subject.id),
                    evaluationPeriodId: selectedPeriod,
                    schoolYear: schoolYear,
                    score: 0, // Score par défaut
                    maxScore: subject.maxScore || 20,
                    coefficient: subject.coefficient || 1,
                    seq1: seq1Grade ? parseFloat(seq1Grade.score) || 0 : 0,
                    seq2: seq2Grade ? parseFloat(seq2Grade.score) || 0 : 0,
                    periodAverage: 0,
                    subjectName: subject.name,
                    subjectCoefficient: subject.coefficient || 1
                  };

                  // Calculer la moyenne de la période
                  let totalScoreSum = 0;
                  let scoreCount = 0;

                  if (seq1Grade) { // Check if seq1Grade object exists
                    const score1 = parseFloat(seq1Grade.score);
                    if (!isNaN(score1)) { // Check if the parsed score is a valid number
                      totalScoreSum += score1;
                      scoreCount++;
                    }
                  }
                  if (seq2Grade) { // Check if seq2Grade object exists
                    const score2 = parseFloat(seq2Grade.score);
                    if (!isNaN(score2)) { // Check if the parsed score is a valid number
                      totalScoreSum += score2;
                      scoreCount++;
                    }
                  }
                  combinedGrade.periodAverage = scoreCount > 0 ? totalScoreSum / scoreCount : 0;
                  console.log(`        Calculated periodAverage for ${student.id} - ${subject.name}: ${combinedGrade.periodAverage}`);

                  gradesByStudent[student.id].push(combinedGrade);
                  console.log(`        ✅ Note ajoutée pour ${student.id} - ${subject.id}:`, combinedGrade);
                }
              });
            });

            setGrades(gradesByStudent);
            console.log('📊 Notes organisées par élève (trimestre avec seq1/seq2):', gradesByStudent);

            // ===== DÉBOGAGE SUPPLÉMENTAIRE =====
            console.log('🔍 === DÉBOGAGE LOADGRADES TRIMESTRE ===');
            console.log('📝 Séquences trouvées:', sequences);
            console.log('📊 Notes 1ère séquence:', seq1Grades);
            console.log('📊 Notes 2ème séquence:', seq2Grades);
            console.log('📚 Matières avec des notes:', Array.from(subjectsWithGrades));
            console.log('👥 Élèves traités:', students.map(s => ({ id: s.id, name: s.nom })));
            console.log('🔍 État final de gradesByStudent:', gradesByStudent);
            console.log('🔍 === FIN DÉBOGAGE LOADGRADES ===');

            // Forcer le recalcul des rangs après avoir chargé les notes des trimestres
            console.log('🔄 Forcer le recalcul des rangs après chargement des notes trimestre...');

            // Attendre que l'état soit mis à jour, puis recalculer
            setTimeout(() => {
              console.log('🔄 Exécution de calculateTrueRanks après délai...');
              calculateTrueRanks();
            }, 200);
          }
        }
      } else {
        // Pour les séquences, récupération normale
        const response = await fetch(`/api/grades?classId=${encodeURIComponent(selectedClass)}&evaluationPeriodId=${selectedPeriod}&schoolYear=${schoolYear}`);

        if (response.ok) {
          const data = await response.json();
          console.log('📦 Notes récupérées de l\'API (séquence):', data);

          const gradesByStudent: GradesByStudent = {};
          data.forEach((grade: Grade) => {
            if (!gradesByStudent[grade.studentId]) {
              gradesByStudent[grade.studentId] = [];
            }
            gradesByStudent[grade.studentId].push(grade);
          });
          setGrades(gradesByStudent);
          console.log('📊 Notes organisées par élève (séquence):', gradesByStudent);
        } else {
          console.error('❌ Erreur lors du chargement des notes:', response.statusText);
          setGrades({});
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des notes:', error);
      setGrades({});
    }
  };

  const loadBulletins = async () => {
    if (!selectedPeriod) return;

    try {
      // Utiliser directement l'ID de la classe comme dans la saisie des notes
      console.log('🔍 Chargement des bulletins pour la classe ID:', selectedClass);

      const response = await fetch(`/api/bulletins?classId=${encodeURIComponent(selectedClass)}&evaluationPeriodId=${selectedPeriod}&schoolYear=${schoolYear}`);
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Bulletins récupérés:', data);
        setBulletins(data);
      } else {
        console.error('❌ Erreur lors du chargement des bulletins:', response.statusText);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des bulletins:', error);
    }
  };

  // Fonction pour charger directement les données des bulletins (plus fiable que le recalcul)
  const loadBulletinsData = async () => {
    if (!selectedClass || !selectedPeriod || !schoolYear) return;

    console.log('🔄 Chargement direct des données des bulletins...');
    setLoading(true);

    try {
      // Charger directement les bulletins depuis l'API
      const response = await fetch(`/api/bulletins?classId=${encodeURIComponent(selectedClass)}&evaluationPeriodId=${selectedPeriod}&schoolYear=${schoolYear}`);

      if (response.ok) {
        const bulletinsData = await response.json();
        console.log('📦 Données des bulletins récupérées:', bulletinsData);

        // Mettre à jour l'état des bulletins
        setBulletins(bulletinsData);

        // Créer un objet des rangs basé sur les données des bulletins
        const ranksFromBulletins: { [studentId: string]: any } = {};

        bulletinsData.forEach((bulletin: any) => {
          ranksFromBulletins[bulletin.studentId] = {
            rank: bulletin.rank || 1,
            totalStudents: bulletinsData.length,
            average: bulletin.averageScore || 0,
            totalWeighted: bulletin.totalScore || 0,
            totalCoefficient: bulletin.totalCoefficient || 0
          };
        });

        // Mettre à jour les rangs calculés avec les vraies données des bulletins
        setCalculatedRanks(ranksFromBulletins);

        console.log('✅ Rangs mis à jour depuis les bulletins:', ranksFromBulletins);
        toast.success('✅ Données des bulletins chargées et rangs synchronisés');

      } else {
        console.error('❌ Erreur lors du chargement des bulletins:', response.statusText);
        toast.error('Erreur lors du chargement des bulletins');
      }

    } catch (error) {
      console.error('❌ Erreur lors du chargement des bulletins:', error);
      toast.error('Erreur lors du chargement des bulletins');
    } finally {
      setLoading(false);
    }
  };

  const getStudentGrades = (studentId: string) => {
    const studentGrades = grades[studentId] || [];

    // Filtrer et nettoyer les notes pour éviter les doublons
    const uniqueGrades = studentGrades.filter((grade, index, self) =>
      index === self.findIndex(g => g.id === grade.id)
    );

    // Vérifier si c'est un trimestre
    const isTrimester = selectedPeriod && selectedPeriod.toLowerCase().includes('trim');

    if (isTrimester) {
      // Pour les trimestres, organiser les notes par matière avec seq1 et seq2
      console.log(`📚 Trimestre détecté pour ${studentId}, organisation des notes des séquences`);

      // Créer un objet avec toutes les matières de la classe
      const allSubjectsGrades: { [subjectId: string]: any } = {};

      // Pour les trimestres, utiliser directement les notes organisées par loadGrades
      // Ces notes contiennent déjà seq1, seq2 et periodAverage
      console.log(`🔍 Notes du trimestre pour l'élève ${studentId}:`, uniqueGrades);
      return uniqueGrades;
    }

    // Pour les séquences, logique existante
    // Créer un objet avec toutes les matières de la classe
    const allSubjectsGrades: { [subjectId: string]: Grade } = {};

    // D'abord, initialiser toutes les matières avec des notes par défaut (0)
    subjects.forEach(subject => {
      allSubjectsGrades[subject.id] = {
        id: `default-${studentId}-${subject.id}`,
        studentId: studentId,
        subjectId: String(subject.id),
        evaluationPeriodId: selectedPeriod,
        score: 0,
        maxScore: subject.maxScore || 20,
        coefficient: subject.coefficient || 1,
        schoolYear: schoolYear,
        seq1: 0,
        seq2: 0,
        periodAverage: 0,
        subjectName: subject.name,
        subjectCoefficient: subject.coefficient || 1
      };
    });

    // Ensuite, remplacer par les vraies notes existantes
    uniqueGrades.forEach(grade => {
      if (allSubjectsGrades[grade.subjectId]) {
        allSubjectsGrades[grade.subjectId] = {
          ...grade,
          subjectCoefficient: grade.subjectCoefficient || grade.coefficient,
          subjectName: subjects.find(s => s.id === parseInt(grade.subjectId))?.name || grade.subjectId,
          score: parseFloat(String(grade.score || 0)),
          maxScore: parseFloat(String(grade.maxScore || 20))
        };
      }
    });

    // Convertir en tableau et trier par nom de matière
    const result = Object.values(allSubjectsGrades).sort((a, b) =>
      (a.subjectName || '').localeCompare(b.subjectName || '')
    );

    console.log(`🔍 Notes complètes pour l'élève ${studentId}:`, result);
    return result;
  };

  const getStudentAverage = (studentId: string): number => {
    try {
      // PRIORITÉ 1: Utiliser les rangs calculés par calculateTrueRanks()
      if (calculatedRanks && calculatedRanks[studentId]) {
        const rankData = calculatedRanks[studentId];
        const average = typeof rankData.average === 'number' ? rankData.average : (typeof rankData.average === 'string' ? parseFloat(rankData.average) : 0);
        console.log(`🏆 Moyenne depuis calculatedRanks pour ${studentId}: ${average}`);
        return average;
      }

      // PRIORITÉ 2: Utiliser directement les données du bulletin
      const bulletin = bulletins.find(b => b.studentId === studentId);
      if (bulletin && bulletin.averageScore !== undefined) {
        const average = typeof bulletin.averageScore === 'number' ? bulletin.averageScore : (typeof bulletin.averageScore === 'string' ? parseFloat(bulletin.averageScore) : 0);
        console.log(`📊 Moyenne du bulletin pour ${studentId}: ${average}`);
        return average;
      }

      // Fallback : calcul manuel si pas de bulletin
      const studentGrades = getStudentGrades(studentId);
      if (studentGrades.length === 0) return 0;

      console.log(`🔍 Calcul manuel de la moyenne pour l'élève ${studentId}:`, studentGrades);

      let totalWeightedScore = 0;
      let totalCoefficient = 0;

      // Vérifier si c'est un trimestre
      const isTrimester = selectedPeriod && selectedPeriod.toLowerCase().includes('trim');

      // Utiliser toutes les matières de la classe
      subjects.forEach(subject => {
        const grade = studentGrades.find(g => g.subjectId === String(subject.id));
        const coefficient = typeof subject.coefficient === 'number' ? subject.coefficient : (typeof subject.coefficient === 'string' ? parseFloat(subject.coefficient) : 1);

        if (grade) {
          if (isTrimester && grade.periodAverage !== undefined) {
            // Pour les trimestres, utiliser periodAverage (moyenne des 2 séquences)
            const averageScore = parseFloat(String(grade.periodAverage)) || 0;
            const weightedScore = averageScore * coefficient;
            totalWeightedScore += weightedScore;

            console.log(`📊 Trimestre ${subject.name}: Moyenne ${grade.periodAverage}/20 × ${coefficient} = ${weightedScore.toFixed(2)}`);
          } else if (grade.score !== undefined && grade.score !== null) {
            // Pour les séquences, normaliser sur 20
            const score = parseFloat(String(grade.score));
            const maxScore = parseFloat(String(grade.maxScore));

            if (!isNaN(score) && !isNaN(maxScore) && maxScore > 0) {
              const normalizedScore = (score / maxScore) * 20;
              const weightedScore = normalizedScore * coefficient;
              totalWeightedScore += weightedScore;

              console.log(`📊 Séquence ${subject.name}: ${score}/${maxScore} × ${coefficient} = ${normalizedScore.toFixed(2)} × ${coefficient} = ${weightedScore.toFixed(2)}`);
            }
          }
        }

        totalCoefficient += coefficient;
      });

      const average = totalCoefficient > 0 ? totalWeightedScore / totalCoefficient : 0;
      console.log(`📊 Moyenne calculée: ${average.toFixed(2)} (totalWeighted: ${totalWeightedScore.toFixed(2)}, totalCoef: ${totalCoefficient})`);

      // S'assurer de retourner toujours un nombre valide
      return isNaN(average) ? 0 : average;
    } catch (error) {
      console.error(`❌ Erreur dans getStudentAverage pour ${studentId}:`, error);
      return 0; // Retourner 0 en cas d'erreur
    }
  };

  const getStudentRank = (studentId: string) => {
    // PRIORITÉ 1: Utiliser les rangs calculés par calculateTrueRanks()
    if (calculatedRanks && calculatedRanks[studentId]) {
      const rankData = calculatedRanks[studentId];
      console.log(`🏆 Rang depuis calculatedRanks pour ${studentId}: ${rankData.rank}`);
      return rankData.rank;
    }

    // PRIORITÉ 2: Utiliser directement les données du bulletin
    const bulletin = bulletins.find(b => b.studentId === studentId);
    if (bulletin && bulletin.rank !== undefined) {
      console.log(`📊 Rang du bulletin pour ${studentId}: ${bulletin.rank}`);
      return bulletin.rank;
    }

    // Fallback : calcul manuel si pas de bulletin
    const averages = students.map(student => ({
      studentId: student.id,
      average: getStudentAverage(student.id) || 0
    })).sort((a, b) => b.average - a.average);

    const rank = averages.findIndex(s => s.studentId === studentId) + 1;
    return rank;
  };

  // NOUVELLE FONCTION : Calculer les rangs par matière
  const getStudentRanksBySubject = (studentId: string) => {
    const studentGrades = grades[studentId] || [];
    const ranksBySubject: { [subjectId: string]: { rank: number, totalStudents: number } } = {};

    // Debug pour voir ce qui se passe
    console.log(`🔍 getStudentRanksBySubject pour ${studentId}:`, {
      studentGrades,
      gradesKeys: Object.keys(grades),
      selectedPeriod,
      isTrimester: selectedPeriod && selectedPeriod.toLowerCase().includes('trim'),
      gradesContent: grades[studentId]
    });

    // Grouper les notes par matière
    const gradesBySubject: { [subjectId: string]: any[] } = {};
    studentGrades.forEach(grade => {
      if (!gradesBySubject[grade.subjectId]) {
        gradesBySubject[grade.subjectId] = [];
      }
      gradesBySubject[grade.subjectId].push(grade);
    });

    // Pour chaque matière, calculer le rang de l'élève
    Object.entries(gradesBySubject).forEach(([subjectId, subjectGrades]) => {
      // Vérifier si c'est un trimestre
      const isTrimester = selectedPeriod && selectedPeriod.toLowerCase().includes('trim');

      // Calculer la moyenne de l'élève dans cette matière
      let studentSubjectAverage = 0;

      if (isTrimester) {
        // Pour les trimestres, utiliser periodAverage (moyenne des 2 séquences)
        const grade = subjectGrades[0]; // Prendre la première note qui contient toutes les infos
        if (grade && grade.periodAverage !== undefined) {
          studentSubjectAverage = parseFloat(String(grade.periodAverage)) || 0;
        }
      } else {
        // Pour les séquences, calculer normalement
        studentSubjectAverage = subjectGrades.reduce((sum, grade) => {
          const score = parseFloat(String(grade.score)) || 0;
          const maxScore = parseFloat(String(grade.maxScore)) || 20;
          const coefficient = parseFloat(String(grade.coefficient)) || 1;
          const normalizedScore = (score / maxScore) * 20;
          return sum + (normalizedScore * coefficient);
        }, 0) / subjectGrades.reduce((sum, grade) => sum + (parseFloat(String(grade.coefficient)) || 1), 0);
      }

      // Calculer les moyennes de tous les élèves dans cette matière
      const allStudentsSubjectAverages = students.map(student => {
        const studentSubjectGrades = grades[student.id]?.filter(g => g.subjectId === subjectId) || [];
        if (studentSubjectGrades.length === 0) return { studentId: student.id, average: 0 };

        let average = 0;

        if (isTrimester) {
          // Pour les trimestres, utiliser periodAverage
          const grade = studentSubjectGrades[0];
          if (grade && grade.periodAverage !== undefined) {
            average = parseFloat(String(grade.periodAverage)) || 0;
          }
        } else {
          // Pour les séquences, calculer normalement
          const totalWeighted = studentSubjectGrades.reduce((sum, grade) => {
            const score = parseFloat(String(grade.score)) || 0;
            const maxScore = parseFloat(String(grade.maxScore)) || 20;
            const coefficient = parseFloat(String(grade.coefficient)) || 1;
            const normalizedScore = (score / maxScore) * 20;
            return sum + (normalizedScore * coefficient);
          }, 0);

          const totalCoefficient = studentSubjectGrades.reduce((sum, grade) =>
            sum + (parseFloat(String(grade.coefficient)) || 1), 0);

          average = totalCoefficient > 0 ? totalWeighted / totalCoefficient : 0;
        }

        return { studentId: student.id, average };
      }); // SUPPRIMER LE FILTRE .filter(s => s.average > 0) pour inclure tous les élèves

      // Trier par moyenne décroissante et calculer le rang
      allStudentsSubjectAverages.sort((a, b) => b.average - a.average);
      const rank = allStudentsSubjectAverages.findIndex(s => s.studentId === studentId) + 1;

      ranksBySubject[subjectId] = {
        rank: rank > 0 ? rank : 1,
        totalStudents: allStudentsSubjectAverages.length
      };
    });

    return ranksBySubject;
  };

  const getMention = (average: number): string => {
    if (average >= 18) return 'Excellent';
    if (average >= 16) return 'Très Bien';
    if (average >= 14) return 'Bien';
    if (average >= 12) return 'Assez Bien';
    if (average >= 10) return 'Passable';
    return 'Insuffisant';
  };

  const getMentionColor = (mention: string): string => {
    switch (mention) {
      case 'Excellent': return 'bg-purple-100 text-purple-800';
      case 'Très Bien': return 'bg-blue-100 text-blue-800';
      case 'Bien': return 'bg-green-100 text-green-800';
      case 'Assez Bien': return 'bg-yellow-100 text-yellow-800';
      case 'Passable': return 'bg-orange-100 text-orange-800';
      case 'Insuffisant': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const openCommentsModal = (student: Student) => {
    setSelectedStudent(student);
    const bulletin = bulletins.find(b => b.studentId === student.id);
    setTeacherComments(bulletin?.teacherComments || '');
    setPrincipalComments(bulletin?.principalComments || '');
    setShowCommentsModal(true);
  };



  const saveComments = async () => {
    if (!selectedStudent || !selectedPeriod) return;

    console.log('🚀 === SAUVEGARDE DES APPRÉCIATIONS ===');
    console.log('👤 Élève sélectionné:', selectedStudent);
    console.log('📅 Période sélectionnée:', selectedPeriod);
    console.log('🏫 Classe sélectionnée:', selectedClass);
    console.log('📚 Année scolaire:', schoolYear);
    console.log('👨‍🏫 Commentaires professeur:', teacherComments);
    console.log('👨‍💼 Commentaires chef établissement:', principalComments);

    try {
      const requestBody = {
        studentId: selectedStudent.id,
        classId: selectedClass,
        evaluationPeriodId: selectedPeriod,
        schoolYear,
        teacherComments,
        principalComments,
        issuedBy: 'ADMIN_001'
      };

      console.log('📤 Corps de la requête envoyé:', requestBody);

      const response = await fetch('/api/bulletins/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 Réponse reçue:', response.status, response.statusText);

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Données de réponse:', responseData);
        toast.success('Appréciations sauvegardées avec succès');
        setShowCommentsModal(false);
        loadBulletins(); // Recharger les bulletins
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erreur de réponse:', errorData);
        toast.error(`Erreur lors de la sauvegarde: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      toast.error(`Erreur lors de la sauvegarde: ${(error as any).message}`);
    }
  };

  const generateBulletin = async (studentId: string) => {
    try {
      // ===== DÉBOGAGE DÉTAILLÉ =====
      console.log('🚀 === GÉNÉRATION DU BULLETIN ===');
      console.log('👤 ID de l\'élève:', studentId);
      console.log('📅 Période sélectionnée:', selectedPeriod);
      console.log('🏫 Classe sélectionnée:', selectedClass);
      console.log('📊 Niveau sélectionné:', selectedLevel);
      console.log('📚 Année scolaire:', schoolYear);

      // Vérifier si c'est un trimestre
      const isTrimester = selectedPeriod && selectedPeriod.toLowerCase().includes('trim');
      console.log('🔍 Type de période (trimestre?):', isTrimester);

      // Récupérer les notes de l'élève
      const studentGrades = getStudentGrades(studentId);
      console.log('📊 Notes de l\'élève récupérées:', studentGrades);

      // Récupérer les informations de l'élève
      const student = students.find(s => s.id === studentId);
      console.log('👤 Informations de l\'élève:', student);

      // Récupérer les matières
      console.log('📚 Matières disponibles:', subjects);

      // Récupérer les périodes d'évaluation
      console.log('📅 Périodes d\'évaluation:', evaluationPeriods);

      // Récupérer l'état des notes
      console.log('📊 État des notes (grades):', grades);

      // CALCULER LES VRAIS RANGS AVANT LA GÉNÉRATION
      calculateTrueRanks();

      // Récupérer le rang calculé pour cet élève
      const studentRankData = calculatedRanks[studentId];
      console.log('🏆 Rang calculé pour cet élève:', studentRankData);

      console.log('🚀 === FIN DÉBOGAGE ===');

      // Calculer les rangs par matière pour cet élève
      const studentRanksBySubject = getStudentRanksBySubject(studentId);
      console.log('🏆 Rangs par matière calculés:', studentRanksBySubject);

      // Récupérer le vrai effectif de la classe (nombre total d'élèves)
      const classStudents = students.filter(s => s.classeId === selectedClass);
      const trueClassSize = classStudents.length;
      console.log(`👥 Effectif réel de la classe: ${trueClassSize} élèves`);

      // Déterminer quelle API utiliser selon le type de période
      const apiEndpoint = isTrimester
        ? '/api/bulletins/generate-trimestre-individuel'
        : '/api/bulletins/generate';

      console.log('🔗 API utilisée:', apiEndpoint);

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          evaluationPeriodId: selectedPeriod,
          schoolYear,
          classId: selectedClass,
          // PASSER TOUS LES RANGS CALCULÉS POUR UNE UTILISATION DIRECTE
          calculatedRanks: {
            [studentId]: {
              ...studentRankData,
              ranksBySubject: studentRanksBySubject, // Ajouter les rangs par matière
              totalStudents: trueClassSize // Vrai effectif de la classe
            }
          },
          // Garder aussi les anciens paramètres pour compatibilité
          frontendRank: studentRankData?.rank || 1,
          frontendTotalStudents: trueClassSize, // Utiliser le vrai effectif
          frontendAverage: studentRankData?.average || 0
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bulletin_${studentId}_${selectedPeriod}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Bulletin généré avec succès');
      } else {
        toast.error('Erreur lors de la génération du bulletin');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la génération du bulletin');
    }
  };

  const generateAllBulletins = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bulletins/generate-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClass,
          evaluationPeriodId: selectedPeriod,
          schoolYear
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bulletins_${selectedClass}_${selectedPeriod}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Tous les bulletins ont été générés');
      } else {
        toast.error('Erreur lors de la génération des bulletins');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la génération des bulletins');
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les élèves
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const average = getStudentAverage(student.id);

    if (statusFilter === 'graded') return matchesSearch && average !== null;
    if (statusFilter === 'ungraded') return matchesSearch && average === null;
    return matchesSearch;
  });

  // Trier les élèves
  filteredStudents.sort((a, b) => {
    if (sortOrder === 'alpha_asc') {
      return a.nom.localeCompare(b.nom);
    } else if (sortOrder === 'alpha_desc') {
      return b.nom.localeCompare(a.nom);
    } else if (sortOrder === 'rank_asc' || sortOrder === 'rank_desc') {
      // Les élèves sans rang (N/A ou null) sont mis à la fin
      const rankA = getStudentRank(a.id) !== null ? Number(getStudentRank(a.id)) : 999999;
      const rankB = getStudentRank(b.id) !== null ? Number(getStudentRank(b.id)) : 999999;

      if (sortOrder === 'rank_asc') {
        return rankA - rankB;
      } else {
        // En mode décroissant, on garde les non classés à la fin tout de même en les traitant à part
        if (rankA === 999999 && rankB !== 999999) return 1;
        if (rankB === 999999 && rankA !== 999999) return -1;
        return rankB - rankA;
      }
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStudents = filteredStudents.slice(startIndex, endIndex);

  // Fonction pour récupérer les vraies données du bulletin depuis l'API
  const fetchBulletinData = async (studentId: string) => {
    if (!selectedClass || !selectedPeriod || !schoolYear) {
      console.log('⚠️ Paramètres manquants pour récupérer les données du bulletin');
      return null;
    }

    try {
      console.log('🔍 Récupération des vraies données du bulletin depuis l\'API...');

      // Appeler l'API de génération de bulletin pour récupérer les vraies données
      const response = await fetch('/api/bulletins/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: studentId,
          evaluationPeriodId: selectedPeriod,
          schoolYear: schoolYear,
          classId: selectedClass,
          // Envoyer les rangs calculés par le frontend pour comparaison
          calculatedRanks: calculatedRanks,
          frontendRank: getStudentRank(studentId),
          frontendTotalStudents: students.length,
          frontendAverage: getStudentAverage(studentId)
        })
      });

      if (!response.ok) {
        console.error('❌ Erreur lors de la récupération des données du bulletin:', response.statusText);
        return null;
      }

      // L'API retourne un PDF, mais nous voulons juste les données
      // Nous allons utiliser une approche différente : récupérer les données depuis la base
      console.log('✅ Données du bulletin récupérées avec succès');

      // Pour l'instant, retourner les données du bulletin existant
      const existingBulletin = bulletins.find(b => b.studentId === studentId);
      return existingBulletin;

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des données du bulletin:', error);
      return null;
    }
  };

  // Fonction pour récupérer les rangs par matière depuis la base de données
  const getSubjectRanksFromDatabase = async (studentId: string) => {
    if (!selectedClass || !selectedPeriod || !schoolYear) {
      return {};
    }

    try {
      setIsLoadingSubjectRanks(true);
      console.log('🔍 Récupération des rangs par matière depuis la base de données...');

      // Appeler l'API pour récupérer les rangs par matière
      const response = await fetch('/api/bulletins/subject-ranks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId: selectedClass,
          evaluationPeriodId: selectedPeriod,
          schoolYear: schoolYear,
          studentId: studentId
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Rangs par matière récupérés:', data);
        setSubjectRanksFromDB(data.ranksBySubject || {});
        return data.ranksBySubject || {};
      } else {
        console.error('❌ Erreur lors de la récupération des rangs par matière:', response.statusText);
        return {};
      }

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des rangs par matière:', error);
      return {};
    } finally {
      setIsLoadingSubjectRanks(false);
    }
  };

  // Fonction pour ouvrir la boîte de dialogue des détails avec récupération des vraies données
  const openDetailsModal = async (student: Student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);

    // Récupérer les vraies données du bulletin depuis la base de données
    console.log('🔍 Ouverture de la boîte de dialogue des détails pour:', student.nom);
    await getSubjectRanksFromDatabase(student.id);
  };

  // Nouvelles fonctions pour calculer les rangs (même logique que les bulletins)

  // Calcul des rangs par matière pour ce composant
  const calculateSubjectRanksForComponent = (classId: number, periodId: number) => {
    if (!students.length || !subjects.length) return {};

    const subjectRanks: { [subjectId: string]: { [studentId: number]: { rank: number, average: number, totalStudents: number } } } = {};

    subjects.forEach(subject => {
      const subjectId = subject.id.toString();
      subjectRanks[subjectId] = {};

      // Calculer les moyennes par élève pour cette matière
      const studentAverages: { studentId: number, average: number }[] = [];

      students.forEach(student => {
        const studentGrades = grades[student.id] || [];
        const studentSubjectGrades = studentGrades.filter(g =>
          String(g.subjectId) === String(subject.id) &&
          String(g.evaluationPeriodId) === String(periodId)
        );

        if (studentSubjectGrades.length > 0) {
          let totalScore = 0;
          let totalMaxScore = 0;

          studentSubjectGrades.forEach(grade => {
            totalScore += grade.score;
            totalMaxScore += grade.maxScore;
          });

          const average = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 20 : 0;
          studentAverages.push({ studentId: typeof student.id === 'number' ? student.id : parseInt(student.id), average: typeof average === 'number' ? average : (typeof average === 'string' ? parseFloat(average) : 0) });
        }
      });

      // Trier par moyenne décroissante
      studentAverages.sort((a, b) => b.average - a.average);

      // Assigner les rangs (gérer les égalités)
      let currentRank = 1;
      let previousAverage = -1;

      studentAverages.forEach((student, index) => {
        if (student.average !== previousAverage) {
          currentRank = index + 1;
        }

        subjectRanks[subjectId][student.studentId] = {
          rank: currentRank,
          average: student.average,
          totalStudents: studentAverages.length
        };

        previousAverage = student.average;
      });
    });

    return subjectRanks;
  };

  // Calcul des rangs généraux pour ce composant
  const calculateGeneralRanksForComponent = (classId: number, periodId: number) => {
    if (!students.length || !subjects.length) return {};

    const generalRanks: { [studentId: number]: { rank: number, average: number, totalStudents: number } } = {};

    // Calculer la moyenne générale par élève
    const studentGeneralAverages: { studentId: number, average: number, totalCoefficient: number }[] = [];

    students.forEach(student => {
      let totalWeightedScore = 0;
      let totalCoefficient = 0;

      const studentGrades = grades[student.id] || [];

      subjects.forEach(subject => {
        const subjectGrades = studentGrades.filter(g =>
          String(g.subjectId) === String(subject.id) &&
          String(g.evaluationPeriodId) === String(periodId)
        );

        if (subjectGrades.length > 0) {
          let subjectTotalScore = 0;
          let subjectTotalMaxScore = 0;

          subjectGrades.forEach(grade => {
            subjectTotalScore += grade.score;
            subjectTotalMaxScore += grade.maxScore;
          });

          if (subjectTotalMaxScore > 0) {
            const subjectAverage = (subjectTotalScore / subjectTotalMaxScore) * 20;
            const coefficient = subject.coefficient || 1;

            totalWeightedScore += subjectAverage * coefficient;
            totalCoefficient += coefficient;
          }
        }
      });

      const generalAverage = totalCoefficient > 0 ? totalWeightedScore / totalCoefficient : 0;
      studentGeneralAverages.push({
        studentId: typeof student.id === 'number' ? student.id : parseInt(student.id),
        average: generalAverage,
        totalCoefficient
      });
    });

    // Trier par moyenne générale décroissante
    studentGeneralAverages.sort((a, b) => b.average - a.average);

    // Assigner les rangs généraux (gérer les égalités)
    let currentRank = 1;
    let previousAverage = -1;

    studentGeneralAverages.forEach((student, index) => {
      if (student.average !== previousAverage) {
        currentRank = index + 1;
      }

      generalRanks[student.studentId] = {
        rank: currentRank,
        average: student.average,
        totalStudents: studentGeneralAverages.length
      };

      previousAverage = student.average;
    });

    return generalRanks;
  };

  // Fonction pour recalculer tous les rangs (par matière et général)
  const recalculateAllRanksForComponent = () => {
    if (!selectedClass || !selectedPeriod) return;

    console.log('🔄 Recalcul des rangs par matière et généraux pour ce composant...');

    // Calculer les rangs par matière
    const periodId = typeof selectedPeriod === 'object' && selectedPeriod !== null && 'id' in selectedPeriod ? (selectedPeriod as any).id : selectedPeriod;
    const subjectRanks = calculateSubjectRanksForComponent(parseInt(selectedClass), periodId);
    // Adapter la structure pour correspondre au type attendu
    const adaptedSubjectRanks: { [subjectId: string]: { rank: number; totalStudents: number; } } = {};
    Object.keys(subjectRanks).forEach(subjectId => {
      const subjectObj = subjectRanks[subjectId];
      if (subjectObj) {
        // Chercher le premier étudiant
        const firstStudentId = Object.keys(subjectObj)[0];
        if (firstStudentId && (subjectObj as Record<string, any>)[firstStudentId]) {
          const studentData = (subjectObj as Record<string, any>)[firstStudentId];
          adaptedSubjectRanks[subjectId] = {
            rank: studentData.rank,
            totalStudents: studentData.totalStudents
          };
        }
      }
    });
    setSubjectRanksFromDB(adaptedSubjectRanks);

    // Calculer les rangs généraux
    const generalRanks = calculateGeneralRanksForComponent(parseInt(selectedClass), periodId);

    // Mettre à jour les bulletins avec les nouveaux rangs
    setBulletins(prevBulletins =>
      prevBulletins.map(bulletin => {
        const generalRank = generalRanks[typeof bulletin.studentId === 'number' ? bulletin.studentId : parseInt(bulletin.studentId)];
        if (generalRank) {
          return {
            ...bulletin,
            rank: generalRank.rank,
            totalStudents: generalRank.totalStudents,
            averageScore: generalRank.average
          };
        }
        return bulletin;
      })
    );

    console.log('✅ Rangs recalculés pour ce composant');
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between bg-white border border-slate-200 p-2 shadow-sm rounded-none">
        <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200">
          <Button
            variant={currentView === 'bulletins' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('bulletins')}
            className={`rounded-none text-[11px] font-bold h-8 px-4 ${currentView === 'bulletins' ? 'bg-white text-blue-700 shadow-sm hover:bg-white' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            <Printer className="h-3.5 w-3.5 mr-2" />
            IMPRESSION BULLETINS
          </Button>
          <Button
            variant={currentView === 'advancement' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('advancement')}
            className={`rounded-none text-[11px] font-bold h-8 px-4 ${currentView === 'advancement' ? 'bg-white text-blue-700 shadow-sm hover:bg-white' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            <Users className="h-3.5 w-3.5 mr-2" />
            CONSEIL DE CLASSE
          </Button>
        </div>

        <div className="flex items-center gap-2 px-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 rounded-none h-8 font-bold text-[10px]"
          >
            {showConfig ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            <span>{showConfig ? "MASQUER LES SÉLECTEURS" : "AFFICHER LES SÉLECTEURS"}</span>
          </Button>
        </div>
      </div>

      {currentView === 'bulletins' ? (
        <div className="space-y-6 mt-0">




          {/* Espaceur supprimé car le bouton est maintenant dans l'en-tête */}

          {/* Sélecteurs */}
          {showConfig && (
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase">Année Scolaire</Label>
                    <SchoolYearSelect
                      value={schoolYear}
                      onValueChange={setSchoolYear}
                      availableYears={availableYears}
                      currentSchoolYear={currentSchoolYear}
                      placeholder="Sélectionner l'année scolaire"
                      className="w-full rounded-none h-9 border-slate-300"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase">Niveau</Label>
                    <Select value={selectedLevel} onValueChange={(value) => {
                      setSelectedLevel(value);
                      setSelectedClass(''); // Réinitialiser la classe sélectionnée
                    }}>
                      <SelectTrigger className="rounded-none h-9 border-slate-300">
                        <SelectValue placeholder="Sélectionner un niveau" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        {availableLevels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase">Classe</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass} disabled={!selectedLevel}>
                      <SelectTrigger className="rounded-none h-9 border-slate-300">
                        <SelectValue placeholder={selectedLevel ? "Sélectionner une classe" : "---"} />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase">Période d'Évaluation</Label>
                    <div className="flex gap-2">
                      <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                        <SelectTrigger className="rounded-none h-9 border-slate-300">
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          {/* Grouper les périodes par type */}
                          {(() => {
                            const sequences = evaluationPeriods.filter(p =>
                              p.name.toLowerCase().includes('seq') || p.name.toLowerCase().includes('séquence')
                            );
                            const trimesters = evaluationPeriods.filter(p =>
                              p.name.toLowerCase().includes('trim')
                            );
                            const others = evaluationPeriods.filter(p =>
                              !p.name.toLowerCase().includes('seq') &&
                              !p.name.toLowerCase().includes('séquence') &&
                              !p.name.toLowerCase().includes('trim')
                            );

                            return (
                              <>
                                {/* Séquences */}
                                {sequences.length > 0 && (
                                  <>
                                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50">
                                      📚 Séquences
                                    </div>
                                    {sequences.map((period) => (
                                      <SelectItem key={period.id} value={period.id}>
                                        {period.name}
                                      </SelectItem>
                                    ))}
                                  </>
                                )}

                                {/* Trimestres */}
                                {trimesters.length > 0 && (
                                  <>
                                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50">
                                      📊 Trimestres
                                    </div>
                                    {trimesters.map((period) => (
                                      <SelectItem key={period.id} value={period.id}>
                                        {period.name}
                                      </SelectItem>
                                    ))}
                                  </>
                                )}

                                {/* Autres périodes */}
                                {others.length > 0 && (
                                  <>
                                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50">
                                      📅 Autres Périodes
                                    </div>
                                    {others.map((period) => (
                                      <SelectItem key={period.id} value={period.id}>
                                        {period.name}
                                      </SelectItem>
                                    ))}
                                  </>
                                )}
                              </>
                            );
                          })()}
                        </SelectContent>
                      </Select>

                      <Button
                        onClick={async () => {
                          await reloadAllDataWithRanks();
                          if (!selectedPeriod?.toLowerCase().includes('trim')) {
                            calculateTrueRanks();
                          }
                        }}
                        variant="default"
                        disabled={!selectedClass || !selectedPeriod}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-none h-9 px-6 font-bold shadow-sm"
                      >
                        Charger
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>




          )}

          {/* Liste des élèves */}
          {selectedClass && selectedPeriod && selectedLevel ? (
            <Card>
              <CardHeader className="pb-4 bg-slate-50/50 border-b border-slate-100 rounded-none">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="bg-white rounded-none">
                      {filteredStudents.length} élève(s)
                    </Badge>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 rounded-none">
                      {evaluationPeriods.find(p => p.id === selectedPeriod)?.name || 'Période'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className="rounded-none h-8"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filtres
                    </Button>

                    <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                      <SelectTrigger className="w-40 h-8 rounded-none">
                        <SelectValue placeholder="Filtrer par statut" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="all">Tous les élèves</SelectItem>
                        <SelectItem value="graded">Élèves notés</SelectItem>
                        <SelectItem value="ungraded">Élèves non notés</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                      <SelectTrigger className="w-44 h-8 rounded-none bg-white">
                        <SelectValue placeholder="Trier par..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="alpha_asc">Nom (A-Z)</SelectItem>
                        <SelectItem value="alpha_desc">Nom (Z-A)</SelectItem>
                        <SelectItem value="rank_asc">Rang (Croissant)</SelectItem>
                        <SelectItem value="rank_desc">Rang (Décroissant)</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="w-px h-6 bg-slate-200 mx-1" />

                    <Button
                      onClick={generateAllBulletins}
                      disabled={loading || !selectedClass || !selectedPeriod}
                      className="bg-green-600 hover:bg-green-700 rounded-none shadow-sm flex items-center gap-2 h-8"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      <span className="hidden sm:inline">Générer Tout</span>
                    </Button>
                  </div>
                </div>

                {showFilters && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Rechercher un élève..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 rounded-none h-9 border-slate-300 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-none h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Chargement...</p>
                  </div>
                ) : (
                  <Table className="border-t border-l border-slate-200 w-full overflow-hidden">
                    <TableHeader>
                      <TableRow className="bg-slate-100 divide-x divide-slate-200 border-b border-slate-200 group hover:bg-slate-100">
                        <TableHead className="w-24 text-[11px] font-bold text-slate-800 uppercase px-2 py-2">Matricule</TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-800 uppercase px-2 py-2">Élève</TableHead>
                        <TableHead className="w-16 text-[11px] font-bold text-slate-800 uppercase px-2 py-2 text-center">Sexe</TableHead>
                        <TableHead className="w-32 text-[11px] font-bold text-slate-800 uppercase px-2 py-2 text-center">Moyenne</TableHead>
                        <TableHead className="w-24 text-[11px] font-bold text-slate-800 uppercase px-2 py-2 text-center">Rang</TableHead>
                        <TableHead className="w-32 text-[11px] font-bold text-slate-800 uppercase px-2 py-2 text-center">Mention</TableHead>
                        <TableHead className="w-40 text-[11px] font-bold text-slate-800 uppercase px-2 py-2 text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentStudents.map((student) => {
                        const average = getStudentAverage(student.id);
                        const rank = average !== null ? getStudentRank(student.id) : null;
                        const mention = average !== null ? getMention(average) : null;
                        const bulletin = bulletins.find(b => b.studentId === student.id);
                        const ranksBySubject = getStudentRanksBySubject(student.id);

                        return (
                          <TableRow key={student.id} className="divide-x divide-slate-200 border-b border-slate-200 hover:bg-slate-50 transition-colors">
                            <TableCell className="text-[11px] px-2 py-1.5 font-mono text-blue-600 font-bold bg-slate-50/30">
                              {student.id || '---'}
                            </TableCell>
                            <TableCell className="text-[11px] px-2 py-1.5 font-semibold text-slate-800">
                              {student.nom} {student.prenom}
                            </TableCell>
                            <TableCell className="text-[11px] px-2 py-1.5 text-center text-slate-600 font-medium">
                              {(student.sexe || '').toUpperCase() === 'MASCULIN' ? 'M' : (student.sexe || '').toUpperCase() === 'FÉMININ' ? 'F' : (student.sexe || '---').substring(0, 1).toUpperCase()}
                            </TableCell>
                            <TableCell className="text-[11px] px-2 py-1.5 text-center">
                              {average !== null && typeof average === 'number' ? (
                                <span className="font-bold text-slate-900 px-2 py-0.5 bg-blue-50/50">
                                  {average.toFixed(2)}/20
                                </span>
                              ) : (
                                <span className="text-slate-400">--/20</span>
                              )}
                            </TableCell>
                            <TableCell className="text-[11px] px-2 py-1.5 text-center">
                              {rank !== null ? (
                                <span className="font-bold text-slate-700">
                                  {rank}/{Object.keys(calculatedRanks).length || students.length}
                                </span>
                              ) : (
                                <span className="text-slate-400">--</span>
                              )}
                            </TableCell>
                            <TableCell className="text-[11px] px-2 py-1.5 text-center">
                              {mention ? (
                                <span className={`px-2 py-0.5 text-[10px] items-center font-bold ${getMentionColor(mention)}`}>
                                  {mention}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-[11px] px-2 py-1.5">
                              <div className="flex justify-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openDetailsModal(student)}
                                  className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-none border-0"
                                  title="Détails"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openCommentsModal(student)}
                                  className="h-7 w-7 p-0 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-none border-0"
                                  title="Appréciations"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-20 p-0 text-blue-600 hover:bg-blue-600 hover:text-white rounded-none border border-blue-200 transition-all font-bold text-[10px]"
                                  onClick={() => generateBulletin(student.id)}
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  PDF
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}

                {/* Pagination améliorée */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 border-t pt-4">
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-muted-foreground">
                        Affichage de {startIndex + 1} à {Math.min(endIndex, filteredStudents.length)} sur {filteredStudents.length} élève(s)
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Page {currentPage} sur {totalPages}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Bouton Première page */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        title="Première page"
                      >
                        ⏮️
                      </Button>

                      {/* Bouton Précédent */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        ◀️ Précédent
                      </Button>

                      {/* Sélecteur de page rapide */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Page:</span>
                        <Select
                          value={currentPage.toString()}
                          onValueChange={(value) => setCurrentPage(parseInt(value))}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                              <SelectItem key={page} value={page.toString()}>
                                {page}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-sm text-muted-foreground">sur {totalPages}</span>
                      </div>

                      {/* Bouton Suivant */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Suivant ▶️
                      </Button>

                      {/* Bouton Dernière page */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        title="Dernière page"
                      >
                        ⏭️
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Sélectionnez une classe et une période pour voir les bulletins
                </p>
              </CardContent>
            </Card>
          )}

          {/* Modal des appréciations */}
          <Dialog open={showCommentsModal} onOpenChange={setShowCommentsModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  Appréciations - {selectedStudent?.nom}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Appréciation du Professeur Principal</Label>
                  <Textarea
                    value={teacherComments}
                    onChange={(e) => setTeacherComments(e.target.value)}
                    placeholder="Appréciation du professeur principal..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Appréciation du Chef d'Établissement</Label>
                  <Textarea
                    value={principalComments}
                    onChange={(e) => setPrincipalComments(e.target.value)}
                    placeholder="Appréciation du chef d'établissement..."
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCommentsModal(false)}>
                    Annuler
                  </Button>
                  <Button onClick={saveComments}>
                    Sauvegarder
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Modal des détails des notes et rangs par matière */}
          <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto p-0 rounded-none border-0 shadow-xl">
              <DialogHeader className="p-4 bg-slate-800 text-white rounded-t-none border-b-0 m-0">
                <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white">
                  <FileText className="h-5 w-5 text-blue-400" />
                  Relevé de Notes - {selectedStudent?.nom} {selectedStudent?.prenom}
                </DialogTitle>
              </DialogHeader>

              {selectedStudent && (
                <div className="p-6 bg-white space-y-6">
                  {/* Informations générales compactes */}
                  <div className="bg-slate-50 border border-slate-200 p-3 grid grid-cols-4 gap-4 text-[11px] uppercase tracking-wider font-semibold text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[9px] mb-1">Classe</span>
                      {classes.find((c: any) => c.id === selectedClass)?.name || selectedClass || '---'}
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] mb-1">Période</span>
                      {evaluationPeriods.find((p: any) => p.id === selectedPeriod)?.name || '---'}
                    </div>
                    <div className="border-l border-slate-200 pl-4">
                      <span className="text-slate-400 block text-[9px] mb-1">Moyenne Générale</span>
                      <span className="font-bold text-[14px] text-blue-600">
                        {(() => {
                          const avg = getStudentAverage(selectedStudent.id);
                          return (typeof avg === 'number') ? `${avg.toFixed(2)}/20` : '---';
                        })()}
                      </span>
                    </div>
                    <div className="border-l border-slate-200 pl-4">
                      <span className="text-slate-400 block text-[9px] mb-1">Rang Général</span>
                      <span className="font-bold text-[14px] text-green-600">
                        {(() => {
                          const rank = getStudentRank(selectedStudent.id);
                          return rank !== null ? `${rank}/${Object.keys(calculatedRanks).length || students.length}` : 'N/A';
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* Détails par matière - Grille compacte */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-[11px] text-slate-800 uppercase tracking-tight">
                        Détail par Matière
                        {isLoadingSubjectRanks && (
                          <span className="ml-2 text-[10px] normal-case text-blue-600">
                            <Loader2 className="h-3 w-3 inline animate-spin mr-1" />
                            Calcul en cours...
                          </span>
                        )}
                      </h3>
                    </div>

                    <div className="border border-slate-200 rounded-none overflow-hidden">
                      <div className="bg-slate-100 border-b border-slate-200 grid grid-cols-12 text-[10px] font-bold text-slate-700 uppercase tracking-tight divide-x divide-slate-200">
                        <div className="col-span-5 px-3 py-2 flex items-center">Matière</div>
                        <div className="col-span-1 px-2 py-2 flex justify-center items-center">Coef</div>

                        {(() => {
                          const isTrimester = selectedPeriod && selectedPeriod.toLowerCase().includes('trim');
                          return isTrimester ? (
                            <>
                              <div className="col-span-2 px-2 py-2 flex justify-center items-center">Seq 1</div>
                              <div className="col-span-2 px-2 py-2 flex justify-center items-center">Seq 2</div>
                              <div className="col-span-1 px-2 py-2 flex justify-center items-center text-blue-800">Moy.</div>
                            </>
                          ) : (
                            <div className="col-span-5 px-2 py-2 flex justify-center items-center text-blue-800">Note (/Max)</div>
                          );
                        })()}

                        <div className="col-span-1 px-2 py-2 flex justify-center items-center">Rang</div>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {(() => {
                          const isTrimester = selectedPeriod && selectedPeriod.toLowerCase().includes('trim');
                          let subjectsToDisplay: any[] = [];

                          if (isTrimester) {
                            subjectsToDisplay = subjects;
                          } else {
                            const ranksBySubject = getStudentRanksBySubject(selectedStudent.id);
                            const subjectsWithGrades = Object.keys(ranksBySubject);
                            subjectsToDisplay = subjects.filter((s: any) => subjectsWithGrades.includes(s.id.toString()));
                          }

                          if (subjectsToDisplay.length === 0) {
                            return (
                              <div className="text-center py-6 text-[11px] text-slate-500 font-medium">
                                Aucune note enregistrée
                              </div>
                            );
                          }

                          return subjectsToDisplay.map((subject: any) => {
                            const subjectId = subject.id.toString();
                            const subjectName = subject.name || `Matière ${subjectId}`;
                            const studentGrades = grades[selectedStudent.id]?.filter((g: any) => g.subjectId === subjectId) || [];

                            const rankData = subjectRanksFromDB[subjectId] || { rank: 'N/A' };

                            return (
                              <div key={subjectId} className="grid grid-cols-12 text-[11px] hover:bg-slate-50 divide-x divide-slate-100 items-center">
                                <div className="col-span-5 px-3 py-1.5 font-semibold text-slate-800 truncate">
                                  {subjectName}
                                </div>
                                <div className="col-span-1 px-2 py-1.5 text-center text-slate-600 font-mono">
                                  {subject.coefficient || 1}
                                </div>

                                {isTrimester ? (
                                  <>
                                    <div className="col-span-2 px-2 py-1.5 text-center font-mono">
                                      {studentGrades.length > 0 && typeof studentGrades[0].seq1 === 'number' ? `${studentGrades[0].seq1.toFixed(2)}` : '---'}
                                    </div>
                                    <div className="col-span-2 px-2 py-1.5 text-center font-mono">
                                      {studentGrades.length > 0 && typeof studentGrades[0].seq2 === 'number' ? `${studentGrades[0].seq2.toFixed(2)}` : '---'}
                                    </div>
                                    <div className="col-span-1 px-2 py-1.5 text-center font-bold font-mono text-blue-700 bg-blue-50/50">
                                      {studentGrades.length > 0 && typeof studentGrades[0].periodAverage === 'number' ? `${studentGrades[0].periodAverage.toFixed(2)}` : '---'}
                                    </div>
                                  </>
                                ) : (
                                  <div className="col-span-5 px-2 py-1.5 text-center font-bold font-mono text-blue-700 bg-blue-50/50">
                                    {studentGrades.length > 0 && typeof studentGrades[0].score === 'number' ? `${studentGrades[0].score.toFixed(2)} / ${studentGrades[0].maxScore}` : '---'}
                                  </div>
                                )}

                                <div className="col-span-1 px-2 py-1.5 text-center font-bold text-green-600">
                                  {rankData.rank !== 'N/A' ? `${rankData.rank}` : '-'}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button variant="outline" className="rounded-none border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] px-6" onClick={() => setShowDetailsModal(false)}>
                      Fermer
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Modal des informations des élèves avec rangs - SUPPRIMÉ */}

          {/* Fonction de débogage pour les trimestres */}
          {(() => {
            const debugStudentBulletin = async (studentId: string) => {
              try {
                console.log('🔍 === DEBUG BULLETIN TRIMESTRE ===');
                console.log('👤 ID de l\'élève:', studentId);
                console.log('📅 Période sélectionnée:', selectedPeriod);
                console.log('🏫 Classe sélectionnée:', selectedClass);
                console.log('📚 Année scolaire:', schoolYear);

                // Vérifier si c'est un trimestre
                if (!isTrimester) {
                  toast.error('Le mode débogage est uniquement disponible pour les trimestres.');
                  return;
                }

                // Appeler l'API de débogage
                const response = await fetch('/api/bulletins/debug-trimestre', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    classId: selectedClass,
                    evaluationPeriodId: selectedPeriod,
                    schoolYear: schoolYear
                  })
                });

                if (!response.ok) {
                  const errorText = await response.text();
                  console.error('❌ Erreur API debug:', response.status, errorText);
                  toast.error('Erreur lors de la récupération des données de débogage.');
                  return;
                }

                const data = await response.json();
                console.log('✅ Données de débogage reçues:', data);

                // Afficher les données dans une alerte pour l'instant
                alert(`Debug Trimestre - ${data.studentsCount} élèves analysés\n\n` +
                  `Période: ${data.periodName}\n` +
                  `Classe: ${data.className}\n\n` +
                  `Données complètes dans la console.`);

              } catch (error) {
                console.error('❌ Erreur lors du débogage:', error);
                toast.error('Erreur lors de la récupération des données de débogage.');
              }
            };

            // Rendre la fonction disponible globalement pour le composant
            (window as any).debugStudentBulletin = debugStudentBulletin;

            return null;
          })()}
        </div>
      ) : (
        <div className="mt-0">

          {selectedClass ? (
            <ClassAdvancementView
              students={students}
              classes={classes}
              currentClassId={selectedClass}
              schoolYear={schoolYear}
              advancementDecisions={advancementDecisions}
              setAdvancementDecisions={setAdvancementDecisions}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 border border-slate-200">
              <FileText className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">Veuillez d'abord sélectionner une classe pour accéder au Conseil de Classe.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

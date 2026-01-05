import { getAllGrades, getGradesByStudent, getGradesByClassAndSubject, addGrade, updateGrade, deleteGrade } from '../db/services/gradesDb';
import { getAllClassSubjects, addClassSubject, deleteClassSubject, getAllSubjects, deleteAllClassSubjectsForClassYear, addGlobalSubject } from '../db/services/classSubjectDb';
import { getFilteredStudents } from './studentService';

export type EvaluationType = string; // Ex: 'Séquence 1', 'Séquence 2', ...

export interface Grade {
  id?: number;
  studentId: string;
  classId: string;
  schoolYear: string;
  subjectId: string;
  evaluationType: EvaluationType;
  score: number;
  assessment?: string;
  recordedAt?: string;
}

export interface ClassSubject {
  id?: number;
  className: string;
  schoolYear: string;
  subjectId: string;
  name: string;
  coefficient: number;
  maxScore: number;
}

export interface Subject {
  subjectId: string;
  name: string;
}

export interface ReportCardData {
  studentId: string;
  notes: Grade[];
}

// Ajout ou mise à jour en masse des notes pour une séquence
export async function saveGrades(grades: Grade[], classId: string, evaluationType: EvaluationType, schoolYear: string): Promise<void> {
  // On supprime toutes les notes existantes pour cette classe, séquence, année
  const existing = await getAllGrades() as any[];
  const toDelete = existing.filter(g => g.classId === classId && g.evaluationType === evaluationType && g.schoolYear === schoolYear);
  for (const g of toDelete) {
    await deleteGrade(g.id);
  }
  // On ajoute toutes les nouvelles notes
  for (const grade of grades) {
    await addGrade(grade);
  }
}

// Récupérer toutes les notes d'une classe pour une séquence donnée
export async function getGradesForSequence(classId: string, evaluationType: EvaluationType, schoolYear: string): Promise<Grade[]> {
  const all = await getAllGrades() as any[];
  return all.filter(g => g.classId === classId && g.evaluationType === evaluationType && g.schoolYear === schoolYear);
}

// Récupérer toutes les notes d'un élève pour une année
export async function getGradesByStudentService(studentId: string, schoolYear: string): Promise<Grade[]> {
  return await getGradesByStudent(studentId, schoolYear) as Grade[];
}

// Mettre à jour une note
export async function updateGradeService(gradeId: number, updatedFields: Partial<{ score: number; assessment?: string; }>): Promise<void> {
  await updateGrade(gradeId, updatedFields);
}

// Supprimer une note
export async function deleteGradeService(gradeId: number): Promise<void> {
  await deleteGrade(gradeId);
}

// Générer les données de bulletin pour une classe, séquence, année
export async function generateReportCardData(classId: string, evaluationType: EvaluationType, schoolYear: string): Promise<any[]> {
  // Récupère toutes les notes de la séquence
  const grades = await getGradesForSequence(classId, evaluationType, schoolYear);

  // Récupérer les matières de la classe pour l'année
  const classSubjects = await getClassSubjects(classId, schoolYear);

  // Récupérer la liste des élèves inscrits dans la classe pour l'année
  const students = await getFilteredStudents({ classe: classId, anneeScolaire: schoolYear });

  // Construire un map des notes par élève pour accès rapide
  const gradesByStudent: Record<string, Grade[]> = {};
  for (const g of grades) {
    if (!gradesByStudent[g.studentId]) gradesByStudent[g.studentId] = [];
    gradesByStudent[g.studentId].push(g);
  }

  // Pour chaque élève de la classe, s'assurer qu'il a une note pour chaque matière (0 si manquante)
  const result: any[] = [];
  for (const student of students) {
    const studentGrades = gradesByStudent[student.id] ? [...gradesByStudent[student.id]] : [];

    // Pour chaque matière de la classe, vérifier s'il y a une note; si non, ajouter une note à 0
    for (const subj of classSubjects) {
      // Tentatives de correspondance: subjectId, id, name
      const match = studentGrades.find(sg =>
        String(sg.subjectId) === String(subj.subjectId || subj.id || subj.subjectId) ||
        String(sg.subjectId) === String(subj.id) ||
        String(sg.subjectId).toLowerCase() === String(subj.name).toLowerCase()
      );

      if (!match) {
        // Ajouter une note factice à 0
        const fakeGrade: Grade = {
          studentId: student.id,
          classId,
          schoolYear,
          subjectId: String(subj.subjectId || subj.id || subj.name),
          evaluationType,
          score: 0,
          assessment: 'ABS' // marque l'absence de note — peut être ajustée
        };
        studentGrades.push(fakeGrade);
      }
    }

    result.push({ studentId: student.id, notes: studentGrades });
  }

  return result;
}

// Récupérer toutes les matières d'une classe pour une année
export async function getClassSubjects(className: string, schoolYear: string): Promise<ClassSubject[]> {
  const all = await getAllClassSubjects() as any[];
  return all.filter(s => s.className === className && s.schoolYear === schoolYear);
}

// Récupérer la liste unique de toutes les matières (tous niveaux/années confondus)
export async function getSubjects(): Promise<Subject[]> {
  const all = await getAllClassSubjects() as any[];
  const map = new Map<string, string>();
  for (const s of all) {
    map.set(s.subjectId, s.subjectName);
  }
  return Array.from(map.entries()).map(([subjectId, name]) => ({ subjectId, name }));
}

// Ajouter une matière à une classe pour une année
export async function addSubjectToClass(className: string, subject: { name: string; coefficient: number; maxScore: number }, schoolYear: string): Promise<void> {
  // Générer un subjectId unique basé sur le nom (ex: math, hist-geo, etc.)
  const subjectId = subject.name.toLowerCase().replace(/[^a-z0-9]/gi, '-');
  await addClassSubject({
    className,
    schoolYear,
    subjectId,
    subjectName: subject.name,
    coefficient: subject.coefficient,
    maxScore: subject.maxScore
  });
}

// Mettre à jour la liste des matières d'une classe pour une année (remplace tout)
export async function updateClassSubjects(className: string, subjects: ClassSubject[], schoolYear: string): Promise<void> {
  // On supprime toutes les matières existantes pour cette classe/année (non implémenté ici, à ajouter si besoin)
  // Puis on ajoute toutes les nouvelles matières
  // Pour l'instant, on fait juste un ajout (à améliorer si besoin)
  for (const subject of subjects) {
    await addClassSubject({
      className,
      schoolYear,
      subjectId: subject.subjectId,
      subjectName: subject.name,
      coefficient: subject.coefficient,
      maxScore: subject.maxScore
    });
  }
}

// Supprimer une matière d'une classe/année
export async function deleteClassSubjectService(id: number): Promise<void> {
  await deleteClassSubject(id);
}

// Récupérer la liste globale de toutes les matières (hors classe)
export async function getAllSubjectsService(): Promise<Subject[]> {
  const all = await getAllSubjects() as any[];
  return all.map(s => ({ subjectId: s.subjectId, name: s.subjectName }));
}

// Supprimer toutes les matières d'une classe/année
export async function deleteAllClassSubjectsForClassYearService(className: string, schoolYear: string): Promise<void> {
  await deleteAllClassSubjectsForClassYear(className, schoolYear);
}

// Ajouter une matière globale (hors classe)
export async function addGlobalSubjectService(subject: { subjectId: string; subjectName: string }): Promise<void> {
  await addGlobalSubject(subject);
}

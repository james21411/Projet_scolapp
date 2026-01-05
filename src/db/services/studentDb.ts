import { executeQuery } from '../utils';
import type { RowDataPacket } from 'mysql2/promise';
import type { Student } from '../../services/studentService';

export async function getAllStudents(): Promise<Student[]> {
  const rows = await executeQuery('SELECT * FROM students');
  // On parse les champs JSON pour chaque étudiant
  return (rows as RowDataPacket[]).map(row => ({
    ...row,
    infoParent: typeof row.infoParent === 'string' ? JSON.parse(row.infoParent) : row.infoParent,
    infoParent2: row.infoParent2 ? (typeof row.infoParent2 === 'string' ? JSON.parse(row.infoParent2) : row.infoParent2) : undefined,
    historiqueClasse: typeof row.historiqueClasse === 'string' ? JSON.parse(row.historiqueClasse) : row.historiqueClasse,
  })) as Student[];
}

export async function getStudentById(id: string): Promise<Student | null> {
  const rows = await executeQuery('SELECT * FROM students WHERE id = ?', [id]);
  const typedRows = rows as RowDataPacket[];
  if (typedRows.length > 0) {
    const row = typedRows[0];
    return {
      ...row,
      infoParent: typeof row.infoParent === 'string' ? JSON.parse(row.infoParent) : row.infoParent,
      infoParent2: row.infoParent2 ? (typeof row.infoParent2 === 'string' ? JSON.parse(row.infoParent2) : row.infoParent2) : undefined,
      historiqueClasse: typeof row.historiqueClasse === 'string' ? JSON.parse(row.historiqueClasse) : row.historiqueClasse,
    } as Student;
  }
  return null;
}

export async function addStudent(student: {
  id: string;
  nom: string;
  prenom: string;
  sexe?: string;
  dateNaissance: string;
  lieuNaissance: string;
  nationalite?: string;
  acteNaissance?: string;
  photoUrl?: string;
  infoParent: any;
  infoParent2?: any;
  niveau: string;
  classe: string;
  anneeScolaire: string;
  historiqueClasse: any;
  statut: string;
  createdAt?: string;
}) {
  const sql = `INSERT INTO students (id, nom, prenom, sexe, dateNaissance, lieuNaissance, nationalite, acteNaissance, photoUrl, infoParent, infoParent2, niveau, classe, anneeScolaire, historiqueClasse, statut, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    student.id,
    student.nom,
    student.prenom,
    student.sexe,
    student.dateNaissance,
    student.lieuNaissance,
    student.nationalite,
    student.acteNaissance,
    student.photoUrl,
    JSON.stringify(student.infoParent),
    student.infoParent2 ? JSON.stringify(student.infoParent2) : null,
    student.niveau,
    student.classe,
    student.anneeScolaire,
    JSON.stringify(student.historiqueClasse),
    student.statut,
    student.createdAt || new Date().toISOString().slice(0, 19).replace('T', ' ')
  ];
  await executeQuery(sql, params);
}

export async function updateStudent(studentId: string, updatedData: Partial<{
  nom: string;
  prenom: string;
  sexe?: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  nationalite?: string;
  acteNaissance?: string;
  photoUrl?: string;
  infoParent?: any;
  infoParent2?: any;
  niveau?: string;
  classe?: string;
  anneeScolaire?: string;
  historiqueClasse?: any;
  statut?: string;
  createdAt?: string;
}>) {
  // Filtrer les champs qui existent dans la table students
  const allowedFields = [
    'nom', 'prenom', 'sexe', 'dateNaissance', 'lieuNaissance', 'nationalite', 
    'acteNaissance', 'photoUrl', 'infoParent', 'infoParent2', 'niveau', 
    'classe', 'anneeScolaire', 'historiqueClasse', 'statut', 'createdAt'
  ];
  
  const filteredData = Object.keys(updatedData)
    .filter(key => allowedFields.includes(key))
    .reduce((obj, key) => {
      obj[key] = (updatedData as any)[key];
      return obj;
    }, {} as any);
  
  const fields = Object.keys(filteredData);
  if (fields.length === 0) return;
  
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const params = fields.map(f => {
    if (f === 'infoParent' || f === 'infoParent2' || f === 'historiqueClasse') {
      return JSON.stringify(filteredData[f]);
    }
    return filteredData[f];
  });
  params.push(studentId);
  const sql = `UPDATE students SET ${setClause} WHERE id = ?`;
  await executeQuery(sql, params);
} 
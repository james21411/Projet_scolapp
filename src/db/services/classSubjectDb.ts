import pool from '../mysql';

export async function getAllClassSubjects() {
  const [rows] = await pool.query('SELECT * FROM class_subjects');
  return rows;
}

export async function getClassSubjectById(id: number) {
  const [rows] = await pool.query('SELECT * FROM class_subjects WHERE id = ?', [id]);
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

export async function addClassSubject(subject: {
  className: string;
  schoolYear: string;
  subjectId: string;
  subjectName: string;
  coefficient: number;
  maxScore: number;
}) {
  const sql = `INSERT INTO class_subjects (className, schoolYear, subjectId, subjectName, coefficient, maxScore) VALUES (?, ?, ?, ?, ?, ?)`;
  const params = [
    subject.className,
    subject.schoolYear,
    subject.subjectId,
    subject.subjectName,
    subject.coefficient,
    subject.maxScore
  ];
  await pool.query(sql, params);
}

export async function deleteClassSubject(id: number) {
  await pool.query('DELETE FROM class_subjects WHERE id = ?', [id]);
}

export async function getAllSubjects() {
  const [rows] = await pool.query('SELECT DISTINCT subjectId, subjectName FROM class_subjects');
  return rows;
}

export async function deleteAllClassSubjectsForClassYear(className: string, schoolYear: string) {
  await pool.query('DELETE FROM class_subjects WHERE className = ? AND schoolYear = ?', [className, schoolYear]);
}

export async function addGlobalSubject(subject: { subjectId: string; subjectName: string; }) {
  // On ajoute une matière globale sans classe ni année (NULL)
  const sql = `INSERT INTO class_subjects (className, schoolYear, subjectId, subjectName, coefficient, maxScore) VALUES (?, ?, ?, ?, ?, ?)`;
  const params = [null, null, subject.subjectId, subject.subjectName, 1, 20];
  await pool.query(sql, params);
} 
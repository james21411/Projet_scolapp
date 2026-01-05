import pool from '../mysql';

export async function getAllGrades() {
  const [rows] = await pool.query('SELECT * FROM grades');
  return rows;
}

export async function getGradesByStudent(studentId: string, schoolYear: string) {
  const [rows] = await pool.query('SELECT * FROM grades WHERE studentId = ? AND schoolYear = ?', [studentId, schoolYear]);
  return rows;
}

export async function getGradesByClassAndSubject(classId: string, subjectId: string, schoolYear: string) {
  const [rows] = await pool.query('SELECT * FROM grades WHERE classId = ? AND subjectId = ? AND schoolYear = ?', [classId, subjectId, schoolYear]);
  return rows;
}

export async function addGrade(grade: {
  studentId: string;
  classId: string;
  schoolYear: string;
  subjectId: string;
  evaluationType: string;
  score: number;
  assessment?: string;
}) {
  const sql = `INSERT INTO grades (studentId, classId, schoolYear, subjectId, evaluationType, score, assessment) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    grade.studentId,
    grade.classId,
    grade.schoolYear,
    grade.subjectId,
    grade.evaluationType,
    grade.score,
    grade.assessment || null
  ];
  await pool.query(sql, params);
}

export async function updateGrade(gradeId: number, updatedFields: Partial<{
  score: number;
  assessment?: string;
}>) {
  const fields = Object.keys(updatedFields);
  if (fields.length === 0) return;
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const params = fields.map(f => (updatedFields as any)[f]);
  params.push(gradeId);
  const sql = `UPDATE grades SET ${setClause} WHERE id = ?`;
  await pool.query(sql, params);
}

export async function deleteGrade(gradeId: number) {
  await pool.query('DELETE FROM grades WHERE id = ?', [gradeId]);
} 
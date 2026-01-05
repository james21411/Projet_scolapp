const mysql = require('mysql2/promise');
const config = require('../config/database');

class GradeService {
  constructor() {
    this.pool = mysql.createPool(config);
  }

  /**
   * Récupérer les notes d'un élève
   */
  async getStudentGrades(studentId, schoolYear, evaluationPeriodId = null) {
    const connection = await this.pool.getConnection();
    try {
      let query = `
        SELECT 
          g.*,
          s.name as subjectName,
          s.code as subjectCode,
          et.name as evaluationTypeName,
          et.weight as evaluationWeight,
          ep.name as evaluationPeriodName
        FROM grades g
        JOIN subjects s ON g.subjectId = s.id
        JOIN evaluation_types et ON g.evaluationTypeId = et.id
        LEFT JOIN evaluation_periods ep ON g.evaluationPeriodId = ep.id
        WHERE g.studentId = ? AND g.schoolYear = ?
      `;
      
      const params = [studentId, schoolYear];
      
      if (evaluationPeriodId) {
        query += ' AND g.evaluationPeriodId = ?';
        params.push(evaluationPeriodId);
      }
      
      query += ' ORDER BY s.name, et.weight DESC, g.recordedAt DESC';
      
      const [rows] = await connection.execute(query, params);
      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Récupérer les notes d'une classe
   */
  async getClassGrades(classId, schoolYear, subjectId = null, evaluationPeriodId = null) {
    const connection = await this.pool.getConnection();
    try {
      let query = `
        SELECT 
          g.*,
          s.name as subjectName,
          s.code as subjectCode,
          st.nom as studentName,
          st.prenom as studentFirstName,
          et.name as evaluationTypeName,
          et.weight as evaluationWeight,
          ep.name as evaluationPeriodName
        FROM grades g
        JOIN subjects s ON g.subjectId = s.id
        JOIN students st ON g.studentId = st.id
        JOIN evaluation_types et ON g.evaluationTypeId = et.id
        LEFT JOIN evaluation_periods ep ON g.evaluationPeriodId = ep.id
        WHERE g.classId = ? AND g.schoolYear = ?
      `;
      
      const params = [classId, schoolYear];
      
      if (subjectId) {
        query += ' AND g.subjectId = ?';
        params.push(subjectId);
      }
      
      if (evaluationPeriodId) {
        query += ' AND g.evaluationPeriodId = ?';
        params.push(evaluationPeriodId);
      }
      
      query += ' ORDER BY st.nom, st.prenom, s.name, et.weight DESC';
      
      const [rows] = await connection.execute(query, params);
      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Ajouter une note
   */
  async addGrade(gradeData) {
    const connection = await this.pool.getConnection();
    try {
      const {
        id, studentId, classId, schoolYear, subjectId, evaluationTypeId,
        evaluationPeriodId, score, maxScore, coefficient, assessment, recordedBy
      } = gradeData;

      // Calculer la note pondérée
      const weightedScore = (score * coefficient).toFixed(2);

      const [result] = await connection.execute(
        `INSERT INTO grades (
          id, studentId, classId, schoolYear, subjectId, evaluationTypeId,
          evaluationPeriodId, score, maxScore, coefficient, weightedScore,
          assessment, recordedBy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, studentId, classId, schoolYear, subjectId, evaluationTypeId,
          evaluationPeriodId, score, maxScore, coefficient, weightedScore,
          assessment, recordedBy
        ]
      );

      return { id, ...gradeData, weightedScore };
    } finally {
      connection.release();
    }
  }

  /**
   * Mettre à jour une note
   */
  async updateGrade(id, gradeData) {
    const connection = await this.pool.getConnection();
    try {
      const { score, maxScore, coefficient, assessment } = gradeData;
      
      // Recalculer la note pondérée
      const weightedScore = (score * coefficient).toFixed(2);

      const [result] = await connection.execute(
        `UPDATE grades 
         SET score = ?, maxScore = ?, coefficient = ?, weightedScore = ?, 
             assessment = ?, updatedAt = NOW() 
         WHERE id = ?`,
        [score, maxScore, coefficient, weightedScore, assessment, id]
      );

      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  /**
   * Supprimer une note
   */
  async deleteGrade(id) {
    const connection = await this.pool.getConnection();
    try {
      const [result] = await connection.execute(
        'DELETE FROM grades WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  /**
   * Calculer la moyenne d'un élève pour une période
   */
  async calculateStudentAverage(studentId, classId, schoolYear, evaluationPeriodId) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT 
           SUM(g.weightedScore * et.weight) as totalWeightedScore,
           SUM(sc.coefficient * et.weight) as totalCoefficient
         FROM grades g
         JOIN evaluation_types et ON g.evaluationTypeId = et.id
         JOIN subject_coefficients sc ON g.subjectId = sc.subjectId 
           AND g.classId = sc.classId AND g.schoolYear = sc.schoolYear
         WHERE g.studentId = ? AND g.classId = ? AND g.schoolYear = ? 
           AND g.evaluationPeriodId = ? AND sc.isActive = true`,
        [studentId, classId, schoolYear, evaluationPeriodId]
      );

      if (rows[0].totalCoefficient > 0) {
        const averageScore = (rows[0].totalWeightedScore / rows[0].totalCoefficient).toFixed(2);
        return parseFloat(averageScore);
      }
      
      return 0;
    } finally {
      connection.release();
    }
  }

  /**
   * Calculer les moyennes de tous les élèves d'une classe
   */
  async calculateClassAverages(classId, schoolYear, evaluationPeriodId) {
    const connection = await this.pool.getConnection();
    try {
      // Récupérer tous les élèves de la classe
      const [students] = await connection.execute(
        'SELECT id, nom, prenom FROM students WHERE classe = ? AND anneeScolaire = ?',
        [classId, schoolYear]
      );

      const averages = [];
      
      for (const student of students) {
        const average = await this.calculateStudentAverage(
          student.id, classId, schoolYear, evaluationPeriodId
        );
        
        averages.push({
          studentId: student.id,
          studentName: `${student.nom} ${student.prenom}`,
          averageScore: average
        });
      }

      // Trier par moyenne décroissante
      averages.sort((a, b) => b.averageScore - a.averageScore);
      
      // Ajouter le classement
      averages.forEach((avg, index) => {
        avg.rank = index + 1;
        avg.totalStudents = averages.length;
      });

      return averages;
    } finally {
      connection.release();
    }
  }

  /**
   * Sauvegarder les moyennes calculées
   */
  async savePeriodAverages(averages, evaluationPeriodId) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      
      for (const avg of averages) {
        await connection.execute(
          `INSERT INTO period_averages (
            id, studentId, classId, schoolYear, evaluationPeriodId,
            averageScore, totalCoefficient, rank, totalStudents
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            averageScore = VALUES(averageScore),
            rank = VALUES(rank),
            totalStudents = VALUES(totalStudents),
            updatedAt = NOW()`,
          [
            `avg-${avg.studentId}-${evaluationPeriodId}`,
            avg.studentId,
            avg.classId,
            avg.schoolYear,
            evaluationPeriodId,
            avg.averageScore,
            avg.totalCoefficient || 0,
            avg.rank,
            avg.totalStudents
          ]
        );
      }
      
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Récupérer les moyennes d'un élève
   */
  async getStudentAverages(studentId, schoolYear) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT 
           pa.*, ep.name as periodName,
           ep.startDate, ep.endDate
         FROM period_averages pa
         JOIN evaluation_periods ep ON pa.evaluationPeriodId = ep.id
         WHERE pa.studentId = ? AND pa.schoolYear = ?
         ORDER BY ep.startDate`,
        [studentId, schoolYear]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Récupérer les statistiques de notes
   */
  async getGradeStatistics(classId, schoolYear, subjectId = null) {
    const connection = await this.pool.getConnection();
    try {
      let query = `
        SELECT 
          COUNT(*) as totalGrades,
          AVG(g.score) as averageScore,
          MIN(g.score) as minScore,
          MAX(g.score) as maxScore,
          COUNT(CASE WHEN g.score >= 10 THEN 1 END) as passingGrades,
          COUNT(CASE WHEN g.score < 10 THEN 1 END) as failingGrades
        FROM grades g
        WHERE g.classId = ? AND g.schoolYear = ?
      `;
      
      const params = [classId, schoolYear];
      
      if (subjectId) {
        query += ' AND g.subjectId = ?';
        params.push(subjectId);
      }
      
      const [rows] = await connection.execute(query, params);
      return rows[0];
    } finally {
      connection.release();
    }
  }

  /**
   * Valider une note avant insertion
   */
  async validateGrade(gradeData) {
    const connection = await this.pool.getConnection();
    try {
      const { score, maxScore, subjectId, classId, schoolYear } = gradeData;
      
      // Vérifier les limites de la note
      if (score < 0 || score > maxScore) {
        throw new Error(`La note doit être entre 0 et ${maxScore}`);
      }
      
      // Vérifier que la matière existe et est active
      const [subject] = await connection.execute(
        'SELECT * FROM subjects WHERE id = ? AND isActive = true',
        [subjectId]
      );
      
      if (subject.length === 0) {
        throw new Error('Matière non trouvée ou inactive');
      }
      
      // Vérifier le coefficient de la matière
      const [coefficient] = await connection.execute(
        'SELECT coefficient, maxScore FROM subject_coefficients WHERE subjectId = ? AND classId = ? AND schoolYear = ? AND isActive = true',
        [subjectId, classId, schoolYear]
      );
      
      if (coefficient.length === 0) {
        throw new Error('Coefficient non configuré pour cette matière');
      }
      
      return {
        isValid: true,
        coefficient: coefficient[0].coefficient,
        maxScore: coefficient[0].maxScore
      };
    } finally {
      connection.release();
    }
  }
}

module.exports = new GradeService(); 
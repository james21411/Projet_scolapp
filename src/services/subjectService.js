const mysql = require('mysql2/promise');
const config = require('../config/database');

class SubjectService {
  constructor() {
    this.pool = mysql.createPool(config);
  }

  /**
   * Récupérer toutes les matières actives
   */
  async getAllSubjects() {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM subjects WHERE isActive = true ORDER BY name'
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Récupérer une matière par ID
   */
  async getSubjectById(id) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM subjects WHERE id = ? AND isActive = true',
        [id]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  /**
   * Créer une nouvelle matière
   */
  async createSubject(subjectData) {
    const connection = await this.pool.getConnection();
    try {
      const { id, name, code, description, category } = subjectData;
      
      const [result] = await connection.execute(
        `INSERT INTO subjects (id, name, code, description, category) 
         VALUES (?, ?, ?, ?, ?)`,
        [id, name, code, description, category]
      );
      
      return { id, ...subjectData };
    } finally {
      connection.release();
    }
  }

  /**
   * Mettre à jour une matière
   */
  async updateSubject(id, subjectData) {
    const connection = await this.pool.getConnection();
    try {
      const { name, code, description, category } = subjectData;
      
      const [result] = await connection.execute(
        `UPDATE subjects 
         SET name = ?, code = ?, description = ?, category = ?, updatedAt = NOW() 
         WHERE id = ?`,
        [name, code, description, category, id]
      );
      
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  /**
   * Désactiver une matière
   */
  async deactivateSubject(id) {
    const connection = await this.pool.getConnection();
    try {
      const [result] = await connection.execute(
        'UPDATE subjects SET isActive = false, updatedAt = NOW() WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  /**
   * Récupérer les matières par catégorie
   */
  async getSubjectsByCategory(category) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM subjects WHERE category = ? AND isActive = true ORDER BY name',
        [category]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Récupérer les coefficients par classe et matière
   */
  async getSubjectCoefficients(classId, schoolYear) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT sc.*, s.name as subjectName, s.code as subjectCode 
         FROM subject_coefficients sc 
         JOIN subjects s ON sc.subjectId = s.id 
         WHERE sc.classId = ? AND sc.schoolYear = ? AND sc.isActive = true 
         ORDER BY s.name`,
        [classId, schoolYear]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Configurer les coefficients pour une classe
   */
  async setSubjectCoefficients(classId, schoolYear, coefficients) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Désactiver les anciens coefficients
      await connection.execute(
        'UPDATE subject_coefficients SET isActive = false WHERE classId = ? AND schoolYear = ?',
        [classId, schoolYear]
      );
      
      // Insérer les nouveaux coefficients
      for (const coef of coefficients) {
        await connection.execute(
          `INSERT INTO subject_coefficients 
           (classId, subjectId, schoolYear, coefficient, maxScore, passingScore) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [classId, coef.subjectId, schoolYear, coef.coefficient, coef.maxScore, coef.passingScore]
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
   * Récupérer les statistiques des matières
   */
  async getSubjectStatistics(schoolYear) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT 
           s.id, s.name, s.code, s.category,
           COUNT(DISTINCT g.studentId) as totalStudents,
           AVG(g.score) as averageScore,
           MIN(g.score) as minScore,
           MAX(g.score) as maxScore,
           COUNT(CASE WHEN g.score >= 10 THEN 1 END) as passingStudents
         FROM subjects s
         LEFT JOIN grades g ON s.id = g.subjectId AND g.schoolYear = ?
         WHERE s.isActive = true
         GROUP BY s.id, s.name, s.code, s.category
         ORDER BY s.name`,
        [schoolYear]
      );
      return rows;
    } finally {
      connection.release();
    }
  }
}

module.exports = new SubjectService(); 
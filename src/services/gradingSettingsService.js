const mysql = require('mysql2/promise');
const config = require('../config/database');

class GradingSettingsService {
  constructor() {
    this.pool = mysql.createPool(config);
  }

  /**
   * Récupérer tous les paramètres de notation
   */
  async getAllSettings() {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM grading_settings WHERE isActive = true ORDER BY category, settingKey'
      );
      
      // Organiser par catégorie
      const settings = {};
      rows.forEach(row => {
        if (!settings[row.category]) {
          settings[row.category] = {};
        }
        settings[row.category][row.settingKey] = {
          value: row.settingValue,
          description: row.description
        };
      });
      
      return settings;
    } finally {
      connection.release();
    }
  }

  /**
   * Récupérer un paramètre spécifique
   */
  async getSetting(key) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM grading_settings WHERE settingKey = ? AND isActive = true',
        [key]
      );
      
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  /**
   * Mettre à jour un paramètre
   */
  async updateSetting(key, value, description = null) {
    const connection = await this.pool.getConnection();
    try {
      let query = 'UPDATE grading_settings SET settingValue = ?, updatedAt = NOW() WHERE settingKey = ?';
      const params = [value, key];
      
      if (description) {
        query = 'UPDATE grading_settings SET settingValue = ?, description = ?, updatedAt = NOW() WHERE settingKey = ?';
        params.splice(1, 0, description);
      }
      
      const [result] = await connection.execute(query, params);
      
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  /**
   * Ajouter un nouveau paramètre
   */
  async addSetting(settingData) {
    const connection = await this.pool.getConnection();
    try {
      const { settingKey, settingValue, description, category } = settingData;
      
      const [result] = await connection.execute(
        `INSERT INTO grading_settings (settingKey, settingValue, description, category) 
         VALUES (?, ?, ?, ?)`,
        [settingKey, settingValue, description, category]
      );
      
      return { settingKey, settingValue, description, category };
    } finally {
      connection.release();
    }
  }

  /**
   * Récupérer les paramètres par catégorie
   */
  async getSettingsByCategory(category) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM grading_settings WHERE category = ? AND isActive = true ORDER BY settingKey',
        [category]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Récupérer la note maximale par défaut
   */
  async getDefaultMaxScore() {
    const setting = await this.getSetting('default_max_score');
    return setting ? parseInt(setting.settingValue) : 20;
  }

  /**
   * Récupérer la note de passage par défaut
   */
  async getDefaultPassingScore() {
    const setting = await this.getSetting('default_passing_score');
    return setting ? parseFloat(setting.settingValue) : 10.0;
  }

  /**
   * Vérifier si les moyennes pondérées sont activées
   */
  async isWeightedAveragesEnabled() {
    const setting = await this.getSetting('enable_weighted_averages');
    return setting ? setting.settingValue === 'true' : true;
  }

  /**
   * Vérifier si le classement est activé
   */
  async isRankingEnabled() {
    const setting = await this.getSetting('enable_ranking');
    return setting ? setting.settingValue === 'true' : true;
  }

  /**
   * Récupérer la précision décimale
   */
  async getDecimalPrecision() {
    const setting = await this.getSetting('decimal_precision');
    return setting ? parseInt(setting.settingValue) : 2;
  }

  /**
   * Récupérer l'échelle de notation par lettres
   */
  async getGradeScale() {
    const setting = await this.getSetting('grade_scale');
    if (setting) {
      try {
        return JSON.parse(setting.settingValue);
      } catch (error) {
        console.error('Erreur lors du parsing de l\'échelle de notation:', error);
      }
    }
    
    // Échelle par défaut
    return {
      "A": 16,
      "B": 14,
      "C": 12,
      "D": 10,
      "E": 8,
      "F": 0
    };
  }

  /**
   * Récupérer les périodes d'évaluation
   */
  async getEvaluationPeriods() {
    const setting = await this.getSetting('evaluation_periods');
    if (setting) {
      try {
        return JSON.parse(setting.settingValue);
      } catch (error) {
        console.error('Erreur lors du parsing des périodes d\'évaluation:', error);
      }
    }
    
    return ["trim1", "trim2", "trim3"];
  }

  /**
   * Récupérer la méthode de calcul des coefficients
   */
  async getCoefficientCalculationMethod() {
    const setting = await this.getSetting('coefficient_calculation');
    return setting ? setting.settingValue : 'weighted';
  }

  /**
   * Vérifier si le calcul automatique des moyennes est activé
   */
  async isAutoCalculateAveragesEnabled() {
    const setting = await this.getSetting('auto_calculate_averages');
    return setting ? setting.settingValue === 'true' : true;
  }

  /**
   * Récupérer le mode de validation des notes
   */
  async getGradeValidationMode() {
    const setting = await this.getSetting('grade_validation');
    return setting ? setting.settingValue : 'strict';
  }

  /**
   * Convertir une note numérique en lettre
   */
  async convertScoreToLetter(score) {
    const gradeScale = await this.getGradeScale();
    
    for (const [letter, minScore] of Object.entries(gradeScale)) {
      if (score >= minScore) {
        return letter;
      }
    }
    
    return 'F';
  }

  /**
   * Valider une note selon les paramètres configurés
   */
  async validateGrade(score, maxScore) {
    const validationMode = await this.getGradeValidationMode();
    const defaultMaxScore = await this.getDefaultMaxScore();
    
    if (validationMode === 'strict') {
      // Validation stricte
      if (score < 0 || score > maxScore) {
        throw new Error(`La note doit être entre 0 et ${maxScore}`);
      }
      
      if (maxScore > defaultMaxScore) {
        throw new Error(`La note maximale ne peut pas dépasser ${defaultMaxScore}`);
      }
    } else if (validationMode === 'flexible') {
      // Validation flexible
      if (score < 0) {
        throw new Error('La note ne peut pas être négative');
      }
      
      if (score > maxScore * 1.1) { // Permet 10% de tolérance
        throw new Error(`La note ne peut pas dépasser ${maxScore * 1.1}`);
      }
    }
    
    return true;
  }

  /**
   * Appliquer la précision décimale à une note
   */
  async applyDecimalPrecision(score) {
    const precision = await this.getDecimalPrecision();
    return parseFloat(score.toFixed(precision));
  }

  /**
   * Calculer la moyenne selon la méthode configurée
   */
  async calculateAverage(scores, coefficients) {
    const method = await this.getCoefficientCalculationMethod();
    const precision = await this.getDecimalPrecision();
    
    if (method === 'weighted') {
      // Moyenne pondérée
      let totalWeightedScore = 0;
      let totalCoefficient = 0;
      
      for (let i = 0; i < scores.length; i++) {
        totalWeightedScore += scores[i] * coefficients[i];
        totalCoefficient += coefficients[i];
      }
      
      if (totalCoefficient === 0) return 0;
      
      const average = totalWeightedScore / totalCoefficient;
      return parseFloat(average.toFixed(precision));
    } else if (method === 'simple') {
      // Moyenne simple
      const sum = scores.reduce((acc, score) => acc + score, 0);
      const average = sum / scores.length;
      return parseFloat(average.toFixed(precision));
    } else if (method === 'geometric') {
      // Moyenne géométrique
      const product = scores.reduce((acc, score) => acc * score, 1);
      const average = Math.pow(product, 1 / scores.length);
      return parseFloat(average.toFixed(precision));
    }
    
    return 0;
  }

  /**
   * Générer un rapport de configuration
   */
  async generateConfigurationReport() {
    const settings = await this.getAllSettings();
    const report = {
      timestamp: new Date().toISOString(),
      settings: settings,
      summary: {
        defaultMaxScore: await this.getDefaultMaxScore(),
        defaultPassingScore: await this.getDefaultPassingScore(),
        weightedAveragesEnabled: await this.isWeightedAveragesEnabled(),
        rankingEnabled: await this.isRankingEnabled(),
        decimalPrecision: await this.getDecimalPrecision(),
        gradeScale: await this.getGradeScale(),
        evaluationPeriods: await this.getEvaluationPeriods(),
        coefficientCalculation: await this.getCoefficientCalculationMethod(),
        autoCalculateAverages: await this.isAutoCalculateAveragesEnabled(),
        gradeValidation: await this.getGradeValidationMode()
      }
    };
    
    return report;
  }

  /**
   * Réinitialiser les paramètres aux valeurs par défaut
   */
  async resetToDefaults() {
    const connection = await this.pool.getConnection();
    try {
      const defaultSettings = [
        ['default_max_score', '20', 'Note maximale par défaut', 'notation'],
        ['default_passing_score', '10', 'Note de passage par défaut', 'notation'],
        ['enable_weighted_averages', 'true', 'Activer les moyennes pondérées', 'notation'],
        ['enable_ranking', 'true', 'Activer le classement des élèves', 'notation'],
        ['decimal_precision', '2', 'Précision décimale pour les notes', 'notation'],
        ['grade_scale', '{"A": 16, "B": 14, "C": 12, "D": 10, "E": 8, "F": 0}', 'Échelle de notation par lettres', 'notation'],
        ['evaluation_periods', '["trim1", "trim2", "trim3"]', 'Périodes d\'évaluation', 'notation'],
        ['coefficient_calculation', 'weighted', 'Méthode de calcul des coefficients', 'notation'],
        ['auto_calculate_averages', 'true', 'Calcul automatique des moyennes', 'notation'],
        ['grade_validation', 'strict', 'Validation stricte des notes', 'notation']
      ];
      
      await connection.beginTransaction();
      
      for (const [key, value, description, category] of defaultSettings) {
        await connection.execute(
          `INSERT INTO grading_settings (settingKey, settingValue, description, category) 
           VALUES (?, ?, ?, ?) 
           ON DUPLICATE KEY UPDATE 
             settingValue = VALUES(settingValue),
             description = VALUES(description),
             updatedAt = NOW()`,
          [key, value, description, category]
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
}

module.exports = new GradingSettingsService(); 
/**
 * Service API pour la gestion des paramètres de notation côté client
 */

class GradingSettingsApiService {
  constructor() {
    this.baseUrl = '/api/grading-settings';
  }

  /**
   * Récupérer tous les paramètres de notation
   */
  async getAllSettings() {
    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres:', error);
      throw error;
    }
  }

  /**
   * Récupérer un paramètre spécifique
   */
  async getSetting(key) {
    try {
      const response = await fetch(`${this.baseUrl}/${key}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération du paramètre:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un paramètre
   */
  async updateSetting(key, value, description = null) {
    try {
      const body = { settingValue: value };
      if (description) {
        body.description = description;
      }

      const response = await fetch(`${this.baseUrl}/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Paramètre non trouvé');
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du paramètre:', error);
      throw error;
    }
  }

  /**
   * Ajouter un nouveau paramètre
   */
  async addSetting(settingData) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingData),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du paramètre:', error);
      throw error;
    }
  }

  /**
   * Récupérer la note maximale par défaut
   */
  async getDefaultMaxScore() {
    try {
      const setting = await this.getSetting('default_max_score');
      return setting ? parseInt(setting.settingValue) : 20;
    } catch (error) {
      console.error('Erreur lors de la récupération de la note maximale:', error);
      return 20; // Valeur par défaut
    }
  }

  /**
   * Récupérer la note de passage par défaut
   */
  async getDefaultPassingScore() {
    try {
      const setting = await this.getSetting('default_passing_score');
      return setting ? parseFloat(setting.settingValue) : 10.0;
    } catch (error) {
      console.error('Erreur lors de la récupération de la note de passage:', error);
      return 10.0; // Valeur par défaut
    }
  }

  /**
   * Vérifier si les moyennes pondérées sont activées
   */
  async isWeightedAveragesEnabled() {
    try {
      const setting = await this.getSetting('enable_weighted_averages');
      return setting ? setting.settingValue === 'true' : true;
    } catch (error) {
      console.error('Erreur lors de la vérification des moyennes pondérées:', error);
      return true; // Valeur par défaut
    }
  }

  /**
   * Vérifier si le classement est activé
   */
  async isRankingEnabled() {
    try {
      const setting = await this.getSetting('enable_ranking');
      return setting ? setting.settingValue === 'true' : true;
    } catch (error) {
      console.error('Erreur lors de la vérification du classement:', error);
      return true; // Valeur par défaut
    }
  }

  /**
   * Récupérer la précision décimale
   */
  async getDecimalPrecision() {
    try {
      const setting = await this.getSetting('decimal_precision');
      return setting ? parseInt(setting.settingValue) : 2;
    } catch (error) {
      console.error('Erreur lors de la récupération de la précision décimale:', error);
      return 2; // Valeur par défaut
    }
  }

  /**
   * Récupérer l'échelle de notation par lettres
   */
  async getGradeScale() {
    try {
      const setting = await this.getSetting('grade_scale');
      if (setting) {
        try {
          return JSON.parse(setting.settingValue);
        } catch (parseError) {
          console.error('Erreur lors du parsing de l\'échelle de notation:', parseError);
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
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'échelle de notation:', error);
      return {
        "A": 16,
        "B": 14,
        "C": 12,
        "D": 10,
        "E": 8,
        "F": 0
      };
    }
  }

  /**
   * Récupérer les périodes d'évaluation
   */
  async getEvaluationPeriods() {
    try {
      const setting = await this.getSetting('evaluation_periods');
      if (setting) {
        try {
          return JSON.parse(setting.settingValue);
        } catch (parseError) {
          console.error('Erreur lors du parsing des périodes d\'évaluation:', parseError);
        }
      }
      
      return ["trim1", "trim2", "trim3"];
    } catch (error) {
      console.error('Erreur lors de la récupération des périodes d\'évaluation:', error);
      return ["trim1", "trim2", "trim3"];
    }
  }

  /**
   * Récupérer la méthode de calcul des coefficients
   */
  async getCoefficientCalculationMethod() {
    try {
      const setting = await this.getSetting('coefficient_calculation');
      return setting ? setting.settingValue : 'weighted';
    } catch (error) {
      console.error('Erreur lors de la récupération de la méthode de calcul:', error);
      return 'weighted'; // Valeur par défaut
    }
  }

  /**
   * Vérifier si le calcul automatique des moyennes est activé
   */
  async isAutoCalculateAveragesEnabled() {
    try {
      const setting = await this.getSetting('auto_calculate_averages');
      return setting ? setting.settingValue === 'true' : true;
    } catch (error) {
      console.error('Erreur lors de la vérification du calcul automatique:', error);
      return true; // Valeur par défaut
    }
  }

  /**
   * Récupérer le mode de validation des notes
   */
  async getGradeValidationMode() {
    try {
      const setting = await this.getSetting('grade_validation');
      return setting ? setting.settingValue : 'strict';
    } catch (error) {
      console.error('Erreur lors de la récupération du mode de validation:', error);
      return 'strict'; // Valeur par défaut
    }
  }

  /**
   * Convertir une note numérique en lettre
   */
  async convertScoreToLetter(score) {
    try {
      const gradeScale = await this.getGradeScale();
      
      for (const [letter, minScore] of Object.entries(gradeScale)) {
        if (score >= minScore) {
          return letter;
        }
      }
      
      return 'F';
    } catch (error) {
      console.error('Erreur lors de la conversion de la note:', error);
      return 'F';
    }
  }

  /**
   * Valider une note selon les paramètres configurés
   */
  async validateGrade(score, maxScore) {
    try {
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
    } catch (error) {
      console.error('Erreur lors de la validation de la note:', error);
      throw error;
    }
  }

  /**
   * Appliquer la précision décimale à une note
   */
  async applyDecimalPrecision(score) {
    try {
      const precision = await this.getDecimalPrecision();
      return parseFloat(score.toFixed(precision));
    } catch (error) {
      console.error('Erreur lors de l\'application de la précision décimale:', error);
      return parseFloat(score.toFixed(2)); // Précision par défaut
    }
  }

  /**
   * Calculer la moyenne selon la méthode configurée
   */
  async calculateAverage(scores, coefficients) {
    try {
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
    } catch (error) {
      console.error('Erreur lors du calcul de la moyenne:', error);
      return 0;
    }
  }

  /**
   * Générer un rapport de configuration
   */
  async generateConfigurationReport() {
    try {
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
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      throw error;
    }
  }
}

export default new GradingSettingsApiService(); 
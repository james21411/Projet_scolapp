/**
 * Service API pour la gestion des matières côté client
 */

class SubjectApiService {
  constructor() {
    this.baseUrl = '/api/subjects';
  }

  /**
   * Récupérer toutes les matières actives
   */
  async getAllSubjects() {
    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des matières:', error);
      throw error;
    }
  }

  /**
   * Récupérer une matière par ID
   */
  async getSubjectById(id) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération de la matière:', error);
      throw error;
    }
  }

  /**
   * Créer une nouvelle matière
   */
  async createSubject(subjectData) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subjectData),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la création de la matière:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour une matière
   */
  async updateSubject(id, subjectData) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subjectData),
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Matière non trouvée');
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la matière:', error);
      throw error;
    }
  }

  /**
   * Supprimer une matière (désactivation)
   */
  async deleteSubject(id) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Matière non trouvée');
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la suppression de la matière:', error);
      throw error;
    }
  }

  /**
   * Récupérer les matières par catégorie
   */
  async getSubjectsByCategory(category) {
    try {
      const allSubjects = await this.getAllSubjects();
      return allSubjects.filter(subject => subject.category === category);
    } catch (error) {
      console.error('Erreur lors de la récupération des matières par catégorie:', error);
      throw error;
    }
  }

  /**
   * Récupérer les coefficients par classe et matière
   */
  async getSubjectCoefficients(classId, schoolYear) {
    try {
      const response = await fetch(`/api/subject-coefficients?classId=${classId}&schoolYear=${schoolYear}`);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des coefficients:', error);
      throw error;
    }
  }

  /**
   * Configurer les coefficients pour une classe
   */
  async setSubjectCoefficients(classId, schoolYear, coefficients) {
    try {
      const response = await fetch('/api/subject-coefficients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ classId, schoolYear, coefficients }),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la configuration des coefficients:', error);
      throw error;
    }
  }

  /**
   * Récupérer les statistiques des matières
   */
  async getSubjectStatistics(schoolYear) {
    try {
      const response = await fetch(`/api/subject-statistics?schoolYear=${schoolYear}`);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }
}

export default new SubjectApiService(); 
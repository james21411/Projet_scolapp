/**
 * Service pour gérer les coefficients des matières par classe
 */
class SubjectCoefficientsApiService {
  constructor() {
    this.baseUrl = '/api/subject-coefficients';
  }

  async getCoefficients(classId = null, schoolYear = null) {
    try {
      let url = this.baseUrl;
      const params = new URLSearchParams();
      
      if (classId) params.append('classId', classId);
      if (schoolYear) params.append('schoolYear', schoolYear);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des coefficients:', error);
      throw error;
    }
  }

  async saveCoefficient(data) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du coefficient:', error);
      throw error;
    }
  }

  async getCoefficientsByClass(classId, schoolYear = '2024-2025') {
    return this.getCoefficients(classId, schoolYear);
  }

  async getCoefficientsBySubject(subjectId, schoolYear = '2024-2025') {
    try {
      const allCoefficients = await this.getCoefficients(null, schoolYear);
      return allCoefficients.filter(coef => coef.subjectId === subjectId);
    } catch (error) {
      console.error('Erreur lors de la récupération des coefficients par matière:', error);
      throw error;
    }
  }
}

export default new SubjectCoefficientsApiService(); 
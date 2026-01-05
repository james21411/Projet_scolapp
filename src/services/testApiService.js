/**
 * Service de test pour vérifier la connectivité API
 */
class TestApiService {
  constructor() {
    this.baseUrl = '/api';
  }

  async testConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/test-subjects`);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Erreur lors du test de connexion:', error);
      throw error;
    }
  }

  async testSubjectsApi() {
    try {
      const response = await fetch(`${this.baseUrl}/subjects`);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Erreur lors du test de l\'API subjects:', error);
      throw error;
    }
  }
}

export default new TestApiService(); 
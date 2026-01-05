class EvaluationPeriodsApiService {
  constructor() {
    this.baseUrl = '/api/evaluation-periods';
  }

  async getPeriods(schoolYear = null) {
    try {
      let url = this.baseUrl;
      if (schoolYear) {
        url += `?schoolYear=${encodeURIComponent(schoolYear)}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des périodes:', error);
      throw error;
    }
  }

  async createPeriod(periodData) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(periodData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la création de la période:', error);
      throw error;
    }
  }

  // Méthode pour créer les périodes par défaut pour une année scolaire
  async createDefaultPeriods(schoolYear) {
    const defaultPeriods = [
      { name: '1ère Séquence', startDate: '2024-09-01', endDate: '2024-10-15' },
      { name: '2ème Séquence', startDate: '2024-10-16', endDate: '2024-12-15' },
      { name: '1er Trimestre', startDate: '2024-09-01', endDate: '2024-12-15' },
      { name: '3ème Séquence', startDate: '2024-12-16', endDate: '2025-02-15' },
      { name: '4ème Séquence', startDate: '2025-02-16', endDate: '2025-04-15' },
      { name: '2ème Trimestre', startDate: '2024-12-16', endDate: '2025-04-15' },
      { name: '5ème Séquence', startDate: '2025-04-16', endDate: '2025-06-15' },
      { name: '6ème Séquence', startDate: '2025-06-16', endDate: '2025-07-31' },
      { name: '3ème Trimestre', startDate: '2025-04-16', endDate: '2025-07-31' }
    ];

    const results = [];
    for (const period of defaultPeriods) {
      try {
        await this.createPeriod({
          ...period,
          schoolYear
        });
        results.push({ ...period, status: 'success' });
      } catch (error) {
        results.push({ ...period, status: 'error', error: error.message });
      }
    }
    
    return results;
  }
}

export default new EvaluationPeriodsApiService(); 
class ClassesApiService {
  constructor() {
    this.baseUrl = '/api/school/classes-with-ids';
  }

  async getClasses() {
    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des classes:', error);
      throw error;
    }
  }

  async getClassesByLevel() {
    try {
      const classes = await this.getClasses();
      const organized = {};
      
      classes.forEach(level => {
        organized[level.name] = level.classes;
      });
      
      return organized;
    } catch (error) {
      console.error('Erreur lors de l\'organisation des classes:', error);
      throw error;
    }
  }

  async getAllClassesFlat() {
    try {
      const classes = await this.getClasses();
      const flatClasses = [];
      
      classes.forEach(level => {
        level.classes.forEach(cls => {
          flatClasses.push({
            ...cls,
            levelName: level.name,
            displayName: `${cls.name} (${level.name})`
          });
        });
      });
      
      return flatClasses;
    } catch (error) {
      console.error('Erreur lors de la récupération des classes plates:', error);
      throw error;
    }
  }
}

export default new ClassesApiService(); 
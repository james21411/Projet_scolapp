export interface PersonnelType {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  isActive: boolean;
  createdAt: string;
}

export interface PersonnelMember {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  type_personnel: string;
  createdAt: string;
  // Informations RH
  dateEmbauche?: string;
  dateFinContrat?: string;
  typeContrat?: 'CDI' | 'CDD' | 'Stage' | 'Vacataire';
  salaire?: number;
  statut?: 'Actif' | 'Inactif' | 'En congé' | 'Démission';
  specialite?: string;
  diplome?: string;
  experience?: number;
  photoUrl?: string;
  personnelTypeId?: string;
}

export interface TeacherAssignment {
  id: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  subject: string;
  schoolYear: string;
  hoursPerWeek: number;
  isMainTeacher: boolean;
  semester?: string;
  createdAt: string;
}

export interface PersonnelContract {
  id: string;
  personnelId: string;
  personnelName: string;
  typeContrat: 'CDI' | 'CDD' | 'Stage' | 'Vacataire';
  dateDebut: string;
  dateFin?: string;
  salaire: number;
  poste: string;
  statut: 'Actif' | 'Terminé' | 'Résilié';
  observations?: string;
  createdAt: string;
}

export interface PayrollRecord {
  id: string;
  personnelId: string;
  personnelName: string;
  month: number;
  year: number;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  status: 'En attente' | 'Payé' | 'Annulé';
  paymentDate?: string;
  notes?: string;
  createdAt: string;
}

// Récupérer tous les types de personnels
export async function getPersonnelTypes(): Promise<PersonnelType[]> {
  try {
    const response = await fetch('/api/personnel/types');
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error || 'Erreur lors du chargement des types de personnel');
    }
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}

// Récupérer tout le personnel
export async function getAllPersonnel(): Promise<PersonnelMember[]> {
  try {
    const response = await fetch('/api/personnel');
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error || 'Erreur lors du chargement du personnel');
    }
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}

// Récupérer les enseignants uniquement
export async function getTeachers(): Promise<PersonnelMember[]> {
  try {
    const response = await fetch('/api/personnel/teachers');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error || 'Erreur lors du chargement des enseignants');
    }
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}

// Récupérer les affectations d'un enseignant
export async function getTeacherAssignments(teacherId: string, schoolYear?: string): Promise<TeacherAssignment[]> {
  try {
    const url = schoolYear 
      ? `/api/personnel/assignments?teacherId=${encodeURIComponent(teacherId)}&schoolYear=${encodeURIComponent(schoolYear)}`
      : `/api/personnel/assignments/${teacherId}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();

    if (data.success) {
      // Adapter les données pour correspondre à l'interface TeacherAssignment
      return data.data.map((item: any) => ({
        id: item.id,
        teacherId: item.teacherId,
        teacherName: item.teacherName || '',
        classId: '', // Non disponible dans la table actuelle
        className: item.className,
        subject: item.subject,
        schoolYear: item.schoolYear,
        hoursPerWeek: item.hoursPerWeek,
        isMainTeacher: item.isMainTeacher,
        semester: item.semester,
        createdAt: item.createdAt
      }));
    } else {
      throw new Error(data.error || 'Erreur lors du chargement des affectations');
    }
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}

// Récupérer toutes les classes disponibles
export async function getAvailableClasses(): Promise<string[]> {
  try {
    const response = await fetch('/api/school/classes');
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error || 'Erreur lors du chargement des classes');
    }
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}

// Récupérer l'année scolaire en cours
export async function getCurrentSchoolYear(): Promise<string> {
  try {
    const response = await fetch('/api/school/current-year');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error || 'Erreur lors du chargement de l\'année scolaire');
    }
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}

// Ajouter une affectation d'enseignant
export async function addTeacherAssignment(assignment: Omit<TeacherAssignment, 'id' | 'createdAt'>): Promise<void> {
  try {
    const response = await fetch('/api/personnel/assignments/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(assignment),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Erreur lors de l\'ajout de l\'affectation');
    }
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}

// Ajouter un nouveau personnel
export async function addPersonnel(personnel: Omit<PersonnelMember, 'id' | 'createdAt'>): Promise<void> {
  try {
    const response = await fetch('/api/personnel/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(personnel),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Erreur lors de l\'ajout du personnel');
    }
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}

// Mettre à jour les informations RH d'un membre du personnel
export async function updatePersonnelInfo(personnelId: string, info: Partial<PersonnelMember>): Promise<void> {
  try {
    const response = await fetch(`/api/personnel/${personnelId}/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(info),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Erreur lors de la mise à jour');
    }
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}

// Récupérer les fiches de paie
export async function getPayrollRecords(month?: number, year?: number, personnelType?: string): Promise<PayrollRecord[]> {
  try {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    if (personnelType) params.append('personnelType', personnelType);

    const response = await fetch(`/api/personnel/payroll?${params.toString()}`);
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error || 'Erreur lors du chargement des fiches de paie');
    }
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}

// Générer les fiches de paie
export async function generatePayrollRecords(month: number, year: number, personnelType?: string): Promise<void> {
  try {
    const response = await fetch('/api/personnel/payroll/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ month, year, personnelType }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Erreur lors de la génération des fiches de paie');
    }
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
} 

// Récupérer les matières disponibles
export async function getAvailableSubjects(): Promise<{id: string, name: string, code: string, category?: string}[]> {
  try {
    const response = await fetch('/api/subjects');
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error || 'Erreur lors du chargement des matières');
    }
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}

// Récupérer les matières par classe
export async function getSubjectsByClass(className: string, schoolYear: string): Promise<{id: string, name: string, code: string, category?: string}[]> {
  try {
    const response = await fetch(`/api/subjects?className=${encodeURIComponent(className)}&schoolYear=${encodeURIComponent(schoolYear)}`);
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error || 'Erreur lors du chargement des matières');
    }
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
} 
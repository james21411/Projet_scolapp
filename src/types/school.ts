// TODO: Implémenter les sections francophone/anglophone
/*
export type SchoolSection = 'francophone' | 'anglophone';

export type LevelType = {
  id: string;
  name: string;
  nameEn: string;
  classes: ClassType[];
};

export type ClassType = {
  id: string;
  name: string;
  nameEn: string;
  levelId: string;
};

export type SchoolStructure = {
  francophone: {
    Maternelle: ClassType[];
    Primaire: ClassType[];
    Secondaire: ClassType[];
  };
  anglophone: {
    Nursery: ClassType[];
    Primary: ClassType[];
    Secondary: ClassType[];
  };
};

export type SchoolInfo = {
  id?: string;
  name: string;
  slogan?: string;
  address?: string;
  phone?: string;
  email?: string;
  bp?: string;
  logoUrl?: string;
  currentSchoolYear: string;
  currency: string;
  defaultSection: SchoolSection;
};

export type Student = {
  id: string;
  nom: string;
  prenom: string;
  sexe?: string;
  dateNaissance: string;
  lieuNaissance: string;
  nationalite?: string;
  acteNaissance?: string;
  photoUrl?: string;
  infoParent: any;
  infoParent2?: any;
  niveau: string;
  classe: string;
  section: SchoolSection;
  anneeScolaire: string;
  historiqueClasse: any;
  statut: string;
  createdAt: string;
};

export type FeeStructure = {
  [section in SchoolSection]: {
    [className: string]: {
      registrationFee: number;
      total: number;
      installments: any[];
    };
  };
};
*/ 
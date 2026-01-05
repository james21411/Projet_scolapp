// TODO: Implémenter les sections francophone/anglophone
/*
import type { SchoolSection, LevelType, ClassType } from '@/types/school';

export const SECTIONS: SchoolSection[] = ['francophone', 'anglophone'];

export const LEVEL_EQUIVALENCES = {
  francophone: {
    Maternelle: 'Nursery',
    Primaire: 'Primary', 
    Secondaire: 'Secondary'
  },
  anglophone: {
    Nursery: 'Maternelle',
    Primary: 'Primaire',
    Secondary: 'Secondaire'
  }
} as const;

export const CLASS_EQUIVALENCES = {
  francophone: {
    'Petite Section': 'Nursery 1',
    'Moyenne Section': 'Nursery 2', 
    'Grande Section': 'Nursery 3',
    'CP': 'Class 1',
    'CE1': 'Class 2',
    'CE2': 'Class 3',
    'CM1': 'Class 4',
    'CM2': 'Class 5',
    '6ème': 'Form 1',
    '5ème': 'Form 2',
    '4ème': 'Form 3',
    '3ème': 'Form 4',
    '2nde': 'Form 5',
    '1ère': 'Lower 6',
    'Terminale': 'Upper 6'
  },
  anglophone: {
    'Nursery 1': 'Petite Section',
    'Nursery 2': 'Moyenne Section',
    'Nursery 3': 'Grande Section',
    'Class 1': 'CP',
    'Class 2': 'CE1',
    'Class 3': 'CE2',
    'Class 4': 'CM1',
    'Class 5': 'CM2',
    'Form 1': '6ème',
    'Form 2': '5ème',
    'Form 3': '4ème',
    'Form 4': '3ème',
    'Form 5': '2nde',
    'Lower 6': '1ère',
    'Upper 6': 'Terminale'
  }
} as const;

export function getEquivalentLevel(section: SchoolSection, level: string): string {
  return LEVEL_EQUIVALENCES[section][level as keyof typeof LEVEL_EQUIVALENCES[typeof section]] || level;
}

export function getEquivalentClass(section: SchoolSection, className: string): string {
  return CLASS_EQUIVALENCES[section][className as keyof typeof CLASS_EQUIVALENCES[typeof section]] || className;
}

export function getLevelDisplayName(section: SchoolSection, level: string): string {
  const equivalents = LEVEL_EQUIVALENCES[section];
  return equivalents[level as keyof typeof equivalents] || level;
}

export function getClassDisplayName(section: SchoolSection, className: string): string {
  const equivalents = CLASS_EQUIVALENCES[section];
  return equivalents[className as keyof typeof equivalents] || className;
}

export function getSectionDisplayName(section: SchoolSection): string {
  return section === 'francophone' ? 'Section Francophone' : 'Section Anglophone';
}

export function getLevelsForSection(section: SchoolSection): string[] {
  return Object.keys(LEVEL_EQUIVALENCES[section]);
}

export function getDefaultSchoolStructure(): any {
  return {
    francophone: {
      Maternelle: [
        { id: 'ps', name: 'Petite Section', nameEn: 'Nursery 1', levelId: 'maternelle' },
        { id: 'ms', name: 'Moyenne Section', nameEn: 'Nursery 2', levelId: 'maternelle' },
        { id: 'gs', name: 'Grande Section', nameEn: 'Nursery 3', levelId: 'maternelle' }
      ],
      Primaire: [
        { id: 'cp', name: 'CP', nameEn: 'Class 1', levelId: 'primaire' },
        { id: 'ce1', name: 'CE1', nameEn: 'Class 2', levelId: 'primaire' },
        { id: 'ce2', name: 'CE2', nameEn: 'Class 3', levelId: 'primaire' },
        { id: 'cm1', name: 'CM1', nameEn: 'Class 4', levelId: 'primaire' },
        { id: 'cm2', name: 'CM2', nameEn: 'Class 5', levelId: 'primaire' }
      ],
      Secondaire: [
        { id: '6e', name: '6ème', nameEn: 'Form 1', levelId: 'secondaire' },
        { id: '5e', name: '5ème', nameEn: 'Form 2', levelId: 'secondaire' },
        { id: '4e', name: '4ème', nameEn: 'Form 3', levelId: 'secondaire' },
        { id: '3e', name: '3ème', nameEn: 'Form 4', levelId: 'secondaire' },
        { id: '2nde', name: '2nde', nameEn: 'Form 5', levelId: 'secondaire' },
        { id: '1ere', name: '1ère', nameEn: 'Lower 6', levelId: 'secondaire' },
        { id: 'term', name: 'Terminale', nameEn: 'Upper 6', levelId: 'secondaire' }
      ]
    },
    anglophone: {
      Nursery: [
        { id: 'n1', name: 'Nursery 1', nameEn: 'Petite Section', levelId: 'nursery' },
        { id: 'n2', name: 'Nursery 2', nameEn: 'Moyenne Section', levelId: 'nursery' },
        { id: 'n3', name: 'Nursery 3', nameEn: 'Grande Section', levelId: 'nursery' }
      ],
      Primary: [
        { id: 'c1', name: 'Class 1', nameEn: 'CP', levelId: 'primary' },
        { id: 'c2', name: 'Class 2', nameEn: 'CE1', levelId: 'primary' },
        { id: 'c3', name: 'Class 3', nameEn: 'CE2', levelId: 'primary' },
        { id: 'c4', name: 'Class 4', nameEn: 'CM1', levelId: 'primary' },
        { id: 'c5', name: 'Class 5', nameEn: 'CM2', levelId: 'primary' }
      ],
      Secondary: [
        { id: 'f1', name: 'Form 1', nameEn: '6ème', levelId: 'secondary' },
        { id: 'f2', name: 'Form 2', nameEn: '5ème', levelId: 'secondary' },
        { id: 'f3', name: 'Form 3', nameEn: '4ème', levelId: 'secondary' },
        { id: 'f4', name: 'Form 4', nameEn: '3ème', levelId: 'secondary' },
        { id: 'f5', name: 'Form 5', nameEn: '2nde', levelId: 'secondary' },
        { id: 'l6', name: 'Lower 6', nameEn: '1ère', levelId: 'secondary' },
        { id: 'u6', name: 'Upper 6', nameEn: 'Terminale', levelId: 'secondary' }
      ]
    }
  };
}
*/ 
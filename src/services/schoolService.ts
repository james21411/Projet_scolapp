import { getSchoolInfo as getSchoolInfoDb, updateSchoolInfo as updateSchoolInfoDb, createSchoolInfo as createSchoolInfoDb, deleteSchoolInfo as deleteSchoolInfoDb, resetSchoolInfo as resetSchoolInfoDb } from '../db/services/schoolDb';
import { getSchoolStructure as getSchoolStructureDb, addClass as addClassDb, updateClass as updateClassDb, deleteClass as deleteClassDb } from '../db/services/schoolStructureDb';
import type { SchoolInfo } from './schoolInfoService';

export interface SchoolStructure {
  levels: {
    [level: string]: {
      classes: string[];
    };
  };
}

export async function getSchoolInfo(): Promise<SchoolInfo | null> {
  try {
    return await getSchoolInfoDb();
  } catch (error) {
    console.warn('Erreur lors de la récupération des informations de l\'école:', error);
    return null;
  }
}

export async function updateSchoolInfo(data: SchoolInfo): Promise<void> {
  await updateSchoolInfoDb(data);
  // (optionnel) logAction({ action: 'settings_updated', details: ... });
}

export async function createSchoolInfo(data: SchoolInfo): Promise<void> {
  await createSchoolInfoDb(data);
}

export async function deleteSchoolInfo(): Promise<void> {
  await deleteSchoolInfoDb();
}

export async function resetSchoolInfo(): Promise<void> {
  await resetSchoolInfoDb();
}

// Fonctions pour la structure de l'école (classes)
export async function getSchoolStructure(): Promise<SchoolStructure> {
  return await getSchoolStructureDb();
}

export async function addClass(level: string, className: string, currentUser?: { id: string; username: string }): Promise<void> {
  await addClassDb(level, className, currentUser);
}

export async function updateClass(level: string, oldClassName: string, newClassName: string, currentUser?: { id: string; username: string }): Promise<void> {
  await updateClassDb(level, oldClassName, newClassName, currentUser);
}

export async function deleteClass(level: string, className: string, currentUser?: { id: string; username: string }): Promise<void> {
  await deleteClassDb(level, className, currentUser);
}

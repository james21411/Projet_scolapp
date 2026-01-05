'use server';

import { addPresence as addPresenceDb, getPresences as getPresencesDb, updatePresence as updatePresenceDb, deletePresence as deletePresenceDb } from '../db/services/presenceDb';

export type PresenceType = 'eleve' | 'personnel';
export type PresenceStatus = 'present' | 'absent' | 'retard' | 'exclusion';

export interface Presence {
  id: string;
  type: PresenceType;
  personId: string;
  personName: string;
  date: string;
  status: PresenceStatus;
  details?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePresenceData {
  type: PresenceType;
  personId: string;
  personName: string;
  date: string;
  status: PresenceStatus;
  details?: string;
}

export interface UpdatePresenceData {
  status?: PresenceStatus;
  details?: string;
  updatedAt?: string;
}

// Récupérer toutes les présences
export async function getPresences(limit = 100, offset = 0): Promise<Presence[]> {
  try {
    return await getPresencesDb(limit, offset);
  } catch (error) {
    console.error('Erreur lors de la récupération des présences:', error);
    return [];
  }
}

// Récupérer les présences par date
export async function getPresencesByDate(date: string): Promise<Presence[]> {
  try {
    // Pour l'instant, on récupère toutes les présences et on filtre côté service
    // Plus tard, on peut optimiser avec une requête SQL spécifique
    const allPresences = await getPresencesDb(1000, 0);
    return allPresences.filter(presence => presence.date === date);
  } catch (error) {
    console.error('Erreur lors de la récupération des présences par date:', error);
    return [];
  }
}

// Ajouter une nouvelle présence
export async function addPresence(data: CreatePresenceData): Promise<Presence> {
  try {
    // S'assurer que la date est au format YYYY-MM-DD
    const formattedDate = data.date ? new Date(data.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    
    // Format DATETIME pour MySQL (YYYY-MM-DD HH:MM:SS)
    const now = new Date();
    const mysqlDateTime = now.toISOString().slice(0, 19).replace('T', ' ');
    
    const presence: Presence = {
      id: `presence-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      ...data,
      date: formattedDate,
      createdAt: mysqlDateTime,
      updatedAt: mysqlDateTime,
    };
    
    await addPresenceDb(presence);
    return presence;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la présence:', error);
    throw error;
  }
}

// Mettre à jour une présence
export async function updatePresence(id: string, data: UpdatePresenceData): Promise<void> {
  try {
    // Format DATETIME pour MySQL (YYYY-MM-DD HH:MM:SS)
    const now = new Date();
    const mysqlDateTime = now.toISOString().slice(0, 19).replace('T', ' ');
    
    // Ajouter updatedAt aux données de mise à jour
    const updateData = {
      ...data,
      updatedAt: mysqlDateTime
    };
    
    await updatePresenceDb(id, updateData);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la présence:', error);
    throw error;
  }
}

// Supprimer une présence
export async function deletePresence(id: string): Promise<void> {
  try {
    await deletePresenceDb(id);
  } catch (error) {
    console.error('Erreur lors de la suppression de la présence:', error);
    throw error;
  }
} 
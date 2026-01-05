import { executeQuery } from '../utils';
import type { RowDataPacket } from 'mysql2/promise';
import type { Presence, CreatePresenceData, UpdatePresenceData } from '../../services/presenceService';

// Récupérer toutes les présences
export async function getPresences(limit = 100, offset = 0): Promise<Presence[]> {
  try {
    const rows = await executeQuery<RowDataPacket[]>(
      'SELECT * FROM presences ORDER BY date DESC, createdAt DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    
    return rows.map(row => ({
      id: row.id,
      type: row.type,
      personId: row.personId,
      personName: row.personName,
      date: row.date,
      status: row.status,
      details: row.details,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des présences:', error);
    return [];
  }
}

// Ajouter une nouvelle présence
export async function addPresence(presence: Presence): Promise<void> {
  try {
    console.log('Tentative d\'ajout de présence:', presence);
    
    const result = await executeQuery(
      'INSERT INTO presences (id, type, personId, personName, date, status, details, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        presence.id,
        presence.type,
        presence.personId,
        presence.personName,
        presence.date,
        presence.status,
        presence.details || null,
        presence.createdAt,
        presence.updatedAt,
      ]
    );
    
    console.log('Présence ajoutée avec succès:', result);
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la présence:', error);
    console.error('Données de présence:', presence);
    throw new Error(`Erreur lors de l'ajout de la présence: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

// Mettre à jour une présence
export async function updatePresence(id: string, data: UpdatePresenceData): Promise<void> {
  try {
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
    }
    
    if (data.details !== undefined) {
      updates.push('details = ?');
      values.push(data.details);
    }
    
    // Utiliser la date fournie ou générer une nouvelle
    const updatedAt = data.updatedAt || new Date().toISOString().slice(0, 19).replace('T', ' ');
    updates.push('updatedAt = ?');
    values.push(updatedAt);
    
    values.push(id);
    
    await executeQuery(
      `UPDATE presences SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la présence:', error);
    throw error;
  }
}

// Supprimer une présence
export async function deletePresence(id: string): Promise<void> {
  try {
    await executeQuery('DELETE FROM presences WHERE id = ?', [id]);
  } catch (error) {
    console.error('Erreur lors de la suppression de la présence:', error);
    throw error;
  }
}

 
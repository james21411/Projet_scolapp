import { executeQuery } from '../utils';
import type { RowDataPacket } from 'mysql2/promise';
import { logActionWithUser } from '../../services/auditLogService';

export interface SchoolLevel {
  id: string;
  name: string;
  order: number;
}

export interface SchoolClass {
  id: string;
  levelId: string;
  name: string;
  order: number;
}

export async function getSchoolStructure(): Promise<{ levels: { [key: string]: { classes: string[] } } }> {
  try {
    // Récupérer seulement les niveaux actifs
    const levels = await executeQuery<RowDataPacket[]>('SELECT * FROM school_levels WHERE isActive = true ORDER BY `order`');
    
    // Récupérer les classes des niveaux actifs
    const classes = await executeQuery<RowDataPacket[]>(`
      SELECT c.* FROM school_classes c 
      JOIN school_levels l ON c.levelId = l.id 
      WHERE l.isActive = true 
      ORDER BY c.\`order\`
    `);
    
    // Organiser les données
    const structure: { levels: { [key: string]: { classes: string[] } } } = { levels: {} };
    
    levels.forEach(level => {
      const levelClasses = classes
        .filter(cls => cls.levelId === level.id)
        .map(cls => cls.name);
      
      structure.levels[level.name] = {
        classes: levelClasses
      };
    });
    
    return structure;
  } catch (error) {
    console.error('Erreur lors de la récupération de la structure:', error);
    // Retourner une structure par défaut si la table n'existe pas
    return {
      levels: {
        "Maternelle": {
          classes: ["Petite Section", "Moyenne Section", "Grande Section"]
        },
        "Primaire": {
          classes: ["SIL", "CP", "CE1", "CE2", "CM1", "CM2"]
        },
        "Secondaire": {
          classes: ["6ème", "5ème", "4ème", "3ème", "2nde", "1ère", "Terminale"]
        }
      }
    };
  }
}

// Fonction pour récupérer tous les niveaux (actifs et inactifs) pour la gestion
export async function getAllLevels(): Promise<any[]> {
  try {
    const levels = await executeQuery<RowDataPacket[]>('SELECT * FROM school_levels ORDER BY `order`');
    return levels;
  } catch (error) {
    console.error('Erreur lors de la récupération de tous les niveaux:', error);
    return [];
  }
}

export async function addClass(levelName: string, className: string, currentUser?: { id: string; username: string }): Promise<void> {
  try {
    // Trouver l'ID du niveau
    const levels = await executeQuery<RowDataPacket[]>('SELECT id FROM school_levels WHERE name = ?', [levelName]);
    
    if (levels.length === 0) {
      throw new Error(`Niveau "${levelName}" non trouvé`);
    }
    
    const levelId = levels[0].id;
    
    // Vérifier si la classe existe déjà
    const existingClasses = await executeQuery<RowDataPacket[]>('SELECT name FROM school_classes WHERE levelId = ? AND name = ?', [levelId, className]);
    
    if (existingClasses.length > 0) {
      throw new Error(`La classe "${className}" existe déjà dans le niveau "${levelName}"`);
    }
    
    // Trouver l'ordre maximum pour ce niveau
    const maxOrder = await executeQuery<RowDataPacket[]>('SELECT MAX(`order`) as maxOrder FROM school_classes WHERE levelId = ?', [levelId]);
    const newOrder = (maxOrder[0]?.maxOrder || 0) + 1;
    
    // Ajouter la classe
    await executeQuery(
      'INSERT INTO school_classes (id, levelId, name, `order`) VALUES (UUID(), ?, ?, ?)',
      [levelId, className, newOrder]
    );
    
    // Créer automatiquement une structure tarifaire par défaut pour cette classe
    try {
      const { createDefaultFeeStructure } = await import('../../services/financeService');
      await createDefaultFeeStructure(className);
      console.log(`✅ Structure tarifaire par défaut créée pour la classe: ${className}`);
    } catch (feeError) {
      console.warn(`⚠️ Impossible de créer la structure tarifaire pour ${className}:`, feeError);
      // Ne pas faire échouer l'ajout de la classe si la création de la structure tarifaire échoue
    }
    
    // Log de l'action
    await logActionWithUser(
      'settings_updated',
      `Classe "${className}" ajoutée au niveau "${levelName}" avec structure tarifaire par défaut`,
      currentUser
    );
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la classe:', error);
    throw error;
  }
}

export async function updateClass(levelName: string, oldClassName: string, newClassName: string, currentUser?: { id: string; username: string }): Promise<void> {
  try {
    // Trouver l'ID du niveau
    const levels = await executeQuery<RowDataPacket[]>('SELECT id FROM school_levels WHERE name = ?', [levelName]);
    
    if (levels.length === 0) {
      throw new Error(`Niveau "${levelName}" non trouvé`);
    }
    
    const levelId = levels[0].id;
    
    // Mettre à jour la classe
    await executeQuery(
      'UPDATE school_classes SET name = ? WHERE levelId = ? AND name = ?',
      [newClassName, levelId, oldClassName]
    );
    
    // Log de l'action
    await logActionWithUser(
      'settings_updated',
      `Classe "${oldClassName}" renommée en "${newClassName}" dans le niveau "${levelName}"`,
      currentUser
    );
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la classe:', error);
    throw error;
  }
}

export async function deleteClass(levelName: string, className: string, currentUser?: { id: string; username: string }): Promise<void> {
  try {
    // Trouver l'ID du niveau
    const levels = await executeQuery<RowDataPacket[]>('SELECT id FROM school_levels WHERE name = ?', [levelName]);
    
    if (levels.length === 0) {
      throw new Error(`Niveau "${levelName}" non trouvé`);
    }
    
    const levelId = levels[0].id;
    
    // Supprimer la classe
    await executeQuery(
      'DELETE FROM school_classes WHERE levelId = ? AND name = ?',
      [levelId, className]
    );
    
    // Log de l'action
    await logActionWithUser(
      'settings_updated',
      `Classe "${className}" supprimée du niveau "${levelName}"`,
      currentUser
    );
  } catch (error) {
    console.error('Erreur lors de la suppression de la classe:', error);
    throw error;
  }
} 
'use server';

import pool from '@/db/mysql';
import { logAction } from './auditLogService';

/**
 * Service pour gérer la transition automatique des matières
 * lors du changement d'année scolaire
 */

/**
 * Copie automatiquement les matières d'une année vers une autre
 * Évite les doublons en vérifiant l'existence
 */
export async function copySubjectsToNewYear(
  previousYear: string,
  newYear: string,
  userId?: string
): Promise<{ success: boolean; inserted: number; updated: number; message: string }> {
  try {
    // 1) Mise à jour des matières déjà existantes (même code + classe) sur l'année cible
    const [updateResult] = await pool.query(
      `UPDATE subjects t
       JOIN subjects s
         ON t.code = s.code AND t.classId = s.classId
       SET t.name = s.name,
           t.category = s.category,
           t.coefficient = s.coefficient,
           t.maxScore = s.maxScore,
           t.isActive = s.isActive,
           t.updatedAt = NOW()
       WHERE t.schoolYear = ? AND s.schoolYear = ? AND s.isActive = true`,
      [newYear, previousYear]
    );

    const updated = (updateResult as any).affectedRows || 0;

    // 2) Insertion des nouvelles matières qui n'existent pas encore dans l'année cible
    const [insertResult] = await pool.query(
      `INSERT INTO subjects (code, name, description, category, coefficient, maxScore, isActive, classId, schoolYear, createdAt, updatedAt)
       SELECT s.code, s.name, s.description, s.category, s.coefficient, s.maxScore, s.isActive, s.classId, ?, NOW(), NOW()
       FROM subjects s
       LEFT JOIN subjects t
         ON t.code = s.code AND t.classId = s.classId AND t.schoolYear = ?
       WHERE s.schoolYear = ? AND s.isActive = true AND t.id IS NULL`,
      [newYear, newYear, previousYear]
    );

    const inserted = (insertResult as any).affectedRows || 0;

    // Logger l'action
    if (userId) {
      await logAction({
        action: 'subjects_copied',
        details: `Reconduction matières ${previousYear} → ${newYear}: ${inserted} insérées, ${updated} mises à jour`,
        userId: userId
      });
    }

    return {
      success: true,
      inserted,
      updated,
      message: `Reconduction effectuée: ${inserted} matière(s) insérée(s), ${updated} mise(s) à jour`
    };

  } catch (error) {
    console.error('Erreur lors de la copie des matières:', error);
    throw new Error(`Échec de la copie des matières: ${error}`);
  }
}

/**
 * Vérifie si une transition d'année est nécessaire pour les matières
 */
export async function checkSubjectsTransitionNeeded(
  previousYear: string,
  newYear: string
): Promise<{ needed: boolean; reason?: string }> {
  try {
    // Vérifier les matières
    const [subjectsCount] = await pool.query(
      'SELECT COUNT(*) as count FROM subjects WHERE schoolYear = ?',
      [newYear]
    );
    
    const hasSubjects = (subjectsCount as any)[0].count > 0;

    if (hasSubjects) {
      return { 
        needed: false, 
        reason: `L'année ${newYear} a déjà des matières configurées` 
      };
    }

    return { 
      needed: true, 
      reason: `L'année ${newYear} n'a pas de matières configurées` 
    };

  } catch (error) {
    console.error('Erreur lors de la vérification de transition:', error);
    return { needed: false, reason: `Erreur de vérification: ${error}` };
  }
}

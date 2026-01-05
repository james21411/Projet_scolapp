import pool from '../mysql';

/**
 * Copie toutes les matières d'une année scolaire vers une nouvelle
 */
export async function copySubjectsToNewYear(oldSchoolYear: string, newSchoolYear: string): Promise<void> {
  try {
    console.log(`🔄 Copie des matières de ${oldSchoolYear} vers ${newSchoolYear}`);
    
    // Vérifier qu'il n'y a pas déjà des matières pour la nouvelle année
    const checkSql = `SELECT COUNT(*) as count FROM subjects WHERE schoolYear = ?`;
    const [checkResult] = await pool.query(checkSql, [newSchoolYear]) as any[];
    
    if (checkResult[0].count > 0) {
      console.log(`⚠️ Des matières existent déjà pour ${newSchoolYear}`);
      return;
    }
    
    // Copier les matières avec la nouvelle année
    const copySql = `
      INSERT INTO subjects (id, name, code, description, category, maxScore, isActive, classId, schoolYear, createdAt, updatedAt)
      SELECT 
        CONCAT(SUBSTRING(id, 1, CHAR_LENGTH(id) - 10), ?, '-', UUID_SHORT()) as id,
        name,
        code,
        description,
        category,
        maxScore,
        isActive,
        classId,
        ? as schoolYear,
        NOW() as createdAt,
        NOW() as updatedAt
      FROM subjects 
      WHERE schoolYear = ?
    `;
    
    await pool.query(copySql, [newSchoolYear, newSchoolYear, oldSchoolYear]);
    
    // Vérifier le nombre de matières copiées
    const verifySql = `SELECT COUNT(*) as count FROM subjects WHERE schoolYear = ?`;
    const [verifyResult] = await pool.query(verifySql, [newSchoolYear]) as any[];
    
    console.log(`✅ ${verifyResult[0].count} matières copiées vers ${newSchoolYear}`);
    
  } catch (error) {
    console.error(`❌ Erreur lors de la copie des matières:`, error);
    throw new Error(`Impossible de copier les matières: ${error}`);
  }
}

/**
 * Copie toutes les classes d'une année scolaire vers une nouvelle
 */
export async function copyClassesToNewYear(oldSchoolYear: string, newSchoolYear: string): Promise<void> {
  try {
    console.log(`🔄 Copie des classes de ${oldSchoolYear} vers ${newSchoolYear}`);
    
    // Vérifier qu'il n'y a pas déjà des classes pour la nouvelle année
    const checkSql = `SELECT COUNT(*) as count FROM classes WHERE schoolYear = ?`;
    const [checkResult] = await pool.query(checkSql, [newSchoolYear]) as any[];
    
    if (checkResult[0].count > 0) {
      console.log(`⚠️ Des classes existent déjà pour ${newSchoolYear}`);
      return;
    }
    
    // Copier les classes avec la nouvelle année
    const copySql = `
      INSERT INTO classes (id, name, level, schoolYear, isActive, createdAt, updatedAt)
      SELECT 
        CONCAT(SUBSTRING(id, 1, CHAR_LENGTH(id) - 10), ?, '-', UUID_SHORT()) as id,
        name,
        level,
        ? as schoolYear,
        isActive,
        NOW() as createdAt,
        NOW() as updatedAt
      FROM classes 
      WHERE schoolYear = ?
    `;
    
    await pool.query(copySql, [newSchoolYear, newSchoolYear, oldSchoolYear]);
    
    // Vérifier le nombre de classes copiées
    const verifySql = `SELECT COUNT(*) as count FROM classes WHERE schoolYear = ?`;
    const [verifyResult] = await pool.query(verifySql, [newSchoolYear]) as any[];
    
    console.log(`✅ ${verifyResult[0].count} classes copiées vers ${newSchoolYear}`);
    
  } catch (error) {
    console.error(`❌ Erreur lors de la copie des classes:`, error);
    throw new Error(`Impossible de copier les classes: ${error}`);
  }
}

/**
 * Copie complète des données scolaires (matières + classes) vers une nouvelle année
 */
export async function copySchoolDataToNewYear(oldSchoolYear: string, newSchoolYear: string): Promise<void> {
  try {
    console.log(`🚀 Copie complète des données scolaires de ${oldSchoolYear} vers ${newSchoolYear}`);
    
    // 1. Copier les classes
    await copyClassesToNewYear(oldSchoolYear, newSchoolYear);
    
    // 2. Copier les matières
    await copySubjectsToNewYear(oldSchoolYear, newSchoolYear);
    
    console.log(`✅ Copie complète terminée pour ${newSchoolYear}`);
    
  } catch (error) {
    console.error(`❌ Erreur lors de la copie complète:`, error);
    throw error;
  }
}

/**
 * Vérifie si des données existent pour une année scolaire
 */
export async function checkDataExistsForYear(schoolYear: string): Promise<{classes: number, subjects: number}> {
  try {
    const [classesResult] = await pool.query('SELECT COUNT(*) as count FROM classes WHERE schoolYear = ?', [schoolYear]) as any[];
    const [subjectsResult] = await pool.query('SELECT COUNT(*) as count FROM subjects WHERE schoolYear = ?', [schoolYear]) as any[];
    
    return {
      classes: classesResult[0].count,
      subjects: subjectsResult[0].count
    };
  } catch (error) {
    console.error(`Erreur lors de la vérification des données pour ${schoolYear}:`, error);
    return { classes: 0, subjects: 0 };
  }
}

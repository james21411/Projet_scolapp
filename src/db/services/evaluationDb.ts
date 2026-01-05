import pool from '../mysql';

export async function createSequencesForYear(schoolYear: string): Promise<void> {
  try {
    console.log(`🚀 Création des séquences pour l'année ${schoolYear}`);
    
    // Vérifier que l'année n'existe pas déjà
    const checkSql = `SELECT COUNT(*) as count FROM evaluation_periods WHERE schoolYear = ? AND id LIKE 'seq%-%'`;
    const [checkResult] = await pool.query(checkSql, [schoolYear]) as any[];
    
    if (checkResult[0].count > 0) {
      console.log(`⚠️ Les séquences pour ${schoolYear} existent déjà`);
      return;
    }
    
    // Créer les 6 séquences
    const insertSql = `
      INSERT INTO evaluation_periods (id, name, schoolYear, isActive) VALUES
      (?, '1ère Séquence', ?, 1),
      (?, '2ème Séquence', ?, 1),
      (?, '3ème Séquence', ?, 1),
      (?, '4ème Séquence', ?, 1),
      (?, '5ème Séquence', ?, 1),
      (?, '6ème Séquence', ?, 1)
    `;
    
    const params = [
      `seq1-${schoolYear}`, schoolYear,
      `seq2-${schoolYear}`, schoolYear,
      `seq3-${schoolYear}`, schoolYear,
      `seq4-${schoolYear}`, schoolYear,
      `seq5-${schoolYear}`, schoolYear,
      `seq6-${schoolYear}`, schoolYear
    ];
    
    await pool.query(insertSql, params);
    
    console.log(`✅ 6 séquences créées avec succès pour ${schoolYear}`);
    
  } catch (error) {
    console.error(`❌ Erreur lors de la création des séquences pour ${schoolYear}:`, error);
    throw new Error(`Impossible de créer les séquences pour ${schoolYear}: ${error}`);
  }
}

/**
 * Récupère toutes les séquences pour une année scolaire
 */
export async function getSequencesForYear(schoolYear: string) {
  try {
    const sql = `SELECT * FROM evaluation_periods WHERE schoolYear = ? AND id LIKE 'seq%-%' ORDER BY id`;
    const [rows] = await pool.query(sql, [schoolYear]) as any[];
    return rows;
  } catch (error) {
    console.error(`Erreur lors de la récupération des séquences pour ${schoolYear}:`, error);
    throw error;
  }
}

/**
 * Vérifie si toutes les séquences existent pour une année
 */
export async function checkSequencesForYear(schoolYear: string): Promise<boolean> {
  try {
    const sql = `SELECT COUNT(*) as count FROM evaluation_periods WHERE schoolYear = ? AND id LIKE 'seq%-%'`;
    const [result] = await pool.query(sql, [schoolYear]) as any[];
    return result[0].count === 6;
  } catch (error) {
    console.error(`Erreur lors de la vérification des séquences pour ${schoolYear}:`, error);
    return false;
  }
}

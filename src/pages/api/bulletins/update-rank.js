import pool from '../../../db/mysql-pool';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { 
      studentId, 
      classId, 
      evaluationPeriodId, 
      schoolYear, 
      rank, 
      totalStudents, 
      averageScore 
    } = req.body;

    if (!studentId || !classId || !evaluationPeriodId || !schoolYear || !rank || !totalStudents) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    const connection = ;

    // Vérifier si un bulletin existe déjà pour cet élève
    const [existingBulletins] = await connection.query(`
      SELECT id FROM report_cards 
      WHERE studentId = ? AND evaluationPeriodId = ? AND schoolYear = ?
    `, [studentId, evaluationPeriodId, schoolYear]);

    if (existingBulletins.length > 0) {
      // Mettre à jour le bulletin existant
      const [updateResult] = await connection.query(`
        UPDATE report_cards 
        SET rank = ?, totalStudents = ?, averageScore = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE studentId = ? AND evaluationPeriodId = ? AND schoolYear = ?
      `, [rank, totalStudents, averageScore, studentId, evaluationPeriodId, schoolYear]);

      console.log(`✅ Bulletin mis à jour pour ${studentId}: rang ${rank}/${totalStudents}`);
    } else {
      // Créer un nouveau bulletin avec le rang calculé
      const bulletinId = `bulletin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const [insertResult] = await connection.query(`
        INSERT INTO report_cards (
          id, studentId, classId, schoolYear, evaluationPeriodId,
          averageScore, totalCoefficient, rank, totalStudents,
          teacherComments, principalComments, mention, issuedBy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        bulletinId, studentId, classId, schoolYear, evaluationPeriodId,
        averageScore, 0, rank, totalStudents,
        '', '', 'N/A', 'SYSTEM'
      ]);

      console.log(`✅ Nouveau bulletin créé pour ${studentId}: rang ${rank}/${totalStudents}`);
    }    return res.status(200).json({ 
      success: true, 
      message: 'Rang mis à jour avec succès',
      rank,
      totalStudents
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du rang:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur interne',
      details: error.message
    });
  }
}
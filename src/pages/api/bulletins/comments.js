import pool from '../../../db/mysql-pool';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Sauvegarder les commentaires
    try {
      const { studentId, evaluationPeriodId, schoolYear, teacherComments, principalComments, classId, issuedBy } = req.body;

      if (!studentId || !evaluationPeriodId || !schoolYear || !classId || !issuedBy) {
        return res.status(400).json({ error: 'Paramètres manquants: studentId, evaluationPeriodId, schoolYear, classId, issuedBy' });
      }

      const connection = ;

      // Vérifier si un bulletin existe déjà
      const [existingBulletins] = await connection.query(
        'SELECT id FROM report_cards WHERE studentId = ? AND evaluationPeriodId = ? AND schoolYear = ?',
        [studentId, evaluationPeriodId, schoolYear]
      );

      if (existingBulletins.length > 0) {
        // Mettre à jour le bulletin existant
        await connection.query(
          `UPDATE report_cards 
           SET teacherComments = ?, principalComments = ?, updatedAt = CURRENT_TIMESTAMP
           WHERE studentId = ? AND evaluationPeriodId = ? AND schoolYear = ?`,
          [teacherComments, principalComments, studentId, evaluationPeriodId, schoolYear]
        );
      } else {
        // Créer un nouveau bulletin avec les commentaires
        const bulletinId = `bulletin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await connection.query(
          `INSERT INTO report_cards (
            id, studentId, classId, evaluationPeriodId, schoolYear, 
            teacherComments, principalComments, averageScore, totalCoefficient, issuedBy, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [bulletinId, studentId, classId, evaluationPeriodId, schoolYear, teacherComments, principalComments, issuedBy]
        );
      }      return res.status(200).json({ 
        message: 'Commentaires sauvegardés avec succès' 
      });

    } catch (error) {
      console.error('Erreur API bulletins/comments POST:', error);
      return res.status(500).json({ 
        error: 'Erreur serveur interne',
        details: error.message 
      });
    }
  } else if (req.method === 'GET') {
    // Récupérer les commentaires
    try {
      const { studentId, evaluationPeriodId, schoolYear } = req.query;

      if (!studentId || !evaluationPeriodId || !schoolYear) {
        return res.status(400).json({ error: 'Paramètres manquants: studentId, evaluationPeriodId, schoolYear' });
      }

      const connection = ;

      const [comments] = await connection.query(
        'SELECT teacherComments, principalComments FROM report_cards WHERE studentId = ? AND evaluationPeriodId = ? AND schoolYear = ?',
        [studentId, evaluationPeriodId, schoolYear]
      );      if (comments.length > 0) {
        return res.status(200).json(comments[0]);
      } else {
        return res.status(200).json({ teacherComments: '', principalComments: '' });
      }

    } catch (error) {
      console.error('Erreur API bulletins/comments GET:', error);
      return res.status(500).json({ 
        error: 'Erreur serveur interne',
        details: error.message 
      });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

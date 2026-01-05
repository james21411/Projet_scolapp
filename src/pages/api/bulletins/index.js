import pool from '../../../db/mysql-pool';

export default async function handler(req, res) {
  const { method } = req;
  let connection;

  try {
    connection = await pool.getConnection();

    switch (method) {
      case 'GET':
        // Récupérer les bulletins avec filtres
        const { classId, evaluationPeriodId, schoolYear, studentId } = req.query;
        
        let query = `
          SELECT 
            b.*,
            s.nom, s.prenom,
            ep.name as periodName,
            u.fullName as issuedByName
          FROM report_cards b
          LEFT JOIN students s ON b.studentId = s.id
          LEFT JOIN evaluation_periods ep ON b.evaluationPeriodId = ep.id
          LEFT JOIN users u ON b.issuedBy = u.id
          WHERE 1=1
        `;
        const params = [];
        
        if (classId) {
          query += ' AND b.classId = ?';
          params.push(classId);
        }
        
        if (evaluationPeriodId) {
          query += ' AND b.evaluationPeriodId = ?';
          params.push(evaluationPeriodId);
        }
        
        if (schoolYear) {
          query += ' AND b.schoolYear = ?';
          params.push(schoolYear);
        }
        
        if (studentId) {
          query += ' AND b.studentId = ?';
          params.push(studentId);
        }
        
        query += ' ORDER BY b.issuedAt DESC';
        
        const [bulletins] = await connection.query(query, params);
        return res.status(200).json(bulletins);

      case 'POST':
        // Créer un nouveau bulletin
        const { 
          studentId: newStudentId, 
          classId: newClassId, 
          schoolYear: newSchoolYear,
          evaluationPeriodId: newEvaluationPeriodId,
          averageScore,
          totalCoefficient,
          rank,
          totalStudents,
          teacherComments,
          principalComments,
          mention,
          issuedBy
        } = req.body;

        const bulletinId = `bulletin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const insertQuery = `
          INSERT INTO report_cards (
            id, studentId, classId, schoolYear, evaluationPeriodId,
            averageScore, totalCoefficient, rank, totalStudents,
            teacherComments, principalComments, mention, issuedBy
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await connection.query(insertQuery, [
          bulletinId, newStudentId, newClassId, newSchoolYear, newEvaluationPeriodId,
          averageScore, totalCoefficient, rank, totalStudents,
          teacherComments, principalComments, mention, issuedBy
        ]);
        return res.status(201).json({ 
          id: bulletinId,
          message: 'Bulletin créé avec succès'
        });

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Erreur API bulletins:', error);
    return res.status(500).json({
      error: 'Erreur serveur interne',
      details: error.message
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

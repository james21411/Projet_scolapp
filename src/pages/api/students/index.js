import pool from '../../../db/mysql-pool';

export default async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        // Récupérer les étudiants avec filtres
        const { classId, schoolYear } = req.query;

        let query = `
          SELECT
            s.*,
            CONCAT(s.nom, ' ', s.prenom) as name,
            CONCAT(s.nom, ' ', s.prenom) as code,
            s.classe as className,
            s.niveau as levelName,
            s.statut as status,
            s.anneeScolaire as schoolYear
          FROM students s
        `;
        const params = [];

        if (classId) {
          // Vérifier si classId est un UUID (ID de classe) ou un nom de classe
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(classId);

          if (isUUID) {
            // Si c'est un UUID, faire une jointure avec school_classes
            query = `
              SELECT
                s.*,
                CONCAT(s.nom, ' ', s.prenom) as name,
                CONCAT(s.nom, ' ', s.prenom) as code,
                s.classe as className,
                s.niveau as levelName,
                s.statut as status,
                s.anneeScolaire as schoolYear
              FROM students s
              INNER JOIN school_classes sc ON s.classe = sc.name
              WHERE sc.id = ?
            `;
            params.push(classId);
          } else {
            // Si c'est un nom de classe, filtrer directement
            query += ' WHERE s.classe = ?';
            params.push(classId);
          }
        }

        if (schoolYear) {
          query += params.length > 0 ? ' AND s.anneeScolaire = ?' : ' WHERE s.anneeScolaire = ?';
          params.push(schoolYear);
        }

        query += ' ORDER BY s.nom, s.prenom';

        const [students] = await pool.execute(query, params);
        return res.status(200).json(students);

      default:
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Erreur API students:', error);
    return res.status(500).json({ error: 'Erreur serveur interne' });
  }
}
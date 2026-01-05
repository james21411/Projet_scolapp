import pool from '../../../db/mysql-pool';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { sourceClassId, targetClassId, sourceSchoolYear, targetSchoolYear, selectedSubjects } = req.body;
    
    console.log('Données reçues:', { sourceClassId, targetClassId, sourceSchoolYear, targetSchoolYear, selectedSubjects });
    
    if (!sourceClassId || !targetClassId || !sourceSchoolYear || !targetSchoolYear) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    if (!selectedSubjects || !Array.isArray(selectedSubjects) || selectedSubjects.length === 0) {
      return res.status(400).json({ error: 'Aucune matière sélectionnée' });
    }

    // Récupérer les matières source
    const placeholders = selectedSubjects.map(() => '?').join(',');
    const [sourceSubjects] = await pool.execute(
      `SELECT * FROM subjects WHERE classId = ? AND schoolYear = ? AND id IN (${placeholders})`,
      [sourceClassId, sourceSchoolYear, ...selectedSubjects]
    );

    console.log('Matières source trouvées:', sourceSubjects.length);

    if (sourceSubjects.length === 0) {
      return res.status(404).json({ error: 'Aucune matière trouvée à copier' });
    }

    let copiedCount = 0;
    let updatedCount = 0;

    // Copier chaque matière vers la classe cible
    for (const subject of sourceSubjects) {
      // Vérifier si la matière existe déjà dans la classe cible
      const [existing] = await pool.execute(
        'SELECT id FROM subjects WHERE classId = ? AND code = ? AND schoolYear = ?',
        [targetClassId, subject.code, targetSchoolYear]
      );

      if (existing.length === 0) {
        // Insérer la nouvelle matière (laisser MySQL générer l'id)
        await pool.execute(
          `INSERT INTO subjects (code, name, category, coefficient, maxScore, isActive, classId, schoolYear)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [subject.code, subject.name, subject.category, subject.coefficient, subject.maxScore, subject.isActive, targetClassId, targetSchoolYear]
        );
        copiedCount++;
      } else {
        // Mettre à jour la matière existante
        await pool.execute(
          `UPDATE subjects 
           SET name = ?, category = ?, coefficient = ?, maxScore = ?, isActive = ?, updatedAt = NOW()
           WHERE classId = ? AND code = ? AND schoolYear = ?`,
          [subject.name, subject.category, subject.coefficient, subject.maxScore, subject.isActive, targetClassId, subject.code, targetSchoolYear]
        );
        updatedCount++;
      }
    }
    
    const message = `Opération terminée: ${copiedCount} matière(s) copiée(s), ${updatedCount} matière(s) mise(s) à jour`;
    console.log(message);
    
    return res.status(200).json({ 
      message,
      copiedCount,
      updatedCount,
      totalProcessed: sourceSubjects.length
    });

  } catch (error) {
    console.error('Erreur API copy subjects:', error);
    return res.status(500).json({ error: 'Erreur serveur interne', details: error.message });
  }
} 
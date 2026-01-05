import pool from '@/db/mysql';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id: personnelId } = req.query;

  try {
    const {
      dateEmbauche,
      dateFinContrat,
      typeContrat,
      salaire,
      statut,
      specialite,
      diplome,
      experience,
      photoUrl,
      personnelTypeId
    } = req.body;

    // Vérifier que le personnel existe
    const [existingPersonnel] = await pool.query('SELECT id FROM personnel WHERE id = ?', [personnelId]);
    if (existingPersonnel.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Personnel non trouvé'
      });
    }

    // Mettre à jour les informations RH
    await pool.query(`
      UPDATE personnel SET
        dateEmbauche = ?,
        dateFinContrat = ?,
        typeContrat = ?,
        salaire = ?,
        statut = ?,
        specialite = ?,
        diplome = ?,
        experience = ?,
        photoUrl = ?,
        personnelTypeId = ?
      WHERE id = ?
    `, [
      dateEmbauche, dateFinContrat, typeContrat, salaire, statut,
      specialite, diplome, experience, photoUrl, personnelTypeId, personnelId
    ]);

    return res.status(200).json({ 
      success: true, 
      message: 'Informations RH mises à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des informations RH:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour des informations RH'
    });
  }
} 
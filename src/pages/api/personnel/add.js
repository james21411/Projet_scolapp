import pool from '@/db/mysql';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      username,
      fullName,
      email,
      phone,
      role,
      type_personnel,
      dateEmbauche,
      typeContrat,
      salaire,
      statut,
      specialite,
      diplome,
      experience,
      photoUrl,
      personnelTypeId
    } = req.body;

    // Vérifier si le personnel existe déjà
    const [existingPersonnel] = await pool.query('SELECT id FROM personnel WHERE username = ? OR email = ?', [username, email]);
    if (existingPersonnel.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Un personnel avec ce nom d\'utilisateur ou cet email existe déjà'
      });
    }

    // Générer un ID unique
    const id = `PERS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const [result] = await pool.query(`
      INSERT INTO personnel (
        id, username, fullName, email, phone, role, type_personnel,
        dateEmbauche, typeContrat, salaire, statut, specialite,
        diplome, experience, photoUrl, personnelTypeId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, username, fullName, email, phone, role, type_personnel,
      dateEmbauche, typeContrat, salaire, statut, specialite,
      diplome, experience, photoUrl, personnelTypeId
    ]);

    return res.status(200).json({ 
      success: true, 
      message: 'Personnel ajouté avec succès',
      data: { id }
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du personnel:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'ajout du personnel'
    });
  }
} 
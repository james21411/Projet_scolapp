import { NextRequest, NextResponse } from 'next/server';
import pool from '@/db/mysql-pool';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { minLength, requireUppercase, requireLowercase, requireNumbers, requireSpecialChars, maxAge } = body;

    // Créer la table si elle n'existe pas
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS password_policies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        minLength INT NOT NULL DEFAULT 8,
        requireUppercase BOOLEAN NOT NULL DEFAULT true,
        requireLowercase BOOLEAN NOT NULL DEFAULT true,
        requireNumbers BOOLEAN NOT NULL DEFAULT true,
        requireSpecialChars BOOLEAN NOT NULL DEFAULT true,
        maxAge INT NOT NULL DEFAULT 90,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Supprimer l'ancienne politique s'il y en a une
    await pool.execute('DELETE FROM password_policies');

    // Insérer la nouvelle politique
    await pool.execute(`
      INSERT INTO password_policies (minLength, requireUppercase, requireLowercase, requireNumbers, requireSpecialChars, maxAge)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [minLength, requireUppercase, requireLowercase, requireNumbers, requireSpecialChars, maxAge]);
    return NextResponse.json({ 
      success: true, 
      message: 'Politique de mot de passe mise à jour avec succès' 
    });

  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la politique:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde de la politique de mot de passe' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Récupérer la politique actuelle
    const [rows] = await pool.execute('SELECT * FROM password_policies ORDER BY id DESC LIMIT 1');
    if ((rows as any[]).length > 0) {
      const policy = (rows as any[])[0];
      return NextResponse.json({
        minLength: policy.minLength,
        requireUppercase: Boolean(policy.requireUppercase),
        requireLowercase: Boolean(policy.requireLowercase),
        requireNumbers: Boolean(policy.requireNumbers),
        requireSpecialChars: Boolean(policy.requireSpecialChars),
        maxAge: policy.maxAge
      });
    } else {
      // Retourner les valeurs par défaut
      return NextResponse.json({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        maxAge: 90
      });
    }

  } catch (error) {
    console.error('Erreur lors de la récupération de la politique:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la politique de mot de passe' },
      { status: 500 }
    );
  }
} 
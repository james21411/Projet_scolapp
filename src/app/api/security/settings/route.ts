import { NextRequest, NextResponse } from 'next/server';
import pool from '@/db/mysql-pool';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionTimeout, maxLoginAttempts, lockoutDuration, requireTwoFactor } = body;

    // Créer la table si elle n'existe pas
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS security_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sessionTimeout INT NOT NULL DEFAULT 30,
        maxLoginAttempts INT NOT NULL DEFAULT 5,
        lockoutDuration INT NOT NULL DEFAULT 15,
        requireTwoFactor BOOLEAN NOT NULL DEFAULT false,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Supprimer l'ancien paramètre s'il y en a un
    await pool.execute('DELETE FROM security_settings');

    // Insérer les nouveaux paramètres
    await pool.execute(`
      INSERT INTO security_settings (sessionTimeout, maxLoginAttempts, lockoutDuration, requireTwoFactor)
      VALUES (?, ?, ?, ?)
    `, [sessionTimeout, maxLoginAttempts, lockoutDuration, requireTwoFactor]);
    return NextResponse.json({ 
      success: true, 
      message: 'Paramètres de sécurité mis à jour avec succès' 
    });

  } catch (error) {
    console.error('Erreur lors de la sauvegarde des paramètres:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde des paramètres de sécurité' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Récupérer les paramètres actuels
    const [rows] = await pool.execute('SELECT * FROM security_settings ORDER BY id DESC LIMIT 1');
    if ((rows as any[]).length > 0) {
      const settings = (rows as any[])[0];
      return NextResponse.json({
        sessionTimeout: settings.sessionTimeout,
        maxLoginAttempts: settings.maxLoginAttempts,
        lockoutDuration: settings.lockoutDuration,
        requireTwoFactor: Boolean(settings.requireTwoFactor)
      });
    } else {
      // Retourner les valeurs par défaut
      return NextResponse.json({
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        lockoutDuration: 15,
        requireTwoFactor: false
      });
    }

  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des paramètres de sécurité' },
      { status: 500 }
    );
  }
} 
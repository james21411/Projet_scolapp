import { NextRequest, NextResponse } from 'next/server';
import pool from '@/db/mysql-pool';

export interface SecurityUser {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
  lockedUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export async function GET() {
  try {
    // Récupérer tous les utilisateurs avec leurs informations de base
    const [rows] = await pool.execute(`
      SELECT
        u.id,
        u.username,
        u.fullName,
        u.email,
        u.role,
        u.createdAt
      FROM users u
      ORDER BY u.fullName
    `);
    return NextResponse.json(rows);

  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des utilisateurs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, fullName, email, role, password } = body;

    // Vérifier si l'utilisateur existe déjà
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if ((existing as any[]).length > 0) {
      return NextResponse.json(
        { error: 'Un utilisateur avec ce nom d\'utilisateur existe déjà' },
        { status: 400 }
      );
    }

    const userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const passwordHash = await import('bcryptjs').then(bcrypt => bcrypt.hash(password, 10));

    // Insérer le nouvel utilisateur (sans colonnes non existantes)
    await pool.execute(`
      INSERT INTO users (id, username, fullName, email, role, passwordHash)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [userId, username, fullName, email, role, passwordHash]);
    return NextResponse.json({
      success: true,
      message: 'Utilisateur créé avec succès',
      userId
    });

  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'utilisateur' },
      { status: 500 }
    );
  }
} 
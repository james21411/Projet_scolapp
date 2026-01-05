import { NextRequest, NextResponse } from 'next/server';
import pool from '@/db/mysql-pool';

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function GET() {
  try {
    // Créer la table si elle n'existe pas
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS roles (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        permissions JSON,
        isActive BOOLEAN NOT NULL DEFAULT true,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Récupérer tous les rôles
    const [rows] = await pool.execute('SELECT * FROM roles ORDER BY name');
    return NextResponse.json(rows);

  } catch (error) {
    console.error('Erreur lors de la récupération des rôles:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des rôles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, permissions } = body;

    // Créer la table si elle n'existe pas
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS roles (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        permissions JSON,
        isActive BOOLEAN NOT NULL DEFAULT true,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const roleId = `role-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Insérer le nouveau rôle
    await pool.execute(`
      INSERT INTO roles (id, name, description, permissions)
      VALUES (?, ?, ?, ?)
    `, [roleId, name, description, JSON.stringify(permissions || [])]);
    return NextResponse.json({ 
      success: true, 
      message: 'Rôle créé avec succès',
      roleId 
    });

  } catch (error) {
    console.error('Erreur lors de la création du rôle:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du rôle' },
      { status: 500 }
    );
  }
} 
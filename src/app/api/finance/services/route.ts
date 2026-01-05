import { NextRequest, NextResponse } from 'next/server';
import pool from '@/db/mysql';

// Table: financial_services
// id (varchar), name, category (e.g., uniforms, books, transport, cantine, other),
// levelId (nullable), classId (nullable), price DECIMAL(12,2), isActive, metadata JSON

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolYear = searchParams.get('schoolYear');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS financial_services (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        category VARCHAR(50) NOT NULL,
        levelId VARCHAR(36),
        classId VARCHAR(36),
        schoolYear VARCHAR(10),
        price DECIMAL(12,2) NOT NULL DEFAULT 0,
        isActive BOOLEAN NOT NULL DEFAULT true,
        metadata JSON,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Ajouter la colonne schoolYear si elle n'existe pas
    try {
      await pool.execute('ALTER TABLE financial_services ADD COLUMN schoolYear VARCHAR(10) AFTER classId');
    } catch (e: any) {
      // Ignorer l'erreur si la colonne existe déjà
      if (e.code !== 'ER_DUP_FIELDNAME') throw e;
    }

    let query = 'SELECT * FROM financial_services';
    const params: any[] = [];
    if (schoolYear) { query += ' WHERE schoolYear = ?'; params.push(schoolYear); }
    query += ' ORDER BY name ASC';
    const [rows] = await pool.execute(query, params) as any;
    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error('Erreur GET financial_services:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, category, levelId, classId, price, isActive = true, metadata, schoolYear } = body;

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS financial_services (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        category VARCHAR(50) NOT NULL,
        levelId VARCHAR(36),
        classId VARCHAR(36),
        schoolYear VARCHAR(10),
        price DECIMAL(12,2) NOT NULL DEFAULT 0,
        isActive BOOLEAN NOT NULL DEFAULT true,
        metadata JSON,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await pool.execute(
      `INSERT INTO financial_services (id, name, category, levelId, classId, schoolYear, price, isActive, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), category=VALUES(category), levelId=VALUES(levelId), classId=VALUES(classId), schoolYear=VALUES(schoolYear), price=VALUES(price), isActive=VALUES(isActive), metadata=VALUES(metadata)`,
      [id, name, category, levelId || null, classId || null, schoolYear || null, price || 0, !!isActive, metadata ? JSON.stringify(metadata) : null]
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur POST financial_services:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'id requis' }, { status: 400 });
    await pool.execute('DELETE FROM financial_services WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur DELETE financial_services:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}



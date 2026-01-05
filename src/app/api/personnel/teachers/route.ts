import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../db/mysql-pool';

export async function GET(request: NextRequest) {
  try {
    // Récupérer les enseignants depuis la table personnel (aligné sur la section Personnel)
    const [teachers] = await pool.execute(`
      SELECT
        id,
        username,
        fullName,
        email,
        phone,
        role,
        photoUrl,
        createdAt
      FROM personnel
      WHERE role = 'Enseignant' OR type_personnel = 'Enseignant'
      ORDER BY fullName ASC
    `);

    return NextResponse.json({
      success: true,
      data: teachers
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des enseignants:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération des enseignants'
    }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../db/mysql-pool';

export async function GET() {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, `order`, isActive FROM school_levels ORDER BY `order`'
    );

    return NextResponse.json({
      success: true,
      levels: rows
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des niveaux:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération des niveaux'
    }, { status: 500 });
  }
}

// PUT - Mettre à jour le statut actif d'un niveau
export async function PUT(request: NextRequest) {
  try {
    const { levelId, isActive } = await request.json();
    
    if (!levelId || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'levelId et isActive sont requis' },
        { status: 400 }
      );
    }

    await pool.execute(`
      UPDATE school_levels 
      SET isActive = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [isActive, levelId]);

    return NextResponse.json({ 
      success: true, 
      message: `Niveau ${isActive ? 'activé' : 'désactivé'} avec succès` 
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du niveau:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour du niveau' },
      { status: 500 }
    );
  }
}

// POST - Mettre à jour plusieurs niveaux en même temps
export async function POST(request: NextRequest) {
  try {
    const { levels } = await request.json();
    
    if (!Array.isArray(levels)) {
      return NextResponse.json(
        { success: false, error: 'levels doit être un tableau' },
        { status: 400 }
      );
    }

    for (const level of levels) {
      if (level.id && typeof level.isActive === 'boolean') {
        await pool.execute(`
          UPDATE school_levels 
          SET isActive = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `, [level.isActive, level.id]);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `${levels.length} niveau(x) mis à jour avec succès` 
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des niveaux:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour des niveaux' },
      { status: 500 }
    );
  }
} 
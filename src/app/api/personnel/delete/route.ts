import { NextRequest, NextResponse } from 'next/server';
import pool from '@/db/mysql';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID du personnel requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const [existingUser] = await pool.query(
      'SELECT id, role FROM users WHERE id = ?',
      [id]
    ) as [any[], any];

    if (existingUser.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Personnel non trouvé' },
        { status: 404 }
      );
    }

    // Supprimer l'utilisateur
    await pool.query('DELETE FROM users WHERE id = ?', [id]);

    return NextResponse.json({ 
      success: true, 
      message: 'Membre du personnel supprimé avec succès' 
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du personnel:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression du personnel' },
      { status: 500 }
    );
  }
} 
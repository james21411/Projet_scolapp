import { NextRequest, NextResponse } from 'next/server';
import pool from '@/db/mysql';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [rows] = await pool.execute(`
      SELECT u.id, u.username, u.fullName, u.email, u.role, u.createdAt
      FROM users u
      WHERE u.id = ?
    `, [params.id]) as any[];

    if ((rows as any[]).length === 0) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    return NextResponse.json((rows as any[])[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'utilisateur' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { username, fullName, email, role } = body;

    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [params.id]
    ) as any[];

    if ((existing as any[]).length === 0) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    await pool.execute(`
      UPDATE users SET username = ?, fullName = ?, email = ?, role = ? WHERE id = ?
    `, [username, fullName, email, role, params.id]);

    return NextResponse.json({ success: true, message: 'Utilisateur mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'utilisateur' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [params.id]
    ) as any[];

    if ((existing as any[]).length === 0) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    await pool.execute('DELETE FROM users WHERE id = ?', [params.id]);

    return NextResponse.json({ success: true, message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'utilisateur' },
      { status: 500 }
    );
  }
}
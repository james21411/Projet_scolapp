import { NextRequest, NextResponse } from 'next/server';
import pool from '@/db/mysql';
import { cacheGetOrLoad, cacheInvalidate } from '@/lib/cache';
import { getCurrentDbName } from '@/db/mysql';

export async function GET() {
  try {
    const dbName = await getCurrentDbName();
    const rows = await cacheGetOrLoad(
      dbName,
      'school_levels',
      async () => {
        const [r] = await pool.execute(
          'SELECT id, name, `order`, isActive FROM school_levels ORDER BY `order`'
        );
        return (r as any[]).map(row => ({
          ...row,
          isActive: row.isActive === 1 || row.isActive === true,
        }));
      },
      'school_structure'
    );
    return NextResponse.json({ success: true, levels: rows });
  } catch (error) {
    console.error('Erreur lors de la récupération des niveaux:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors de la récupération des niveaux' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { levelId, isActive } = await request.json();
    if (!levelId || typeof isActive !== 'boolean') {
      return NextResponse.json({ success: false, error: 'levelId et isActive sont requis' }, { status: 400 });
    }
    await pool.execute(
      'UPDATE school_levels SET isActive = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [isActive, levelId]
    );
    const dbName = await getCurrentDbName();
    cacheInvalidate(dbName, 'school_levels');
    cacheInvalidate(dbName, 'school_structure');
    cacheInvalidate(dbName, 'school_structure_flat');
    cacheInvalidate(dbName, 'school_classes_list');
    return NextResponse.json({ success: true, message: `Niveau ${isActive ? 'activé' : 'désactivé'} avec succès` });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur lors de la mise à jour du niveau' }, { status: 500 });
  }
}

// POST - Créer un nouveau niveau OU mettre à jour en lot
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const dbName = await getCurrentDbName();
    if (Array.isArray(data.levels)) {
      // Bulk update
      for (const level of data.levels) {
        if (level.id && level.isActive !== undefined) {
          const isActiveValue = level.isActive === true || level.isActive === 1 || level.isActive === '1';
          let orderSql = '';
          const params: any[] = [isActiveValue];
          if (level.order !== undefined) {
            orderSql = ', `order` = ?';
            params.push(level.order);
          }
          if (level.name) {
            orderSql += ', name = ?';
            params.push(level.name);
          }
          params.push(level.id);

          await pool.execute(`
            UPDATE school_levels 
            SET isActive = ?, updated_at = CURRENT_TIMESTAMP ${orderSql}
            WHERE id = ?
          `, params);
        }
      }
      cacheInvalidate(dbName);
      return NextResponse.json({ success: true, message: `${data.levels.length} niveau(x) mis à jour avec succès` });
    } else {
      // Create new level
      const { name, order, isActive } = data;
      const newId = `lv-${Date.now()}`;
      await pool.execute(
        'INSERT INTO school_levels (id, name, `order`, isActive) VALUES (?, ?, ?, ?)',
        [newId, name, order || 99, isActive !== false]
      );
      cacheInvalidate(dbName);
      return NextResponse.json({ success: true, message: 'Niveau ajouté avec succès' });
    }
  } catch (error) {
    console.error('Erreur POST levels:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors de la modification des niveaux' }, { status: 500 });
  }
}

// DELETE - Supprimer un niveau
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: 'ID requis' }, { status: 400 });

    const [classes] = await pool.execute('SELECT id FROM school_classes WHERE levelId = ? LIMIT 1', [id]) as [any[], any];
    if (classes.length > 0) {
      return NextResponse.json({ success: false, error: 'Impossible: des classes sont liées à ce niveau' }, { status: 400 });
    }

    await pool.execute('DELETE FROM school_levels WHERE id = ?', [id]);
    const dbName = await getCurrentDbName();
    cacheInvalidate(dbName);

    return NextResponse.json({ success: true, message: 'Niveau supprimé' });
  } catch (error) {
    console.error('Erreur DELETE levels:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors de la suppression' }, { status: 500 });
  }
} 
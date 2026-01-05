import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../db/mysql-pool';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
        host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'scolapp'
    });

    const [rows] = await pool.execute(
      'SELECT * FROM roles WHERE id = ?',
      [params.id]
    );    if ((rows as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Rôle non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json((rows as any[])[0]);

  } catch (error) {
    console.error('Erreur lors de la récupération du rôle:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du rôle' },
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
    const { name, description, permissions, isActive } = body;

      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'scolapp'
    });

    // Vérifier si le rôle existe
    const [existing] = await pool.execute(
      'SELECT id FROM roles WHERE id = ?',
      [params.id]
    );

    if ((existing as any[]).length === 0) {      return NextResponse.json(
        { error: 'Rôle non trouvé' },
        { status: 404 }
      );
    }

    // Mettre à jour le rôle
    await pool.execute(`
      UPDATE roles 
      SET name = ?, description = ?, permissions = ?, isActive = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, description, JSON.stringify(permissions || []), isActive, params.id]);    return NextResponse.json({ 
      success: true, 
      message: 'Rôle mis à jour avec succès' 
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du rôle:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du rôle' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
        host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'scolapp'
    });

    // Vérifier si le rôle existe
    const [existing] = await pool.execute(
      'SELECT id FROM roles WHERE id = ?',
      [params.id]
    );

    if ((existing as any[]).length === 0) {      return NextResponse.json(
        { error: 'Rôle non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si des utilisateurs utilisent ce rôle
    const [usersWithRole] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE role = ?',
      [params.id]
    );

    if ((usersWithRole as any[])[0].count > 0) {      return NextResponse.json(
        { error: 'Impossible de supprimer ce rôle car des utilisateurs l\'utilisent' },
        { status: 400 }
      );
    }

    // Supprimer le rôle
    await pool.execute('DELETE FROM roles WHERE id = ?', [params.id]);    return NextResponse.json({ 
      success: true, 
      message: 'Rôle supprimé avec succès' 
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du rôle:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du rôle' },
      { status: 500 }
    );
  }
} 
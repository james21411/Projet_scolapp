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

            const [rows] = await pool.execute(`
          SELECT 
            u.id,
            u.username,
            u.fullName,
            u.email,
            u.role,
            u.createdAt
          FROM users u
          WHERE u.id = ?
        `, [params.id]);    if ((rows as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
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
    const { username, fullName, email, role, isActive, loginAttempts, lockedUntil } = body;

      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'scolapp'
    });

    // Vérifier si l'utilisateur existe
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [params.id]
    );

    if ((existing as any[]).length === 0) {      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

            // Mettre à jour l'utilisateur
        await pool.execute(`
          UPDATE users 
          SET username = ?, fullName = ?, email = ?, role = ?
          WHERE id = ?
        `, [username, fullName, email, role, params.id]);    return NextResponse.json({ 
      success: true, 
      message: 'Utilisateur mis à jour avec succès' 
    });

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
        host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'scolapp'
    });

    // Vérifier si l'utilisateur existe
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [params.id]
    );

    if ((existing as any[]).length === 0) {      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Supprimer l'utilisateur
    await pool.execute('DELETE FROM users WHERE id = ?', [params.id]);    return NextResponse.json({ 
      success: true, 
      message: 'Utilisateur supprimé avec succès' 
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'utilisateur' },
      { status: 500 }
    );
  }
} 
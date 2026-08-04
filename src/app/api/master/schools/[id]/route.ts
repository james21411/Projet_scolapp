import { NextRequest, NextResponse } from 'next/server';
import { registryPool } from '@/db/registry';
import mysql from 'mysql2/promise';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get the school first to find its db_name
    const [rows] = await registryPool.query('SELECT * FROM schools WHERE id = ?', [id]) as any[];
    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: 'École introuvable' }, { status: 404 });
    }

    const school = rows[0];

    // Delete the database (optional - safer to just deactivate)
    try {
      const conn = await mysql.createConnection({
        host: process.env.MYSQL_HOST || 'localhost',
        port: Number(process.env.MYSQL_PORT) || 3306,
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || 'Nuttertools2.0',
      });
      await conn.query(`DROP DATABASE IF EXISTS \`${school.db_name}\``);
      await conn.end();
    } catch (dbErr) {
      console.error('Erreur suppression DB:', dbErr);
      // Continue even if DB deletion fails - at least remove from registry
    }

    // Remove from registry
    await registryPool.query('DELETE FROM schools WHERE id = ?', [id]);

    return NextResponse.json({ success: true, message: 'École supprimée avec succès' });
  } catch (error: any) {
    console.error('API Delete School Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

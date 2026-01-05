import { NextRequest, NextResponse } from 'next/server';
import pool from '@/db/mysql';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  try {
    const body = await request.json().catch(() => ({}));
    const { startDate, endDate, isActive, name } = body || {};

    const fields: string[] = [];
    const values: any[] = [];
    if (typeof name === 'string') { fields.push('name = ?'); values.push(name); }
    if (typeof startDate !== 'undefined') { fields.push('startDate = ?'); values.push(startDate || null); }
    if (typeof endDate !== 'undefined') { fields.push('endDate = ?'); values.push(endDate || null); }
    if (typeof isActive !== 'undefined') { fields.push('isActive = ?'); values.push(!!isActive ? 1 : 0); }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 });
    }

    const sql = `UPDATE evaluation_periods SET ${fields.join(', ')}, updatedAt = NOW() WHERE id = ?`;
    values.push(id);
    await pool.query(sql, values);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erreur' }, { status: 500 });
  }
}



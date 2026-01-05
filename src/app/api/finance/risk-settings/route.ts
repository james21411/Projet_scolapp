import { NextRequest, NextResponse } from 'next/server';
import pool from '@/db/mysql';
import { logAction } from '@/services/auditLogService';

const ensureTable = async () => {
  await pool.query(`CREATE TABLE IF NOT EXISTS finance_risk_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    settings JSON NOT NULL,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);
};

export async function GET() {
  try {
    await ensureTable();
    const [rows] = await pool.query('SELECT settings FROM finance_risk_settings ORDER BY id DESC LIMIT 1');
    const list = rows as any[];
    if (Array.isArray(list) && list.length > 0) {
      return NextResponse.json(list[0].settings);
    }
    // Valeurs par défaut
    const defaults = {
      levels: [
        { name: 'Élevé', min: 0, max: 25, color: '#ef4444' },
        { name: 'Moyen', min: 25, max: 50, color: '#f59e0b' },
        { name: 'Modéré', min: 50, max: 75, color: '#3b82f6' },
        { name: 'Sain', min: 75, max: 100, color: '#10b981' }
      ]
    };
    return NextResponse.json(defaults);
  } catch (error) {
    console.error('GET /finance/risk-settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTable();
    const body = await request.json();
    // Validation simple
    if (!body || !Array.isArray(body.levels)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    await pool.query('INSERT INTO finance_risk_settings (settings) VALUES (?)', [JSON.stringify(body)]);
    await logAction({ action: 'settings_updated', details: `finance_risk_settings updated: ${JSON.stringify(body).slice(0, 500)}` });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /finance/risk-settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/db/mysql';

// Table: financial_transactions
// id, serviceId (nullable), serviceName, category, amount, quantity, totalAmount, date, schoolYear, cashier, notes, studentId (nullable)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolYear = searchParams.get('schoolYear');
    const category = searchParams.get('category');

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS financial_transactions (
        id VARCHAR(64) PRIMARY KEY,
        serviceId VARCHAR(64),
        serviceName VARCHAR(200),
        category VARCHAR(50) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        totalAmount DECIMAL(12,2) NOT NULL,
        date DATETIME NOT NULL,
        schoolYear VARCHAR(10) NOT NULL,
        cashier VARCHAR(100),
        notes TEXT,
        studentId VARCHAR(20),
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_year (schoolYear),
        INDEX idx_category (category),
        INDEX idx_date (date)
      )
    `);

    let query = 'SELECT * FROM financial_transactions WHERE 1=1';
    const params: any[] = [];
    if (schoolYear) { query += ' AND schoolYear = ?'; params.push(schoolYear); }
    if (category) { query += ' AND category = ?'; params.push(category); }
    query += ' ORDER BY date DESC LIMIT 1000';

    const [rows] = await pool.execute(query, params) as any;
    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error('Erreur GET financial_transactions:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, serviceId, serviceName, category, amount, quantity = 1, date, schoolYear, cashier, notes, studentId } = body;
    const totalAmount = Number(amount) * Number(quantity || 1);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS financial_transactions (
        id VARCHAR(64) PRIMARY KEY,
        serviceId VARCHAR(64),
        serviceName VARCHAR(200),
        category VARCHAR(50) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        totalAmount DECIMAL(12,2) NOT NULL,
        date DATETIME NOT NULL,
        schoolYear VARCHAR(10) NOT NULL,
        cashier VARCHAR(100),
        notes TEXT,
        studentId VARCHAR(20),
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await pool.execute(
      `INSERT INTO financial_transactions (id, serviceId, serviceName, category, amount, quantity, totalAmount, date, schoolYear, cashier, notes, studentId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, serviceId || null, serviceName || null, category, amount, quantity, totalAmount, date, schoolYear, cashier || null, notes || null, studentId || null]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur POST financial_transactions:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}



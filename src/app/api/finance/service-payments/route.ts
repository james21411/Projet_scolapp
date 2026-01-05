import { NextRequest, NextResponse } from 'next/server';
import pool from '@/db/mysql';

// Table: financial_service_payments
// id, studentId, schoolYear, serviceId, serviceName, amount, method, date, cashier, cashierUsername

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const schoolYear = searchParams.get('schoolYear');

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS financial_service_payments (
        id VARCHAR(64) PRIMARY KEY,
        studentId VARCHAR(32) NOT NULL,
        schoolYear VARCHAR(10) NOT NULL,
        serviceId VARCHAR(64) NOT NULL,
        serviceName VARCHAR(200) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        method VARCHAR(50) NOT NULL,
        date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        cashier VARCHAR(100),
        cashierUsername VARCHAR(100),
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_student_year (studentId, schoolYear)
      )
    `);

    let query = 'SELECT * FROM financial_service_payments WHERE 1=1';
    const params: any[] = [];
    if (studentId) { query += ' AND studentId = ?'; params.push(studentId); }
    if (schoolYear) { query += ' AND schoolYear = ?'; params.push(schoolYear); }
    query += ' ORDER BY date DESC';

    const [rows] = await pool.execute(query, params) as any;
    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error('Erreur GET financial_service_payments:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, studentId, schoolYear, serviceId, amount, method, cashier, cashierUsername } = body;

    if (!studentId || !schoolYear || !serviceId || !amount || !method) {
      return NextResponse.json({ success: false, error: 'Champs requis manquants' }, { status: 400 });
    }

    // Récupérer le nom du service
    const [services] = await pool.execute('SELECT name FROM financial_services WHERE id = ? LIMIT 1', [serviceId]) as any;
    const serviceName = services && services[0] ? services[0].name : 'Service';

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS financial_service_payments (
        id VARCHAR(64) PRIMARY KEY,
        studentId VARCHAR(32) NOT NULL,
        schoolYear VARCHAR(10) NOT NULL,
        serviceId VARCHAR(64) NOT NULL,
        serviceName VARCHAR(200) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        method VARCHAR(50) NOT NULL,
        date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        cashier VARCHAR(100),
        cashierUsername VARCHAR(100),
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const paymentId = id || crypto.randomUUID();
    await pool.execute(
      `INSERT INTO financial_service_payments (id, studentId, schoolYear, serviceId, serviceName, amount, method, cashier, cashierUsername)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [paymentId, studentId, schoolYear, serviceId, serviceName, Number(amount) || 0, method, cashier || null, cashierUsername || null]
    );

    const [createdRows] = await pool.execute('SELECT * FROM financial_service_payments WHERE id = ? LIMIT 1', [paymentId]) as any;
    return NextResponse.json(createdRows[0]);
  } catch (error: any) {
    console.error('Erreur POST financial_service_payments:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}




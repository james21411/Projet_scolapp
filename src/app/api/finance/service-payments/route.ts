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

    // S'assurer de la contrainte d'unicité (best-effort si la table existe déjà)
    try {
      await pool.execute('ALTER TABLE financial_service_payments ADD UNIQUE KEY uniq_student_service (studentId, schoolYear, serviceId)');
    } catch (e: any) {
      if (e.code !== 'ER_DUP_FIELDNAME' && e.code !== 'ER_DUP_KEYNAME') {
        // Les doublons existants peuvent empêcher l'ajout ; l'API bloque déjà les doublons au niveau applicatif.
      }
    }

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

    // Récupérer le nom et le prix du service
    const [services] = await pool.execute('SELECT name, price FROM financial_services WHERE id = ? LIMIT 1', [serviceId]) as any;
    if (!services || !services[0]) {
      return NextResponse.json({ success: false, error: 'Service introuvable' }, { status: 404 });
    }
    const serviceName = services[0].name;
    const servicePrice = Number(services[0].price) || 0;

    // Le montant doit être payé en une seule fois : strictement égal au prix du service
    const parsedAmount = Number(amount) || 0;
    if (servicePrice > 0 && Math.abs(parsedAmount - servicePrice) > 0.001) {
      return NextResponse.json({
        success: false,
        error: `Le montant doit être exactement égal au prix du service (${servicePrice.toLocaleString('fr-FR')} XAF)`
      }, { status: 400 });
    }

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
        UNIQUE KEY uniq_student_service (studentId, schoolYear, serviceId)
      )
    `);

    // Vérifier que l'élève n'a pas déjà payé ce service pour cette année scolaire
    const [existingRows] = await pool.execute(
      'SELECT id FROM financial_service_payments WHERE studentId = ? AND schoolYear = ? AND serviceId = ? LIMIT 1',
      [studentId, schoolYear, serviceId]
    ) as any;
    if (existingRows && existingRows[0]) {
      return NextResponse.json({
        success: false,
        error: 'Ce service a déjà été payé par cet élève pour cette année scolaire.'
      }, { status: 409 });
    }

    const paymentId = id || crypto.randomUUID();
    await pool.execute(
      `INSERT INTO financial_service_payments (id, studentId, schoolYear, serviceId, serviceName, amount, method, cashier, cashierUsername)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [paymentId, studentId, schoolYear, serviceId, serviceName, parsedAmount, method, cashier || null, cashierUsername || null]
    );

    const [createdRows] = await pool.execute('SELECT * FROM financial_service_payments WHERE id = ? LIMIT 1', [paymentId]) as any;
    return NextResponse.json(createdRows[0]);
  } catch (error: any) {
    console.error('Erreur POST financial_service_payments:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}




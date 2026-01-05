import pool from '../mysql';

export async function getAllPayments() {
  const [rows] = await pool.query('SELECT * FROM payments');
  return rows;
}

export async function getPaymentById(id: string) {
  const [rows] = await pool.query('SELECT * FROM payments WHERE id = ?', [id]);
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

function toMySQLDateTime(date: string | Date) {
  const d = new Date(date);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

export async function addPayment(payment: {
  id: string;
  studentId: string;
  schoolYear: string;
  amount: number;
  date?: string;
  method: string;
  reason?: string;
  cashier: string;
  cashierUsername: string;
  installmentsPaid?: any;
}) {
  const sql = `INSERT INTO payments (id, studentId, schoolYear, amount, date, method, reason, cashier, cashierUsername, installmentsPaid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    payment.id,
    payment.studentId,
    payment.schoolYear,
    payment.amount,
    payment.date ? toMySQLDateTime(payment.date) : null,
    payment.method,
    payment.reason || null,
    payment.cashier,
    payment.cashierUsername,
    payment.installmentsPaid ? JSON.stringify(payment.installmentsPaid) : null
  ];
  await pool.query(sql, params);
}

export async function updatePayment(paymentId: string, updatedFields: Partial<{
  amount: number;
  date: string;
  method: string;
  reason?: string;
  cashier: string;
  cashierUsername: string;
  installmentsPaid?: any;
}>) {
  const fields = Object.keys(updatedFields);
  if (fields.length === 0) return;
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const params = fields.map(f => {
    if (f === 'installmentsPaid') {
      return JSON.stringify((updatedFields as any)[f]);
    }
    if (f === 'date') {
      const v = (updatedFields as any)[f];
      return v ? toMySQLDateTime(v) : null;
    }
    return (updatedFields as any)[f];
  });
  params.push(paymentId);
  const sql = `UPDATE payments SET ${setClause} WHERE id = ?`;
  await pool.query(sql, params);
} 
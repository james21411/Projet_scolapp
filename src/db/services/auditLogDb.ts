import pool from '../mysql';

export async function addAuditLog(log: {
  id: string;
  timestamp: string;
  action: string;
  userId?: string;
  username?: string;
  details: string;
}) {
  // Formater le timestamp pour MySQL
  const formattedTimestamp = log.timestamp.includes('T') 
    ? log.timestamp.slice(0, 19).replace('T', ' ')
    : log.timestamp;
    
  const sql = `INSERT INTO audit_logs (id, timestamp, action, userId, username, details) VALUES (?, ?, ?, ?, ?, ?)`;
  const params = [log.id, formattedTimestamp, log.action, log.userId || null, log.username || null, log.details];
  await pool.query(sql, params);
}

export async function getAuditLogs(limit = 100): Promise<any[]> {
  const [rows] = await pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?', [limit]);
  return rows as any[];
}

export async function deleteOldAuditLogs(keep = 5000) {
  await pool.query('DELETE FROM audit_logs WHERE id NOT IN (SELECT id FROM (SELECT id FROM audit_logs ORDER BY timestamp DESC LIMIT ?) as t)', [keep]);
} 
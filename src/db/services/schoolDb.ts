import pool from '../mysql';
import type { SchoolInfo } from '../../services/schoolInfoService';

export async function getSchoolInfo(): Promise<SchoolInfo | null> {
  try {
    const [rows] = await pool.query('SELECT * FROM school_info LIMIT 1') as any[];
    if (rows.length > 0) {
      return rows[0] as SchoolInfo;
    }
    return null;
  } catch (error) {
    console.warn('Erreur lors de la récupération des informations de l\'école depuis la base de données:', error);
    return null;
  }
}

export async function updateSchoolInfo(data: SchoolInfo): Promise<void> {
  const sql = `UPDATE school_info SET name=?, slogan=?, address=?, phone=?, email=?, bp=?, logoUrl=?, currentSchoolYear=?, currency=? WHERE id=1`;
  const params = [data.name, data.slogan, data.address, data.phone, data.email, data.bp, data.logoUrl, data.currentSchoolYear, data.currency];
  await pool.query(sql, params);
}

export async function createSchoolInfo(data: SchoolInfo): Promise<void> {
  const sql = `INSERT INTO school_info (name, slogan, address, phone, email, bp, logoUrl, currentSchoolYear, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [data.name, data.slogan, data.address, data.phone, data.email, data.bp, data.logoUrl, data.currentSchoolYear, data.currency];
  await pool.query(sql, params);
}

export async function deleteSchoolInfo(): Promise<void> {
  await pool.query('DELETE FROM school_info');
}

export async function resetSchoolInfo(): Promise<void> {
  await pool.query('DELETE FROM school_info');
  const sql = `INSERT INTO school_info (name, slogan, address, phone, email, bp, logoUrl, currentSchoolYear, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    'ScolApp Visuel Academy',
    "L'excellence à votre portée",
    'Yaoundé, Cameroun',
    '(+237) 699 99 99 99',
    'contact@scolapp.com',
    '1234',
    null,
    `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    'XAF',
  ];
  await pool.query(sql, params);
} 
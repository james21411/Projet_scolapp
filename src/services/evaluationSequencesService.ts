'use server';

import pool from '@/db/mysql';

export interface EvaluationPeriodRow {
  id: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  schoolYear: string;
  isActive?: number | boolean;
}

export async function getSequencesForYear(year: string): Promise<EvaluationPeriodRow[]> {
  const [rows] = await pool.query(
    `SELECT id, name, startDate, endDate, schoolYear, isActive
     FROM evaluation_periods
     WHERE schoolYear = ? AND (id LIKE 'seq%-%' OR LOWER(name) LIKE '%séquence%' OR LOWER(name) LIKE '%sequence%')
     ORDER BY id`,
    [year]
  ) as any[];
  return rows as EvaluationPeriodRow[];
}

export async function createDefaultSequencesForYear(targetYear: string): Promise<{ inserted: number; message: string }> {
  // Génère 6 séquences avec des dates par défaut, requises par le schéma
  const m = targetYear.match(/^(\d{4})-(\d{4})$/);
  const y1 = m ? parseInt(m[1], 10) : new Date().getFullYear();
  const y2 = m ? parseInt(m[2], 10) : y1 + 1;

  const seqDefs = [
    { id: `seq1-${targetYear}`, name: '1ère Séquence', start: `${y1}-09-01`, end: `${y1}-10-15` },
    { id: `seq2-${targetYear}`, name: '2ème Séquence', start: `${y1}-10-16`, end: `${y1}-12-15` },
    { id: `seq3-${targetYear}`, name: '3ème Séquence', start: `${y1}-12-16`, end: `${y2}-02-15` },
    { id: `seq4-${targetYear}`, name: '4ème Séquence', start: `${y2}-02-16`, end: `${y2}-04-15` },
    { id: `seq5-${targetYear}`, name: '5ème Séquence', start: `${y2}-04-16`, end: `${y2}-06-15` },
    { id: `seq6-${targetYear}`, name: '6ème Séquence', start: `${y2}-06-16`, end: `${y2}-07-31` },
  ];

  let inserted = 0;
  for (const s of seqDefs) {
    const [exists] = await pool.query('SELECT id FROM evaluation_periods WHERE id = ? LIMIT 1', [s.id]) as any[];
    if (exists.length === 0) {
      await pool.query(
        `INSERT INTO evaluation_periods (id, name, startDate, endDate, schoolYear, isActive)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [s.id, s.name, s.start, s.end, targetYear]
      );
      inserted++;
    }
  }
  return { inserted, message: `Séquences créées: ${inserted}` };
}

export async function reconductSequences(previousYear: string, targetYear: string): Promise<{ inserted: number; updated: number; message: string }> {
  // Récupérer les séquences source
  const source = await getSequencesForYear(previousYear);
  let inserted = 0;
  let updated = 0;

  for (const seq of source) {
    // Calculer le nouvel ID en remplaçant l'année suffixe si forme seqN-YYYY-YYYY
    let newId = seq.id;
    const match = seq.id.match(/^seq(\d+)-\d{4}-\d{4}$/);
    if (match) {
      newId = `seq${match[1]}-${targetYear}`;
    } else if (seq.id.startsWith('seq')) {
      // fallback generique
      const num = seq.id.replace(/[^0-9]/g, '') || '1';
      newId = `seq${num}-${targetYear}`;
    }

    const [exists] = await pool.query('SELECT id FROM evaluation_periods WHERE id = ? LIMIT 1', [newId]) as any[];
    if (exists.length === 0) {
      await pool.query(
        `INSERT INTO evaluation_periods (id, name, startDate, endDate, schoolYear, isActive)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [newId, seq.name, seq.startDate || null, seq.endDate || null, targetYear, 1]
      );
      inserted++;
    } else {
      await pool.query(
        `UPDATE evaluation_periods
         SET name = ?, startDate = ?, endDate = ?, isActive = 1, schoolYear = ?
         WHERE id = ?`,
        [seq.name, seq.startDate || null, seq.endDate || null, targetYear, newId]
      );
      updated++;
    }
  }

  return { inserted, updated, message: `Séquences reconduites: ${inserted} insérées, ${updated} mises à jour` };
}



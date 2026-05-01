'use server';

import pool from '@/db/mysql';

export interface EvaluationPeriodRow {
  id: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  schoolYear: string;
  isActive?: number | boolean;
  type?: string;
  order?: number;
}

export async function getSequencesForYear(year: string): Promise<EvaluationPeriodRow[]> {
  const [rows] = await pool.query(
    `SELECT id, name, type, startDate, endDate, schoolYear, isActive, \`order\`
     FROM evaluation_periods
     WHERE schoolYear = ?
     ORDER BY \`order\` ASC, startDate ASC`,
    [year]
  ) as any[];
  return rows as EvaluationPeriodRow[];
}

export async function createDefaultSequencesForYear(targetYear: string): Promise<{ inserted: number; message: string }> {
  // Génère 6 séquences et 3 trimestres avec des dates par défaut
  const m = targetYear.match(/^(\d{4})-(\d{4})$/);
  const y1 = m ? parseInt(m[1], 10) : new Date().getFullYear();
  const y2 = m ? parseInt(m[2], 10) : y1 + 1;

  const seqDefs = [
    { id: `seq1-${targetYear}`, name: '1ère Séquence', type: 'sequence', order: 1, start: `${y1}-09-01`, end: `${y1}-10-15` },
    { id: `seq2-${targetYear}`, name: '2ème Séquence', type: 'sequence', order: 2, start: `${y1}-10-16`, end: `${y1}-11-30` },
    { id: `trim1-${targetYear}`, name: '1er Trimestre', type: 'trimestre', order: 3, start: `${y1}-09-01`, end: `${y1}-11-30` },
    { id: `seq3-${targetYear}`, name: '3ème Séquence', type: 'sequence', order: 4, start: `${y1}-12-01`, end: `${y2}-01-31` },
    { id: `seq4-${targetYear}`, name: '4ème Séquence', type: 'sequence', order: 5, start: `${y2}-02-01`, end: `${y2}-03-15` },
    { id: `trim2-${targetYear}`, name: '2ème Trimestre', type: 'trimestre', order: 6, start: `${y1}-12-01`, end: `${y2}-03-15` },
    { id: `seq5-${targetYear}`, name: '5ème Séquence', type: 'sequence', order: 7, start: `${y2}-03-16`, end: `${y2}-05-15` },
    { id: `seq6-${targetYear}`, name: '6ème Séquence', type: 'sequence', order: 8, start: `${y2}-05-16`, end: `${y2}-06-30` },
    { id: `trim3-${targetYear}`, name: '3ème Trimestre', type: 'trimestre', order: 9, start: `${y2}-03-16`, end: `${y2}-06-30` },
  ];

  let inserted = 0;
  for (const s of seqDefs) {
    const [exists] = await pool.query('SELECT id FROM evaluation_periods WHERE id = ? LIMIT 1', [s.id]) as any[];
    if (exists.length === 0) {
      await pool.query(
        `INSERT INTO evaluation_periods (id, name, type, startDate, endDate, schoolYear, isActive, \`order\`)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
        [s.id, s.name, s.type, s.start, s.end, targetYear, s.order]
      );
      inserted++;
    }
  }
  return { inserted, message: `Périodes créées: ${inserted}` };
}

export async function reconductSequences(previousYear: string, targetYear: string): Promise<{ inserted: number; updated: number; message: string }> {
  // Récupérer les périodes source
  const source = await getSequencesForYear(previousYear);
  let inserted = 0;
  let updated = 0;

  for (const seq of source) {
    // Calculer le nouvel ID
    let newId = seq.id;
    const match = seq.id.match(/^(seq\d+|trim\d+)-\d{4}-\d{4}$/);
    if (match) {
      newId = `${match[1]}-${targetYear}`;
    }

    const [exists] = await pool.query('SELECT id FROM evaluation_periods WHERE id = ? LIMIT 1', [newId]) as any[];
    if (exists.length === 0) {
      await pool.query(
        `INSERT INTO evaluation_periods (id, name, type, startDate, endDate, schoolYear, isActive, \`order\`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [newId, seq.name, seq.type || 'sequence', seq.startDate || null, seq.endDate || null, targetYear, 1, seq.order || 1]
      );
      inserted++;
    } else {
      await pool.query(
        `UPDATE evaluation_periods
         SET name = ?, type = ?, startDate = ?, endDate = ?, isActive = 1, schoolYear = ?, \`order\` = ?
         WHERE id = ?`,
        [seq.name, seq.type || 'sequence', seq.startDate || null, seq.endDate || null, targetYear, seq.order || 1, newId]
      );
      updated++;
    }
  }

  return { inserted, updated, message: `Périodes reconduites: ${inserted} insérées, ${updated} mises à jour` };
}



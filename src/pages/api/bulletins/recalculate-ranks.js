import { getPoolFromRequest } from '@/lib/pool-from-request';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const pool = await getPoolFromRequest(req, res);
        const { classId, evaluationPeriodId, schoolYear } = req.body;

        if (!classId || !evaluationPeriodId || !schoolYear) {
            return res.status(400).json({ error: 'Paramètres manquants' });
        }

        console.log('🏆 === RECALCUL DES RANGS GÉNÉRAUX ===');
        console.log(`Classe: ${classId}, Période: ${evaluationPeriodId}, Année: ${schoolYear}`);

        const connection = pool;

        // 1. Récupérer tous les élèves de la classe
        const [students] = await connection.query(`
      SELECT id, nom, prenom FROM students WHERE classe = ?
    `, [classId]);

        if (students.length === 0) {
            return res.status(200).json({ message: 'Aucun élève dans cette classe', results: [] });
        }

        // 2. Récupérer les notes pour chaque élève dans cette période
        const studentAverages = [];

        for (const student of students) {
            const [grades] = await connection.query(`
        SELECT score, maxScore, coefficient 
        FROM grades 
        WHERE studentId = ? AND evaluationPeriodId = ? AND schoolYear = ?
      `, [student.id, evaluationPeriodId, schoolYear]);

            if (grades.length > 0) {
                let totalWeighted = 0;
                let totalCoef = 0;

                grades.forEach(g => {
                    const coef = parseFloat(g.coefficient) || 1;
                    const score = parseFloat(g.score) || 0;
                    const maxScore = parseFloat(g.maxScore) || 20;
                    const normalized = maxScore > 0 ? (score / maxScore) * 20 : score;

                    totalWeighted += normalized * coef;
                    totalCoef += coef;
                });

                const average = totalCoef > 0 ? totalWeighted / totalCoef : 0;
                studentAverages.push({
                    studentId: student.id,
                    average: average
                });
            }
        }

        // 3. Calculer les rangs
        const sorted = [...studentAverages].sort((a, b) => b.average - a.average);
        const totalStudents = sorted.length;

        const results = [];
        for (let i = 0; i < sorted.length; i++) {
            const s = sorted[i];
            const rank = i + 1;

            // Vérifier si un bulletin existe
            const [existing] = await connection.query(`
        SELECT id FROM report_cards 
        WHERE studentId = ? AND evaluationPeriodId = ? AND schoolYear = ?
      `, [s.studentId, evaluationPeriodId, schoolYear]);

            if (existing.length > 0) {
                await connection.query(`
          UPDATE report_cards SET \`rank\` = ?, totalStudents = ?, averageScore = ?
          WHERE id = ?
        `, [rank, totalStudents, s.average, existing[0].id]);
            } else {
                const id = `rc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                await connection.query(`
          INSERT INTO report_cards (id, studentId, classId, evaluationPeriodId, schoolYear, \`rank\`, totalStudents, averageScore, mention)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [id, s.studentId, classId, evaluationPeriodId, schoolYear, rank, totalStudents, s.average, 'N/A']);
            }

            results.push({ studentId: s.studentId, rank, average: s.average });
        }

        console.log(`✅ Recalcul terminé pour ${results.length} élèves.`);

        return res.status(200).json({
            success: true,
            successCount: results.length,
            totalStudents: totalStudents,
            results
        });

    } catch (error) {
        console.error('❌ Erreur recalcul rangs:', error);
        return res.status(500).json({ error: error.message });
    }
}

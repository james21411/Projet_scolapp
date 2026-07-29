import { getPoolForDb } from '@/db/mysql';
import { registryPool, type School } from '@/db/registry';

export interface RegisteredSchool extends School {
    status: 'active' | 'inactive';
    studentCount?: number;
    revenueTotal?: number;
}

export async function getAllRegisteredSchools(): Promise<RegisteredSchool[]> {
    try {
        const [schools] = await registryPool.query('SELECT * FROM schools ORDER BY created_at DESC') as any[];

        // Enrichir avec des stats basiques pour chaque école
        const enrichedSchools = await Promise.all(schools.map(async (school: any) => {
            try {
                const schoolPool = getPoolForDb(school.db_name);

                // Nombre d'élèves
                const [studentRows] = await schoolPool.query('SELECT COUNT(*) as count FROM students WHERE status = "Actif"') as any[];
                const studentCount = studentRows[0]?.count || 0;

                // Revenu total (Scolarité + Transactions)
                const [paymentRows] = await schoolPool.query('SELECT SUM(amount) as total FROM payments') as any[];
                const [transRows] = await schoolPool.query('SELECT SUM(amount) as total FROM financial_transactions') as any[];

                const revenueTotal = (Number(paymentRows[0]?.total) || 0) + (Number(transRows[0]?.total) || 0);

                return {
                    ...school,
                    status: school.is_active ? 'active' : 'inactive',
                    studentCount,
                    revenueTotal
                };
            } catch (error) {
                return {
                    ...school,
                    status: school.is_active ? 'active' : 'inactive',
                    studentCount: 0,
                    revenueTotal: 0
                };
            }
        }));

        return enrichedSchools;
    } catch (error) {
        console.error('Erreur getAllRegisteredSchools:', error);
        return [];
    }
}

export async function updateSchoolStatus(id: string, is_active: boolean): Promise<void> {
    await registryPool.query('UPDATE schools SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, id]);
}

import { getPoolForDb } from '@/db/mysql';
import { registryPool, type School } from '@/db/registry';

export interface RegisteredSchool extends School {
    status: 'active' | 'inactive';
    studentCount?: number;
    revenueTotal?: number;
    teacherCount?: number;
    classCount?: number;
    approval_status?: 'pending' | 'approved' | 'rejected';
    subscription_expires_at?: string | null;
    max_students?: number;
    payment_proof_url?: string | null;
    payment_phone?: string | null;
    payment_account_name?: string | null;
}

// Plan limits
export const PLAN_LIMITS: Record<string, { maxStudents: number; maxTeachers: number; price: number }> = {
    starter: { maxStudents: 100, maxTeachers: 5, price: 50000 },
    pro: { maxStudents: 500, maxTeachers: 20, price: 150000 },
    enterprise: { maxStudents: 9999, maxTeachers: 999, price: 300000 },
};

export const ORANGE_MONEY_PAYMENT = {
    phone: '698 38 51 85',
    accountName: 'NSOUNJOU TOUNSIE DUKRAM',
};

export async function getAllRegisteredSchools(): Promise<RegisteredSchool[]> {
    try {
        const [schools] = await registryPool.query('SELECT * FROM schools ORDER BY created_at DESC') as any[];

        const enrichedSchools = await Promise.all(schools.map(async (school: any) => {
            try {
                const schoolPool = getPoolForDb(school.db_name);

                // Student count - try multiple approaches
                let studentCount = 0;
                try {
                    const [studentRows] = await schoolPool.query("SELECT COUNT(*) as count FROM students") as any[];
                    studentCount = studentRows[0]?.count || 0;
                } catch (error) {
                    console.error(`Erreur compteur élèves ${school.name}:`, error);
                }

                // Revenue - try payments table
                let revenueTotal = 0;
                try {
                    const [paymentRows] = await schoolPool.query('SELECT SUM(amount) as total FROM payments') as any[];
                    revenueTotal = Number(paymentRows[0]?.total) || 0;
                } catch { /* ignore */ }

                // Teacher count
                let teacherCount = 0;
                try {
                    const [teacherRows] = await schoolPool.query('SELECT COUNT(*) as count FROM personnel WHERE role = "Enseignant"') as any[];
                    teacherCount = teacherRows[0]?.count || 0;
                } catch {
                    try {
                        const [teacherRows2] = await schoolPool.query('SELECT COUNT(*) as count FROM personnel') as any[];
                        teacherCount = teacherRows2[0]?.count || 0;
                    } catch { /* ignore */ }
                }

                // Class count
                let classCount = 0;
                try {
                    const [classRows] = await schoolPool.query('SELECT COUNT(*) as count FROM school_classes') as any[];
                    classCount = classRows[0]?.count || 0;
                } catch { /* ignore */ }

                return {
                    ...school,
                    status: school.is_active ? 'active' : 'inactive',
                    studentCount,
                    revenueTotal,
                    teacherCount,
                    classCount,
                    approval_status: school.approval_status || 'approved',
                    subscription_expires_at: school.subscription_expires_at || null,
                    max_students: school.max_students || PLAN_LIMITS[school.plan]?.maxStudents || 100,
                };
            } catch (error) {
                console.error(`Erreur stats école ${school.name}:`, error);
                return {
                    ...school,
                    status: school.is_active ? 'active' : 'inactive',
                    studentCount: 0,
                    revenueTotal: 0,
                    teacherCount: 0,
                    classCount: 0,
                    approval_status: school.approval_status || 'approved',
                    subscription_expires_at: school.subscription_expires_at || null,
                    max_students: school.max_students || PLAN_LIMITS[school.plan]?.maxStudents || 100,
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

export async function updateSchoolApproval(id: string, approval_status: string): Promise<void> {
    if (approval_status === 'approved') {
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        await registryPool.query(
            'UPDATE schools SET approval_status = ?, subscription_expires_at = ?, is_active = 1 WHERE id = ?',
            [approval_status, expiresAt.toISOString().split('T')[0], id]
        );
        return;
    }
    await registryPool.query(
        'UPDATE schools SET approval_status = ?, is_active = 0 WHERE id = ?',
        [approval_status, id]
    );
}

export async function updateSchoolPlan(id: string, plan: string, maxStudents?: number): Promise<void> {
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.starter;
    const max = maxStudents || limits.maxStudents;
    await registryPool.query('UPDATE schools SET plan = ?, max_students = ? WHERE id = ?', [plan, max, id]);
}

export async function renewSubscription(id: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    await registryPool.query('UPDATE schools SET subscription_expires_at = ?, is_active = 1 WHERE id = ?', [expiresAt.toISOString().split('T')[0], id]);
}

export async function suspendSubscription(id: string): Promise<void> {
    await registryPool.query('UPDATE schools SET is_active = 0 WHERE id = ?', [id]);
}

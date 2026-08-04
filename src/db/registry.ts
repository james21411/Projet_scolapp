import mysql from 'mysql2/promise';

// Pool dédié à la base de données centrale (registry)
const registryPool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'Nuttertools2.0',
    database: process.env.REGISTRY_DB || 'scolapp_registry',
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4',
});

export interface School {
    id: string;
    slug: string;
    name: string;
    db_name: string;
    domain?: string | null;
    admin_email: string;
    admin_name: string;
    phone?: string;
    address?: string;
    logo_url?: string;
    plan: 'starter' | 'pro' | 'enterprise';
    is_active: boolean;
    created_at: string;
}

export function normalizeHost(host?: string | null): string {
    return (host || '')
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .split('/')[0]
        .split(':')[0]
        .trim();
}

export function getSlugFromHost(host?: string | null): string | null {
    const normalized = normalizeHost(host);
    if (!normalized || normalized === 'localhost' || normalized === '127.0.0.1') return null;
    const parts = normalized.split('.');
    if (parts.length < 3) return null;
    const subdomain = parts[0];
    if (!subdomain || subdomain === 'www') return null;
    return subdomain;
}

// Récupérer une école par son slug
export async function getSchoolBySlug(slug: string): Promise<School | null> {
    try {
        const [rows] = await registryPool.query(
            'SELECT * FROM schools WHERE (slug = ? OR name = ?) AND is_active = 1',
            [slug, slug]
        ) as any[];
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error('Erreur registry getSchoolBySlug:', error);
        return null;
    }
}

// Récupérer une école par domaine exact, avec fallback sur le sous-domaine comme slug.
export async function getSchoolByHost(host: string): Promise<School | null> {
    const normalizedHost = normalizeHost(host);
    if (!normalizedHost) return null;

    try {
        const [rows] = await registryPool.query(
            'SELECT * FROM schools WHERE domain = ? AND is_active = 1',
            [normalizedHost]
        ) as any[];
        if (rows.length > 0) return rows[0];
    } catch (error: any) {
        // Anciennes installations: la colonne domain peut ne pas encore exister.
        if (!String(error?.message || '').includes('Unknown column')) {
            console.error('Erreur registry getSchoolByHost:', error);
        }
    }

    const slug = getSlugFromHost(normalizedHost);
    return slug ? getSchoolBySlug(slug) : null;
}

// Récupérer une école par son email admin
export async function getSchoolByEmail(email: string): Promise<School | null> {
    try {
        const [rows] = await registryPool.query(
            'SELECT * FROM schools WHERE admin_email = ?',
            [email]
        ) as any[];
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error('Erreur registry getSchoolByEmail:', error);
        return null;
    }
}

// Vérifier si un slug est disponible
export async function isSlugAvailable(slug: string): Promise<boolean> {
    try {
        const [rows] = await registryPool.query(
            'SELECT id FROM schools WHERE slug = ?',
            [slug]
        ) as any[];
        return (rows as any[]).length === 0;
    } catch {
        return false;
    }
}

// Enregistrer une nouvelle école dans le registry
export async function registerSchool(school: Omit<School, 'id' | 'created_at' | 'is_active'>): Promise<School> {
    const id = generateUUID();
    try {
        await registryPool.query(
            `INSERT INTO schools (id, slug, name, db_name, domain, admin_email, admin_name, phone, address, logo_url, plan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, school.slug, school.name, school.db_name, school.domain || null, school.admin_email, school.admin_name,
                school.phone || null, school.address || null, school.logo_url || null, school.plan]
        );
    } catch (error: any) {
        if (!String(error?.message || '').includes('Unknown column')) throw error;

        await registryPool.query(
            `INSERT INTO schools (id, slug, name, db_name, admin_email, admin_name, phone, address, logo_url, plan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, school.slug, school.name, school.db_name, school.admin_email, school.admin_name,
                school.phone || null, school.address || null, school.logo_url || null, school.plan]
        );
    }
    const created = await getSchoolBySlug(school.slug);
    return created!;
}

// Lister toutes les écoles (pour un panneau superadmin futur)
export async function getAllSchools(): Promise<School[]> {
    const [rows] = await registryPool.query('SELECT * FROM schools ORDER BY created_at DESC') as any[];
    return rows as School[];
}

// Générer un UUID simple
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export { registryPool };
export default registryPool;

import mysql from 'mysql2/promise';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, type SessionData } from '@/lib/session';

// Cache des pools par nom de base de données
const poolCache = new Map<string, mysql.Pool>();

// Créer ou récupérer un pool pour une DB donnée
export function getPoolForDb(dbName: string): mysql.Pool {
    if (poolCache.has(dbName)) {
        return poolCache.get(dbName)!;
    }

    const pool = mysql.createPool({
        host: process.env.MYSQL_HOST || 'localhost',
        port: Number(process.env.MYSQL_PORT) || 3306,
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || 'Nuttertools2.0',
        database: dbName,
        waitForConnections: true,
        connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT) || 20,
        queueLimit: 10,
        multipleStatements: true,
        dateStrings: true,
        charset: 'utf8mb4',
        connectTimeout: 60000,
    });

    poolCache.set(dbName, pool);
    console.log(`✅ Pool créé pour la DB: ${dbName}`);
    return pool;
}

// Déterminer la DB de manière dynamique (selon la session ou processus)
export async function getCurrentDbName(): Promise<string> {
    try {
        const cookieStore = await cookies();
        const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
        if (session && session.dbName) {
            return session.dbName;
        }
        console.log("⚠️ getCurrentDbName: session.dbName est vide, retour au default");
        return process.env.MYSQL_DATABASE || 'scolapp';
    } catch (error) {
        console.error("⚠️ getCurrentDbName Error:", error);
        return process.env.MYSQL_DATABASE || 'scolapp';
    }
}

// Fonction pour obtenir manuellement un pool
export async function getDynamicPool(): Promise<mysql.Pool> {
    const dbName = await getCurrentDbName();
    return getPoolForDb(dbName);
}

// Proxy pour intercepter toutes les requêtes pool et router vers la bonne DB
const poolProxyHandler: ProxyHandler<any> = {
    get(target, prop, receiver) {
        // Pour les propriétés synchrones (comme config, etc.), on retourne la valeur du pool par défaut
        if (prop === 'config' || prop === 'threadId') {
            return getPoolForDb(process.env.MYSQL_DATABASE || 'scolapp')[prop as keyof mysql.Pool];
        }

        // Pour les méthodes, on retourne une fonction asynchrone qui redirige vers le bon pool
        if (typeof prop === 'string' && ['query', 'execute', 'getConnection', 'end', 'format'].includes(prop)) {
            return async (...args: any[]) => {
                const dbName = await getCurrentDbName();
                const pool = getPoolForDb(dbName);
                const method = pool[prop as keyof mysql.Pool];
                if (typeof method === 'function') {
                    return (method as Function).apply(pool, args);
                }
            };
        }

        // Par défaut
        return Reflect.get(getPoolForDb(process.env.MYSQL_DATABASE || 'scolapp'), prop, receiver);
    }
};

// Exporter le proxy comme si c'était le pool par défaut
const pool = new Proxy({}, poolProxyHandler) as mysql.Pool;

export default pool;

// Tester la connexion (du pool actuel)
export const testConnection = async () => {
    try {
        const conn = await pool.getConnection();
        await conn.ping();
        conn.release();
        return true;
    } catch (error) {
        console.error('Erreur de connexion:', error);
        return false;
    }
};

export const getActiveConnections = async () => {
    return 0; // fallback technique
};

export const checkAndResetConnections = async () => {
    return false;
};

export const cleanupConnections = async () => {
    await pool.end();
};

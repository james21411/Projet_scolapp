import mysql from 'mysql2/promise';
import { cookies, headers } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, type SessionData } from '@/lib/session';
import { getSchoolByHost } from './registry';

// Cache des pools par nom de base de données persisté entre les rechargements HMR en développement
const poolCache: Map<string, mysql.Pool> = (global as any)._mysqlPoolCache || new Map<string, mysql.Pool>();
if (process.env.NODE_ENV !== 'production') {
    (global as any)._mysqlPoolCache = poolCache;
}

// Créer ou récupérer un pool pour une DB donnée
export function getPoolForDb(dbName: string): mysql.Pool {
    // Empêcher l'accumulation excessive de pools (Max 80)
    if (poolCache.size >= 80) {
        console.log(`⚠️ Alerte: Nombre de pools (${poolCache.size}) élevé. Nettoyage en cours...`);
        // Fermer les anciens pools en arrière-plan pour libérer les connexions MySQL
        poolCache.forEach((p, name) => {
            p.end().catch(err => console.error(`Erreur fermeture pool ${name}:`, err));
        });
        poolCache.clear();
        console.log("♻️ Cache des pools réinitialisé.");
    }

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
        // Limiter à 5 connexions par tenant pour éviter le "Too many connections"
        // Avec 10 tenants, ça donne un max de 50 connexions simultanees
        connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT) || 5,
        // File d'attente illimitée pour absorber les pics
        queueLimit: 0,
        // Recycler les connexions inactives après 60s pour libérer des slots
        idleTimeout: 60000,
        multipleStatements: true,
        dateStrings: true,
        charset: 'utf8mb4',
        connectTimeout: 30000,
        // KeepAlive pour éviter les connexions zombies
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
    });

    poolCache.set(dbName, pool);
    console.log(`✅ Pool créé pour la DB: ${dbName}`);
    return pool;
}

// Déterminer la DB de manière dynamique (selon la session ou processus)
export async function getCurrentDbName(): Promise<string> {
    const defaultDb = process.env.MYSQL_DATABASE || 'scolapp';
    try {
        // cookies() n'est disponible que dans l'App Router.
        // Dans les Pages API routes, cette appel lève une erreur Invariant.
        // On la détecte silencieusement et on retourne la DB par défaut.
        const cookieStore = await cookies();
        const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
        if (session && session.dbName) {
            return session.dbName;
        }

        const headerStore = await headers();
        const host = headerStore.get('x-forwarded-host') || headerStore.get('host');
        if (host) {
            const school = await getSchoolByHost(host);
            if (school?.db_name) {
                return school.db_name;
            }
        }

        return defaultDb;
    } catch (error: any) {
        // Erreur silencieuse pour les Pages Router API routes
        if (
            error?.message?.includes('requestAsyncStorage') ||
            error?.message?.includes('cookies()') ||
            error?.message?.includes('Invariant')
        ) {
            return defaultDb;
        }
        console.error("⚠️ getCurrentDbName Error:", error);
        return defaultDb;
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

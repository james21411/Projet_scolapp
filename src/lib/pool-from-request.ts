/**
 * Utilitaire pour les routes Pages API (/pages/api/**)
 * Lit la session iron-session depuis req et retourne le pool
 * du bon tenant, sans passer par cookies() de next/headers
 * qui ne fonctionne que dans l'App Router.
 */
import { getIronSession } from 'iron-session';
import { sessionOptions, type SessionData } from '@/lib/session';
import { getPoolForDb } from '@/db/mysql';

/**
 * @param req - L'objet IncomingMessage des routes Pages API
 * @param res - L'objet ServerResponse correspondant
 * @returns Le pool MySQL du tenant correct selon la session
 */
export async function getPoolFromRequest(req: any, res: any) {
    const session = await getIronSession<SessionData>(req, res, sessionOptions);

    if (session?.dbName) {
        return getPoolForDb(session.dbName);
    }

    // Fallback sur la DB par défaut si pas de session
    const defaultDb = process.env.MYSQL_DATABASE || 'scolapp';
    console.warn(`⚠️ getPoolFromRequest: pas de session.dbName, DB par défaut: ${defaultDb}`);
    return getPoolForDb(defaultDb);
}

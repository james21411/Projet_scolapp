/**
 * Cache en mémoire simple pour données quasi-statiques (par tenant)
 * Évite de recharger school_info, school_levels, school_classes,
 * evaluation_periods, grading_settings, personnel_types à chaque requête.
 *
 * TTL (Time To Live) par défaut : 5 minutes.
 * Les tables qui changent souvent (grades, students, report_cards) NE SONT PAS cachées.
 */

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

// Cache global : Map<"dbName:cacheKey" → CacheEntry>
const store = new Map<string, CacheEntry<unknown>>();

// TTL par type de donnée (en millisecondes)
const TTL = {
    school_info: 10 * 60 * 1000,       // 10 min – change rarement
    school_structure: 10 * 60 * 1000,  // 10 min – niveaux & classes
    evaluation_periods: 5 * 60 * 1000,  // 5 min - périodes scolaires
    grading_settings: 10 * 60 * 1000,  // 10 min – paramètres de notation
    personnel_types: 15 * 60 * 1000,   // 15 min – types de personnel
    security_settings: 15 * 60 * 1000, // 15 min – sécurité
    default: 5 * 60 * 1000,            // 5 min  – défaut
} as const;

type TtlKey = keyof typeof TTL;

// ---------- API publique ----------

export function cacheGet<T>(dbName: string, key: string): T | null {
    const entry = store.get(`${dbName}:${key}`) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        store.delete(`${dbName}:${key}`);
        return null;
    }
    return entry.data;
}

export function cacheSet<T>(
    dbName: string,
    key: string,
    data: T,
    ttlKey: TtlKey = 'default'
): void {
    store.set(`${dbName}:${key}`, {
        data,
        expiresAt: Date.now() + TTL[ttlKey],
    });
}

/** Invalider toutes les entrées d'un tenant (ex: après écriture). */
export function cacheInvalidate(dbName: string, key?: string): void {
    if (key) {
        store.delete(`${dbName}:${key}`);
    } else {
        // Supprimer toutes les clés de ce tenant
        for (const k of store.keys()) {
            if (k.startsWith(`${dbName}:`)) store.delete(k);
        }
    }
}

/** Helper : récupère depuis le cache ou charge depuis la DB. */
export async function cacheGetOrLoad<T>(
    dbName: string,
    key: string,
    loader: () => Promise<T>,
    ttlKey: TtlKey = 'default'
): Promise<T> {
    const cached = cacheGet<T>(dbName, key);
    if (cached !== null) return cached;
    const data = await loader();
    cacheSet(dbName, key, data, ttlKey);
    return data;
}

// Nettoyage automatique toutes les 5 minutes pour éviter les fuites mémoire
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
        if (now > entry.expiresAt) store.delete(key);
    }
}, 5 * 60 * 1000);
// Cache cleared
// Trigger rebuild

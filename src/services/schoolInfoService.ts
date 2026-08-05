
'use server';

import { logAction } from './auditLogService';
import { getSchoolInfo as getSchoolInfoDb, updateSchoolInfo as updateSchoolInfoDb, createSchoolInfo as createSchoolInfoDb } from './schoolService';

export interface SchoolInfo {
    name: string;
    slogan: string;
    address: string;
    phone: string;
    email: string;
    bp: string;
    logoUrl?: string | null; // Can be a data URI
    currentSchoolYear: string;
    currency: string; // e.g., 'XAF', 'EUR', 'USD'
}

const defaultData: SchoolInfo = {
    name: "ÉTABLISSEMENT SCOLAIRE",
    slogan: "L'excellence à votre portée",
    address: "Yaoundé, Cameroun",
    phone: "(+237) 699 99 99 99",
    email: "contact@ecole.cm",
    bp: "1234",
    logoUrl: null,
    currentSchoolYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    currency: 'XAF',
};

import { getSchoolBySlug } from '@/db/registry';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, type SessionData } from '@/lib/session';
import { getRequestedSchoolSlug } from '@/db/mysql';

export async function getSchoolInfo(): Promise<SchoolInfo> {
    try {
        // Enforce blocking mechanism: check if the school is active in the registry
        const cookieStore = await cookies();
        const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
        const requestedSlug = await getRequestedSchoolSlug();
        const activeSlug = requestedSlug || session?.schoolSlug;

        if (activeSlug && activeSlug !== 'default') {
            const school = await getSchoolBySlug(activeSlug);
            if (!school) {
                console.error(`🛑 getSchoolInfo blocked: School "${activeSlug}" is inactive or missing in registry.`);
                throw new Error('Votre établissement est désactivé. Veuillez contacter l\'administrateur.');
            }
        }

        const info = await getSchoolInfoDb();
        if (!info) {
            // Si aucune donnée n'existe, créer les données par défaut
            try {
                await createSchoolInfoDb(defaultData);
                console.log('Données de l\'école initialisées avec les valeurs par défaut');
            } catch (createError) {
                console.warn('Impossible de créer les données par défaut:', createError);
            }
            return defaultData;
        }
        // Ensure all keys from defaultData exist
        return { ...defaultData, ...info };
    } catch (error) {
        console.warn('Erreur lors de la récupération des informations de l\'école, utilisation des valeurs par défaut:', error);
        return defaultData;
    }
}

export async function updateSchoolInfo(data: SchoolInfo): Promise<void> {
    const oldData = await getSchoolInfo();
    const changes: string[] = [];

    (Object.keys(data) as Array<keyof SchoolInfo>).forEach(key => {
        if (data[key] !== oldData[key]) {
            changes.push(`'${key}' changed from '${oldData[key] || ''}' to '${data[key] || ''}'`);
        }
    });

    if (changes.length > 0) {
        await logAction({ action: 'settings_updated', details: `General settings updated. Changes: ${changes.join(', ')}` });
    }

    await updateSchoolInfoDb(data);
}

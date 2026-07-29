import { NextRequest, NextResponse } from 'next/server';
import { registryPool } from '@/db/registry';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const query = request.nextUrl.searchParams.get('q');
        if (!query || query.length < 2) {
            return NextResponse.json({ schools: [] });
        }

        // Limit results to 5 matches
        const [rows] = await registryPool.execute(
            `SELECT slug, name, logo_url as logoUrl 
             FROM schools 
             WHERE name LIKE ? OR slug LIKE ? 
             ORDER BY name ASC 
             LIMIT 5`,
            [`%${query}%`, `%${query}%`]
        ) as any[];

        return NextResponse.json({ schools: rows });
    } catch (error) {
        console.error('Erreur lors de la recherche des écoles:', error);
        return NextResponse.json(
            { error: 'Erreur interne du serveur' },
            { status: 500 }
        );
    }
}

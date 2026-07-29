import { NextRequest, NextResponse } from 'next/server';
import { registryPool } from '@/db/registry';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const [schools] = await registryPool.execute(
            `SELECT id, slug, name, db_name, admin_email, admin_name, phone, address, plan, is_active, created_at 
             FROM schools 
             ORDER BY created_at DESC`
        );
        return NextResponse.json({ success: true, schools });
    } catch (error) {
        console.error('Erreur SuperAdmin récupération écoles:', error);
        return NextResponse.json({ success: false, error: 'Erreur interne du serveur' }, { status: 500 });
    }
}

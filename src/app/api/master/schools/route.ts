import { NextResponse } from 'next/server';
import { getAllRegisteredSchools, updateSchoolStatus } from '@/services/masterAdminService';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const schools = await getAllRegisteredSchools();
        return NextResponse.json({ success: true, schools });
    } catch (error: any) {
        console.error('API Master Schools Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { id, status } = await request.json();
        await updateSchoolStatus(id, status);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

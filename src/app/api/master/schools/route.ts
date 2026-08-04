import { NextResponse } from 'next/server';
import {
  getAllRegisteredSchools,
  updateSchoolStatus,
  updateSchoolApproval,
  updateSchoolPlan,
  renewSubscription,
  suspendSubscription,
} from '@/services/masterAdminService';

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
        const body = await request.json();
        const { id, action, status, plan, maxStudents } = body;

        switch (action) {
            case 'toggle-status':
                await updateSchoolStatus(id, status);
                break;
            case 'approve':
                await updateSchoolApproval(id, 'approved');
                break;
            case 'reject':
                await updateSchoolApproval(id, 'rejected');
                break;
            case 'update-plan':
                await updateSchoolPlan(id, plan, maxStudents);
                break;
            case 'renew':
                await renewSubscription(id);
                break;
            case 'suspend':
                await suspendSubscription(id);
                break;
            default:
                // Legacy support
                if (typeof status === 'boolean') {
                    await updateSchoolStatus(id, status);
                }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}


import {getAuth} from 'firebase-admin/auth';
import {initFirebaseAdminApp} from '@/lib/firebase-admin';
import {cookies} from 'next/headers';
import {NextRequest, NextResponse} from 'next/server';

// This file is no longer used for direct redirection, but we can keep it for now.
// The logic is moved to /api/auth/github/url and the frontend.

export async function GET(req: NextRequest) {
    return NextResponse.json({ message: "This endpoint is deprecated. Use /api/auth/github/url instead." }, { status: 404 });
}

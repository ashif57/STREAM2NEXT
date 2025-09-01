
import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';

export async function POST() {
  try {
    cookies().delete('customToken');
    cookies().delete('github_oauth_state');
    return new NextResponse('Signed out', {status: 200});
  } catch (error) {
    return new NextResponse('Error signing out', {status: 500});
  }
}

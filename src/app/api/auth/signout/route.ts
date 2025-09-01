
import {NextResponse} from 'next/server';

export async function POST() {
  try {
    const response = new NextResponse('Signed out', {status: 200});
    response.cookies.delete('customToken');
    response.cookies.delete('github_oauth_state');
    return response;
  } catch (error) {
    return new NextResponse('Error signing out', {status: 500});
  }
}

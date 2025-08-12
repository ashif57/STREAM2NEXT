
import {cookies} from 'next/headers';
import {NextRequest, NextResponse} from 'next/server';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_REDIRECT_URI = 'http://localhost:9002/api/auth/github/callback';

export async function GET(req: NextRequest) {
  if (!GITHUB_CLIENT_ID) {
    return NextResponse.json(
      {error: 'GitHub client ID is not configured.'},
      {status: 500}
    );
  }

  const state = Math.random().toString(36).substring(7);
  cookies().set('github_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    maxAge: 60 * 60, // 1 hour
    path: '/',
  });

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    state: state,
    scope: 'repo',
    redirect_uri: GITHUB_REDIRECT_URI,
  });

  const url = `https://github.com/login/oauth/authorize?${params.toString()}`;

  return NextResponse.json({url});
}

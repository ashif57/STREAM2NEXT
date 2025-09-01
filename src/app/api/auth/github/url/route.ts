
import {cookies} from 'next/headers';
import {NextRequest, NextResponse} from 'next/server';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
export async function GET(req: NextRequest) {
  if (!GITHUB_CLIENT_ID) {
    return NextResponse.json(
      {error: 'GitHub client ID is not configured.'},
      {status: 500}
    );
  }

  const host = req.headers.get('host');
  const protocol = req.headers.get('x-forwarded-proto') || 'http';
  const redirect_uri = `${protocol}://${host}/api/auth/github/callback`;

  const state = Math.random().toString(36).substring(7);

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    state: state,
    scope: 'repo',
    redirect_uri: redirect_uri,
  });

  const url = `https://github.com/login/oauth/authorize?${params.toString()}`;

  const response = NextResponse.json({url});
  response.cookies.set('github_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    maxAge: 60 * 60, // 1 hour
    path: '/',
  });
  return response;
}

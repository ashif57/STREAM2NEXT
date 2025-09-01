
import {initFirebaseAdminApp} from '@/lib/firebase-admin';
import {getAuth} from 'firebase-admin/auth';
import {cookies} from 'next/headers';
import {NextRequest, NextResponse} from 'next/server';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// Explicitly define the callback URL to ensure it's consistent.
const GITHUB_REDIRECT_URI = (process.env.NEXT_PUBLIC_URL || 'http://localhost:9002') + '/api/auth/github/callback';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const storedState = cookies().get('github_oauth_state')?.value;

  console.log('GitHub Callback received state:', state);
  console.log('Stored state:', storedState);

  if (!state || state !== storedState) {
    console.error('State mismatch error');
    return new Response('Invalid state', {status: 400});
  }

  if (!code) {
    console.error('No code received from GitHub');
    return new Response('No code provided', {status: 400});
  }

  try {
    const tokenResponse = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
          state,
          redirect_uri: GITHUB_REDIRECT_URI,
        }),
      }
    );

    const tokenData = await tokenResponse.json();
    console.log('GitHub Token Response:', tokenData);

    if (tokenData.error) {
      console.error('GitHub token error:', tokenData.error_description);
      throw new Error(tokenData.error_description);
    }
    const accessToken = tokenData.access_token;

    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${accessToken}`,
      },
    });
    const githubUser = await userResponse.json();
    console.log('GitHub User:', githubUser.login);
    
    initFirebaseAdminApp();
    const auth = getAuth();
    const customToken = await auth.createCustomToken(githubUser.id.toString(), {
      github_username: githubUser.login,
      github_access_token: accessToken,
    });
    
    cookies().set('customToken', customToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/',
    });
    
    return NextResponse.redirect(new URL('/', req.url));
  } catch (error) {
    console.error('GitHub callback process error:', error);
    return new Response('Authentication failed', {status: 500});
  }
}


import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { initFirebaseAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth as getClientAuth,
  signInWithCustomToken,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const clientApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const clientAuth = getClientAuth(clientApp);

async function getGitHubAccessToken(): Promise<string | null> {
  const customToken = (await cookies()).get('customToken')?.value;
  if (!customToken) {
    return null;
  }

  try {
    const userCredential = await signInWithCustomToken(clientAuth, customToken);
    const user = userCredential.user;

    initFirebaseAdminApp();
    const adminAuth = getAuth();
    const idToken = await user.getIdToken(true); // Force refresh the token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    return decodedToken.github_access_token || null;
  } catch (error) {
    console.error("Error getting GitHub access token:", error);
    return null;
  }
}

export async function GET() {
  const accessToken = await getGitHubAccessToken();

  if (!accessToken) {
    return NextResponse.json({ error: 'Not authenticated or GitHub token missing.' }, { status: 401 });
  }

  try {
    const reposResponse = await fetch('https://api.github.com/user/repos?type=owner&sort=updated', {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!reposResponse.ok) {
      const errorData = await reposResponse.json();
      console.error('GitHub API error:', errorData.message);
      return NextResponse.json({ error: `GitHub API Error: ${errorData.message}` }, { status: reposResponse.status });
    }

    const reposData = await reposResponse.json();
    const repos = reposData.map((repo: any) => ({
      id: repo.id.toString(),
      name: repo.name,
    }));

    return NextResponse.json(repos);
  } catch (error: any) {
    console.error('Error fetching GitHub repos:', error);
    return NextResponse.json({ error: 'Failed to fetch repositories from GitHub.' }, { status: 500 });
  }
}

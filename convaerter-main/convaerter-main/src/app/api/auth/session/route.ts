
import {initFirebaseAdminApp} from '@/lib/firebase-admin';
import {getAuth} from 'firebase-admin/auth';
import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
import {getApp, getApps, initializeApp} from 'firebase/app';
import {
  getAuth as getClientAuth,
  signInWithCustomToken,
  User,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const clientApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const clientAuth = getClientAuth(clientApp);

export async function GET() {
  const customToken = cookies().get('customToken')?.value;

  if (!customToken) {
    return new Response(JSON.stringify({user: null}), {
      status: 200,
      headers: {'Content-Type': 'application/json'},
    });
  }

  try {
    const userCredential = await signInWithCustomToken(clientAuth, customToken);
    const user: User = userCredential.user;

    initFirebaseAdminApp();
    const adminAuth = getAuth();
    const decodedToken = await adminAuth.verifyIdToken(await user.getIdToken());
    
    const responseUser = {
      uid: user.uid,
      email: decodedToken.email || user.providerData[0]?.email || '',
      displayName:
        decodedToken.name || user.displayName || decodedToken.github_username,
      photoURL: decodedToken.picture || user.photoURL,
    };
    
    return NextResponse.json({user: responseUser});
  } catch (error: any) {
    if (error.code === 'auth/id-token-expired') {
        cookies().delete('customToken');
        return new Response(JSON.stringify({user: null, error: 'Session expired' }), {
            status: 401,
            headers: {'Content-Type': 'application/json'},
        });
    }
    console.error('Session error:', error);
    return new Response(JSON.stringify({user: null, error: 'Invalid session' }), {
        status: 401,
        headers: {'Content-Type': 'application/json'},
      }
    );
  }
}

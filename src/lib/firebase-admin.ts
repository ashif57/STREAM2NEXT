
import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { credential } from 'firebase-admin';

export function initFirebaseAdminApp() {
  if (getApps().length === 0) {
    initializeApp({
      credential: credential.applicationDefault(),
    });
  }
  return getApp();
}

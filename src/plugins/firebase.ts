import fp from 'fastify-plugin';
import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getDatabase, type Database } from 'firebase-admin/database';
import { env } from '../config/env.js';

export interface FirebaseServices {
  auth: Auth;
  db: Database;
}

declare module 'fastify' {
  interface FastifyInstance {
    /** Firebase admin services, or null when Firebase env is not configured. */
    firebase: FirebaseServices | null;
  }
}

/**
 * Initialises firebase-admin for the realtime chat bridge. The Firebase `uid`
 * is our Postgres user id, so the per-thread members allowlist and security
 * rules align with our identity. When env is missing the plugin no-ops and
 * chat realtime endpoints surface a clear error at call time.
 */
export default fp(async (app) => {
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_DB_URL } = env;

  if (
    !FIREBASE_PROJECT_ID ||
    !FIREBASE_CLIENT_EMAIL ||
    !FIREBASE_PRIVATE_KEY ||
    !FIREBASE_DB_URL
  ) {
    app.log.warn('Firebase not configured — chat realtime bridge disabled');
    app.decorate('firebase', null);
    return;
  }

  const fbApp: App =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      databaseURL: FIREBASE_DB_URL,
    });

  app.decorate('firebase', { auth: getAuth(fbApp), db: getDatabase(fbApp) });
});

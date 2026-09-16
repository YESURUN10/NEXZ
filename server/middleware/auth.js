import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Admin role cache with 5-minute TTL.
 * Key: uid, Value: { isAdmin: boolean, timestamp: number }
 */
const adminCache = new Map();
const ADMIN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Express middleware: Verifies Firebase ID token from Authorization header.
 * Sets req.user = { uid, email } on success.
 * Returns 401 if token is missing or invalid.
 */
export async function verifyToken(req, res, next) {
  if (global.FIREBASE_FIRESTORE_ENABLED === false) {
    req.user = { uid: 'local-dev', email: 'local@dev.com' };
    return next();
  }
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        error: 'missing_token',
        message: 'Authorization header with Bearer token is required.',
      });
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({
        status: 'error',
        error: 'missing_token',
        message: 'Bearer token is empty.',
      });
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
    };

    next();
  } catch (error) {
    console.error('[Auth] Token verification failed:', error.message);
    return res.status(401).json({
      status: 'error',
      error: 'invalid_token',
      message: 'Invalid or expired authentication token.',
    });
  }
}

/**
 * Express middleware: Checks if the authenticated user is an admin.
 * Must be used AFTER verifyToken middleware.
 * Caches admin status for 5 minutes to reduce Firestore reads.
 * Returns 403 if user is not an admin.
 */
export async function isAdmin(req, res, next) {
  if (global.FIREBASE_FIRESTORE_ENABLED === false) {
    return next();
  }
  try {
    const { uid } = req.user;

    // Check cache first
    const cached = adminCache.get(uid);
    if (cached && Date.now() - cached.timestamp < ADMIN_CACHE_TTL) {
      if (cached.isAdmin) {
        return next();
      }
      return res.status(403).json({
        status: 'error',
        error: 'forbidden',
        message: 'Admin access required.',
      });
    }

    // Cache miss - check Firestore
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(uid).get();

    const isAdminUser = userDoc.exists && userDoc.data()?.isAdmin === true;

    // Update cache
    adminCache.set(uid, {
      isAdmin: isAdminUser,
      timestamp: Date.now(),
    });

    if (!isAdminUser) {
      return res.status(403).json({
        status: 'error',
        error: 'forbidden',
        message: 'Admin access required.',
      });
    }

    next();
  } catch (error) {
    console.error('[Auth] Admin check failed:', error.message);
    return res.status(500).json({
      status: 'error',
      error: 'admin_check_failed',
      message: 'Failed to verify admin status.',
    });
  }
}

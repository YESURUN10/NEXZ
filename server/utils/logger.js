import { getFirestore } from 'firebase-admin/firestore';

/**
 * Fire-and-forget request logger to Firestore.
 * Writes to logs/requests/entries subcollection.
 * Does NOT await - failures are silently caught.
 *
 * @param {object} params
 * @param {string} params.route - The API route hit
 * @param {string} [params.userId] - Authenticated user ID (if any)
 * @param {Date|string} params.timestamp - When the request occurred
 * @param {boolean} params.success - Whether the request succeeded
 * @param {string} [params.errorType] - Error classification (if failed)
 */
export function logRequest({ route, userId, timestamp, success, errorType }) {
  try {
    const db = getFirestore();
    db.collection('logs')
      .doc('requests')
      .collection('entries')
      .add({
        route,
        userId: userId || null,
        timestamp: timestamp || new Date().toISOString(),
        success,
        errorType: errorType || null,
        createdAt: new Date(),
      })
      .catch(() => {
        // Silently ignore write failures
      });
  } catch {
    // Silently ignore initialization failures
  }
}

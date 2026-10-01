import { auth } from '@/modules/shared/config/firebase';

// Where the API lives:
//  - `npm run dev`  -> ALWAYS the local backend (http://localhost:5000). It runs with the
//    goodkart Firebase credentials (backend/serviceAccountKey.json), so every login,
//    registration and order lands in the goodkart database. This is decided here in code
//    (not via .env) so a leftover VITE_API_BASE_URL - which still points at the old
//    sellsathi backend - can never send dev traffic to the wrong database. Start the
//    backend with `npm run dev` inside backend/ (or from the repo root, which starts both).
//    Set VITE_DEV_API_URL only if you deliberately want dev to use a different backend.
//  - production build -> VITE_API_BASE_URL from .env.
export const API_BASE = import.meta.env.DEV
    ? (import.meta.env.VITE_DEV_API_URL || 'http://localhost:5000')
    : (import.meta.env.VITE_API_BASE_URL || 'https://sellsathi-refactored.onrender.com');

/**
 * `fetch` with a hard timeout, so a stalled request (dead port, silent
 * firewall drop, a cold-starting Render backend that never comes back)
 * fails with a clear error instead of hanging the caller — and the UI —
 * forever. Plain `fetch` has no built-in timeout at all.
 *
 * @param {string} url
 * @param {RequestInit} options - standard fetch options
 * @param {number} timeoutMs - default 25s (covers a Render free-tier cold start)
 */
export async function fetchWithTimeout(url, options = {}, timeoutMs = 25000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } catch (err) {
        if (err.name === 'AbortError') {
            throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s: ${url}`);
        }
        throw err;
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Reads the locally-stored user object for the current login context
 * ('seller_user' when a seller session is active, 'user' otherwise), with the
 * same seller->consumer fallback used by authFetch.
 */
function getStoredUser() {
    try {
        const loginCtx = sessionStorage.getItem('loginContext');
        const storageKey = loginCtx === 'SELLER' ? 'seller_user' : 'user';
        let localUser = JSON.parse(localStorage.getItem(storageKey));
        if (!localUser && storageKey === 'seller_user') {
            localUser = JSON.parse(localStorage.getItem('user'));
        }
        return localUser;
    } catch (_) {
        return null;
    }
}

/**
 * Returns the effective logged-in user, or null if nobody is logged in.
 *
 * `auth.currentUser` (Firebase) only reflects a REAL Firebase Auth session -
 * email/password, Google, and a genuine Firebase phone-OTP sign-in all set it.
 * Checks both the Firebase session and the locally stored user, preferring the
 * real Firebase user's fields when one exists.
 */
export function getCurrentUser() {
    const stored = getStoredUser();
    if (auth.currentUser) {
        return {
            ...stored,
            uid: auth.currentUser.uid,
            email: auth.currentUser.email || stored?.email || '',
            phoneNumber: auth.currentUser.phoneNumber || stored?.phone || '',
        };
    }
    if (stored?.uid) {
        return { ...stored, phoneNumber: stored.phone || '' };
    }
    return null;
}

/**
 * Authenticated fetch wrapper.
 *
 * Every request is authenticated with the real Firebase session:
 *    -> waits for Firebase to restore the session
 *    -> force-refreshes the ID token (prevents 401 from expired tokens)
 *    -> sends Authorization: Bearer <token>
 * Requests made while nobody is signed in are sent without credentials
 * (public endpoints work, protected ones answer 401).
 *
 * @param {string} path - API path (e.g. '/admin/stats')
 * @param {object} options - Standard fetch options (method, body, etc.)
 * @returns {Promise<Response>}
 */
export async function authFetch(path, options = {}) {
    const url = `${API_BASE}${path}`;
    const headers = { ...options.headers };
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    // Make sure Firebase has finished restoring a saved session before we look at currentUser
    if (typeof auth.authStateReady === 'function') {
        try { await auth.authStateReady(); } catch (_) { /* ignore */ }
    }

    const currentUser = auth.currentUser;
    if (currentUser) {
        try {
            // Force-refresh to ensure we don't send an expired token
            const idToken = await currentUser.getIdToken(true);
            headers['Authorization'] = `Bearer ${idToken}`;
        } catch (err) {
            console.warn('[authFetch] Firebase token refresh failed:', err.message);
        }
    }

    return fetch(url, { ...options, headers });
}

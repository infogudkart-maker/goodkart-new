'use strict';
const admin = require('firebase-admin');
require('dotenv').config();

// The ONLY Firebase project this backend may read from / write to.
// Goodkart replaced the old 'sellsathi-94ede' project; every user, seller,
// product, order and OTP record must live here and nowhere else.
const FIREBASE_PROJECT_ID = 'goodkart';

let serviceAccount;

try {
    let rawCredentials = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (rawCredentials) {
        // Sanitize: remove whitespace and potential surrounding quotes
        rawCredentials = rawCredentials.trim();
        if (rawCredentials.startsWith('"') && rawCredentials.endsWith('"')) {
            rawCredentials = rawCredentials.slice(1, -1);
        }

        // Handle both stringified JSON and Base64 encoded JSON
        try {
            // First attempt: direct JSON parse
            serviceAccount = typeof rawCredentials === 'string' 
                ? JSON.parse(rawCredentials) 
                : rawCredentials;
        } catch (jsonError) {
            // Second attempt: check if it's Base64
            try {
                const decoded = Buffer.from(rawCredentials, 'base64').toString('utf8');
                serviceAccount = JSON.parse(decoded);
            } catch (base64Error) {
                // If both fail, show original JSON error as it's most likely what user pasted
                throw new Error(`JSON Parse Error: ${jsonError.message}`);
            }
        }
    } else {
        // Fallback to local file for development
        serviceAccount = require('../../serviceAccountKey.json');
    }

    if (serviceAccount && serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
} catch (error) {
    console.error('❌ Failed to load Firebase Service Account Credentials:', error.message);
    console.error('Please ensure serviceAccountKey.json exists locally or FIREBASE_SERVICE_ACCOUNT env var is set correctly in production.');
    process.exit(1);
}

// Fail fast if the credentials (serviceAccountKey.json locally, or the
// FIREBASE_SERVICE_ACCOUNT env var on the host) belong to another project,
// e.g. the old sellsathi one. Without this check the Admin SDK would happily
// keep saving data to - and verifying login tokens against - the wrong project.
if (serviceAccount.project_id !== FIREBASE_PROJECT_ID) {
    console.error(`❌ Firebase credentials are for project "${serviceAccount.project_id}", but this backend must use "${FIREBASE_PROJECT_ID}".`);
    console.error('   Local dev: put the goodkart service account key in backend/serviceAccountKey.json.');
    console.error('   Hosted:    set FIREBASE_SERVICE_ACCOUNT to the goodkart service account key.');
    process.exit(1);
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: FIREBASE_PROJECT_ID,
    });
    console.log(`🔥 Firebase Admin connected to project: ${FIREBASE_PROJECT_ID}`);
}

const db = admin.firestore();

module.exports = { admin, db };

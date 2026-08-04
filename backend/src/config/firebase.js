'use strict';
const admin = require('firebase-admin');
require('dotenv').config();

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

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'sellsathi-94ede',
    });
}

const db = admin.firestore();

module.exports = { admin, db };

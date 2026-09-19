'use strict';

/**
 * One-off migration script: copies ALL Firestore data from the old
 * "sellsathi-94ede" project to the new "goodkart" project, so goodkart
 * ends up with an exact copy of the current database.
 *
 * Works on the free Spark plan (no GCS bucket / Blaze upgrade needed),
 * because it just reads every document with the Admin SDK and re-writes
 * it into the other project — it does not use gcloud export/import.
 *
 * WHAT YOU NEED BEFORE RUNNING THIS:
 *  1. A service account key JSON for the OLD project (sellsathi-94ede):
 *     Firebase Console -> sellsathi-94ede -> Project settings ->
 *     Service accounts -> Generate new private key.
 *     Save it as: backend/scripts/serviceAccountKey.sellsathi.json
 *
 *  2. A service account key JSON for the NEW project (goodkart):
 *     Firebase Console -> goodkart -> Project settings -> Service accounts
 *     -> Generate new private key.
 *     Save it as: backend/scripts/serviceAccountKey.goodkart.json
 *
 *  3. Firestore must already be created (in Native mode) in the goodkart
 *     project - Firebase Console -> goodkart -> Firestore Database ->
 *     Create database. Otherwise writes below will fail.
 *
 *  Both key files are already covered by backend/.gitignore
 *  ("serviceAccountKey*.json") - see the note at the bottom of this file
 *  if that pattern isn't there yet.
 *
 * HOW TO RUN (from the backend/ folder):
 *     node scripts/migrateFirestoreToGoodkart.js
 *
 * The script is safe to re-run: it overwrites documents by the same ID,
 * it never deletes anything, and it logs progress as it goes.
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const SOURCE_KEY_PATH = path.join(__dirname, 'serviceAccountKey.sellsathi.json');
const TARGET_KEY_PATH = path.join(__dirname, 'serviceAccountKey.goodkart.json');

// Firestore write batches max out at 500 operations - stay comfortably
// under that so a batch never overflows.
const BATCH_SIZE = 400;

function loadServiceAccount(filePath, label) {
    if (!fs.existsSync(filePath)) {
        console.error(`\n[Missing key] Could not find ${label} service account key at:\n  ${filePath}\n`);
        console.error('Download it from Firebase Console -> Project settings -> Service accounts -> Generate new private key, and save it at that exact path.');
        process.exit(1);
    }
    return require(filePath);
}

const sourceAccount = loadServiceAccount(SOURCE_KEY_PATH, 'sellsathi-94ede (source)');
const targetAccount = loadServiceAccount(TARGET_KEY_PATH, 'goodkart (target)');

const sourceApp = admin.initializeApp(
    { credential: admin.credential.cert(sourceAccount), projectId: 'sellsathi-94ede' },
    'sourceApp'
);
const targetApp = admin.initializeApp(
    { credential: admin.credential.cert(targetAccount), projectId: 'goodkart' },
    'targetApp'
);

const sourceDb = sourceApp.firestore();
const targetDb = targetApp.firestore();

let docsCopied = 0;
let collectionsSeen = 0;

/**
 * Recursively copies a collection: every document, its data, and any
 * subcollections that document has, then moves on to the next document.
 */
async function copyCollection(sourceCollectionRef, targetCollectionRef) {
    collectionsSeen += 1;
    const snapshot = await sourceCollectionRef.get();
    console.log(`Collection "${sourceCollectionRef.path}": ${snapshot.size} document(s)`);

    let batch = targetDb.batch();
    let opsInBatch = 0;

    for (const docSnap of snapshot.docs) {
        const targetDocRef = targetCollectionRef.doc(docSnap.id);
        batch.set(targetDocRef, docSnap.data());
        opsInBatch += 1;
        docsCopied += 1;

        if (opsInBatch >= BATCH_SIZE) {
            await batch.commit();
            batch = targetDb.batch();
            opsInBatch = 0;
        }
    }

    if (opsInBatch > 0) {
        await batch.commit();
    }

    // Walk subcollections of every document (e.g. orders/{id}/items).
    for (const docSnap of snapshot.docs) {
        const subcollections = await docSnap.ref.listCollections();
        for (const subcol of subcollections) {
            const targetSubcolRef = targetCollectionRef.doc(docSnap.id).collection(subcol.id);
            await copyCollection(subcol, targetSubcolRef);
        }
    }
}

async function main() {
    console.log('Starting Firestore migration: sellsathi-94ede -> goodkart\n');

    const topLevelCollections = await sourceDb.listCollections();
    if (topLevelCollections.length === 0) {
        console.log('No top-level collections found in the source project - nothing to copy.');
        return;
    }

    console.log(`Found ${topLevelCollections.length} top-level collection(s): ${topLevelCollections.map(c => c.id).join(', ')}\n`);

    for (const col of topLevelCollections) {
        const targetCollectionRef = targetDb.collection(col.id);
        await copyCollection(col, targetCollectionRef);
    }

    console.log(`\nDone. Copied ${docsCopied} document(s) across ${collectionsSeen} collection(s)/subcollection(s).`);
    console.log('Spot-check a few documents in the goodkart Firestore console to confirm, then update the app config to point at goodkart (see frontend/src/modules/shared/config/firebase.js and backend/src/config/firebase.js).');
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('\nMigration failed:', err);
        process.exit(1);
    });

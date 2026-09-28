import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// NOTE: apiKey / messagingSenderId / appId / measurementId below are
// placeholders. Get the real values from Firebase Console -> goodkart
// project -> Project settings -> General -> "Your apps" -> add a Web app
// (if you haven't registered one yet) -> copy the firebaseConfig object
// shown there, and paste the real values in below. projectId, authDomain
// and storageBucket are already correct for the goodkart project id.
const firebaseConfig = {
  apiKey: "AIzaSyCrVCO8HHxTS8X_JDy5DrGEhJZNUPdKRYY",
  authDomain: "goodkart.firebaseapp.com",
  projectId: "goodkart",
  storageBucket: "goodkart.firebasestorage.app",
  messagingSenderId: "158491180234",
  appId: "1:158491180234:web:dc0ce161d69f1830054833",
  measurementId: "G-MTPS28G650"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;

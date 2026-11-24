import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';

export { isFirebaseConfigured };

export function createFirebaseClients() {
    if (!isFirebaseConfigured()) {
        throw new Error('Firebase is not configured. Add the web app settings in js/firebase-config.js.');
    }

    const app = initializeApp(firebaseConfig);
    return {
        auth: getAuth(app),
        db: getFirestore(app)
    };
}

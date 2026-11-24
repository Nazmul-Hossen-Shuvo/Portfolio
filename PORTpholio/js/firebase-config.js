export const firebaseConfig = {
    apiKey: 'YOUR_FIREBASE_API_KEY',
    authDomain: 'nazmul-hossen-shuvo.firebaseapp.com',
    projectId: 'nazmul-hossen-shuvo',
    appId: 'YOUR_FIREBASE_APP_ID'
};

export const adminEmail = 'nhtshuvo@gmail.com';

export function isFirebaseConfigured() {
    return firebaseConfig.apiKey !== 'YOUR_FIREBASE_API_KEY'
        && firebaseConfig.appId !== 'YOUR_FIREBASE_APP_ID'
        && Boolean(firebaseConfig.apiKey && firebaseConfig.appId && firebaseConfig.projectId);
}

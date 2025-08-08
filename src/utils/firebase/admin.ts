import admin from "firebase-admin";

let firebaseAdmin: typeof admin;

if (
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_PRIVATE_KEY &&
  process.env.FIREBASE_CLIENT_EMAIL
) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  firebaseAdmin = admin;
} else {
  // Create a mock admin object for build time
  firebaseAdmin = {
    messaging: () => ({
      sendEachForMulticast: () => Promise.resolve({ failureCount: 0, responses: [] })
    })
  } as any;
}

export default firebaseAdmin;

// lib/firebaseAdmin.js
// import admin from "firebase-admin";
// import serviceAccount from "../../lib/feedme-dd81d-firebase-adminsdk-fbsvc-e6e402be97.json"; // Path to your JSON file

// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount as any),
//   });
// }

// export default admin;

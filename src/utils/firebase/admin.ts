// import admin from "firebase-admin";

// const serviceAccount = {
//   projectId: process.env.FIREBASE_PROJECT_ID!,
//   privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
//   clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
// };

// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });
// }

// export default admin;

// lib/firebaseAdmin.js
import admin from "firebase-admin";
import serviceAccount from "../../lib/feedme-dd81d-firebase-adminsdk-fbsvc-e6e402be97.json"; // Path to your JSON file

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any),
  });
}

export default admin;

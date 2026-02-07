import admin from "firebase-admin";

let firebaseAdmin: typeof admin;

const projectId = process.env.PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const privateKey = process.env.PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY;
const clientEmail = process.env.CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;

console.log("Firebase Admin Check:", { 
  projectId: !!projectId, 
  privateKey: !!privateKey, 
  clientEmail: !!clientEmail 
});

if (projectId && privateKey && clientEmail) {
  const serviceAccount = {
    projectId,
    privateKey: privateKey
      .replace(/\\n/g, "\n")
      .replace(/^"|"$/g, ""), // Remove surrounding quotes only
    clientEmail,
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

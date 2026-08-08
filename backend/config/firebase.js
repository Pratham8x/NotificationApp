const admin = require("firebase-admin");

const serviceAccount = require("../firebase-service-account.json");

if (admin.getApps().length === 0) {
  admin.initializeApp({
    credential: admin.cert(serviceAccount),
  });
}

module.exports = admin;
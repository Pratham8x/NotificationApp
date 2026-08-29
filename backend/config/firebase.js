const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const serviceAccountPath = path.join(
  __dirname,
  "..",
  "firebase-service-account.json"
);

const getServiceAccount = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT
      );

      // Railway variables sometimes contain escaped newlines.
      if (serviceAccount.private_key) {
        serviceAccount.private_key =
          serviceAccount.private_key.replace(/\\n/g, "\n");
      }

      return serviceAccount;
    } catch (error) {
      throw new Error(
        `FIREBASE_SERVICE_ACCOUNT must be valid JSON: ${error.message}`
      );
    }
  }

  if (fs.existsSync(serviceAccountPath)) {
    return JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  }

  throw new Error(
    "Firebase credentials are missing. Set FIREBASE_SERVICE_ACCOUNT to the service-account JSON."
  );
};

if (admin.getApps().length === 0) {
  admin.initializeApp({
    credential: admin.cert(getServiceAccount()),
  });
}

module.exports = admin;

const fs = require("fs");
const path = require("path");

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  const serviceAccountPath = path.join(
    __dirname,
    "..",
    "firebase-service-account.json"
  );

  if (fs.existsSync(serviceAccountPath)) {
    process.env.FIREBASE_SERVICE_ACCOUNT = fs.readFileSync(
      serviceAccountPath,
      "utf8"
    );
  }
}

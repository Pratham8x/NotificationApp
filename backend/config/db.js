const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Older versions of the User model used a unique email field. MongoDB
    // keeps indexes after a field is removed from a Mongoose schema, causing
    // every mobile-only user (email: null) after the first one to fail with
    // E11000. Remove only that obsolete index and preserve all user data.
    const usersCollectionExists = await mongoose.connection.db
      .listCollections({name: 'users'}, {nameOnly: true})
      .hasNext();
    if (usersCollectionExists) {
      const usersCollection = mongoose.connection.collection('users');
      const indexes = await usersCollection.indexes();
      const staleEmailIndex = indexes.find(index =>
        index.name === 'email_1' && index.key?.email === 1,
      );
      if (staleEmailIndex) {
        await usersCollection.dropIndex(staleEmailIndex.name);
        console.log(' Removed obsolete users.email_1 index');
      }
    }

    console.log(" MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

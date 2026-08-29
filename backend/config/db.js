const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

    const usersCollectionExists = await mongoose.connection.db
      .listCollections({ name: "users" }, { nameOnly: true })
      .hasNext();

    if (usersCollectionExists) {
      const usersCollection =
        mongoose.connection.collection("users");

      const indexes = await usersCollection.indexes();

      const staleEmailIndex = indexes.find(
        (index) =>
          index.name === "email_1" &&
          index.key?.email === 1
      );

      if (staleEmailIndex) {
        await usersCollection.dropIndex("email_1");
        console.log("Removed obsolete users.email_1 index");
      }
    }
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    throw error;
  }
};

module.exports = connectDB;
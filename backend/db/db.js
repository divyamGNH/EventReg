import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const removeLegacyIndexes = async () => {
  const usersCollection = mongoose.connection.collection("users");
  const indexes = await usersCollection.indexes();
  const hasLegacyUserTokenIndex = indexes.some(
    (entry) => entry.name === "user_token_1",
  );

  if (hasLegacyUserTokenIndex) {
    await usersCollection.dropIndex("user_token_1");
    console.log("Dropped legacy users index: user_token_1");
  }
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    await removeLegacyIndexes();
    console.log("MongoDB connected successfully ✅");
  } catch (error) {
    console.error("MongoDB connection failed ❌", error);
    process.exit(1);
  }
};

export default connectDB;

import "dotenv/config";
import mongoose from "mongoose";

const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
  throw new Error("Falta MONGO_URL en el .env");
}

mongoose.set("strictQuery", true);

export async function connectMongo(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGO_URL!);
  console.log("✅ MongoDB conectado");
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
}

export { mongoose };

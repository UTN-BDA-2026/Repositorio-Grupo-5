import "dotenv/config";
import { Redis } from "ioredis";

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  throw new Error("Falta REDIS_URL en el .env");
}

export const redis = new Redis(REDIS_URL, {
  lazyConnect: false,
  maxRetriesPerRequest: 3,
});

redis.on("connect", () => console.log("✅ Redis conectado"));
redis.on("error", (err: Error) => console.error("❌ Redis error:", err.message));

export async function pingRedis(): Promise<boolean> {
  try {
    const pong = await redis.ping();
    return pong === "PONG";
  } catch {
    return false;
  }
}

// TTL del carrito: 7 días
export const CART_TTL_SECONDS = 60 * 60 * 24 * 7;

export const cartKey = (userId: number | string) => `cart:${userId}`;

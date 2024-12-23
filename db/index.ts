import { drizzle } from "drizzle-orm/neon-http";
import { neon, neonConfig } from '@neondatabase/serverless';
import * as schema from "@db/schema";
import ws from "ws";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure neon with WebSocket support for better performance
neonConfig.webSocketConstructor = ws;
const sql = neon(process.env.DATABASE_URL);

// Create drizzle database instance with schema
export const db = drizzle(sql, { schema });

// Helper function to validate database connection
async function validateConnection() {
  try {
    // Try a simple query to validate connection
    const result = await sql`SELECT 1 as test`;
    console.log("Database connection validated successfully");
    return true;
  } catch (error) {
    console.error("Database connection validation failed:", error);
    return false;
  }
}

// Initialize database with retries
export async function initDb(retries = 3, delay = 1000): Promise<typeof db> {
  for (let i = 0; i < retries; i++) {
    try {
      const isValid = await validateConnection();
      if (isValid) {
        console.log("Database connection established successfully");
        return db;
      }
    } catch (error) {
      console.error(`Database connection attempt ${i + 1} failed:`, error);
      if (i < retries - 1) {
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error("Failed to establish database connection after multiple attempts");
}
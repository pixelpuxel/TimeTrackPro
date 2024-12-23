import { drizzle } from "drizzle-orm/neon-http";
import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

// Create SQL connection
const sql = neon(process.env.DATABASE_URL);

// Create database instance with schema
export const db = drizzle(sql, { schema });

// Export a function to test the connection
export async function testConnection() {
  try {
    const result = await sql`SELECT 1`;
    console.log('Database connection test succeeded');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}
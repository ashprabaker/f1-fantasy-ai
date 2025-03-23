import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { pgTable, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import postgres from "postgres";

// Load environment variables
config({ path: ".env.local" });

// Define membership enum
const membershipEnum = pgEnum("membership", ["free", "pro"]);

// Define the profiles table manually
const profilesTable = pgTable("profiles", {
  userId: text("user_id").primaryKey().notNull(),
  membership: membershipEnum("membership").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  lastRecommendationAt: timestamp("last_recommendation_at"),
  recommendationCount: integer("recommendation_count").default(0),
  lastSyncAt: timestamp("last_sync_at"),
  syncCount: integer("sync_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
});

const pushSchema = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }

  console.log("Starting schema push...");
  
  try {
    // Connect to Postgres
    const client = postgres(process.env.DATABASE_URL);
    const db = drizzle(client);
    
    // Create profiles table
    console.log("Creating profiles table...");
    const query = `
    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY NOT NULL,
      membership membership NOT NULL DEFAULT 'free',
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      last_recommendation_at TIMESTAMP,
      recommendation_count INTEGER DEFAULT 0,
      last_sync_at TIMESTAMP,
      sync_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
    `;
    
    await db.execute(query);
    console.log("Profiles table created successfully!");
    
    // Close connection
    await client.end();
  } catch (error) {
    console.error("Schema push failed:", error);
    process.exit(1);
  }
};

pushSchema(); 
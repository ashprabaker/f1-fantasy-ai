import { config } from "dotenv";
import postgres from "postgres";

// Load environment variables
config({ path: ".env.local" });

const createTables = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }

  console.log("Starting table creation...");
  
  // Connect to Postgres
  const sql = postgres(process.env.DATABASE_URL);
  
  try {
    // Add subscription tracking table if not exists
    console.log("Creating subscriptions table...");
    await sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        user_id TEXT PRIMARY KEY,
        membership TEXT NOT NULL DEFAULT 'free',
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log("Subscriptions table created successfully!");
    
    await sql.end();
    console.log("Table creation completed successfully!");
  } catch (error) {
    console.error("Table creation failed:", error);
    process.exit(1);
  }
};

createTables(); 
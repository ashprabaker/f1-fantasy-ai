import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// Load environment variables
config({ path: ".env.local" });

const runMigration = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }

  console.log("Starting migration...");
  
  // Create Postgres client
  const client = postgres(process.env.DATABASE_URL);
  const db = drizzle(client);
  
  // Apply migrations
  try {
    await migrate(db, { migrationsFolder: "db/migrations" });
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
  
  // Close connection
  await client.end();
};

runMigration(); 
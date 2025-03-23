import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { pgTable } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "./schema";

config({ path: ".env.local" });

// Import schemas here after we create them
// import { profilesTable, teamsTable, etc. } from "./schema";

// Define the relations
const teamRelations = relations(schema.teamsTable, ({ many }) => ({
  drivers: many(schema.driversTable),
  constructors: many(schema.constructorsTable)
}));

const driverRelations = relations(schema.driversTable, ({ one }) => ({
  team: one(schema.teamsTable, {
    fields: [schema.driversTable.teamId],
    references: [schema.teamsTable.id]
  })
}));

const constructorRelations = relations(schema.constructorsTable, ({ one }) => ({
  team: one(schema.teamsTable, {
    fields: [schema.constructorsTable.teamId],
    references: [schema.teamsTable.id]
  })
}));

// We'll add schemas to this object as we create them
const schemaObject = {
  profiles: schema.profilesTable,
  teams: schema.teamsTable,
  drivers: schema.driversTable,
  constructors: schema.constructorsTable,
  races: schema.racesTable,
  raceResults: schema.raceResultsTable,
  marketDrivers: schema.marketDriversTable,
  marketConstructors: schema.marketConstructorsTable,
  subscriptions: schema.subscriptionsTable
};

// Create a Postgres client with the connection string
const queryClient = postgres(process.env.DATABASE_URL!);

// Create the database with the schema
export const db = drizzle(queryClient, { schema: schemaObject }); 
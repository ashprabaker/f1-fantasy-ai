import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { relations } from "drizzle-orm";
import postgres from "postgres";
import { 
  profilesTable,
  teamsTable,
  driversTable,
  constructorsTable,
  racesTable,
  raceResultsTable,
  marketDriversTable,
  marketConstructorsTable
} from "./schema";

config({ path: ".env.local" });

// Import schemas here after we create them
// import { profilesTable, teamsTable, etc. } from "./schema";

// Define the relations
const teamRelations = relations(teamsTable, ({ many }) => ({
  drivers: many(driversTable),
  constructors: many(constructorsTable)
}));

const driverRelations = relations(driversTable, ({ one }) => ({
  team: one(teamsTable, {
    fields: [driversTable.teamId],
    references: [teamsTable.id]
  })
}));

const constructorRelations = relations(constructorsTable, ({ one }) => ({
  team: one(teamsTable, {
    fields: [constructorsTable.teamId],
    references: [teamsTable.id]
  })
}));

// We'll add schemas to this object as we create them
const schema = {
  profiles: profilesTable,
  teams: teamsTable,
  drivers: driversTable,
  constructors: constructorsTable,
  races: racesTable,
  raceResults: raceResultsTable,
  marketDrivers: marketDriversTable,
  marketConstructors: marketConstructorsTable
};

const client = postgres(process.env.DATABASE_URL!);

export const db = drizzle(client, { schema }); 
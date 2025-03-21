import { pgTable, text, uuid, timestamp, integer, date } from "drizzle-orm/pg-core";

export const racesTable = pgTable("races", {
  id: uuid("id").defaultRandom().primaryKey(),
  season: integer("season").notNull(),
  round: integer("round").notNull(),
  name: text("name").notNull(),
  circuit: text("circuit").notNull(),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});

export const raceResultsTable = pgTable("race_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  raceId: uuid("race_id").references(() => racesTable.id, { onDelete: "cascade" }).notNull(),
  driverName: text("driver_name").notNull(),
  constructorName: text("constructor_name").notNull(),
  position: integer("position"),
  points: integer("points").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});

export type InsertRace = typeof racesTable.$inferInsert;
export type SelectRace = typeof racesTable.$inferSelect;
export type InsertRaceResult = typeof raceResultsTable.$inferInsert;
export type SelectRaceResult = typeof raceResultsTable.$inferSelect; 
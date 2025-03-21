import { pgTable, text, uuid, timestamp, doublePrecision, integer, boolean } from "drizzle-orm/pg-core";
import { teamsTable } from "./teams-schema";

export const driversTable = pgTable("drivers", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id")
    .references(() => teamsTable.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  price: doublePrecision("price").notNull(),
  points: integer("points").default(0),
  isSelected: boolean("is_selected").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});

export type InsertDriver = typeof driversTable.$inferInsert;
export type SelectDriver = typeof driversTable.$inferSelect; 
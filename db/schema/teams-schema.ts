import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";

export const teamsTable = pgTable("teams", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});

export type InsertTeam = typeof teamsTable.$inferInsert;
export type SelectTeam = typeof teamsTable.$inferSelect; 
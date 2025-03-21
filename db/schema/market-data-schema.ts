import { pgTable, text, uuid, timestamp, doublePrecision, integer } from "drizzle-orm/pg-core";

export const marketDriversTable = pgTable("market_drivers", {
  id: uuid("id").defaultRandom().primaryKey(),
  driverNumber: integer("driver_number").notNull(),
  name: text("name").notNull(),
  price: doublePrecision("price").notNull(),
  team: text("team").notNull(),
  teamColor: text("team_color"),
  points: doublePrecision("points").default(0),
  imageUrl: text("image_url"),
  countryCode: text("country_code"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});

export const marketConstructorsTable = pgTable("market_constructors", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  price: doublePrecision("price").notNull(),
  points: doublePrecision("points").default(0),
  color: text("color"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});

export type InsertMarketDriver = typeof marketDriversTable.$inferInsert;
export type SelectMarketDriver = typeof marketDriversTable.$inferSelect;
export type InsertMarketConstructor = typeof marketConstructorsTable.$inferInsert;
export type SelectMarketConstructor = typeof marketConstructorsTable.$inferSelect; 
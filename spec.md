
# F1 Fantasy Team Advisor - Product Specification

## Overview

F1 Fantasy Team Advisor is a web application that helps users optimize their F1 fantasy teams by providing AI-powered recommendations based on current driver/constructor prices and historical race data.

The app requires users to create an account and subscribe to a Pro tier to access the main dashboard. Once subscribed, users can input their F1 fantasy team (5 drivers and 2 constructors) and receive AI-powered recommendations to improve their team.

### Key Features
- User authentication (signup/login)
- Subscription management (Pro tier)
- Team input and persistence
- AI-powered team recommendations based on:
  - Current driver/constructor prices
  - Historical race data
  - Performance trends

### Tech Stack
- Frontend: Next.js, Tailwind CSS, Shadcn UI, Framer Motion
- Backend: Supabase, Drizzle ORM, Server Actions
- Auth: Clerk
- Payments: Stripe
- Deployment: Vercel

## Implementation Tasks

### 1. Project Setup and Configuration

**Task 1.1: Create Next.js project with Shadcn UI**
- Initialize project: `pnpm dlx shadcn@latest init`
- Configure basic theming
- Set up initial directory structure

**Task 1.2: Set up environment variables**
- Create `.env.local` file with required variables:
```
# DB (Supabase)
DATABASE_URL=

# Auth (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup

# Payments (Stripe)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_YEARLY=
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONTHLY=

# OpenAI
OPENAI_API_KEY=
```

**Task 1.3: Initialize version control and deploy to Vercel**
- Create a new GitHub repository
- Push initial commit
- Deploy to Vercel
- Configure custom domain if needed
- Add environment variables to Vercel

### 2. Database and ORM Setup

**Task 2.1: Set up Supabase**
- Create a new Supabase project
- Save database password
- Get connection URL and add to environment variables

**Task 2.2: Set up Drizzle ORM**
- Install required packages:
```
pnpm i drizzle-orm dotenv postgres
pnpm i -D drizzle-kit
```

**Task 2.3: Configure Drizzle**
- Create `drizzle.config.ts` file:
```typescript
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

export default defineConfig({
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!
  }
});
```

**Task 2.4: Create database file structure**
- Create `db/db.ts` file
- Create `db/schema` directory
- Create `db/queries` directory

### 3. Database Schema Definition

**Task 3.1: Create profile schema**
- Create `db/schema/profiles-schema.ts`:
```typescript
import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const membershipEnum = pgEnum("membership", ["free", "pro"]);

export const profilesTable = pgTable("profiles", {
  userId: text("user_id").primaryKey().notNull(),
  membership: membershipEnum("membership").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});

export type InsertProfile = typeof profilesTable.$inferInsert;
export type SelectProfile = typeof profilesTable.$inferSelect;
```

**Task 3.2: Create F1 team schema**
- Create `db/schema/teams-schema.ts`:
```typescript
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
```

**Task 3.3: Create drivers schema**
- Create `db/schema/drivers-schema.ts`:
```typescript
import { pgTable, text, uuid, timestamp, doublePrecision, integer } from "drizzle-orm/pg-core";
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
```

**Task 3.4: Create constructors schema**
- Create `db/schema/constructors-schema.ts`:
```typescript
import { pgTable, text, uuid, timestamp, doublePrecision, integer, boolean } from "drizzle-orm/pg-core";
import { teamsTable } from "./teams-schema";

export const constructorsTable = pgTable("constructors", {
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

export type InsertConstructor = typeof constructorsTable.$inferInsert;
export type SelectConstructor = typeof constructorsTable.$inferSelect;
```

**Task 3.5: Create historical race data schema**
- Create `db/schema/race-data-schema.ts`:
```typescript
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
```

**Task 3.6: Create market data schema (for current prices)**
- Create `db/schema/market-data-schema.ts`:
```typescript
import { pgTable, text, uuid, timestamp, doublePrecision } from "drizzle-orm/pg-core";

export const marketDriversTable = pgTable("market_drivers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  price: doublePrecision("price").notNull(),
  team: text("team").notNull(),
  totalPoints: doublePrecision("total_points").default(0),
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
  totalPoints: doublePrecision("total_points").default(0),
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
```

**Task 3.7: Export all schemas and set up database connection**
- Create `db/schema/index.ts` to export all schemas
- Update `db/db.ts` with all schemas:
```typescript
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
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
```

**Task 3.8: Add migration scripts to package.json**
- Add the following scripts to package.json:
```json
"scripts": {
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate"
}
```

**Task 3.9: Generate and run migrations**
- Run `pnpm db:generate`
- Run `pnpm db:migrate`

### 4. Database Queries

**Task 4.1: Create profile queries**
- Create `db/queries/profiles-queries.ts`:
```typescript
"use server"

import { db } from "@/db/db";
import { InsertProfile, profilesTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export const createProfile = async (data: InsertProfile) => {
  try {
    const [profile] = await db.insert(profilesTable).values(data).returning();
    return profile;
  } catch (error) {
    console.error("Error creating profile:", error);
    throw new Error("Failed to create profile");
  }
}

export const getProfile = async (userId: string) => {
  try {
    return await db.query.profiles.findFirst({
      where: eq(profilesTable.userId, userId)
    });
  } catch (error) {
    console.error("Error getting profile:", error);
    throw new Error("Failed to get profile");
  }
}

export const updateProfile = async (userId: string, data: Partial<InsertProfile>) => {
  try {
    const [updatedProfile] = await db
      .update(profilesTable)
      .set(data)
      .where(eq(profilesTable.userId, userId))
      .returning();
    return updatedProfile;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw new Error("Failed to update profile");
  }
}

export const updateProfileByStripeCustomerId = async (
  stripeCustomerId: string,
  data: Partial<InsertProfile>
) => {
  try {
    const [updatedProfile] = await db
      .update(profilesTable)
      .set(data)
      .where(eq(profilesTable.stripeCustomerId, stripeCustomerId))
      .returning();
    return updatedProfile;
  } catch (error) {
    console.error("Error updating profile by stripe customer ID:", error);
    throw new Error("Failed to update profile by stripe customer ID");
  }
}
```

**Task 4.2: Create team queries**
- Create `db/queries/teams-queries.ts`:
```typescript
"use server"

import { db } from "@/db/db";
import { InsertTeam, teamsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export const createTeam = async (data: InsertTeam) => {
  try {
    const [team] = await db.insert(teamsTable).values(data).returning();
    return team;
  } catch (error) {
    console.error("Error creating team:", error);
    throw new Error("Failed to create team");
  }
}

export const getUserTeam = async (userId: string) => {
  try {
    return await db.query.teams.findFirst({
      where: eq(teamsTable.userId, userId),
      with: {
        drivers: true,
        constructors: true
      }
    });
  } catch (error) {
    console.error("Error getting user team:", error);
    throw new Error("Failed to get user team");
  }
}

export const updateTeam = async (id: string, data: Partial<InsertTeam>) => {
  try {
    const [updatedTeam] = await db
      .update(teamsTable)
      .set(data)
      .where(eq(teamsTable.id, id))
      .returning();
    return updatedTeam;
  } catch (error) {
    console.error("Error updating team:", error);
    throw new Error("Failed to update team");
  }
}

export const deleteTeam = async (id: string) => {
  try {
    await db.delete(teamsTable).where(eq(teamsTable.id, id));
    return true;
  } catch (error) {
    console.error("Error deleting team:", error);
    throw new Error("Failed to delete team");
  }
}
```

**Task 4.3: Create drivers and constructors queries**
- Create `db/queries/team-members-queries.ts`:
```typescript
"use server"

import { db } from "@/db/db";
import { 
  InsertDriver, 
  InsertConstructor, 
  driversTable, 
  constructorsTable 
} from "@/db/schema";
import { eq } from "drizzle-orm";

// Driver queries
export const addDriverToTeam = async (data: InsertDriver) => {
  try {
    const [driver] = await db.insert(driversTable).values(data).returning();
    return driver;
  } catch (error) {
    console.error("Error adding driver:", error);
    throw new Error("Failed to add driver");
  }
}

export const updateDriver = async (id: string, data: Partial<InsertDriver>) => {
  try {
    const [updatedDriver] = await db
      .update(driversTable)
      .set(data)
      .where(eq(driversTable.id, id))
      .returning();
    return updatedDriver;
  } catch (error) {
    console.error("Error updating driver:", error);
    throw new Error("Failed to update driver");
  }
}

export const removeDriver = async (id: string) => {
  try {
    await db.delete(driversTable).where(eq(driversTable.id, id));
    return true;
  } catch (error) {
    console.error("Error removing driver:", error);
    throw new Error("Failed to remove driver");
  }
}

// Constructor queries
export const addConstructorToTeam = async (data: InsertConstructor) => {
  try {
    const [constructor] = await db.insert(constructorsTable).values(data).returning();
    return constructor;
  } catch (error) {
    console.error("Error adding constructor:", error);
    throw new Error("Failed to add constructor");
  }
}

export const updateConstructor = async (id: string, data: Partial<InsertConstructor>) => {
  try {
    const [updatedConstructor] = await db
      .update(constructorsTable)
      .set(data)
      .where(eq(constructorsTable.id, id))
      .returning();
    return updatedConstructor;
  } catch (error) {
    console.error("Error updating constructor:", error);
    throw new Error("Failed to update constructor");
  }
}

export const removeConstructor = async (id: string) => {
  try {
    await db.delete(constructorsTable).where(eq(constructorsTable.id, id));
    return true;
  } catch (error) {
    console.error("Error removing constructor:", error);
    throw new Error("Failed to remove constructor");
  }
}
```

**Task 4.4: Create market data queries**
- Create `db/queries/market-data-queries.ts`:
```typescript
"use server"

import { db } from "@/db/db";
import { 
  InsertMarketDriver, 
  InsertMarketConstructor, 
  marketDriversTable, 
  marketConstructorsTable 
} from "@/db/schema";

export const getAllMarketDrivers = async () => {
  try {
    return await db.query.marketDrivers.findMany({
      orderBy: (marketDrivers, { desc }) => [desc(marketDrivers.totalPoints)]
    });
  } catch (error) {
    console.error("Error getting market drivers:", error);
    throw new Error("Failed to get market drivers");
  }
}

export const getAllMarketConstructors = async () => {
  try {
    return await db.query.marketConstructors.findMany({
      orderBy: (marketConstructors, { desc }) => [desc(marketConstructors.totalPoints)]
    });
  } catch (error) {
    console.error("Error getting market constructors:", error);
    throw new Error("Failed to get market constructors");
  }
}

export const updateMarketData = async (
  drivers: InsertMarketDriver[],
  constructors: InsertMarketConstructor[]
) => {
  try {
    // Clear existing data
    await db.delete(marketDriversTable);
    await db.delete(marketConstructorsTable);
    
    // Insert new data
    await db.insert(marketDriversTable).values(drivers);
    await db.insert(marketConstructorsTable).values(constructors);
    
    return true;
  } catch (error) {
    console.error("Error updating market data:", error);
    throw new Error("Failed to update market data");
  }
}
```

**Task 4.5: Create race data queries**
- Create `db/queries/race-data-queries.ts`:
```typescript
"use server"

import { db } from "@/db/db";
import { 
  InsertRace,
  InsertRaceResult,
  racesTable,
  raceResultsTable
} from "@/db/schema";
import { eq } from "drizzle-orm";

// Race queries
export const createRace = async (data: InsertRace) => {
  try {
    const [race] = await db.insert(racesTable).values(data).returning();
    return race;
  } catch (error) {
    console.error("Error creating race:", error);
    throw new Error("Failed to create race");
  }
}

export const getAllRaces = async () => {
  try {
    return await db.query.races.findMany({
      orderBy: (races, { desc, asc }) => [desc(races.season), asc(races.round)]
    });
  } catch (error) {
    console.error("Error getting races:", error);
    throw new Error("Failed to get races");
  }
}

// Race results queries
export const addRaceResult = async (data: InsertRaceResult) => {
  try {
    const [result] = await db.insert(raceResultsTable).values(data).returning();
    return result;
  } catch (error) {
    console.error("Error adding race result:", error);
    throw new Error("Failed to add race result");
  }
}

export const getRaceResults = async (raceId: string) => {
  try {
    return await db.query.raceResults.findMany({
      where: eq(raceResultsTable.raceId, raceId),
      orderBy: (results, { asc }) => [asc(results.position)]
    });
  } catch (error) {
    console.error("Error getting race results:", error);
    throw new Error("Failed to get race results");
  }
}
```

### 5. Server Actions

**Task 5.1: Create type definitions**
- Create `types/action-types.ts`:
```typescript
export type ActionState<T> = {
  isSuccess: boolean
  message: string
  data?: T
}
```

- Create `types/index.ts`:
```typescript
export * from "./action-types"
```

**Task 5.2: Create profile actions**
- Create `actions/db/profiles-actions.ts`:
```typescript
"use server"

import { createProfile, getProfile, updateProfile } from "@/db/queries/profiles-queries";
import { InsertProfile, SelectProfile } from "@/db/schema";
import { ActionState } from "@/types";

export async function createProfileAction(
  data: InsertProfile
): Promise<ActionState<SelectProfile>> {
  try {
    const profile = await createProfile(data);
    return {
      isSuccess: true,
      message: "Profile created successfully",
      data: profile
    };
  } catch (error) {
    console.error("Error creating profile:", error);
    return { isSuccess: false, message: "Failed to create profile" };
  }
}

export async function getProfileAction(
  userId: string
): Promise<ActionState<SelectProfile>> {
  try {
    const profile = await getProfile(userId);
    if (!profile) {
      return {
        isSuccess: false,
        message: "Profile not found"
      };
    }
    
    return {
      isSuccess: true,
      message: "Profile retrieved successfully",
      data: profile
    };
  } catch (error) {
    console.error("Error getting profile:", error);
    return { isSuccess: false, message: "Failed to get profile" };
  }
}

export async function updateProfileAction(
  userId: string,
  data: Partial<InsertProfile>
): Promise<ActionState<SelectProfile>> {
  try {
    const updatedProfile = await updateProfile(userId, data);
    return {
      isSuccess: true,
      message: "Profile updated successfully",
      data: updatedProfile
    };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { isSuccess: false, message: "Failed to update profile" };
  }
}
```

**Task 5.3: Create team actions**
- Create `actions/db/teams-actions.ts`:
```typescript
"use server"

import { createTeam, getUserTeam, updateTeam, deleteTeam } from "@/db/queries/teams-queries";
import { InsertTeam, SelectTeam } from "@/db/schema";
import { ActionState } from "@/types";
import { revalidatePath } from "next/cache";

export async function createTeamAction(
  data: InsertTeam
): Promise<ActionState<SelectTeam>> {
  try {
    const team = await createTeam(data);
    revalidatePath("/dashboard");
    return {
      isSuccess: true,
      message: "Team created successfully",
      data: team
    };
  } catch (error) {
    console.error("Error creating team:", error);
    return { isSuccess: false, message: "Failed to create team" };
  }
}

export async function getUserTeamAction(
  userId: string
): Promise<ActionState<SelectTeam>> {
  try {
    const team = await getUserTeam(userId);
    if (!team) {
      return {
        isSuccess: false,
        message: "Team not found"
      };
    }
    
    return {
      isSuccess: true,
      message: "Team retrieved successfully",
      data: team
    };
  } catch (error) {
    console.error("Error getting user team:", error);
    return { isSuccess: false, message: "Failed to get user team" };
  }
}

export async function updateTeamAction(
  id: string,
  data: Partial<InsertTeam>
): Promise<ActionState<SelectTeam>> {
  try {
    const updatedTeam = await updateTeam(id, data);
    revalidatePath("/dashboard");
    return {
      isSuccess: true,
      message: "Team updated successfully",
      data: updatedTeam
    };
  } catch (error) {
    console.error("Error updating team:", error);
    return { isSuccess: false, message: "Failed to update team" };
  }
}

export async function deleteTeamAction(
  id: string
): Promise<ActionState<boolean>> {
  try {
    await deleteTeam(id);
    revalidatePath("/dashboard");
    return {
      isSuccess: true,
      message: "Team deleted successfully",
      data: true
    };
  } catch (error) {
    console.error("Error deleting team:", error);
    return { isSuccess: false, message: "Failed to delete team" };
  }
}
```

**Task 5.4: Create team members actions**
- Create `actions/db/team-members-actions.ts`:
```typescript
"use server"

import {
  addDriverToTeam,
  updateDriver,
  removeDriver,
  addConstructorToTeam,
  updateConstructor,
  removeConstructor
} from "@/db/queries/team-members-queries";
import {
  InsertDriver,
  SelectDriver,
  InsertConstructor,
  SelectConstructor
} from "@/db/schema";
import { ActionState } from "@/types";
import { revalidatePath } from "next/cache";

// Driver actions
export async function addDriverAction(
  data: InsertDriver
): Promise<ActionState<SelectDriver>> {
  try {
    const driver = await addDriverToTeam(data);
    revalidatePath("/dashboard");
    return {
      isSuccess: true,
      message: "Driver added successfully",
      data: driver
    };
  } catch (error) {
    console.error("Error adding driver:", error);
    return { isSuccess: false, message: "Failed to add driver" };
  }
}

export async function updateDriverAction(
  id: string,
  data: Partial<InsertDriver>
): Promise<ActionState<SelectDriver>> {
  try {
    const updatedDriver = await updateDriver(id, data);
    revalidatePath("/dashboard");
    return {
      isSuccess: true,
      message: "Driver updated successfully",
      data: updatedDriver
    };
  } catch (error) {
    console.error("Error updating driver:", error);
    return { isSuccess: false, message: "Failed to update driver" };
  }
}

export async function removeDriverAction(
  id: string
): Promise<ActionState<boolean>> {
  try {
    await removeDriver(id);
    revalidatePath("/dashboard");
    return {
      isSuccess: true,
      message: "Driver removed successfully",
      data: true
    };
  } catch (error) {
    console.error("Error removing driver:", error);
    return { isSuccess: false, message: "Failed to remove driver" };
  }
}

// Constructor actions
export async function addConstructorAction(
  data: InsertConstructor
): Promise<ActionState<SelectConstructor>> {
  try {
    const constructor = await addConstructorToTeam(data);
    revalidatePath("/dashboard");
    return {
      isSuccess: true,
      message: "Constructor added successfully",
      data: constructor
    };
  } catch (error) {
    console.error("Error adding constructor:", error);
    return { isSuccess: false, message: "Failed to add constructor" };
  }
}

export async function updateConstructorAction(
  id: string,
  data: Partial<InsertConstructor>
): Promise<ActionState<SelectConstructor>> {
  try {
    const updatedConstructor = await updateConstructor(id, data);
    revalidatePath("/dashboard");
    return {
      isSuccess: true,
      message: "Constructor updated successfully",
      data: updatedConstructor
    };
  } catch (error) {
    console.error("Error updating constructor:", error);
    return { isSuccess: false, message: "Failed to update constructor" };
  }
}

export async function removeConstructorAction(
  id: string
): Promise<ActionState<boolean>> {
  try {
    await removeConstructor(id);
    revalidatePath("/dashboard");
    return {
      isSuccess: true,
      message: "Constructor removed successfully",
      data: true
    };
  } catch (error) {
    console.error("Error removing constructor:", error);
    return { isSuccess: false, message: "Failed to remove constructor" };
  }
}
```

**Task 5.5: Create market data actions**
- Create `actions/db/market-data-actions.ts`:
```typescript
"use server"

import { 
  getAllMarketDrivers, 
  getAllMarketConstructors, 
  updateMarketData
} from "@/db/queries/market-data-queries";
import { 
  InsertMarketDriver, 
  SelectMarketDriver, 
  InsertMarketConstructor, 
  SelectMarketConstructor 
} from "@/db/schema";
import { ActionState } from "@/types";
import { revalidatePath } from "next/cache";

export async function getMarketDriversAction(): Promise<ActionState<SelectMarketDriver[]>> {
  try {
    const drivers = await getAllMarketDrivers();
    return {
      isSuccess: true,
      message: "Market drivers retrieved successfully",
      data: drivers
    };
  } catch (error) {
    console.error("Error getting market drivers:", error);
    return { isSuccess: false, message: "Failed to get market drivers" };
  }
}

export async function getMarketConstructorsAction(): Promise<ActionState<SelectMarketConstructor[]>> {
  try {
    const constructors = await getAllMarketConstructors();
    return {
      isSuccess: true,
      message: "Market constructors retrieved successfully",
      data: constructors
    };
  } catch (error) {
    console.error("Error getting market constructors:", error);
    return { isSuccess: false, message: "Failed to get market constructors" };
  }
}

export async function updateMarketDataAction(
  drivers: InsertMarketDriver[],
  constructors: InsertMarketConstructor[]
): Promise<ActionState<boolean>> {
  try {
    await updateMarketData(drivers, constructors);
    revalidatePath("/dashboard");
    return {
      isSuccess: true,
      message: "Market data updated successfully",
      data: true
    };
  } catch (error) {
    console.error("Error updating market data:", error);
    return { isSuccess: false, message: "Failed to update market data" };
  }
}
```

**Task 5.6: Create AI recommendation actions**
- Create `lib/openai.ts`:
```typescript
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
```

- Create `actions/ai-recommendation-actions.ts`:
```typescript
"use server"

import { openai } from "@/lib/openai";
import { ActionState } from "@/types";
import { SelectMarketDriver, SelectMarketConstructor, SelectDriver, SelectConstructor } from "@/db/schema";

interface TeamData {
  drivers: SelectDriver[];
  constructors: SelectConstructor[];
}

interface Recommendation {
  analysis: string;
  driverSuggestions: {
    toAdd: SelectMarketDriver[];
    toRemove: SelectDriver[];
  };
  constructorSuggestions: {
    toAdd: SelectMarketConstructor[];
    toRemove: SelectConstructor[];
  };
}

export async function generateTeamRecommendationsAction(
  teamData: TeamData,
  marketDrivers: SelectMarketDriver[],
  marketConstructors: SelectMarketConstructor[]
): Promise<ActionState<Recommendation>> {
  try {
    // Calculate team budget
    const totalDriverPrice = teamData.drivers.reduce((sum, driver) => sum + driver.price, 0);
    const totalConstructorPrice = teamData.constructors.reduce((sum, constructor) => sum + constructor.price, 0);
    const totalBudget = totalDriverPrice + totalConstructorPrice;
    
    // Prepare the data for the AI prompt
    const prompt = `
      I need recommendations for an F1 Fantasy team. Here's the current team:
      
      Current Drivers:
      ${teamData.drivers.map(d => `- ${d.name} (Price: $${d.price}M, Points: ${d.points})`).join('\n')}
      
      Current Constructors:
      ${teamData.constructors.map(c => `- ${c.name} (Price: $${c.price}M, Points: ${c.points})`).join('\n')}
      
      Total Budget: $${totalBudget}M
      
      Available Drivers:
      ${marketDrivers.map(d => `- ${d.name} (Price: $${d.price}M, Points: ${d.totalPoints}, Team: ${d.team})`).join('\n')}
      
      Available Constructors:
      ${marketConstructors.map(c => `- ${c.name} (Price: $${c.price}M, Points: ${c.totalPoints})`).join('\n')}
      
      Please analyze the current team and provide recommendations to improve performance.
      Suggest which drivers and constructors to add or remove based on their price, recent performance, and value for money.
      Provide a list of specific drivers and constructors to add and remove, along with a detailed analysis.
      Ensure that the recommended team follows F1 Fantasy rules (5 drivers and 2 constructors) and stays within the budget.
    `;
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert F1 Fantasy advisor. Provide detailed analysis and recommendations for Fantasy F1 teams."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });
    
    // Parse AI response (this is simplified - you would need to parse the actual AI response)
    const aiResponse = response.choices[0].message.content || "";
    
    // Process AI response to extract recommendations
    // This is a simplified example - you would need to implement proper parsing
    const recommendation: Recommendation = {
      analysis: aiResponse,
      driverSuggestions: {
        toAdd: [], // Would be populated based on AI response
        toRemove: [] // Would be populated based on AI response
      },
      constructorSuggestions: {
        toAdd: [], // Would be populated based on AI response
        toRemove: [] // Would be populated based on AI response
      }
    };
    
    return {
      isSuccess: true,
      message: "Recommendations generated successfully",
      data: recommendation
    };
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return { isSuccess: false, message: "Failed to generate recommendations" };
  }
}
```

### 6. Authentication Setup

**Task 6.1: Install Clerk**
- Install required packages:
```
pnpm i @clerk/nextjs @clerk/themes
```

**Task 6.2: Set up middleware**
- Create `middleware.ts` in the root directory:
```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = auth();

  // If the user isn't signed in and the route is private, redirect to sign-in
  if (!userId && isProtectedRoute(req)) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // If the user is logged in and the route is protected, let them view.
  if (userId && isProtectedRoute(req)) {
    return NextResponse.next();
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"]
};
```

**Task 6.3: Create utilities and providers**
- Create `components/utilities/providers.tsx`:
```typescript
"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProviderProps } from "next-themes/dist/types";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

export const Providers = ({ children, ...props }: ThemeProviderProps) => {
  const { theme } = useTheme();

  return (
    <ClerkProvider
      appearance={{
        baseTheme: theme === "dark" ? dark : undefined
      }}
    >
      <NextThemesProvider {...props}>
        <TooltipProvider>{children}</TooltipProvider>
      </NextThemesProvider>
    </ClerkProvider>
  );
};
```

**Task 6.4: Update main layout**
- Update `app/layout.tsx` to include the Providers:
```typescript
"use server";

import { Providers } from "@/components/utilities/providers";
import "@/app/globals.css";
import { auth } from "@clerk/nextjs/server";
import { createProfileAction } from "@/actions/db/profiles-actions";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = auth();

  // Create profile if user is signed in and doesn't have one
  if (userId) {
    await createProfileAction({
      userId,
      membership: "free"
    });
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
        >
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

**Task 6.5: Create auth pages**
- Create `app/(auth)/layout.tsx`:
```typescript
"use server";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex h-screen items-center justify-center">
      {children}
    </div>
  );
}
```

- Create `app/(auth)/login/[[...login]]/page.tsx`:
```typescript
"use client";

import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

export default function SignInPage() {
  const { theme } = useTheme();

  return (
    <SignIn
      forceRedirectUrl="/dashboard"
      appearance={{ baseTheme: theme === "dark" ? dark : undefined }}
    />
  );
}
```

- Create `app/(auth)/signup/[[...signup]]/page.tsx`:
```typescript
"use client";

import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

export default function SignUpPage() {
  const { theme } = useTheme();

  return (
    <SignUp
      forceRedirectUrl="/dashboard"
      appearance={{ baseTheme: theme === "dark" ? dark : undefined }}
    />
  );
}
```

### 7. Stripe Payment Setup

**Task 7.1: Install Stripe**
- Install required packages:
```
pnpm i stripe
```

**Task 7.2: Create Stripe utility**
- Create `lib/stripe.ts`:
```typescript
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
  typescript: true
});
```

**Task 7.3: Create Stripe actions**
- Create `actions/stripe-actions.ts`:
```typescript
"use server"

import { updateProfile, updateProfileByStripeCustomerId } from "@/db/queries/profiles-queries";
import { SelectProfile } from "@/db/schema";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

type MembershipStatus = SelectProfile["membership"];

const getMembershipStatus = (status: Stripe.Subscription.Status, membership: MembershipStatus): MembershipStatus => {
  switch (status) {
    case "active":
    case "trialing":
      return membership;
    case "canceled":
    case "incomplete":
    case "incomplete_expired":
    case "past_due":
    case "paused":
    case "unpaid":
      return "free";
    default:
      return "free";
  }
};

const getSubscription = async (subscriptionId: string) => {
  return stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["default_payment_method"]
  });
};

export const updateStripeCustomer = async (userId: string, subscriptionId: string, customerId: string) => {
  try {
    if (!userId || !subscriptionId || !customerId) {
      throw new Error("Missing required parameters for updateStripeCustomer");
    }

    const subscription = await getSubscription(subscriptionId);

    const updatedProfile = await updateProfile(userId, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id
    });

    if (!updatedProfile) {
      throw new Error("Failed to update customer profile");
    }

    return updatedProfile;
  } catch (error) {
    console.error("Error in updateStripeCustomer:", error);
    throw error instanceof Error ? error : new Error("Failed to update Stripe customer");
  }
};

export const manageSubscriptionStatusChange = async (subscriptionId: string, customerId: string, productId: string): Promise<MembershipStatus> => {
  try {
    if (!subscriptionId || !customerId || !productId) {
      throw new Error("Missing required parameters for manageSubscriptionStatusChange");
    }

    const subscription = await getSubscription(subscriptionId);

    const product = await stripe.products.retrieve(productId);
    const membership = product.metadata.membership as MembershipStatus;
    if (!["free", "pro"].includes(membership)) {
      throw new Error(`Invalid membership type in product metadata: ${membership}`);
    }

    const membershipStatus = getMembershipStatus(subscription.status, membership);

    await updateProfileByStripeCustomerId(customerId, {
      stripeSubscriptionId: subscription.id,
      membership: membershipStatus
    });

    return membershipStatus;
  } catch (error) {
    console.error("Error in manageSubscriptionStatusChange:", error);
    throw error instanceof Error ? error : new Error("Failed to update subscription status");
  }
};
```

**Task 7.4: Create Stripe webhooks**
- Create `app/api/stripe/webhooks/route.ts`:
```typescript
"use server"

import { manageSubscriptionStatusChange, updateStripeCustomer } from "@/actions/stripe-actions";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import Stripe from "stripe";

const relevantEvents = new Set([
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted"
]);

export async function POST(req: Request) {
  const body = await req.text();
  

# F1 Fantasy Team Advisor - Frontend Implementation

Now let's define the frontend components and pages for the application. We'll use Shadcn UI components throughout and ensure everything integrates with the backend we've already specified.

## 8. Frontend Structure and Components

### Task 8.1: Create Basic UI Components

**Create Header Component**
- Create `components/ui/header.tsx`:
```tsx
"use client"

import { UserButton } from "@clerk/nextjs"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function Header() {
  const pathname = usePathname()
  
  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-xl">F1 Advisor</Link>
          
          <nav className="hidden md:flex gap-6">
            <Link 
              href="/dashboard" 
              className={cn(
                "transition-colors hover:text-foreground/80", 
                pathname.startsWith("/dashboard") ? "text-foreground font-medium" : "text-foreground/60"
              )}
            >
              Dashboard
            </Link>
            <Link 
              href="/pricing" 
              className={cn(
                "transition-colors hover:text-foreground/80", 
                pathname === "/pricing" ? "text-foreground font-medium" : "text-foreground/60"
              )}
            >
              Pricing
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <ModeToggle />
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  )
}
```

**Create Mode Toggle**
- Create `components/ui/mode-toggle.tsx`:
```tsx
"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Moon, Sun } from "lucide-react"

export function ModeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

**Create Footer Component**
- Create `components/ui/footer.tsx`:
```tsx
"use server"

import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-8">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          &copy; {new Date().getFullYear()} F1 Fantasy Team Advisor. All rights reserved.
        </p>
        <div className="flex gap-4">
          <Link 
            href="/terms" 
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            Terms
          </Link>
          <Link 
            href="/privacy" 
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  )
}
```

### Task 8.2: Create Marketing Pages

**Create Landing Page**
- Create `app/(marketing)/page.tsx`:
```tsx
"use server"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { ArrowRight, Check } from "lucide-react"

export default async function LandingPage() {
  const { userId } = auth()
  
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <main className="flex-1">
        <section className="py-12 md:py-16 lg:py-20">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  Optimize Your F1 Fantasy Team
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Get AI-powered recommendations to improve your F1 Fantasy team performance and beat your friends
                </p>
              </div>
              <div className="space-x-4">
                {userId ? (
                  <Button asChild size="lg">
                    <Link href="/dashboard">
                      Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild size="lg">
                      <Link href="/signup">
                        Get Started <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <Link href="/login">
                        Log in
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
        
        <section className="bg-muted py-12 md:py-16 lg:py-20">
          <div className="container px-4 md:px-6">
            <div className="mx-auto grid max-w-5xl items-center gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                  Why Choose Our F1 Fantasy Advisor?
                </h2>
                <p className="text-muted-foreground md:text-lg">
                  Our AI-powered recommendations analyze current prices, historical data, and performance trends to help you make better decisions.
                </p>
              </div>
              <div className="grid gap-4">
                <div className="flex items-start gap-4">
                  <Check className="h-6 w-6 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-bold">AI-Powered Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      Get personalized recommendations based on your current team
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Check className="h-6 w-6 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-bold">Data-Driven Decisions</h3>
                    <p className="text-sm text-muted-foreground">
                      Recommendations based on historical race data and current prices
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Check className="h-6 w-6 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-bold">Save Your Team</h3>
                    <p className="text-sm text-muted-foreground">
                      No need to re-enter your team each time you visit
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
```

**Create Pricing Page**
- Create `app/(marketing)/pricing/page.tsx`:
```tsx
"use server"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { auth } from "@clerk/nextjs/server"
import { Check } from "lucide-react"

export default async function PricingPage() {
  const { userId } = auth()

  return (
    <div className="container py-12 max-w-5xl">
      <div className="flex flex-col items-center text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Simple, Transparent Pricing</h1>
        <p className="mt-4 text-muted-foreground max-w-[700px]">
          Maximize your F1 Fantasy performance with our premium features
        </p>
      </div>
      
      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-2xl">Free Plan</CardTitle>
            <div className="mt-4 flex items-baseline justify-center">
              <span className="text-5xl font-extrabold tracking-tight">$0</span>
              <span className="ml-1 text-xl text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3">
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Limited team analysis</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Basic recommendations</span>
              </li>
              <li className="flex items-center text-muted-foreground">
                <Check className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>No team save functionality</span>
              </li>
              <li className="flex items-center text-muted-foreground">
                <Check className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Limited market data access</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" asChild>
              <a href={userId ? "/dashboard" : "/signup"}>
                {userId ? "Access Dashboard" : "Sign Up for Free"}
              </a>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="flex flex-col border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Pro Plan</CardTitle>
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                Recommended
              </span>
            </div>
            <div className="mt-4 flex items-baseline justify-center">
              <span className="text-5xl font-extrabold tracking-tight">$9.99</span>
              <span className="ml-1 text-xl text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3">
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Advanced team analysis</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>AI-powered detailed recommendations</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Save and update your team</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Full access to market data and trends</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Weekly personalized insights</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" asChild>
              <a
                href={userId ? `${process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONTHLY}?client_reference_id=${userId}` : "/signup"}
              >
                {userId ? "Upgrade to Pro" : "Sign Up for Pro"}
              </a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
```

**Create Marketing Layout**
- Create `app/(marketing)/layout.tsx`:
```tsx
"use server"

import { Header } from "@/components/ui/header"
import { Footer } from "@/components/ui/footer"

interface MarketingLayoutProps {
  children: React.ReactNode
}

export default async function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
```

### Task 8.3: Create Dashboard Components

**Create Dashboard Layout**
- Create `app/dashboard/layout.tsx`:
```tsx
"use server"

import { Header } from "@/components/ui/header"
import { Footer } from "@/components/ui/footer"
import { Sidebar } from "@/app/dashboard/_components/sidebar"
import { auth } from "@clerk/nextjs/server"
import { getProfileAction } from "@/actions/db/profiles-actions"
import { redirect } from "next/navigation"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const { userId } = auth()
  
  if (!userId) {
    redirect("/login")
  }
  
  const { data: profile, isSuccess } = await getProfileAction(userId)
  
  // If user is not a pro member, redirect to pricing
  if (isSuccess && profile?.membership !== "pro") {
    redirect("/pricing")
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <Sidebar />
        <main className="relative py-6">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  )
}
```

**Create Sidebar Component**
- Create `app/dashboard/_components/sidebar.tsx`:
```tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard,
  LineChart,
  Flag,
  Settings,
  Users
} from "lucide-react"

const items = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard
  },
  {
    title: "Team",
    href: "/dashboard/team",
    icon: Users
  },
  {
    title: "Market",
    href: "/dashboard/market",
    icon: LineChart
  },
  {
    title: "Race Data",
    href: "/dashboard/races",
    icon: Flag
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings
  }
]

export function Sidebar() {
  const pathname = usePathname()
  
  return (
    <aside className="fixed top-16 z-30 -ml-2 hidden h-[calc(100vh-4rem)] w-full shrink-0 md:sticky md:block">
      <div className="h-full py-6 pr-6 lg:py-8">
        <nav className="flex flex-col space-y-2">
          {items.map((item) => (
            <Button
              key={item.href}
              variant={pathname === item.href ? "default" : "ghost"}
              className={cn(
                "justify-start",
                pathname === item.href ? 
                  "bg-primary text-primary-foreground" : 
                  "hover:bg-muted"
              )}
              asChild
            >
              <Link href={item.href}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </Link>
            </Button>
          ))}
        </nav>
      </div>
    </aside>
  )
}
```

**Create Dashboard Overview Page**
- Create `app/dashboard/page.tsx`:
```tsx
"use server"

import { getUserTeamAction } from "@/actions/db/teams-actions"
import { getMarketDriversAction, getMarketConstructorsAction } from "@/actions/db/market-data-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { auth } from "@clerk/nextjs/server"
import Link from "next/link"
import { LineChart, TrendingUp, Users, AlertTriangle } from "lucide-react"

export default async function DashboardPage() {
  const { userId } = auth()
  
  if (!userId) {
    return null
  }
  
  const [teamResult, driversResult, constructorsResult] = await Promise.all([
    getUserTeamAction(userId),
    getMarketDriversAction(),
    getMarketConstructorsAction()
  ])
  
  const hasTeam = teamResult.isSuccess && teamResult.data
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Get an overview of your F1 Fantasy team and recommendations.
        </p>
      </div>
      
      {!hasTeam ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" />
              Setup Required
            </CardTitle>
            <CardDescription>
              You need to set up your F1 Fantasy team before we can provide recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/team">
                Set Up Your Team
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Team Value
              </CardTitle>
              <LineChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${calculateTeamValue(teamResult.data)}M
              </div>
              <p className="text-xs text-muted-foreground">
                Budget limit: $100M
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Team Performance
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {calculateTeamPoints(teamResult.data)} pts
              </div>
              <p className="text-xs text-muted-foreground">
                +14% from last week
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Team Members
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {teamResult.data?.drivers?.length || 0} Drivers, {teamResult.data?.constructors?.length || 0} Constructors
              </div>
              <p className="text-xs text-muted-foreground">
                Required: 5 Drivers, 2 Constructors
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Market Movements</CardTitle>
            <CardDescription>
              Top drivers with the biggest price changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {driversResult.isSuccess && driversResult.data && driversResult.data.length > 0 ? (
              <div className="space-y-2">
                {driversResult.data.slice(0, 5).map((driver) => (
                  <div key={driver.id} className="flex items-center justify-between">
                    <span className="font-medium">{driver.name}</span>
                    <span className="text-sm">${driver.price}M</span>
                  </div>
                ))}
                <Button variant="link" size="sm" asChild className="px-0">
                  <Link href="/dashboard/market">
                    View all market data
                  </Link>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No market data available</p>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Your Team</CardTitle>
            <CardDescription>
              Your current F1 Fantasy team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasTeam ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Drivers</h4>
                  <div className="space-y-2">
                    {teamResult.data?.drivers?.map((driver) => (
                      <div key={driver.id} className="flex items-center justify-between">
                        <span>{driver.name}</span>
                        <span className="text-sm">${driver.price}M</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Constructors</h4>
                  <div className="space-y-2">
                    {teamResult.data?.constructors?.map((constructor) => (
                      <div key={constructor.id} className="flex items-center justify-between">
                        <span>{constructor.name}</span>
                        <span className="text-sm">${constructor.price}M</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button asChild>
                  <Link href="/dashboard/team">
                    Manage Your Team
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
                <p className="text-sm text-muted-foreground mb-4">You haven't set up your team yet</p>
                <Button asChild>
                  <Link href="/dashboard/team">
                    Set Up Your Team
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function calculateTeamValue(team: any) {
  if (!team) return 0
  
  const driverTotal = team.drivers?.reduce((sum: number, driver: any) => sum + driver.price, 0) || 0
  const constructorTotal = team.constructors?.reduce((sum: number, constructor: any) => sum + constructor.price, 0) || 0
  
  return (driverTotal + constructorTotal).toFixed(1)
}

function calculateTeamPoints(team: any) {
  if (!team) return 0
  
  const driverPoints = team.drivers?.reduce((sum: number, driver: any) => sum + (driver.points || 0), 0) || 0
  const constructorPoints = team.constructors?.reduce((sum: number, constructor: any) => sum + (constructor.points || 0), 0) || 0
  
  return driverPoints + constructorPoints
}
```

### Task 8.4: Create Team Management Components

**Create Team Management Page**
- Create `app/dashboard/team/page.tsx`:
```tsx
"use server"

import { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"
import { TeamForm } from "../_components/team-form"
import { TeamFormFetcher } from "../_components/team-form-fetcher"
import { Skeleton } from "@/components/ui/skeleton"

export default async function TeamPage() {
  const { userId } = auth()
  
  if (!userId) {
    return null
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Your F1 Fantasy Team</h2>
        <p className="text-muted-foreground">
          Manage your drivers and constructors to optimize your team performance.
        </p>
      </div>
      
      <Suspense fallback={<TeamFormSkeleton />}>
        <TeamFormFetcher userId={userId} />
      </Suspense>
    </div>
  )
}

function TeamFormSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
      
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array(2).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
      
      <Skeleton className="h-10 w-32" />
    </div>
  )
}
```

**Create Team Form Fetcher Component**
- Create `app/dashboard/_components/team-form-fetcher.tsx`:
```tsx
"use server"

import { getUserTeamAction } from "@/actions/db/teams-actions"
import { getMarketDriversAction, getMarketConstructorsAction } from "@/actions/db/market-data-actions"
import { TeamForm } from "./team-form"

interface TeamFormFetcherProps {
  userId: string
}

export async function TeamFormFetcher({ userId }: TeamFormFetcherProps) {
  const [teamResult, driversResult, constructorsResult] = await Promise.all([
    getUserTeamAction(userId),
    getMarketDriversAction(),
    getMarketConstructorsAction()
  ])
  
  return (
    <TeamForm
      userId={userId}
      initialTeam={teamResult.data}
      marketDrivers={driversResult.data || []}
      marketConstructors={constructorsResult.data || []}
    />
  )
}
```

**Create Team Form Component**
- Create `app/dashboard/_components/team-form.tsx`:
```tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DialogTrigger, DialogTitle, DialogDescription, DialogHeader, DialogFooter, DialogContent, Dialog } from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { createTeamAction, updateTeamAction } from "@/actions/db/teams-actions"
import { addDriverAction, removeDriverAction, addConstructorAction, removeConstructorAction } from "@/actions/db/team-members-actions"
import { generateTeamRecommendationsAction } from "@/actions/ai-recommendation-actions"
import { AlertCircle, Plus, X, Check, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { SelectTeam, SelectDriver, SelectConstructor, SelectMarketDriver, SelectMarketConstructor } from "@/db/schema"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { v4 as uuidv4 } from "uuid"

interface TeamFormProps {
  userId: string
  initialTeam?: SelectTeam & {
    drivers: SelectDriver[]
    constructors: SelectConstructor[]
  }
  marketDrivers: SelectMarketDriver[]
  marketConstructors: SelectMarketConstructor[]
}

export function TeamForm({ userId, initialTeam, marketDrivers, marketConstructors }: TeamFormProps) {
  const [team, setTeam] = useState<SelectTeam | undefined>(initialTeam)
  const [drivers, setDrivers] = useState<SelectDriver[]>(initialTeam?.drivers || [])
  const [constructors, setConstructors] = useState<SelectConstructor[]>(initialTeam?.constructors || [])
  const [recommendation, setRecommendation] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showDriverDialog, setShowDriverDialog] = useState<boolean>(false)
  const [showConstructorDialog, setShowConstructorDialog] = useState<boolean>(false)
  const [showRecommendationDialog, setShowRecommendationDialog] = useState<boolean>(false)
  
  const totalBudget = 100
  const usedBudget = drivers.reduce((sum, driver) => sum + driver.price, 0) + 
                     constructors.reduce((sum, constructor) => sum + constructor.price, 0)
  const remainingBudget = totalBudget - usedBudget
  
  // Filter out drivers and constructors already in team
  const availableDrivers = marketDrivers.filter(
    md => !drivers.some(d => d.name === md.name)
  )
  
  const availableConstructors = marketConstructors.filter(
    mc => !constructors.some(c => c.name === mc.name)
  )
  
  async function saveTeam() {
    setIsLoading(true)
    
    try {
      if (!team) {
        // Create new team
        const result = await createTeamAction({
          userId,
          name: "My F1 Fantasy Team"
        })
        
        if (result.isSuccess && result.data) {
          setTeam(result.data)
          toast.success("Team created successfully")
        } else {
          toast.error(result.message || "Failed to create team")
          return
        }
      }
      
      // Add drivers if needed
      for (const driver of drivers) {
        if (!driver.id.includes("-")) continue // Skip already saved drivers
        
        await addDriverAction({
          ...driver,
          teamId: team?.id || result.data.id
        })
      }
      
      // Add constructors if needed
      for (const constructor of constructors) {
        if (!constructor.id.includes("-")) continue // Skip already saved constructors
        
        await addConstructorAction({
          ...constructor,
          teamId: team?.id || result.data.id
        })
      }
      
      toast.success("Team saved successfully")
    } catch (error) {
      console.error("Error saving team:", error)
      toast.error("An error occurred while saving the team")
    } finally {
      setIsLoading(false)
    }
  }
  
  async function addDriver(marketDriver: SelectMarketDriver) {
    if (drivers.length >= 5) {
      toast.error("You can only have 5 drivers in your team")
      return
    }
    
    if (usedBudget + marketDriver.price > totalBudget) {
      toast.error("Adding this driver would exceed your budget")
      return
    }
    
    const newDriver: SelectDriver = {
      id: uuidv4(), // Temporary ID until saved
      teamId: team?.id || "",
      name: marketDriver.name,
      price: marketDriver.price,
      points: marketDriver.totalPoints || 0,
      isSelected: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    setDrivers([...drivers, newDriver])
    setShowDriverDialog(false)
  }
  
  async function addConstructor(marketConstructor: SelectMarketConstructor) {
    if (constructors.length >= 2) {
      toast.error("You can only have 2 constructors in your team")
      return
    }
    
    if (usedBudget + marketConstructor.price > totalBudget) {
      toast.error("Adding this constructor would exceed your budget")
      return
    }
    
    const newConstructor: SelectConstructor = {
      id: uuidv4(), // Temporary ID until saved
      teamId: team?.id || "",
      name: marketConstructor.name,
      price: marketConstructor.price,
      points: marketConstructor.totalPoints || 0,
      isSelected: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    setConstructors([...constructors, newConstructor])
    setShowConstructorDialog(false)
  }
  
  function removeDriver(index: number) {
    const newDrivers = [...drivers]
    newDrivers.splice(index, 1)
    setDrivers(newDrivers)
  }
  
  function removeConstructor(index: number) {
    const newConstructors = [...constructors]
    newConstructors.splice(index, 1)
    setConstructors(newConstructors)
  }
  
  async function getRecommendations() {
    if (!team || drivers.length === 0 || constructors.length === 0) {
      toast.error("Please save your team first")
      return
    }
    
    setIsLoading(true)
    
    try {
      const result = await generateTeamRecommendationsAction(
        { drivers, constructors },
        marketDrivers,
        marketConstructors
      )
      
      if (result.isSuccess && result.data) {
        setRecommendation(result.data.analysis)
        setShowRecommendationDialog(true)
      } else {
        toast.error(result.message || "Failed to generate recommendations")
      }
    } catch (error) {
      console.error("Error generating recommendations:", error)
      toast.error("An error occurred while generating recommendations")
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="space-y-8">
      {(!team || drivers.length < 5 || constructors.length < 2) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Attention needed</AlertTitle>
          <AlertDescription>
            Your team is incomplete. You need exactly 5 drivers and 2 constructors.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-between items-center">
        <div>
          <p className="text-lg font-medium">
            Budget: ${usedBudget.toFixed(1)}M / ${totalBudget}M
          </p>
          <p className="text-sm text-muted-foreground">
            Remaining: ${remainingBudget.toFixed(1)}M
          </p>
        </div>
        
        <div className="space-x-4">
          <Button onClick={saveTeam} disabled={isLoading}>
            Save Team
          </Button>
          <Button 
            variant="outline" 
            onClick={getRecommendations} 
            disabled={isLoading || !team || drivers.length < 5 || constructors.length < 2}
          >
            Get Recommendations
          </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-medium">Drivers ({drivers.length}/5)</h3>
          <Dialog open={showDriverDialog} onOpenChange={setShowDriverDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={drivers.length >= 5}>
                <Plus className="mr-2 h-4 w-4" /> Add Driver
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Driver</DialogTitle>
                <DialogDescription>
                  Select a driver to add to your team.
                </DialogDescription>
              </DialogHeader>
              
              <Command>
                <CommandInput placeholder="Search drivers..." />
                <CommandList>
                  <CommandEmpty>No drivers found.</CommandEmpty>
                  <CommandGroup>
                    {availableDrivers.map((driver) => (
                      <CommandItem
                        key={driver.id}
                        onSelect={() => addDriver(driver)}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span>{driver.name}</span>
                          <Badge variant="outline">${driver.price}M</Badge>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDriverDialog(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {drivers.map((driver, index) => (
            <Card key={driver.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex justify-between items-center">
                  {driver.name}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDriver(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price</span>
                  <span>${driver.price}M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Points</span>
                  <span>{driver.points}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-medium">Constructors ({constructors.length}/2)</h3>
          <Dialog open={showConstructorDialog} onOpenChange={setShowConstructorDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={constructors.length >= 2}>
                <Plus className="mr-2 h-4 w-4" /> Add Constructor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Constructor</DialogTitle>
                <DialogDescription>
                  Select a constructor to add to your team.
                </DialogDescription>
              </DialogHeader>
              
              <Command>
                <CommandInput placeholder="Search constructors..." />
                <CommandList>
                  <CommandEmpty>No constructors found.</CommandEmpty>
                  <CommandGroup>
                    {availableConstructors.map((constructor) => (
                      <CommandItem
                        key={constructor.id}
                        onSelect={() => addConstructor(constructor)}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span>{constructor.name}</span>
                          <Badge variant="outline">${constructor.price}M</Badge>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowConstructorDialog(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          {constructors.map((constructor, index) => (
            <Card key={constructor.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex justify-between items-center">
                  {constructor.name}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeConstructor(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price</span>
                  <span>${constructor.price}M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Points</span>
                  <span>{constructor.points}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <Dialog open={showRecommendationDialog} onOpenChange={setShowRecommendationDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Team Recommendations</DialogTitle>
            <DialogDescription>
              AI-powered analysis and suggestions for your F1 Fantasy team.
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto">
            {recommendation ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: recommendation.replace(/\n/g, '<br />') }} />
              </div>
            ) : (
              <p>No recommendations available.</p>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowRecommendationDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

### Task 8.5: Create Market Data Page

**Create Market Data Page**
- Create `app/dashboard/market/page.tsx`:
```tsx
"use server"

import { Suspense } from "react"
import { getMarketDriversAction, getMarketConstructorsAction } from "@/actions/db/market-data-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { SelectMarketDriver, SelectMarketConstructor } from "@/db/schema"

export default async

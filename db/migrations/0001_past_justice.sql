ALTER TABLE "market_constructors" RENAME COLUMN "total_points" TO "points";--> statement-breakpoint
ALTER TABLE "market_constructors" ADD COLUMN "color" text;--> statement-breakpoint
ALTER TABLE "market_drivers" ADD COLUMN "driver_number" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "market_drivers" ADD COLUMN "team_color" text;--> statement-breakpoint
ALTER TABLE "market_drivers" ADD COLUMN "points" double precision DEFAULT 0;--> statement-breakpoint
ALTER TABLE "market_drivers" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "market_drivers" ADD COLUMN "country_code" text;--> statement-breakpoint
ALTER TABLE "market_drivers" DROP COLUMN "total_points";
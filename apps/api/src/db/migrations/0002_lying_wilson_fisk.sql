ALTER TABLE "appointments" ALTER COLUMN "customer_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "guest_name" varchar(120);--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "guest_email" varchar(255);--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "guest_phone" varchar(20);
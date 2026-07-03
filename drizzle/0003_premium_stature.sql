ALTER TABLE "users" ADD COLUMN "phone_country_code" text;
--> statement-breakpoint
-- Normalize existing phone data to the new canonical form (national = last 10 digits).
UPDATE "users" SET "phone_country_code" = '+91',
  "phone" = right(regexp_replace("phone", '\D', '', 'g'), 10)
  WHERE "phone" IS NOT NULL;
--> statement-breakpoint
UPDATE "auth_credentials" SET "provider_uid" = right(regexp_replace("provider_uid", '\D', '', 'g'), 10)
  WHERE "provider" = 'phone' AND "provider_uid" IS NOT NULL;
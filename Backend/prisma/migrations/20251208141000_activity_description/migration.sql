-- Add optional description to Activity
ALTER TABLE "public"."Activity" ADD COLUMN IF NOT EXISTS "description" TEXT;

-- AlterTable (custom fork: per-user theme preferences)
ALTER TABLE "public"."User"
ADD COLUMN "themeMode" TEXT NOT NULL DEFAULT 'dark',
ADD COLUMN "themeAccent" TEXT NOT NULL DEFAULT 'cyan';

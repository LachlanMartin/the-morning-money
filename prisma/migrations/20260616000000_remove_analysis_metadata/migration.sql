ALTER TABLE "Analysis" DROP COLUMN "confidence";
ALTER TABLE "Analysis" DROP COLUMN "predictedDirection";
ALTER TABLE "Analysis" DROP COLUMN "sentiment";
DROP TYPE IF EXISTS "Direction";
DROP TYPE IF EXISTS "Sentiment";

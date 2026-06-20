-- Re-add sentiment, predicted direction, and confidence to Analysis
CREATE TYPE "Sentiment" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE');
CREATE TYPE "Direction" AS ENUM ('UP', 'FLAT', 'DOWN');
ALTER TABLE "Analysis" ADD COLUMN "sentiment" "Sentiment";
ALTER TABLE "Analysis" ADD COLUMN "predictedDirection" "Direction";
ALTER TABLE "Analysis" ADD COLUMN "confidence" DOUBLE PRECISION;

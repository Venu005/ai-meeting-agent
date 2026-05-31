-- CreateEnum
CREATE TYPE "RecordingStatus" AS ENUM ('NONE', 'PROCESSING', 'READY', 'FALLBACK', 'UNAVAILABLE');

-- AlterTable
ALTER TABLE "meetings" ADD COLUMN     "recordingFallbackUrl" TEXT,
ADD COLUMN     "recordingKey" TEXT,
ADD COLUMN     "recordingStatus" "RecordingStatus" NOT NULL DEFAULT 'NONE';

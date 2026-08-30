-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "manufacturer" TEXT,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "unit" TEXT,
ADD COLUMN     "unitAr" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_slug_key" ON "Equipment"("slug");

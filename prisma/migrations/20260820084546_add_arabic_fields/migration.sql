-- AlterTable
ALTER TABLE "DigitalTool" ADD COLUMN     "descriptionAr" TEXT,
ADD COLUMN     "titleAr" TEXT;

-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "descriptionAr" TEXT,
ADD COLUMN     "locationAr" TEXT,
ADD COLUMN     "nameAr" TEXT,
ADD COLUMN     "specsAr" TEXT;

-- AlterTable
ALTER TABLE "HomeMedia" ADD COLUMN     "captionAr" TEXT;

-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "bioAr" TEXT,
ADD COLUMN     "titleOrRoleAr" TEXT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "descriptionAr" TEXT,
ADD COLUMN     "summaryAr" TEXT,
ADD COLUMN     "titleAr" TEXT;

-- AlterTable
ALTER TABLE "Publication" ADD COLUMN     "abstractAr" TEXT,
ADD COLUMN     "titleAr" TEXT;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "ctaLabelAr" TEXT,
ADD COLUMN     "descriptionAr" TEXT,
ADD COLUMN     "titleAr" TEXT;

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "contactAddressAr" TEXT,
ADD COLUMN     "directorMessageAr" TEXT,
ADD COLUMN     "homeIntroBodyAr" TEXT,
ADD COLUMN     "homeIntroTitleAr" TEXT;

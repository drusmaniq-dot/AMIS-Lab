import { prisma } from "@/lib/db";

const DEFAULT_SETTINGS = {
  id: "1",
  homeIntroTitle: "AMIS Lab",
  homeIntroTitleAr: null as string | null,
  homeIntroBody:
    "Advanced Materials, Innovation & Sustainability. Site content has not been configured yet — an admin can edit this from the admin dashboard.",
  homeIntroBodyAr: null as string | null,
  directorName: "Director name not set",
  directorPhotoUrl: null as string | null,
  directorMessage: "The director's message has not been added yet.",
  directorMessageAr: null as string | null,
  contactAddress: null as string | null,
  contactAddressAr: null as string | null,
  contactEmail: null as string | null,
  contactPhone: null as string | null,
  mapEmbedUrl: null as string | null,
  updatedAt: new Date(),
};

export async function getSiteSettings() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "1" } });
  return settings ?? DEFAULT_SETTINGS;
}

export async function getSocialLinks() {
  return prisma.socialLink.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getHomeMedia() {
  return prisma.homeMedia.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

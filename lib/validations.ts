import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, { error: "Name must be at least 2 characters." }).trim(),
  email: z.email({ error: "Enter a valid email address." }).trim(),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters." })
    .regex(/[a-zA-Z]/, { error: "Password must contain at least one letter." })
    .regex(/[0-9]/, { error: "Password must contain at least one number." }),
});

export const profileLinkSchema = z.object({
  label: z.string().min(1, { error: "Label is required." }).trim(),
  url: z.url({ error: "Enter a valid URL." }).trim(),
});

// Bilingual text fields are intentionally optional here — at least one of
// (field, fieldAr) must be present, which is checked in the Server Action
// (see lib/bilingual.ts `requireOneOf`), right alongside the auto-translate step.

export const personSchema = z.object({
  fullName: z.string().min(1, { error: "Name is required." }).trim(),
  titleOrRole: z.string().optional(),
  titleOrRoleAr: z.string().optional(),
  bio: z.string().optional(),
  bioAr: z.string().optional(),
  category: z.enum(["DIRECTOR", "FACULTY", "STUDENT", "ALUMNI", "STAFF"]),
  profileLinks: z.array(profileLinkSchema).default([]),
  academicDegree: z.string().optional(),
  academicDegreeAr: z.string().optional(),
  email: z.union([z.email(), z.literal("")]).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  addressAr: z.string().optional(),
  discipline: z.string().optional(),
  disciplineAr: z.string().optional(),
  subdiscipline: z.string().optional(),
  subdisciplineAr: z.string().optional(),
  citationCount: z.union([z.coerce.number().int().gte(0), z.literal("")]).optional(),
  hIndex: z.union([z.coerce.number().int().gte(0), z.literal("")]).optional(),
});

export const projectSchema = z.object({
  title: z.string().optional(),
  titleAr: z.string().optional(),
  summary: z.string().optional(),
  summaryAr: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  phase: z.enum(["PLANNED", "ONGOING", "COMPLETED"]),
  projectNumber: z.string().optional(),
  investigator: z.string().optional(),
  externalUrl: z.union([z.url(), z.literal("")]).optional(),
  tags: z.string().optional(),
});

export const publicationSchema = z.object({
  title: z.string().optional(),
  titleAr: z.string().optional(),
  authors: z.string().min(1, { error: "At least one author is required." }).trim(),
  venue: z.string().min(1, { error: "Venue is required." }).trim(),
  year: z.coerce
    .number({ error: "Year must be a number." })
    .int()
    .gte(1950)
    .lte(new Date().getFullYear() + 1),
  type: z.enum(["JOURNAL", "CONFERENCE", "PATENT", "BOOK_CHAPTER", "OTHER"]),
  doiOrLink: z.union([z.url(), z.literal("")]).optional(),
  abstract: z.string().optional(),
  abstractAr: z.string().optional(),
});

export const digitalToolSchema = z.object({
  title: z.string().optional(),
  titleAr: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  url: z.union([z.url(), z.literal("")]).optional(),
});

export const serviceSchema = z.object({
  title: z.string().optional(),
  titleAr: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaLabelAr: z.string().optional(),
  ctaUrl: z.union([z.url(), z.literal("")]).optional(),
  ctaEmail: z.union([z.email(), z.literal("")]).optional(),
});

export const equipmentSchema = z.object({
  name: z.string().optional(),
  nameAr: z.string().optional(),
  unit: z.string().optional(),
  unitAr: z.string().optional(),
  model: z.string().optional(),
  manufacturer: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  location: z.string().optional(),
  locationAr: z.string().optional(),
});

export const socialLinkSchema = z.object({
  platform: z.string().min(1, { error: "Platform name is required." }).trim(),
  url: z.url({ error: "Enter a valid URL." }).trim(),
  icon: z.string().optional(),
});

export const homeMediaSchema = z.object({
  type: z.enum(["IMAGE", "VIDEO_EMBED"]),
  url: z.url({ error: "Enter a valid URL." }).trim(),
  caption: z.string().optional(),
  captionAr: z.string().optional(),
});

export const siteSettingsSchema = z.object({
  homeIntroTitle: z.string().optional(),
  homeIntroTitleAr: z.string().optional(),
  homeIntroBody: z.string().optional(),
  homeIntroBodyAr: z.string().optional(),
  directorName: z.string().min(1, { error: "Director name is required." }).trim(),
  directorMessage: z.string().optional(),
  directorMessageAr: z.string().optional(),
  contactAddress: z.string().optional(),
  contactAddressAr: z.string().optional(),
  contactEmail: z.union([z.email(), z.literal("")]).optional(),
  contactPhone: z.string().optional(),
  mapEmbedUrl: z.union([z.url(), z.literal("")]).optional(),
});

export const contactMessageSchema = z.object({
  name: z.string().min(1, { error: "Name is required." }).trim(),
  email: z.email({ error: "Enter a valid email address." }).trim(),
  subject: z.string().optional(),
  message: z.string().min(1, { error: "Message is required." }).trim(),
});

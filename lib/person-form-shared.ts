import "server-only";
import { personSchema } from "@/lib/validations";
import { getStorage } from "@/lib/storage";
import { requireOneOf, resolveBilingual } from "@/lib/bilingual";
import { parseStringListField, resolveStringList, parsePublications, parseProfileLinks } from "@/lib/person-cv-helpers";

// Shared between the admin Person form (app/admin/people/actions.ts) and the
// self-service dashboard profile form (app/dashboard/profile/actions.ts) —
// both edit the same Person fields, just with different auth/approval rules
// around the write itself.

export function parsePerson(formData: FormData) {
  return personSchema.safeParse({
    fullName: formData.get("fullName"),
    titleOrRole: formData.get("titleOrRole"),
    titleOrRoleAr: formData.get("titleOrRoleAr"),
    bio: formData.get("bio"),
    bioAr: formData.get("bioAr"),
    category: formData.get("category"),
    profileLinks: parseProfileLinks(formData),
    academicDegree: formData.get("academicDegree") || undefined,
    academicDegreeAr: formData.get("academicDegreeAr") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    addressAr: formData.get("addressAr") || undefined,
    discipline: formData.get("discipline") || undefined,
    disciplineAr: formData.get("disciplineAr") || undefined,
    subdiscipline: formData.get("subdiscipline") || undefined,
    subdisciplineAr: formData.get("subdisciplineAr") || undefined,
    citationCount: formData.get("citationCount") || undefined,
    hIndex: formData.get("hIndex") || undefined,
  });
}

export async function uploadPersonImage(formData: FormData) {
  const file = formData.get("photo");
  if (file instanceof File && file.size > 0) {
    return (await getStorage().upload(file, "people")).url;
  }
  return undefined;
}

export async function uploadPersonCv(formData: FormData) {
  const file = formData.get("cv");
  if (file instanceof File && file.size > 0) {
    return (await getStorage().upload(file, "people-cv", "document")).url;
  }
  return undefined;
}

export async function resolvePersonFields(
  formData: FormData,
  data: NonNullable<ReturnType<typeof parsePerson>["data"]>
) {
  const roleError = requireOneOf(data.titleOrRole, data.titleOrRoleAr, "Role/title");
  if (roleError) return { error: roleError } as const;
  const bioError = requireOneOf(data.bio, data.bioAr, "Bio");
  if (bioError) return { error: bioError } as const;

  const [role, bio, academicDegree, address, discipline, subdiscipline] = await Promise.all([
    resolveBilingual(data.titleOrRole, data.titleOrRoleAr),
    resolveBilingual(data.bio, data.bioAr),
    resolveBilingual(data.academicDegree, data.academicDegreeAr),
    resolveBilingual(data.address, data.addressAr),
    resolveBilingual(data.discipline, data.disciplineAr),
    resolveBilingual(data.subdiscipline, data.subdisciplineAr),
  ]);

  const researchInterestsEn = parseStringListField(formData, "researchInterests");
  const researchInterestsAr = parseStringListField(formData, "researchInterestsAr");
  const researchProjectsEn = parseStringListField(formData, "researchProjects");
  const researchProjectsAr = parseStringListField(formData, "researchProjectsAr");
  const [researchInterests, researchProjects] = await Promise.all([
    resolveStringList(researchInterestsEn, researchInterestsAr),
    resolveStringList(researchProjectsEn, researchProjectsAr),
  ]);

  const publications = parsePublications(formData);

  return {
    ok: true,
    role,
    bio,
    academicDegree,
    address,
    discipline,
    subdiscipline,
    researchInterests,
    researchProjects,
    publications,
  } as const;
}

"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { teamAccountSchema } from "@/lib/validations";
import { AUTHOR_ALIASES } from "@/lib/author-aliases";
import { notify } from "@/lib/notify";

export type CreateTeamAccountState = { error?: string } | undefined;

export async function createTeamAccount(
  _prevState: CreateTeamAccountState,
  formData: FormData
): Promise<CreateTeamAccountState> {
  const session = await requireAdmin();

  const parsed = teamAccountSchema.safeParse({
    personId: formData.get("personId"),
    username: formData.get("username"),
    temporaryPassword: formData.get("temporaryPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { personId, username, temporaryPassword } = parsed.data;
  const normalizedUsername = username.toLowerCase();

  const person = await prisma.person.findUnique({ where: { id: personId } });
  if (!person) {
    return { error: "Person not found." };
  }
  if (person.userId) {
    return { error: "This person already has an account." };
  }

  const existingUsername = await prisma.user.findUnique({ where: { username: normalizedUsername } });
  if (existingUsername) {
    return { error: "That username is already taken." };
  }

  const passwordHash = await bcrypt.hash(temporaryPassword, 10);
  const placeholderEmail = `${normalizedUsername}@pending.amislab.local`;

  const user = await prisma.user.create({
    data: {
      name: person.fullName,
      email: placeholderEmail,
      username: normalizedUsername,
      passwordHash,
      role: "TEAM",
      status: "APPROVED",
      profileComplete: false,
    },
  });

  await prisma.person.update({ where: { id: personId }, data: { userId: user.id } });

  await notify("member.team_account_created", {
    username: normalizedUsername,
    personName: person.fullName,
    createdBy: session.user.email,
  });

  redirect(`/admin/team/confirm/${user.id}`);
}

export async function confirmReassignments(userId: string, formData: FormData) {
  await requireAdmin();

  const publicationIds = formData.getAll("publicationId").map(String);
  const projectIds = formData.getAll("projectId").map(String);

  // Adds this person as an extra owner of each item — never replaces the
  // existing owner(s), so a shared paper/project can end up managed by every
  // co-author who has an account, and the row itself is never duplicated.
  await prisma.$transaction([
    ...publicationIds.map((id) =>
      prisma.publication.update({ where: { id }, data: { owners: { connect: { id: userId } } } })
    ),
    ...projectIds.map((id) =>
      prisma.project.update({ where: { id }, data: { owners: { connect: { id: userId } } } })
    ),
  ]);

  if (publicationIds.length > 0 || projectIds.length > 0) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
    await notify("member.content_co_ownership_added", {
      userEmail: user?.email,
      userName: user?.name,
      publicationCount: publicationIds.length,
      projectCount: projectIds.length,
    });
  }

  redirect("/admin/users");
}

export async function findCandidateReassignments(personFullName: string, userId: string) {
  await requireAdmin();

  const alias = AUTHOR_ALIASES[personFullName];
  const authorCandidates = [personFullName, alias].filter((v): v is string => Boolean(v));
  const notAlreadyOwner = { owners: { none: { id: userId } } };

  const [publications, projects] = await Promise.all([
    prisma.publication.findMany({
      where: { ...notAlreadyOwner, authors: { hasSome: authorCandidates } },
      select: { id: true, title: true, year: true, authors: true },
      orderBy: { year: "desc" },
    }),
    prisma.project.findMany({
      where: {
        ...notAlreadyOwner,
        investigator: { contains: personFullName, mode: "insensitive" },
      },
      select: { id: true, title: true, investigator: true },
    }),
  ]);

  return { publications, projects };
}

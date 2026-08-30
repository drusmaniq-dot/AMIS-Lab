import "server-only";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/lib/auth";

export class UnauthorizedError extends Error {
  constructor(message = "You must be signed in to do that.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "You don't have permission to do that.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function getSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

/** Any signed-in, approved user (Member or Admin). Throws if not authenticated. */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session?.user) {
    throw new UnauthorizedError();
  }
  return session;
}

/** Throws unless the signed-in user is an Admin. */
export async function requireAdmin(): Promise<Session> {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") {
    throw new ForbiddenError("This action is restricted to lab admins.");
  }
  return session;
}

/** Throws unless the signed-in user is an Admin, or owns the given resource. */
export async function requireOwnerOrAdmin(ownerId: string | null | undefined): Promise<Session> {
  const session = await requireAuth();
  if (session.user.role === "ADMIN") return session;
  if (ownerId && session.user.id === ownerId) return session;
  throw new ForbiddenError("You can only manage your own content.");
}

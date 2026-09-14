import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/i18n/get-locale";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { notify } from "@/lib/notify";

// The adapter persists Google sign-ins (User/Account rows) even though
// sessions stay JWT-based (required for the Credentials provider to work
// at all). `as never` sidesteps a structural-typing mismatch between our
// custom Prisma 7 client output path (lib/generated/prisma/client) and the
// stock `@prisma/client` type the adapter's signature expects — the actual
// runtime client shape (user/account/session/verificationToken models) is
// identical, so this is safe.
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma as never),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      // Google verifies email ownership itself, so linking a Google sign-in
      // to an existing email/password account with the same address (e.g.
      // an admin whose account email is their real Gmail) doesn't carry the
      // usual "unverified email" risk this flag is named for.
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const locale = await getLocale();
        const t = dictionaries[locale].authErrors;

        if (!credentials?.email || !credentials?.password) {
          throw new Error(t.credentialsRequired);
        }

        // Team accounts log in with an admin-issued username until they
        // complete onboarding and set a real email (see profileComplete).
        const identifier = credentials.email.toLowerCase().trim();
        const user = identifier.includes("@")
          ? await prisma.user.findUnique({ where: { email: identifier } })
          : await prisma.user.findUnique({ where: { username: identifier } });

        if (!user) {
          throw new Error(t.incorrect);
        }

        if (!user.passwordHash) {
          // Account was created via Google sign-in only; no password to check against.
          throw new Error(t.incorrect);
        }
        const passwordValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!passwordValid) {
          throw new Error(t.incorrect);
        }

        if (user.status === "PENDING") {
          throw new Error(t.pending);
        }
        if (user.status === "REJECTED") {
          throw new Error(t.rejected);
        }
        if (user.status === "SUSPENDED") {
          throw new Error(t.suspended);
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          status: user.status,
          profileComplete: user.profileComplete,
        };
      },
    }),
  ],
  callbacks: {
    // Credentials logins already reject non-APPROVED users inside authorize()
    // above; Google logins skip authorize() entirely, so the same gate is
    // enforced here instead. A brand-new Google sign-in gets a User row via
    // the adapter with the schema default status of PENDING, so it's blocked
    // here too until an admin approves it — same rule, different provider.
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.status && user.status !== "APPROVED") {
        return false;
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
        token.profileComplete = user.profileComplete;
      }
      // Lets the client force a fresh token right after onboarding completes
      // (via useSession().update()) instead of waiting for the next full
      // login — otherwise the JWT would keep saying profileComplete: false
      // and proxy.ts would bounce the user straight back to /onboarding.
      if (trigger === "update") {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id },
          select: { role: true, status: true, profileComplete: true, email: true, name: true, image: true },
        });
        if (fresh) {
          token.role = fresh.role;
          token.status = fresh.status;
          token.profileComplete = fresh.profileComplete;
          token.email = fresh.email;
          token.name = fresh.name;
          token.picture = fresh.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.status = token.status;
        session.user.profileComplete = token.profileComplete;
      }
      return session;
    },
  },
  events: {
    // Fires once, the first time the adapter creates a User row for a new
    // Google sign-in — the OAuth equivalent of the /register form submit,
    // so admins get the same "someone needs approval" notification either way.
    async createUser({ user }) {
      await notify("member.signup_requested", { email: user.email, name: user.name });
    },
  },
};

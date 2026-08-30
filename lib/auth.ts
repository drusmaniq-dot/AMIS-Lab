import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/i18n/get-locale";
import { dictionaries } from "@/lib/i18n/dictionaries";

// No database adapter is wired up yet: Credentials + JWT sessions don't need one.
// If an OAuth provider (e.g. university SSO) is added later, install
// @next-auth/prisma-adapter and pass `adapter: PrismaAdapter(prisma as never)`
// here — the Account/Session/VerificationToken tables already exist for that.
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const locale = await getLocale();
        const t = dictionaries[locale].authErrors;

        if (!credentials?.email || !credentials?.password) {
          throw new Error(t.credentialsRequired);
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user) {
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
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.status = token.status;
      }
      return session;
    },
  },
};

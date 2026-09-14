import { DefaultSession } from "next-auth";
import { Role, UserStatus } from "@/lib/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      status: UserStatus;
      profileComplete: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: Role;
    status: UserStatus;
    profileComplete: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    status: UserStatus;
    profileComplete: boolean;
  }
}

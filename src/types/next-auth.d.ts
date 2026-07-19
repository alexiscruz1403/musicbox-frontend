import type { DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken: string;
    refreshToken: string;
    error?: string;
    user: {
      id: string;
      handle: string;
      displayName: string;
      avatarUrl?: string;
      status: string;
      role: string;
      language: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    handle: string;
    displayName: string;
    avatarUrl?: string | null;
    status: string;
    role: string;
    language: string;
    accessToken: string;
    refreshToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    handle: string;
    displayName: string;
    avatarUrl: string | null;
    status: string;
    role: string;
    language: string;
    accessToken: string;
    refreshToken: string;
    error?: string;
  }
}

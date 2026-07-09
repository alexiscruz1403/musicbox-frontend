import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { AuthResponse, RefreshResponse } from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";

function decodeJwtExp(token: string): number | null {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString(),
    ) as { exp?: number };
    return payload.exp ?? null;
  } catch {
    return null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });
        if (!res.ok) return null;
        const { data } = (await res.json()) as { data: AuthResponse };
        return {
          id: data.user.id,
          handle: data.user.handle,
          displayName: data.user.displayName,
          email: data.user.email,
          avatarUrl: data.user.avatarUrl ?? null,
          status: data.user.status,
          role: data.user.role,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        };
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // First sign in: populate from user/account
      if (user) {
        token.id = user.id;
        token.handle = user.handle;
        token.displayName = user.displayName;
        token.avatarUrl = user.avatarUrl ?? null;
        token.status = user.status;
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
      }

      if (account?.provider === "google" && account.id_token) {
        const res = await fetch(`${API_BASE}/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: account.id_token }),
        });
        if (res.ok) {
          const { data } = (await res.json()) as { data: AuthResponse };
          token.id = data.user.id;
          token.handle = data.user.handle;
          token.displayName = data.user.displayName;
          token.avatarUrl = data.user.avatarUrl ?? null;
          token.status = data.user.status;
          token.role = data.user.role;
          token.accessToken = data.accessToken;
          token.refreshToken = data.refreshToken;
        } else {
          token.error = "GoogleAuthError";
        }
      }

      // Proactive refresh: renew if access token expires in < 5 min
      if (token.accessToken) {
        const exp = decodeJwtExp(token.accessToken as string);
        const nowSecs = Math.floor(Date.now() / 1000);
        if (exp && exp - nowSecs < 300 && token.refreshToken) {
          const res = await fetch(`${API_BASE}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: token.refreshToken }),
          });
          if (res.ok) {
            const { data } = (await res.json()) as { data: RefreshResponse };
            token.accessToken = data.accessToken;
            token.refreshToken = data.refreshToken;
            delete token.error;
          } else {
            token.error = "RefreshTokenError";
          }
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.handle = token.handle as string;
      session.user.displayName = token.displayName as string;
      session.user.avatarUrl = (token.avatarUrl as string | null) ?? undefined;
      session.user.status = token.status as string;
      session.user.role = token.role as string;
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      if (token.error) {
        session.error = token.error as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
});

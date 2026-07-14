import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

const PROTECTED_PREFIXES = ["/settings", "/admin"];
const AUTH_ONLY_PREFIXES = ["/login", "/register"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAuthOnly = AUTH_ONLY_PREFIXES.some((p) => pathname.startsWith(p));

  let session;
  try {
    session = await auth();
  } catch (err) {
    // auth() failing (e.g. the session endpoint/backend hiccupping) must not
    // block navigation for every route — send to /login instead of letting
    // the request fall through to a 404/500.
    console.error("[proxy] auth() failed, redirecting to /login:", err);
    if (isAuthOnly) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (session?.error === "RefreshTokenError") {
    session = null;
  }

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && session && session.user.role !== "ADMIN") {
    const url = req.nextUrl.clone();
    url.pathname = "/feed";
    return NextResponse.redirect(url);
  }

  if (isAuthOnly && session) {
    const url = req.nextUrl.clone();
    url.pathname = `/u/${session.user.handle}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

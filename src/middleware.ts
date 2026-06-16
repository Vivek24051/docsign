import { NextRequest, NextResponse } from "next/server";

const AUTH_ONLY_PATHS = ["/dashboard", "/documents", "/admin"];
const REDIRECT_AWAY_IF_AUTHED = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Just check cookie presence in edge middleware — full JWT verification happens in each route
  const hasToken = !!request.cookies.get("auth_token")?.value;

  if (hasToken && REDIRECT_AWAY_IF_AUTHED.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const isProtected = AUTH_ONLY_PATHS.some((p) => pathname.startsWith(p));
  if (isProtected && !hasToken) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

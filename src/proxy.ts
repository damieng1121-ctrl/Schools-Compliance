import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

// `auth`'s many overloads (Pages API routes, route handlers, Server
// Components, middleware) make TS infer the wrong one for a plain call —
// this file only ever uses it as middleware, which is what it was already
// doing before this file added the branches below.
const authMiddleware = auth as unknown as (
  request: NextRequest,
  event: NextFetchEvent,
) => Response | Promise<Response> | undefined;

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  if (request.nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.next({ request: { headers: request.headers } });
  }

  const authResult = await authMiddleware(request, event);
  // auth() redirects unauthenticated users to /login — let that through
  // unchanged. Otherwise, build our own pass-through response rather than
  // trust that auth()'s own "continue" response carried our header
  // mutation, so the corrected headers definitely reach the page render.
  if (authResult?.headers.get("location")) return authResult;
  return NextResponse.next({ request: { headers: request.headers } });
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/auth/:path*"],
};

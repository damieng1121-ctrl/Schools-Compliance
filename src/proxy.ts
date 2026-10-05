import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

// `auth`'s many overloads (Pages API routes, route handlers, Server
// Components, middleware) make TS infer the wrong one for a plain call —
// this file only ever uses it as middleware, which is what it was already
// doing before this file added the branch below.
const authMiddleware = auth as unknown as (
  request: NextRequest,
  event: NextFetchEvent,
) => Response | Promise<Response> | undefined;

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (request.nextUrl.pathname.startsWith("/api/auth")) {
    // Reached via the Firebase Hosting rewrite (rather than hitting Cloud
    // Run directly): Firebase connects to Cloud Run using Cloud Run's own
    // default URL and passes the real public hostname separately via
    // `x-fh-requested-host`. Auth.js's `trustHost` only looks at the
    // standard `X-Forwarded-Host` header, so without this it derives the
    // wrong origin during sign-in/callback and throws a "Configuration"
    // error. Translating the header here fixes it.
    const firebaseHost = request.headers.get("x-fh-requested-host");
    if (firebaseHost) {
      const headers = new Headers(request.headers);
      headers.set("x-forwarded-host", firebaseHost);
      headers.set("x-forwarded-proto", "https");
      return NextResponse.next({ request: { headers } });
    }
    return NextResponse.next();
  }

  return authMiddleware(request, event);
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/auth/:path*"],
};

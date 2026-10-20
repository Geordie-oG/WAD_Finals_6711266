import { NextResponse } from "next/server";
import { verifyJWT } from "./lib/auth";
import corsHeaders from "./lib/cors";
import {
  X_HEADER_USER_EMAIL,
  X_HEADER_USER_ID,
  X_HEADER_USER_NAME,
} from "./lib/constant";
export function proxy(request) {
  if (request.method === "OPTIONS")
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  const user = verifyJWT(request);
  if (!user)
    return NextResponse.json(
      { message: "Please sign in to continue." },
      { status: 401, headers: corsHeaders },
    );
  const headers = new Headers(request.headers);
  // Never trust caller-supplied identity headers. Handlers also revalidate the DB user.
  headers.delete(X_HEADER_USER_EMAIL);
  headers.delete(X_HEADER_USER_NAME);
  headers.set(X_HEADER_USER_ID, user.id);
  return NextResponse.next({ request: { headers } });
}
export const config = {
  matcher: [
    "/api/course/:path*",
    "/api/user/:path*",
    "/api/enrollment/:path*",
    "/api/auth/me",
  ],
};

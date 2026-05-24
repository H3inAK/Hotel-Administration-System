import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, type SessionPayload, type SessionRole, verifySessionToken } from "@/lib/session";

export async function getSessionFromCookie(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function requireApiSession(allowedRoles?: SessionRole[]): Promise<SessionPayload | NextResponse> {
  const session = await getSessionFromCookie();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  return session;
}

export function isAuthError(result: SessionPayload | NextResponse): result is NextResponse {
  return result instanceof Response;
}

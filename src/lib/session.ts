import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE_NAME = "hotel_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type SessionRole = "ADMIN" | "RECEPTIONIST";

export type SessionPayload = {
  userId: string;
  name: string;
  email: string;
  role: SessionRole;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters long.");
  }

  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getJwtSecret());
}

export async function verifySessionToken(token?: string | null): Promise<SessionPayload | null> {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const role = payload.role === "ADMIN" || payload.role === "RECEPTIONIST" ? payload.role : null;

    if (!payload.userId || !payload.email || !payload.name || !role) {
      return null;
    }

    return {
      userId: String(payload.userId),
      name: String(payload.name),
      email: String(payload.email),
      role
    };
  } catch {
    return null;
  }
}

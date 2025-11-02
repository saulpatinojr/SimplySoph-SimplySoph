import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { AppUser } from "@shared/types/auth";
import { ForbiddenError } from "@shared/_core/errors";
import { firebaseAuth, firebaseDb } from "./firebaseAdmin";
import { ENV } from "./env";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import type { DecodedIdToken, UserRecord } from "firebase-admin/auth";
import { Timestamp } from "firebase-admin/firestore";

type FirestoreUserDoc = {
  name: string | null;
  email: string | null;
  role: "user" | "admin";
  loginMethod?: string | null;
  lastSignedIn?: Timestamp | null;
};

const SESSION_MAX_AGE_MS = Math.min(ONE_YEAR_MS, 14 * 24 * 60 * 60 * 1000); // Firebase max is 2 weeks

class FirebaseAuthSdk {
  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }

    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  private mapFirestoreUser(uid: string, doc?: FirestoreUserDoc | null): AppUser {
    const lastSignedIn =
      doc?.lastSignedIn && "toDate" in doc.lastSignedIn
        ? doc.lastSignedIn.toDate()
        : null;

    return {
      id: uid,
      email: doc?.email ?? null,
      name: doc?.name ?? null,
      role: doc?.role ?? "user",
      loginMethod: doc?.loginMethod ?? null,
      lastSignedIn,
    };
  }

  private async resolveUserRole(
    uid: string,
    existing?: FirestoreUserDoc | null
  ): Promise<"user" | "admin"> {
    if (existing?.role === "admin") {
      return "admin";
    }
    if (uid === ENV.ownerFirebaseUid) {
      return "admin";
    }
    return existing?.role ?? "user";
  }

  private async ensureUserDocument(
    uid: string,
    decoded: DecodedIdToken
  ): Promise<AppUser> {
    const db = firebaseDb();
    const docRef = db.collection("users").doc(uid);
    const snapshot = await docRef.get();
    const existing = snapshot.exists
      ? (snapshot.data() as FirestoreUserDoc)
      : null;

    const auth = firebaseAuth();
    let userRecord: UserRecord | null = null;
    try {
      userRecord = await auth.getUser(uid);
    } catch (error) {
      console.warn("[Firebase] Failed to fetch user record:", error);
    }

    const providerId =
      decoded.firebase?.sign_in_provider ??
      userRecord?.providerData?.[0]?.providerId ??
      existing?.loginMethod ??
      null;

    const name =
      decoded.name ??
      userRecord?.displayName ??
      existing?.name ??
      null;
    const email =
      decoded.email ??
      userRecord?.email ??
      existing?.email ??
      null;
    const role = await this.resolveUserRole(uid, existing);

    const payload: FirestoreUserDoc = {
      name,
      email,
      role,
      loginMethod: providerId,
      lastSignedIn: Timestamp.now(),
    };

    await docRef.set(payload, { merge: true });

    return this.mapFirestoreUser(uid, payload);
  }

  async createSessionFromIdToken(
    idToken: string,
    options?: { expiresInMs?: number }
  ): Promise<{ sessionCookie: string; user: AppUser }> {
    const expiresIn = Math.min(
      options?.expiresInMs ?? SESSION_MAX_AGE_MS,
      SESSION_MAX_AGE_MS
    );

    const auth = firebaseAuth();
    const decodedIdToken = await auth.verifyIdToken(idToken, true);
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn,
    });

    const user = await this.ensureUserDocument(decodedIdToken.uid, decodedIdToken);

    return { sessionCookie, user };
  }

  async revokeUserSessions(uid: string): Promise<void> {
    try {
      await firebaseAuth().revokeRefreshTokens(uid);
    } catch (error) {
      console.warn("[Firebase] Failed to revoke refresh tokens:", error);
    }
  }

  async authenticateRequest(req: Request): Promise<AppUser | null> {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);

    if (!sessionCookie) {
      console.warn("[Auth] Missing Firebase session cookie");
      return null;
    }

    try {
      const decoded = await firebaseAuth().verifySessionCookie(sessionCookie, true);
      return this.ensureUserDocument(decoded.uid, decoded);
    } catch (error) {
      console.warn("[Auth] Session verification failed", error);
      throw ForbiddenError("Invalid session cookie");
    }
  }
}

export const sdk = new FirebaseAuthSdk();

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * Callable Cloud Function: setAdminClaim
 *
 * Sets or removes the `role: "admin"` custom claim on a Firebase Auth user.
 * Only callable by an existing admin (verified via custom claims on the caller).
 *
 * Request body:
 *   { uid: string; grant: boolean }
 *
 * @see docs/ADMIN_ROLES.md for the full admin role management guide
 * @see CODE_REVIEW_REPORT.md P1-01
 */
export const setAdminClaim = functions.https.onCall(async (data, context) => {
  // 1. Verify the caller is already an admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be signed in."
    );
  }

  const callerClaims = context.auth.token;
  if (callerClaims.role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only admins can manage roles."
    );
  }

  // 2. Validate input
  const { uid, grant } = data as { uid?: string; grant?: boolean };
  if (!uid || typeof uid !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "uid (string) is required."
    );
  }
  if (typeof grant !== "boolean") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "grant (boolean) is required."
    );
  }

  // 3. Set / remove the custom claim
  try {
    const newClaims = grant ? { role: "admin" } : { role: "user" };
    await admin.auth().setCustomUserClaims(uid, newClaims);

    // 4. Mirror the role into Firestore so the client can read it
    await admin.firestore().collection("users").doc(uid).set(
      { role: grant ? "admin" : "user" },
      { merge: true }
    );

    functions.logger.info(
      `[setAdminClaim] ${grant ? "Granted" : "Revoked"} admin for uid=${uid} by caller=${context.auth.uid}`
    );

    return { success: true, uid, role: grant ? "admin" : "user" };
  } catch (error: unknown) {
    functions.logger.error("[setAdminClaim] Failed", error);
    const message = error instanceof Error ? error.message : "Internal error";
    throw new functions.https.HttpsError("internal", message);
  }
});

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAdminClaim = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
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
exports.setAdminClaim = functions.https.onCall(async (data, context) => {
    // 1. Verify the caller is already an admin
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be signed in.");
    }
    const callerClaims = context.auth.token;
    if (callerClaims.role !== "admin") {
        throw new functions.https.HttpsError("permission-denied", "Only admins can manage roles.");
    }
    // 2. Validate input
    const { uid, grant } = data;
    if (!uid || typeof uid !== "string") {
        throw new functions.https.HttpsError("invalid-argument", "uid (string) is required.");
    }
    if (typeof grant !== "boolean") {
        throw new functions.https.HttpsError("invalid-argument", "grant (boolean) is required.");
    }
    // 3. Set / remove the custom claim
    try {
        const newClaims = grant ? { role: "admin" } : { role: "user" };
        await admin.auth().setCustomUserClaims(uid, newClaims);
        // 4. Mirror the role into Firestore so the client can read it
        await admin.firestore().collection("users").doc(uid).set({ role: grant ? "admin" : "user" }, { merge: true });
        functions.logger.info(`[setAdminClaim] ${grant ? "Granted" : "Revoked"} admin for uid=${uid} by caller=${context.auth.uid}`);
        return { success: true, uid, role: grant ? "admin" : "user" };
    }
    catch (error) {
        functions.logger.error("[setAdminClaim] Failed", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
//# sourceMappingURL=setAdminClaim.js.map
# Admin Role Management

> **Last updated:** March 2, 2026  
> **Relates to:** CODE_REVIEW_REPORT.md \u2014 P1-01, P1-02, CR-1, CR-2

---

## How Admin Authorization Works

Admin access in SimplySoph uses **Firebase Custom Claims** \u2014 cryptographically signed tokens that travel with every authenticated request. This is the industry-standard approach recommended by Firebase for role-based access control.

### Architecture

```
\u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510   custom claim   \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
\u2502  Firebase    \u2502 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u25b6  \u2502  Firestore Rules  \u2502
\u2502  Auth Token  \u2502   role: "admin"  \u2502  request.auth     \u2502
\u2502  (JWT)       \u2502                  \u2502  .token.role       \u2502
\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518                  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518
       \u2502
       \u25bc
\u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
\u2502  Client App  \u2502  getIdTokenResult().claims.role
\u2502  useAuth()   \u2502
\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518
```

### Why Not Firestore Document Roles?

Previously, admin status was determined by reading a `role` field from the user's Firestore document. This was vulnerable because Firestore rules allowed users to write to their own document \u2014 meaning **any authenticated user could self-promote to admin** by setting `role: "admin"` on their own profile.

Custom Claims are set server-side via the Firebase Admin SDK and **cannot be modified by the client**.

---

## Granting Admin Access

### Option 1: Firebase Console (quickest)

1. Go to [Firebase Console](https://console.firebase.google.com) \u2192 your project \u2192 Authentication \u2192 Users
2. Find the user by email
3. Copy their UID
4. Open Cloud Shell or run locally:

```bash
# Using firebase-admin in a Node script
const admin = require("firebase-admin");
admin.initializeApp();
await admin.auth().setCustomUserClaims("<UID>", { role: "admin" });
```

### Option 2: Call the `setAdminClaim` Cloud Function

From the client (requires an existing admin):

```typescript
import { getFunctions, httpsCallable } from "firebase/functions";

const setAdmin = httpsCallable(getFunctions(), "setAdminClaim");
await setAdmin({ uid: "<target-uid>", grant: true });
```

### Option 3: Via the Admin Dashboard (future)

A user management page in `/admin/users` can call the `setAdminClaim` function directly.

---

## Revoking Admin Access

Same as granting, but with `grant: false`:

```typescript
await setAdmin({ uid: "<target-uid>", grant: false });
```

The user must sign out and back in (or wait for token refresh) for the revocation to take effect.

---

## How Firestore Rules Enforce This

```javascript
function isAdmin() {
  return request.auth != null && request.auth.token.role == "admin";
}
```

This function is used in every write rule for content collections (`blogPosts`, `videos`, `photoAlbums`, `photos`, `categories`, `destinations`, etc.).

---

## Initial Setup for New Deployments

When deploying SimplySoph for the first time:

1. Deploy Cloud Functions: `firebase deploy --only functions`
2. Set the first admin manually via Firebase Console / Admin SDK (Option 1 above)
3. That admin can then grant access to others via the `setAdminClaim` callable function

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Admin UI shows "Access Denied" | Custom claim not set or token not refreshed | Sign out \u2192 sign in, or call `user.getIdToken(true)` |
| Firestore writes fail with PERMISSION_DENIED | Rules check `request.auth.token.role` but claim is missing | Verify claim is set via Firebase Console \u2192 Authentication \u2192 Users \u2192 custom claims |
| Old hardcoded UIDs no longer work | Migration removed `ADDITIONAL_ADMIN_UIDS` | Set custom claims for those UIDs using Option 1 or 2 |

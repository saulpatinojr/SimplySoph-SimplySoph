// Backfills a `status: "published"` field onto legacy content docs that were
// created before the status field existed. Public queries now filter on
// status == "published" (required by firestore.rules for visitor reads), so
// docs without the field are hidden from the public site until backfilled.
//
// Usage:
//   node scripts/backfill-content-status.mjs           # dry run (default)
//   node scripts/backfill-content-status.mjs --apply   # write changes
//
// Auth: uses Application Default Credentials. Run
//   gcloud auth application-default login
// or set GOOGLE_APPLICATION_CREDENTIALS to a service-account key file.

// Run from project root with: NODE_PATH=functions/node_modules node scripts/backfill-content-status.mjs
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const APPLY = process.argv.includes("--apply");
const COLLECTIONS = ["photoAlbums", "videos", "destinations", "blogPosts"];

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

let totalMissing = 0;

for (const name of COLLECTIONS) {
  const snapshot = await db.collection(name).get();
  const missing = snapshot.docs.filter(doc => !("status" in doc.data()));
  totalMissing += missing.length;
  console.log(`${name}: ${snapshot.size} docs, ${missing.length} missing status`);

  if (APPLY && missing.length > 0) {
    const batch = db.batch();
    for (const doc of missing) {
      batch.update(doc.ref, { status: "published" });
    }
    await batch.commit();
    console.log(`  -> stamped ${missing.length} docs as published`);
  }
}

console.log(
  APPLY
    ? `Done. Backfilled ${totalMissing} docs.`
    : `Dry run complete (${totalMissing} docs would be updated). Re-run with --apply to write.`
);

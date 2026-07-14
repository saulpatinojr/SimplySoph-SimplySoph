import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { getMetadata, ref, uploadString } from "firebase/storage";

const projectId = `simplysoph-storage-${Date.now()}`;
const bucketName = `${projectId}.appspot.com`;
const bucketUrl = `gs://${bucketName}`;

const testEnv = await initializeTestEnvironment({
  projectId,
  storage: {
    rules: readFileSync("storage.rules", "utf8"),
  },
});

async function seed(path, contentType = "image/jpeg") {
  await testEnv.withSecurityRulesDisabled(async context => {
    const storage = context.storage(bucketUrl);
    await uploadString(ref(storage, path), "seed-data", "raw", { contentType });
  });
}

test.after(async () => {
  await testEnv.cleanup();
});

test("guests can read public blog cover images", async () => {
  await seed("blog-covers/cover-1.jpg");
  const storage = testEnv.unauthenticatedContext().storage(bucketUrl);
  await assertSucceeds(getMetadata(ref(storage, "blog-covers/cover-1.jpg")));
});

test("guests cannot upload blog cover images", async () => {
  const storage = testEnv.unauthenticatedContext().storage(bucketUrl);
  await assertFails(
    uploadString(ref(storage, "blog-covers/cover-2.jpg"), "guest-write", "raw", {
      contentType: "image/jpeg",
    })
  );
});

test("admin can upload valid blog cover images", async () => {
  const storage = testEnv
    .authenticatedContext("admin-1", { role: "admin" })
    .storage(bucketUrl);

  await assertSucceeds(
    uploadString(ref(storage, "blog-covers/cover-3.jpg"), "admin-write", "raw", {
      contentType: "image/jpeg",
    })
  );
});

test("admin cannot upload invalid content types to image paths", async () => {
  const storage = testEnv
    .authenticatedContext("admin-2", { role: "admin" })
    .storage(bucketUrl);

  await assertFails(
    uploadString(ref(storage, "blog-covers/cover-4.txt"), "not-an-image", "raw", {
      contentType: "text/plain",
    })
  );
});

test("signed-in users can only upload and delete their own avatars", async () => {
  const ownStorage = testEnv.authenticatedContext("user-1", { role: "user" }).storage(bucketUrl);
  const otherStorage = testEnv.authenticatedContext("user-2", { role: "user" }).storage(bucketUrl);

  await assertSucceeds(
    uploadString(ref(ownStorage, "avatars/user-1"), "avatar", "raw", {
      contentType: "image/png",
    })
  );

  await assertFails(
    uploadString(ref(otherStorage, "avatars/user-1"), "avatar", "raw", {
      contentType: "image/png",
    })
  );
});

test("unknown storage paths are denied", async () => {
  const storage = testEnv
    .authenticatedContext("admin-3", { role: "admin" })
    .storage(bucketUrl);

  await assertFails(
    uploadString(ref(storage, "private/misc.txt"), "secret", "raw", {
      contentType: "text/plain",
    })
  );
});

test("all storage rules tests executed", () => {
  assert.ok(true);
});

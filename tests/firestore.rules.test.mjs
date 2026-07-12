import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

const projectId = `simplysoph-rules-${Date.now()}`;
const testEnv = await initializeTestEnvironment({
  projectId,
  firestore: {
    rules: readFileSync("firestore.rules", "utf8"),
  },
});

async function seed(path, data) {
  await testEnv.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), path), data);
  });
}

test.after(async () => {
  await testEnv.cleanup();
});

test("guest can read published blog post", async () => {
  await seed("blogPosts/published-1", { status: "published", title: "Published" });
  const db = testEnv.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(db, "blogPosts/published-1")));
});

test("guest cannot read draft blog post", async () => {
  await seed("blogPosts/draft-1", { status: "draft", title: "Draft" });
  const db = testEnv.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, "blogPosts/draft-1")));
});

test("admin can read draft blog post", async () => {
  await seed("blogPosts/draft-2", { status: "draft", title: "Draft" });
  const db = testEnv.authenticatedContext("admin-1", { role: "admin" }).firestore();
  await assertSucceeds(getDoc(doc(db, "blogPosts/draft-2")));
});

test("user can only create own profile with user role", async () => {
  const db = testEnv.authenticatedContext("user-1", { role: "user" }).firestore();

  await assertSucceeds(
    setDoc(doc(db, "users/user-1"), {
      uid: "user-1",
      role: "user",
      displayName: "User One",
    })
  );

  await assertFails(
    setDoc(doc(db, "users/user-2"), {
      uid: "user-2",
      role: "user",
    })
  );

  await assertFails(
    setDoc(doc(db, "users/user-3"), {
      uid: "user-3",
      role: "admin",
    })
  );
});

test("newsletter records can be created by guests but not updated by guests", async () => {
  const guestDb = testEnv.unauthenticatedContext().firestore();

  await assertSucceeds(
    setDoc(doc(guestDb, "newsletterSubscribers/sub-1"), {
      email: "person@example.com",
      subscribedAt: serverTimestamp(),
      active: true,
      source: "website",
    })
  );

  await assertFails(
    updateDoc(doc(guestDb, "newsletterSubscribers/sub-1"), {
      active: false,
      unsubscribedAt: serverTimestamp(),
    })
  );
});

test("admin can update newsletter records", async () => {
  await seed("newsletterSubscribers/sub-2", {
    email: "person2@example.com",
    active: true,
  });

  const adminDb = testEnv.authenticatedContext("admin-2", { role: "admin" }).firestore();
  await assertSucceeds(
    updateDoc(doc(adminDb, "newsletterSubscribers/sub-2"), {
      active: false,
      unsubscribedAt: serverTimestamp(),
    })
  );
});

test("signed-in user can create own pending comment", async () => {
  const db = testEnv.authenticatedContext("user-2", { role: "user" }).firestore();
  await assertSucceeds(
    setDoc(doc(db, "comments/c-1"), {
      postId: "p-1",
      postType: "blog",
      content: "Great post",
      authorId: "user-2",
      authorName: "User Two",
      createdAt: serverTimestamp(),
      status: "pending",
    })
  );
});

test("signed-in user cannot spoof another author in comments", async () => {
  const db = testEnv.authenticatedContext("user-3", { role: "user" }).firestore();
  await assertFails(
    setDoc(doc(db, "comments/c-2"), {
      postId: "p-2",
      postType: "blog",
      content: "Not allowed",
      authorId: "other-user",
      authorName: "Spoofer",
      createdAt: serverTimestamp(),
      status: "pending",
    })
  );
});

test("guest comments require guest authorId pattern", async () => {
  const db = testEnv.unauthenticatedContext().firestore();

  await assertSucceeds(
    setDoc(doc(db, "comments/c-3"), {
      postId: "p-3",
      postType: "photo",
      content: "Love this",
      authorId: "guest_12345",
      authorName: "Guest",
      guestEmail: "guest@example.com",
      createdAt: serverTimestamp(),
      status: "pending",
    })
  );

  await assertFails(
    setDoc(doc(db, "comments/c-4"), {
      postId: "p-4",
      postType: "photo",
      content: "Bad guest id",
      authorId: "not_guest",
      authorName: "Guest",
      createdAt: serverTimestamp(),
      status: "pending",
    })
  );
});

test("only admin can moderate or delete comments", async () => {
  await seed("comments/c-5", {
    postId: "p-5",
    postType: "video",
    content: "pending",
    authorId: "guest_abc",
    authorName: "Guest",
    status: "pending",
  });

  const userDb = testEnv.authenticatedContext("user-4", { role: "user" }).firestore();
  const adminDb = testEnv.authenticatedContext("admin-3", { role: "admin" }).firestore();

  await assertFails(updateDoc(doc(userDb, "comments/c-5"), { status: "approved" }));
  await assertSucceeds(updateDoc(doc(adminDb, "comments/c-5"), { status: "approved" }));
  await assertSucceeds(deleteDoc(doc(adminDb, "comments/c-5")));
});

test("contact form allows constrained guest create and blocks invalid payload", async () => {
  const db = testEnv.unauthenticatedContext().firestore();

  await assertSucceeds(
    setDoc(doc(db, "contact_messages/m-1"), {
      name: "Visitor",
      email: "visitor@example.com",
      subject: "Partnership",
      message: "Hello there",
      submittedAt: serverTimestamp(),
      status: "unread",
    })
  );

  await assertFails(
    setDoc(doc(db, "contact_messages/m-2"), {
      name: "Visitor",
      email: "bad-email",
      subject: "Partnership",
      message: "Hello there",
      submittedAt: serverTimestamp(),
      status: "unread",
    })
  );
});

test("all tests executed", () => {
  assert.ok(true);
});

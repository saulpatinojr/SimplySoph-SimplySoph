import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  where,
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

test("guests cannot write newsletter records directly (must go through the API)", async () => {
  const guestDb = testEnv.unauthenticatedContext().firestore();

  await assertFails(
    setDoc(doc(guestDb, "newsletterSubscribers/sub-1"), {
      email: "person@example.com",
      subscribedAt: serverTimestamp(),
      active: true,
      source: "website",
    })
  );

  await seed("newsletterSubscribers/sub-1", {
    email: "person@example.com",
    active: true,
  });

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

test("comments cannot be created directly by signed-in users (must go through the API)", async () => {
  const db = testEnv.authenticatedContext("user-2", { role: "user" }).firestore();
  await assertFails(
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

test("comments cannot be created directly by guests (must go through the API)", async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  await assertFails(
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
});

test("approved comments are readable by guests, pending ones are not", async () => {
  await seed("comments/c-approved", {
    postId: "p-1",
    postType: "blog",
    content: "Approved",
    authorId: "guest_a",
    authorName: "Guest",
    status: "approved",
  });
  await seed("comments/c-pending", {
    postId: "p-1",
    postType: "blog",
    content: "Pending",
    authorId: "guest_b",
    authorName: "Guest",
    status: "pending",
  });

  const db = testEnv.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(db, "comments/c-approved")));
  await assertFails(getDoc(doc(db, "comments/c-pending")));
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

test("contact messages cannot be created directly (must go through the API)", async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  const signedInDb = testEnv.authenticatedContext("user-5", { role: "user" }).firestore();

  await assertFails(
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
    setDoc(doc(signedInDb, "contact_messages/m-2"), {
      name: "Member",
      email: "member@example.com",
      subject: "Partnership",
      message: "Hello there",
      submittedAt: serverTimestamp(),
      status: "unread",
    })
  );
});

test("mail collection is fully locked down, even for signed-in users and admins", async () => {
  const guestDb = testEnv.unauthenticatedContext().firestore();
  const userDb = testEnv.authenticatedContext("user-6", { role: "user" }).firestore();
  const adminDb = testEnv.authenticatedContext("admin-4", { role: "admin" }).firestore();

  const payload = {
    to: "victim@example.com",
    message: { subject: "spam", text: "spam" },
  };

  await assertFails(setDoc(doc(guestDb, "mail/spam-1"), payload));
  await assertFails(setDoc(doc(userDb, "mail/spam-2"), payload));
  await assertFails(setDoc(doc(adminDb, "mail/spam-3"), payload));
  await assertFails(getDoc(doc(userDb, "mail/spam-1")));
});

test("future feature collections are deny-all", async () => {
  const userDb = testEnv.authenticatedContext("user-7", { role: "user" }).firestore();

  await assertFails(
    setDoc(doc(userDb, "wardrobe_items/w-1"), { userId: "user-7", name: "Jacket" })
  );
  await assertFails(getDoc(doc(userDb, "wardrobe_items/w-1")));
  await assertFails(
    setDoc(doc(userDb, "style_personas/s-1"), { userId: "user-7", name: "Preppy" })
  );
  await assertFails(getDoc(doc(userDb, "style_personas/s-1")));
});

// ── List-query coverage ─────────────────────────────────────────────────
// Security rules must be *provable* for list queries: a query on a
// status-guarded collection is denied for visitors unless it filters on
// status == "published". These tests pin the public read paths the site
// actually uses (Passport, Photos, Videos, destination detail).

test("guest can query published destinations by slug", async () => {
  await seed("destinations/dest-1", {
    slug: "tokyo",
    city: "Tokyo",
    status: "published",
  });
  const db = testEnv.unauthenticatedContext().firestore();
  await assertSucceeds(
    getDocs(
      query(
        collection(db, "destinations"),
        where("slug", "==", "tokyo"),
        where("status", "==", "published"),
        limit(1)
      )
    )
  );
});

test("guest destination query without status filter is denied", async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  await assertFails(
    getDocs(
      query(collection(db, "destinations"), where("slug", "==", "tokyo"), limit(1))
    )
  );
});

test("guest can query published videos and photo albums", async () => {
  await seed("videos/video-1", { title: "GRWM", status: "published", publishedAt: new Date() });
  await seed("photoAlbums/album-1", { title: "Paris", status: "published", createdAt: new Date() });
  const db = testEnv.unauthenticatedContext().firestore();
  await assertSucceeds(
    getDocs(query(collection(db, "videos"), where("status", "==", "published")))
  );
  await assertSucceeds(
    getDocs(query(collection(db, "photoAlbums"), where("status", "==", "published")))
  );
});

test("guest can query photos by album and categories", async () => {
  await seed("photos/photo-1", { albumId: "album-1", order: 1 });
  await seed("categories/cat-1", { type: "photo", createdAt: new Date() });
  const db = testEnv.unauthenticatedContext().firestore();
  await assertSucceeds(
    getDocs(query(collection(db, "photos"), where("albumId", "==", "album-1")))
  );
  await assertSucceeds(
    getDocs(query(collection(db, "categories"), where("type", "==", "photo"), orderBy("createdAt", "desc")))
  );
});

test("guest cannot read draft destination directly", async () => {
  await seed("destinations/draft-dest", { slug: "secret", status: "draft" });
  const db = testEnv.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, "destinations/draft-dest")));
});

// ── Menagerie ───────────────────────────────────────────────────────────

test("guest can query published menagerie, unfiltered list denied", async () => {
  await seed("menagerie/plush-1", {
    slug: "bartholomew",
    name: "Bartholomew",
    status: "published",
    adoptionDate: new Date(),
  });
  const db = testEnv.unauthenticatedContext().firestore();
  await assertSucceeds(
    getDocs(
      query(
        collection(db, "menagerie"),
        where("status", "==", "published"),
        orderBy("adoptionDate", "desc")
      )
    )
  );
  await assertFails(getDocs(query(collection(db, "menagerie"), limit(5))));
});

test("guest cannot read draft plush; admin can and may write", async () => {
  await seed("menagerie/plush-draft", { slug: "secret-plush", status: "draft" });
  const guestDb = testEnv.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(guestDb, "menagerie/plush-draft")));

  const adminDb = testEnv.authenticatedContext("admin-1", { role: "admin" }).firestore();
  await assertSucceeds(getDoc(doc(adminDb, "menagerie/plush-draft")));
  await assertSucceeds(
    setDoc(doc(adminDb, "menagerie/plush-new"), {
      slug: "new-plush",
      status: "draft",
      createdAt: serverTimestamp(),
    })
  );
  await assertSucceeds(deleteDoc(doc(adminDb, "menagerie/plush-new")));
});

test("non-admin users cannot write to menagerie", async () => {
  const userDb = testEnv.authenticatedContext("user-1", { role: "user" }).firestore();
  await assertFails(
    setDoc(doc(userDb, "menagerie/sneaky"), { slug: "sneaky", status: "published" })
  );
});

// ── Looks ───────────────────────────────────────────────────────────────

test("guest can query published looks, unfiltered list denied", async () => {
  await seed("looks/look-1", {
    slug: "airport-set",
    title: "Airport Set",
    status: "published",
    publishedAt: new Date(),
  });
  const db = testEnv.unauthenticatedContext().firestore();
  await assertSucceeds(
    getDocs(
      query(
        collection(db, "looks"),
        where("status", "==", "published"),
        orderBy("publishedAt", "desc")
      )
    )
  );
  await assertFails(getDocs(query(collection(db, "looks"), limit(5))));
});

test("guest cannot read draft look; admin can and may write", async () => {
  await seed("looks/look-draft", { slug: "secret-look", status: "draft" });
  const guestDb = testEnv.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(guestDb, "looks/look-draft")));

  const adminDb = testEnv.authenticatedContext("admin-1", { role: "admin" }).firestore();
  await assertSucceeds(getDoc(doc(adminDb, "looks/look-draft")));
  await assertSucceeds(
    setDoc(doc(adminDb, "looks/look-new"), {
      slug: "new-look",
      status: "draft",
      createdAt: serverTimestamp(),
    })
  );
  await assertSucceeds(deleteDoc(doc(adminDb, "looks/look-new")));
});

test("non-admin users cannot write to looks", async () => {
  const userDb = testEnv.authenticatedContext("user-1", { role: "user" }).firestore();
  await assertFails(
    setDoc(doc(userDb, "looks/sneaky"), { slug: "sneaky", status: "published" })
  );
});

test("all tests executed", () => {
  assert.ok(true);
});

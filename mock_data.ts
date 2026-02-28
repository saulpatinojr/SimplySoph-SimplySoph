import { getFirebaseFirestore } from "./client/src/lib/firebase";
import { collection, doc, setDoc, Timestamp } from "firebase/firestore";

async function run() {
  const db = getFirebaseFirestore();
  const dest1 = doc(collection(db, "destinations"));
  await setDoc(dest1, {
    city: "Paris",
    slug: "paris",
    country: "France",
    date: Timestamp.now(),
    coverStampUrl: "https://via.placeholder.com/150",
    mediaItems: [
        { type: "image", url: "https://via.placeholder.com/800x600", visaThumbnailUrl: "https://via.placeholder.com/150", title: "Eiffel Tower" }
    ],
    status: "published",
    authorId: "123",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
  console.log("added paris");
}

run();

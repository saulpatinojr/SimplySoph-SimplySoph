import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./common";

/**
 * Submit a contact form message to Firestore.
 * Validates email format before submission.
 */
export async function submitContactMessage(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  if (!data.name.trim() || !data.message.trim()) {
    return { success: false, error: "Name and message are required." };
  }

  try {
    await addDoc(collection(db(), "contact_messages"), {
      ...data,
      email: data.email.toLowerCase().trim(),
      submittedAt: serverTimestamp(),
      status: "unread",
    });
    return { success: true };
  } catch (err) {
    console.error("Contact form submission error:", err);
    return {
      success: false,
      error: "Failed to send message. Please try again.",
    };
  }
}

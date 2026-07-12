import { API_BASE } from "@/const";

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
    const res = await fetch(`${API_BASE}/contact/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...data,
        source: window.location.pathname,
      }),
    });

    if (!res.ok) {
      const errorBody = (await res.json().catch(() => ({}))) as { error?: string };
      return {
        success: false,
        error: errorBody.error || "Failed to send message. Please try again.",
      };
    }

    return { success: true };
  } catch (err) {
    console.error("Contact form submission error:", err);
    return {
      success: false,
      error: "Failed to send message. Please try again.",
    };
  }
}

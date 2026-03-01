/**
 * Email service integration utility (#27)
 *
 * This module provides a Firestore trigger-ready architecture for
 * sending emails when documents are written to specific collections.
 *
 * To enable email sending, deploy a Firebase Cloud Function that watches
 * the `mail` collection and sends via a provider (e.g., SendGrid, Mailgun).
 *
 * Example Cloud Function (deploy separately):
 * ```
 * exports.sendEmail = functions.firestore
 *   .document('mail/{mailId}')
 *   .onCreate(async (snap) => {
 *     const { to, subject, html } = snap.data();
 *     await transporter.sendMail({ from: 'hello@simplysoph.com', to, subject, html });
 *     await snap.ref.update({ status: 'sent', sentAt: admin.firestore.FieldValue.serverTimestamp() });
 *   });
 * ```
 */

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./common";

/**
 * Queue an email to be sent by a Cloud Function trigger.
 * The email is stored in Firestore's `mail` collection.
 */
export async function queueEmail(data: {
  to: string;
  subject: string;
  html: string;
  templateId?: string;
  templateData?: Record<string, unknown>;
}): Promise<string> {
  const docRef = await addDoc(collection(db(), "mail"), {
    ...data,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Send a welcome email when a user subscribes to the newsletter.
 */
export async function sendWelcomeEmail(email: string): Promise<string> {
  return queueEmail({
    to: email,
    subject: "Welcome to SimplySoph! ✨",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
        <h1 style="font-family: serif; font-size: 28px;">Welcome to SimplySoph!</h1>
        <p>Thanks for subscribing! You'll be the first to know about:</p>
        <ul>
          <li>New blog posts & styling tips</li>
          <li>Photo album drops</li>
          <li>Exclusive behind-the-scenes content</li>
          <li>Brand collaborations & giveaways</li>
        </ul>
        <p>Stay stylish ✨</p>
        <p style="color: #c5a55a; font-weight: bold;">— SimplySoph</p>
      </div>
    `,
  });
}

/**
 * Send a notification when a contact form message is received.
 */
export async function sendContactNotification(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<string> {
  return queueEmail({
    to: "hello@simplysoph.com",
    subject: `New Contact: ${data.subject || "Website Inquiry"}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${data.name} (${data.email})</p>
        <p><strong>Subject:</strong> ${data.subject || "N/A"}</p>
        <hr style="border: 1px solid #eee;">
        <p>${data.message}</p>
      </div>
    `,
  });
}

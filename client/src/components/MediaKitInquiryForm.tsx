import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { submitContactMessage } from "@/lib/services/contact";

export default function MediaKitInquiryForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "Brand partnership inquiry",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    const result = await submitContactMessage(form);

    if (result.success) {
      toast.success("Thanks — your partnership inquiry is in the queue.");
      setForm({
        name: "",
        email: "",
        subject: "Brand partnership inquiry",
        message: "",
      });
    } else {
      toast.error(result.error || "Could not send inquiry.");
    }

    setSubmitting(false);
  }

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="media-name">Name</Label>
        <Input
          id="media-name"
          value={form.name}
          onChange={event => setForm(current => ({ ...current, name: event.target.value }))}
          placeholder="Your name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="media-email">Email</Label>
        <Input
          id="media-email"
          type="email"
          value={form.email}
          onChange={event => setForm(current => ({ ...current, email: event.target.value }))}
          placeholder="team@brand.com"
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="media-subject">Campaign focus</Label>
        <Input
          id="media-subject"
          value={form.subject}
          onChange={event => setForm(current => ({ ...current, subject: event.target.value }))}
          placeholder="Campaign, launch, or deliverable focus"
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="media-message">Project brief</Label>
        <textarea
          id="media-message"
          value={form.message}
          onChange={event => setForm(current => ({ ...current, message: event.target.value }))}
          placeholder="Share launch timing, target audience, channels, usage needs, and success goals."
          className="min-h-36 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="md:col-span-2 flex flex-wrap gap-3 justify-center pt-2">
        <Button className="btn-gold text-white gap-2" type="submit" disabled={submitting}>
          <Mail size={16} />
          {submitting ? "Sending..." : "Send inquiry"}
        </Button>
        <a href="mailto:hello@simplysoph.com?subject=Media%20Kit%20Request">
          <Button variant="outline" type="button" className="gap-2">
            Email instead
          </Button>
        </a>
      </div>
    </form>
  );
}

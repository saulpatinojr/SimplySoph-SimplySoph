import { useState } from "react";
import { subscribeToNewsletter } from "@/lib/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "exists" | "error"
  >("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    try {
      const isNew = await subscribeToNewsletter(email);
      setStatus(isNew ? "success" : "exists");
      if (isNew) setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Mail
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={status === "loading"}
            className="pl-10"
            aria-label="Email address for newsletter"
          />
        </div>
        <Button
          type="submit"
          disabled={status === "loading"}
          className="btn-gold text-white"
        >
          {status === "loading" ? "..." : "Subscribe"}
        </Button>
      </form>

      {status === "success" && (
        <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
          <CheckCircle size={14} /> You're subscribed! 🎉
        </p>
      )}
      {status === "exists" && (
        <p className="mt-2 text-sm text-muted-foreground flex items-center gap-1">
          <CheckCircle size={14} /> You're already subscribed!
        </p>
      )}
      {status === "error" && (
        <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
          <AlertCircle size={14} /> Something went wrong. Please try again.
        </p>
      )}
    </div>
  );
}

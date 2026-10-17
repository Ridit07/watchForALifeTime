"use client";

import { useState } from "react";
import { cx } from "@/lib/utils";

type Status = "idle" | "sending" | "sent" | "error";

/**
 * Posts to Formspree over fetch rather than a native form submit, so the
 * visitor stays on the site and gets an inline confirmation instead of
 * Formspree's own thank-you page.
 */
export function ContactForm({ formId }: { formId: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  if (!formId) {
    return (
      <p className="border border-white/10 bg-ink p-5 text-sm text-muted-light">
        The contact form is not configured yet. Please email us directly in
        the meantime.
      </p>
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("sending");
    setMessage("");

    try {
      const response = await fetch(`https://formspree.io/f/${formId}`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });

      if (response.ok) {
        form.reset();
        setStatus("sent");
        return;
      }

      const body = await response.json().catch(() => null);
      setStatus("error");
      setMessage(
        body?.errors?.[0]?.message ||
          "We could not send that. Please try again, or call the showroom.",
      );
    } catch {
      setStatus("error");
      setMessage("No connection. Please try again.");
    }
  }

  if (status === "sent") {
    return (
      <div
        role="status"
        className="border border-sand-50 bg-ink p-8 text-center"
      >
        <p className="font-display text-xl text-sand-50">Thank you — message sent</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-light">
          We read every message and will reply to the address you gave us,
          usually within a working day.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 text-xs tracking-[0.15em] text-muted-light uppercase underline underline-offset-4 hover:text-sand-50"
        >
          Send another
        </button>
      </div>
    );
  }

  const field =
    "mt-1.5 w-full border border-white/15 bg-ink px-3.5 py-2.5 text-sm text-sand-50 transition-colors focus:border-sand-50 focus:outline-none";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="eyebrow">Your name</span>
          <input name="name" required autoComplete="name" className={field} />
        </label>
        <label className="block">
          <span className="eyebrow">Phone</span>
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className={field}
          />
        </label>
      </div>

      <label className="block">
        <span className="eyebrow">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className={field}
        />
      </label>

      <label className="block">
        <span className="eyebrow">Subject</span>
        <select name="subject" className={field} defaultValue="General enquiry">
          <option>General enquiry</option>
          <option>About a watch</option>
          <option>Servicing or battery</option>
          <option>Exchange within 7 days</option>
          <option>Order or delivery</option>
        </select>
      </label>

      <label className="block">
        <span className="eyebrow">Message</span>
        <textarea name="message" required rows={6} className={field} />
      </label>

      {/* Honeypot: bots fill hidden fields, people never see this one. */}
      <input
        type="text"
        name="_gotcha"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="hidden"
      />

      {status === "error" && (
        <p role="alert" className="text-sm text-red-800">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className={cx("btn btn-primary w-full sm:w-auto", status === "sending" && "opacity-60")}
      >
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

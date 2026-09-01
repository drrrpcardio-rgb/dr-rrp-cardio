"use client";

import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Send, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { contactEmail, web3formsAccessKey } from "@/lib/site-data";

interface FormState {
  name: string;
  email: string;
  phone: string;
  profession: string;
  interest: string;
  message: string;
}

const initialState: FormState = {
  name: "",
  email: "",
  phone: "",
  profession: "",
  interest: "",
  message: "",
};

const interests = [
  "ECG",
  "Echo",
  "Cath Lab",
  "IVUS",
  "Interventional Cardiology",
];

type Errors = Partial<Record<keyof FormState, string>>;
type Status = "idle" | "submitting" | "success" | "error";

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <label className="group relative block">
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-mist-700 uppercase">
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

const inputClasses =
  "w-full rounded-xl border border-mist-300 bg-white px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-royal-500";

/** Delivers the enquiry to contactEmail via Web3Forms — see src/lib/site-data.ts. */
async function submitEnquiry(form: FormState) {
  const res = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      access_key: web3formsAccessKey,
      subject: `Enquiry — ${form.interest || "General"} — ${form.name}`,
      from_name: form.name,
      name: form.name,
      email: form.email,
      phone: form.phone,
      profession: form.profession,
      "Course / Programme Interested In": form.interest,
      message: form.message,
    }),
  });
  const result = await res.json();
  if (!result.success) throw new Error(result.message || "Submission failed");
}

export function ContactForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): Errors {
    const next: Errors = {};
    if (!form.name.trim()) next.name = "Please enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address.";
    if (!form.phone.trim()) next.phone = "Please enter a phone number.";
    if (!form.interest) next.interest = "Select an area of interest.";
    return next;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setStatus("submitting");
    try {
      await submitEnquiry(form);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center rounded-2xl border border-mist-200 bg-white p-12 text-center"
      >
        <CheckCircle2 size={40} className="text-royal-700" />
        <h3 className="font-heading mt-5 text-xl font-semibold text-ink">Thank you, {form.name}.</h3>
        <p className="mt-2 max-w-sm text-sm text-mist-700">
          We&rsquo;ve received your enquiry and will get back to you shortly
          about {form.interest}.
        </p>
        <button
          onClick={() => {
            setForm(initialState);
            setStatus("idle");
          }}
          className="mt-6 text-sm font-medium text-royal-700 underline-grow"
        >
          Submit another enquiry
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-mist-200 bg-white p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full Name" error={errors.name}>
          <input
            className={cn(inputClasses, errors.name && "border-red-400")}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Dr. Jane Doe"
          />
        </Field>
        <Field label="Email" error={errors.email}>
          <input
            type="email"
            className={cn(inputClasses, errors.email && "border-red-400")}
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <input
            type="tel"
            className={cn(inputClasses, errors.phone && "border-red-400")}
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+91 00000 00000"
          />
        </Field>
        <Field label="Profession">
          <input
            className={inputClasses}
            value={form.profession}
            onChange={(e) => update("profession", e.target.value)}
            placeholder="e.g. MBBS Doctor, Nurse, Cath Lab Technologist"
          />
        </Field>
        <Field label="Course / Programme Interested In" error={errors.interest}>
          <select
            className={cn(inputClasses, errors.interest && "border-red-400")}
            value={form.interest}
            onChange={(e) => update("interest", e.target.value)}
          >
            <option value="">Select one</option>
            {interests.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-5">
        <Field label="Message (optional)">
          <textarea
            className={inputClasses}
            rows={4}
            value={form.message}
            onChange={(e) => update("message", e.target.value)}
            placeholder="Tell us a bit about what you're looking for..."
          />
        </Field>
      </div>

      {status === "error" && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 flex items-center gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <XCircle size={18} className="shrink-0" />
          Something went wrong sending that — please try again, or email us
          directly at{" "}
          <a href={`mailto:${contactEmail}`} className="font-medium underline-grow">
            {contactEmail}
          </a>
          .
        </motion.p>
      )}

      <motion.button
        whileTap={{ scale: 0.97 }}
        type="submit"
        disabled={status === "submitting"}
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-royal-700 px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-royal-800 disabled:opacity-60 sm:w-auto"
      >
        {status === "submitting" ? (
          <>
            Sending... <Loader2 size={16} className="animate-spin" />
          </>
        ) : (
          <>
            Send Enquiry <Send size={16} />
          </>
        )}
      </motion.button>
    </form>
  );
}

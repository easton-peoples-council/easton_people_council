"use client";

import { useEffect, useState, FormEvent } from "react";
import Script from "next/script";

type FormState = "idle" | "submitting" | "success" | "error";

type FormFieldId = "name" | "email" | "phone" | "comment";
type FormFieldEntry = {
  id: FormFieldId;
  label: string;
  type: "text" | "email" | "tel" | "textarea";
  required?: boolean;
};

const FORM_FIELDS: FormFieldEntry[] = [
  { id: "name", label: "Name", type: "text", required: true },
  { id: "email", label: "Email address", type: "email", required: true },
  { id: "phone", label: "Phone number", type: "tel" },
  { id: "comment", label: "Comment", type: "textarea" },
];

type FormData = Record<FormFieldId, string>;

const initialForm: FormData = Object.fromEntries(
  FORM_FIELDS.map((f) => [f.id, ""])
) as FormData;

declare global {
  interface Window {
    onTurnstileSuccess?: (token: string) => void;
    onTurnstileExpired?: () => void;
    onTurnstileError?: () => void;
    turnstile?: {
      reset: () => void;
    };
  }
}

function FormField({
  id,
  label,
  type,
  value,
  onChange,
  disabled,
  required,
}: {
  id: string;
  label: string;
  type: "text" | "email" | "tel" | "textarea";
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  required?: boolean;
}) {
  const common = {
    id,
    value,
    onChange: (e: { target: { value: string } }) => onChange(e.target.value),
    disabled,
  };
  return (
    <>
      <label htmlFor={id}>{label}</label>
      {type === "textarea" ? (
        <textarea {...common} />
      ) : (
        <input type={type} required={required} {...common} />
      )}
    </>
  );
}

export default function SignupForm() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    window.onTurnstileSuccess = (token: string) => {
      setTurnstileToken(token);
    };
    window.onTurnstileExpired = () => {
      setTurnstileToken("");
    };
    window.onTurnstileError = () => {
      setTurnstileToken("");
    };

    return () => {
      delete window.onTurnstileSuccess;
      delete window.onTurnstileExpired;
      delete window.onTurnstileError;
    };
  }, []);

  function setField(id: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [id]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!turnstileToken) {
      setState("error");
      setErrorMessage("Please complete verification.");
      return;
    }

    setState("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, turnstileToken }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setState("error");
        setErrorMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setState("success");
      setForm(initialForm);
      setTurnstileToken("");
      window.turnstile?.reset();
    } catch {
      setState("error");
      setErrorMessage("Network error. Please try again.");
    }
  }

  const disabled = state === "submitting" || !turnstileToken;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
      />

      <form className="signupForm" onSubmit={handleSubmit}>
        {FORM_FIELDS.map((f) => (
          <FormField
            key={f.id}
            id={f.id}
            label={f.label}
            type={f.type}
            value={form[f.id]}
            onChange={(v) => setField(f.id, v)}
            disabled={state === "submitting"}
            required={f.required}
          />
        ))}

        {turnstileSiteKey ? (
          <div
            className="cf-turnstile"
            data-sitekey={turnstileSiteKey}
            data-callback="onTurnstileSuccess"
            data-expired-callback="onTurnstileExpired"
            data-error-callback="onTurnstileError"
          />
        ) : (
          <p className="formMessage error">
            Verification is currently unavailable. Please try again later.
          </p>
        )}

        <button type="submit" disabled={disabled}>
          {state === "submitting" ? "Submitting…" : "Get Involved"}
        </button>

        {state === "success" && (
          <p className="formMessage success">Thank you. Your details have been submitted.</p>
        )}
        {state === "error" && errorMessage && (
          <p className="formMessage error">{errorMessage}</p>
        )}
      </form>
    </>
  );
}

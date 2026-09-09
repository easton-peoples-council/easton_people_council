"use client";

import { useEffect, useState, FormEvent } from "react";
import Script from "next/script";
import { EMAIL_REGEX, UK_PHONE_LOOSE_REGEX, MAX_COMMENT_LENGTH } from "@/lib/validation";

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
      // Cloudflare passes a numeric error code as a string, and render()
      // returns undefined when the widget fails to mount.
      render: (
        el: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": (code?: string) => void;
        }
      ) => string | undefined;
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
        <textarea {...common} maxLength={MAX_COMMENT_LENGTH} />
      ) : (
        <input type={type} required={required} {...common} />
      )}
    </>
  );
}

function useTurnstileToken() {
  const [turnstileToken, setTurnstileToken] = useState("");

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

  return { turnstileToken, setTurnstileToken };
}

export default function SignupForm() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const { turnstileToken, setTurnstileToken } = useTurnstileToken();
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

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

    const trimmedEmail = form.email.trim();
    const trimmedPhone = form.phone.trim();
    const trimmedComment = form.comment.trim();

    if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
      setState("error");
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (trimmedPhone && !UK_PHONE_LOOSE_REGEX.test(trimmedPhone)) {
      setState("error");
      setErrorMessage("Please enter a valid phone number.");
      return;
    }

    if (trimmedComment.length > MAX_COMMENT_LENGTH) {
      setState("error");
      setErrorMessage(`Comment must be ${MAX_COMMENT_LENGTH} characters or fewer.`);
      return;
    }

    setState("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          email: trimmedEmail,
          phone: trimmedPhone,
          comment: trimmedComment,
          turnstileToken,
        }),
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

  function renderField(field: FormFieldEntry) {
    return (
      <FormField
        key={field.id}
        id={field.id}
        label={field.label}
        type={field.type}
        value={form[field.id]}
        onChange={(value) => setField(field.id, value)}
        disabled={state === "submitting"}
        required={field.required}
      />
    );
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
      />

      <form className="signupForm" onSubmit={handleSubmit}>
        {FORM_FIELDS.map(renderField)}

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

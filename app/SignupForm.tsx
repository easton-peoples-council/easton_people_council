"use client";

import { useState, FormEvent } from "react";

type FormState = "idle" | "submitting" | "success" | "error";

type FormFieldId = "firstName" | "lastName" | "email" | "phone" | "comment";
type FormFieldEntry = {
  id: FormFieldId;
  label: string;
  type: "text" | "email" | "tel" | "textarea";
  required?: boolean;
  row?: "name";
};

const FORM_FIELDS: FormFieldEntry[] = [
  { id: "firstName", label: "First name", type: "text", required: true, row: "name" },
  { id: "lastName", label: "Last name", type: "text", row: "name" },
  { id: "email", label: "Email address", type: "email", required: true },
  { id: "phone", label: "Phone number", type: "tel" },
  { id: "comment", label: "Comment", type: "textarea" },
];

type FormData = Record<FormFieldId, string>;

const initialForm: FormData = Object.fromEntries(
  FORM_FIELDS.map((f) => [f.id, ""])
) as FormData;

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

  function setField(id: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [id]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setState("error");
        setErrorMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setState("success");
      setForm(initialForm);
    } catch {
      setState("error");
      setErrorMessage("Network error. Please try again.");
    }
  }

  const disabled = state === "submitting";
  const nameRowFields = FORM_FIELDS.filter((f) => f.row === "name");
  const otherFields = FORM_FIELDS.filter((f) => !f.row);

  return (
    <form className="signupForm" onSubmit={handleSubmit}>
      <div className="signupFormNameRow">
        {nameRowFields.map((f) => (
          <div key={f.id}>
            <FormField
              id={f.id}
              label={f.label}
              type={f.type}
              value={form[f.id]}
              onChange={(v) => setField(f.id, v)}
              disabled={disabled}
              required={f.required}
            />
          </div>
        ))}
      </div>

      {otherFields.map((f) => (
        <FormField
          key={f.id}
          id={f.id}
          label={f.label}
          type={f.type}
          value={form[f.id]}
          onChange={(v) => setField(f.id, v)}
          disabled={disabled}
          required={f.required}
        />
      ))}

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
  );
}

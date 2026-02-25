"use client";

import { useState, FormEvent } from "react";

type FormState = "idle" | "submitting" | "success" | "error";

export default function SignupForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, phone, comment }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setState("error");
        setErrorMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setState("success");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setComment("");
    } catch {
      setState("error");
      setErrorMessage("Network error. Please try again.");
    }
  }

  return (
    <form className="signupForm" onSubmit={handleSubmit}>
      <div className="signupFormNameRow">
        <div>
          <label htmlFor="firstName">First name</label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            disabled={state === "submitting"}
          />
        </div>
        <div>
          <label htmlFor="lastName">Last name</label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={state === "submitting"}
          />
        </div>
      </div>

      <label htmlFor="email">Email address</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={state === "submitting"}
      />

      <label htmlFor="phone">Phone number</label>
      <input
        id="phone"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        disabled={state === "submitting"}
      />

      <label htmlFor="comment">Comment</label>
      <textarea
        id="comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        disabled={state === "submitting"}
      />

      <button type="submit" disabled={state === "submitting"}>
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

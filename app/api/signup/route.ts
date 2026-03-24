import { NextRequest, NextResponse } from "next/server";
import { qomonRequest } from "@/lib/qomon";
import { EMAIL_REGEX, UK_PHONE_LOOSE_REGEX, MAX_COMMENT_LENGTH } from "@/lib/validation";

type TurnstileVerifyResponse = {
  success: boolean;
  "error-codes"?: string[];
};

async function verifyTurnstileToken(token: string, remoteIp?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return { ok: false, error: "Turnstile secret is not configured", status: 500 };
  }

  const formData = new URLSearchParams({
    secret,
    response: token,
  });

  if (remoteIp) {
    formData.append("remoteip", remoteIp);
  }

  const verifyResponse = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    }
  );

  if (!verifyResponse.ok) {
    return { ok: false, error: "Verification service failed", status: 502 };
  }

  const verifyData = (await verifyResponse.json()) as TurnstileVerifyResponse;
  if (!verifyData.success) {
    return {
      ok: false,
      error: "Verification failed. Please try again.",
      status: 400,
    };
  }

  return { ok: true };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = (body.name ?? "").trim();
    const email = (body.email ?? "").trim();
    const phone = (body.phone ?? "").trim();
    const comment = (body.comment ?? "").trim();
    const turnstileToken = (body.turnstileToken ?? "").trim();
    const remoteIp =
      request.headers.get("cf-connecting-ip") ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

    if (!turnstileToken) {
      return NextResponse.json(
        { error: "Verification is required" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!email && !phone && !comment) {
      return NextResponse.json(
        { error: "At least one of email, phone, or comment is required" },
        { status: 400 }
      );
    }

    if (email && !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    if (phone && !UK_PHONE_LOOSE_REGEX.test(phone)) {
      return NextResponse.json(
        { error: "Please enter a valid phone number" },
        { status: 400 }
      );
    }

    if (comment.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json(
        { error: `Comment must be ${MAX_COMMENT_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }

    const turnstileVerification = await verifyTurnstileToken(turnstileToken, remoteIp);
    if (!turnstileVerification.ok) {
      return NextResponse.json(
        { error: turnstileVerification.error },
        { status: turnstileVerification.status }
      );
    }

    const response = await qomonRequest("/contacts/upsert", {
      method: "POST",
      body: JSON.stringify({
        kind: "contact",
        data: {
          firstname: name,
          surname: "",
          phone: phone,
          // comment: comment,  / TODO include/allow comments. allow updating of existing contact if there are matches in place
          mail: email,
          // tags: ["website-signup"],  // TODO MK Specify tags look up what they mean
        }
      }),
    });
    const responseText = await response.text();

    if (!response.ok) {
      console.error("Qomon error:", responseText);
      return NextResponse.json(
        { error: "Failed to create contact" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

// TODO GDPR CHECKS
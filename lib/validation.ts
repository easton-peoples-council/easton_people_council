export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const UK_PHONE_LOOSE_REGEX = /^[+()\-\d\s]{7,20}$/;
export const MAX_COMMENT_LENGTH = 2000;

type TurnstileVerifyResponse = {
  success: boolean;
  "error-codes"?: string[];
};

export async function verifyTurnstileToken(token: string, remoteIp?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return { ok: false, error: "Turnstile secret is not configured", status: 500 };
  }

  const formData = new URLSearchParams({ secret, response: token });
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
    return { ok: false, error: "Verification failed. Please try again.", status: 400 };
  }

  return { ok: true };
}

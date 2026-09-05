import { NextRequest, NextResponse } from "next/server";
import { qomonRequest } from "@/lib/qomon";
import { EMAIL_REGEX, verifyTurnstileToken } from "@/lib/validation";

// Easton sits inside this box. Anything drawn outside it is not a proposal
// for Easton's boundary.
const BRISTOL_BBOX = { minLng: -2.75, maxLng: -2.4, minLat: 51.38, maxLat: 51.55 };
const MAX_VERTICES = 200;

type Ring = [number, number][];

function parseRing(input: unknown): Ring | string {
  if (!Array.isArray(input)) {
    return "No boundary was submitted";
  }
  if (input.length < 3) {
    return "A boundary needs at least three points";
  }
  if (input.length > MAX_VERTICES) {
    return `A boundary can have at most ${MAX_VERTICES} points`;
  }

  const ring: Ring = [];
  for (const point of input) {
    if (!Array.isArray(point) || point.length !== 2) {
      return "Boundary points are malformed";
    }
    const [lng, lat] = point;
    if (typeof lng !== "number" || typeof lat !== "number") {
      return "Boundary points are malformed";
    }
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      return "Boundary points are malformed";
    }
    if (
      lng < BRISTOL_BBOX.minLng ||
      lng > BRISTOL_BBOX.maxLng ||
      lat < BRISTOL_BBOX.minLat ||
      lat > BRISTOL_BBOX.maxLat
    ) {
      return "The boundary must be drawn around Easton";
    }
    // 5dp is about a metre — plenty for a neighbourhood boundary, and keeps
    // the string short enough to sit in a Qomon custom field.
    ring.push([Number(lng.toFixed(5)), Number(lat.toFixed(5))]);
  }

  return ring;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = (body.name ?? "").trim();
    const email = (body.email ?? "").trim();
    const postcode = (body.postcode ?? "").trim();
    const turnstileToken = (body.turnstileToken ?? "").trim();
    const remoteIp =
      request.headers.get("cf-connecting-ip") ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

    if (!turnstileToken) {
      return NextResponse.json({ error: "Verification is required" }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    const ring = parseRing(body.boundary);
    if (typeof ring === "string") {
      return NextResponse.json({ error: ring }, { status: 400 });
    }

    const fieldId = Number(process.env.QOMON_BOUNDARY_FIELD_ID);
    if (!fieldId) {
      return NextResponse.json(
        { error: "Boundary submissions are not configured" },
        { status: 500 }
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
          mail: email,
          ...(postcode && { address: { postalcode: postcode } }),
          custom_fields: [{ id: fieldId, value: JSON.stringify(ring) }],
        },
      }),
    });

    if (!response.ok) {
      console.error("Qomon error:", await response.text());
      return NextResponse.json({ error: "Failed to save boundary" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

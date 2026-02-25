import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const firstName = (body.firstName ?? "").trim();
    const lastName = (body.lastName ?? "").trim();
    const email = (body.email ?? "").trim();
    const phone = (body.phone ?? "").trim();
    const comment = (body.comment ?? "").trim();

    if (!firstName) {
      return NextResponse.json(
        { error: "First name is required" },
        { status: 400 }
      );
    }

    if (!firstName) {
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
    
    const response = await fetch("https://api.qomon.com/contacts", {  // TODO Specify endpoint
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.QOMON_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        comment: comment,
        email,
        tags: ["website-signup"],  // TODO Specify tags look up what they mean
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Qomon error:", errorText);
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
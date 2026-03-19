import { NextRequest, NextResponse } from "next/server";
import { QOMON_SERVER } from "@/lib/qomon";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const firstName = (body.firstName ?? "").trim();
    const lastName = (body.lastName ?? "").trim();
    const email = (body.email ?? "").trim();
    const phone = (body.phone ?? "").trim();
    const comment = (body.comment ?? "").trim();

    if (!firstName && !lastName) {
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
    
    const response = await fetch(`${QOMON_SERVER}/contacts/upsert`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.QOMON_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        kind: "contact",
        data: {
          firstname: firstName,
          surname: lastName,
          phone: phone,
          // comment: comment,  / TODO include/allow comments. allow updating of existing contact if there are matches in place
          mail: email,
          // tags: ["website-signup"],  // TODO Specify tags look up what they mean
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
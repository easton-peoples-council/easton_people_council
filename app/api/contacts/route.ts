import { NextResponse } from "next/server";
import { getContactsCount } from "@/lib/qomon";

export async function POST(request: Request) {
  try {
    const total = await getContactsCount();
    return NextResponse.json({ contacts: total });
  } catch (error) {
    console.error("[api/contacts] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

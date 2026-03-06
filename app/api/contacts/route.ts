import { NextResponse } from "next/server";
import { getContactsCount } from "@/lib/qomon";

export async function POST(request: Request) {
  const url = request.url;
  const { searchParams } = new URL(url);
  const query = Object.fromEntries(searchParams.entries());
  console.log("[api/contacts] GET requested", { url, query });
  try {
    const total = await getContactsCount();
    console.log("[api/contacts] Success, contacts:", total);
    return NextResponse.json({ contacts: total });
  } catch (error) {
    console.error("[api/contacts] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

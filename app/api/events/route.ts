import ical from "node-ical";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.CALENDAR_URL as string;
  console.log("[api/events] Fetching calendar from URL:", url ? `${url.slice(0, 50)}...` : "(not set)");

  const data = await ical.async.fromURL(url);
  const rawCount = Object.keys(data).length;
  const vevents = Object.values(data).filter((e: any) => e.type === "VEVENT");
  console.log("[api/events] Raw entries:", rawCount, "VEVENT count:", vevents.length);

  vevents.forEach((event: any, i: number) => {
    console.log(`[api/events] VEVENT [${i}] all attributes:`);
    for (const key of Object.keys(event)) {
      const val = event[key];
      const preview =
        val === null || val === undefined
          ? String(val)
          : typeof val === "object" && val instanceof Date
            ? val.toISOString()
            : typeof val === "object"
              ? `{${Object.keys(val).join(", ")}}`
              : String(val).length > 80
                ? `${String(val).slice(0, 80)}...`
                : String(val);
      console.log(`  ${key}:`, preview);
    }
  });

  const events = vevents.map((event: any) => ({
    title: event.summary,
    description: event.description ?? "",
    location: event.location ?? "",
    start: event.start,
    end: event.end,
  }));

  console.log("[api/events] Mapped events:", events.length);
  events.forEach((e, i) => {
    console.log(`  [${i}] title="${e.title}" description=${e.description ? `"${String(e.description).slice(0, 60)}..."` : '""'}`);
  });

  return Response.json(events);
}
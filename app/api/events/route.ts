import ical from "node-ical";
import { type IcalVEvent, type CalendarEvent } from "@/lib/events";

export const runtime = 'nodejs';
export const dynamic = "force-dynamic";

function toIso(v: unknown): string {
  if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString();
  if (typeof v === "string" && !isNaN(Date.parse(v))) return v;
  return "";
}

export async function GET() {
  const url = process.env.CALENDAR_URL;
  if (!url?.startsWith("http")) {
    return Response.json([], { status: 503 });
  }
  try {
    const data = await ical.async.fromURL(url);
    const vevents = Object.values(data).filter(
      (e) => e != null && (e as { type?: string }).type === "VEVENT"
    ) as IcalVEvent[];

    const events: CalendarEvent[] = vevents
      .map((event) => ({
        title: event.summary ?? "",
        description: event.description ?? "",
        location: event.location ?? "",
        start: toIso(event.start),
        end: toIso(event.end),
      }))
      .filter((e) => e.start);

    return Response.json(events);
  } catch {
    return Response.json([], { status: 502 });
  }
}
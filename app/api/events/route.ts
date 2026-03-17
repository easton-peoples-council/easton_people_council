import ical from "node-ical";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.CALENDAR_URL as string;
  const data = await ical.async.fromURL(url);
  const vevents = Object.values(data).filter((e: any) => e.type === "VEVENT");

  const events = vevents.map((event: any) => ({
    title: event.summary,
    description: event.description ?? "",
    location: event.location ?? "",
    start: event.start,
    end: event.end,
  }));

  return Response.json(events);
}
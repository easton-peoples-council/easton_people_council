import ical from "node-ical";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.CALENDAR_URL as string;

  const data = await ical.async.fromURL(url);

  const events = Object.values(data)
    .filter((event: any) => event.type === "VEVENT")
    .map((event: any) => ({
      title: event.summary,
      start: event.start,
      end: event.end,
    }));

  return Response.json(events);
}
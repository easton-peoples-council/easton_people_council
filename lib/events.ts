/** Minimal shape of a VEVENT from node-ical (for typing the ical parse result). */
export type IcalVEvent = {
  type: "VEVENT";
  summary?: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
};

/** Event shape returned by GET /api/events (and used by the calendar client). */
export type CalendarEvent = {
  title: string;
  description: string;
  location: string;
  start: string;
  end: string;
};

/** Cleans API event data (strip [In-person], normalize empty title) and sorts by start time. */
export function cleanAndSortEvents(events: CalendarEvent[]): CalendarEvent[] {
  const cleaned = events
    .filter((e) => e?.start && !isNaN(Date.parse(e.start)))
    .map(({ title, description, location, start, end }) => {
    const cleanTitle = (title ?? "").replace(/\s*\[In-person\]\s*/gi, "").trim() || "Event";
    const rawDesc = description ?? "";
    const cleanDesc = rawDesc.replace(/^\s*\[In-person\]\s*\n?/gi, "").trim();
    return {
      title: cleanTitle,
      start,
      end,
      description: cleanDesc,
      location: location ?? "",
    };
  });
  cleaned.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  return cleaned;
}

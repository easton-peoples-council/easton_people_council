"use client";

import { useEffect, useState } from "react";

type CalendarEvent = {
  title: string;
  start: string;
  end: string;
  description: string;
  location: string;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDateTime(start: string, end: string): string {
  return `${formatDate(start)}, ${formatTime(start)} – ${formatTime(end)}`;
}

export default function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data: Array<{ title?: string; description?: string; location?: string; start: string; end: string }>) => {
        const cleaned = data.map(({ title, description, location, start, end }) => {
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
        setEvents(cleaned);
      })
      .finally(() => setLoading(false));
  }, []);
 
  if (loading) {
    return (
      <div className="calendar">
        <p className="calendar-loading">Loading events…</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="calendar">
        <p className="calendar-empty">No upcoming events at the moment. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="calendar">
      <ul className="calendar-list">
        {events.map((event, i) => (
          <li key={i} className="calendar-event">
            <time className="calendar-event-datetime" dateTime={event.start}>
              {formatDateTime(event.start, event.end)}
            </time>
            <h3 className="calendar-event-title">{event.title}</h3>
            {event.location && (
              <p className="calendar-event-meta">{event.location}</p>
            )}
            {event.description && (
              <p className="calendar-event-desc">{event.description}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { type CalendarEvent, cleanAndSortEvents } from "@/lib/events";

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch("/api/events");
        const data = res.ok ? await res.json() : [];
        setEvents(cleanAndSortEvents(Array.isArray(data) ? data : []));
        setError(null);
      } catch {
        setEvents([]);
        setError("Unable to load events. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  return (
    <div className="calendar">
      {loading && <p className="calendar-loading">Loading events…</p>}
      {error && <p className="calendar-error">{error}</p>}
      {!loading && !error && events.length === 0 && (
        <p className="calendar-empty">No upcoming events at the moment. Check back soon.</p>
      )}
      {!loading && !error && events.length > 0 && (
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
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import listPlugin from "@fullcalendar/list";

function escapeHtml(text: string) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

type CalendarEvent = {
  title?: string;
  start: string;
  end: string;
  extendedProps: { description: string };
};

export default function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data: Array<{ title?: string; description?: string; start: string; end: string }>) =>
        setEvents(
          data.map(({ title, description, start, end }) => ({
            title,
            start,
            end,
            extendedProps: { description: description ?? "" },
          }))
        )
      );
  }, []);

  return (
    <FullCalendar
      plugins={[listPlugin]}
      initialView="listYear"
      events={events}
      height="auto"
      eventDidMount={(arg) => {
        const desc = arg.event.extendedProps?.description;
        if (desc) {
          const titleEl = arg.el.querySelector(".fc-event-title");
          if (titleEl) {
            const descEl = document.createElement("div");
            descEl.className = "fc-event-description";
            descEl.style.marginTop = "4px";
            descEl.style.fontSize = "0.9em";
            descEl.style.opacity = "0.9";
            descEl.textContent = desc;
            titleEl.insertAdjacentElement("afterend", descEl);
          }
        }
      }}
    />
  );
}
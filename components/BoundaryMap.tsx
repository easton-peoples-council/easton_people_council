"use client";

import { useCallback, useEffect, useRef, useState, FormEvent } from "react";
import Script from "next/script";
import { EMAIL_REGEX } from "@/lib/validation";

type FormState = "idle" | "submitting" | "success" | "error";

const EASTON_CENTRE: [number, number] = [51.4653, -2.562];

export default function BoundaryMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const [boundary, setBoundary] = useState<[number, number][] | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // next/script dedupes by src, so arriving here via a nav link does not
  // re-run api.js and its auto-render pass never sees this widget. Render it
  // explicitly instead. onReady fires on mount even when the script already
  // loaded; onLoad does not.
  const renderTurnstile = useCallback(() => {
    if (!turnstileRef.current || !turnstileSiteKey || widgetId.current) return;
    widgetId.current = window.turnstile?.render(turnstileRef.current, {
      sitekey: turnstileSiteKey,
      callback: (token: string) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => setTurnstileToken(""),
    });
  }, [turnstileSiteKey]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let map: import("leaflet").Map | undefined;

    // Leaflet and Geoman both touch `window` on import, so they load here
    // rather than at module scope.
    (async () => {
      const L = (await import("leaflet")).default;
      await import("@geoman-io/leaflet-geoman-free");

      // The cleanup may have run while the imports were in flight. Without
      // this, a remount calls L.map() twice on the same node and Leaflet
      // throws "Map container is already initialized".
      if (cancelled) return;

      map = L.map(container).setView(EASTON_CENTRE, 14);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      map.pm.addControls({
        position: "topleft",
        drawMarker: false,
        drawCircle: false,
        drawCircleMarker: false,
        drawPolyline: false,
        drawRectangle: false,
        drawText: false,
        cutPolygon: false,
        rotateMode: false,
        dragMode: false,
      });

      const readLayer = (layer: import("leaflet").Layer) => {
        const ring = (layer as import("leaflet").Polygon).getLatLngs()[0];
        if (!Array.isArray(ring)) return;
        setBoundary(
          (ring as import("leaflet").LatLng[]).map((p) => [p.lng, p.lat])
        );
      };

      let drawn: import("leaflet").Layer | undefined;

      map.on("pm:create", (e) => {
        // One boundary per person: drawing again replaces the last one.
        if (drawn) map?.removeLayer(drawn);
        drawn = e.layer;
        readLayer(e.layer);
        e.layer.on("pm:edit", () => readLayer(e.layer));
      });

      map.on("pm:remove", () => {
        drawn = undefined;
        setBoundary(null);
      });
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!boundary) {
      setState("error");
      setErrorMessage("Please draw a boundary on the map first.");
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setState("error");
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setState("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/boundary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          boundary,
          turnstileToken,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setState("error");
        setErrorMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setState("success");
      setTurnstileToken("");
      window.turnstile?.reset();
    } catch {
      setState("error");
      setErrorMessage("Network error. Please try again.");
    }
  }

  return (
    <>
      {/* Same src as SignupForm so next/script loads api.js once, not twice.
          The auto-render pass only looks for .cf-turnstile, which this
          widget's container deliberately is not. */}
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        onReady={renderTurnstile}
      />

      <div ref={containerRef} className="boundaryMap" />

      <form className="signupForm" onSubmit={handleSubmit}>
        <p className="boundaryHint">
          {boundary
            ? `Boundary drawn with ${boundary.length} points. Use the edit tools to adjust it.`
            : "Use the polygon tool at the top left of the map to trace where you think Easton begins and ends."}
        </p>

        <label htmlFor="boundary-name">Name</label>
        <input
          id="boundary-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={state === "submitting"}
        />

        <label htmlFor="boundary-email">Email address</label>
        <input
          id="boundary-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={state === "submitting"}
        />

        {turnstileSiteKey ? (
          <div ref={turnstileRef} />
        ) : (
          <p className="formMessage error">
            Verification is currently unavailable. Please try again later.
          </p>
        )}

        <button type="submit" disabled={state === "submitting" || !turnstileToken}>
          {state === "submitting" ? "Submitting…" : "Submit my boundary"}
        </button>

        {state === "success" && (
          <p className="formMessage success">Thank you. Your boundary has been submitted.</p>
        )}
        {state === "error" && errorMessage && (
          <p className="formMessage error">{errorMessage}</p>
        )}
      </form>
    </>
  );
}

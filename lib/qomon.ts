const QOMON_SERVER = "https://incoming.qomon.app";

export async function getContactsCount(): Promise<number> {
  const url = `${QOMON_SERVER}/search`;
  console.log("[qomon] Fetching contacts:", url, "API key set:", !!process.env.QOMON_API_KEY);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.QOMON_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      "data": {
        "advanced_search": {
          "per_page": 1000,
          "query": {
            "$all": []
          }
        }
      }
    }),
  });

  console.log("[qomon] Response status:", res.status, res.statusText);

  if (!res.ok) {
    const text = await res.text();
    console.error("[qomon] Error response body:", text);
    throw new Error(`Qomon API error: ${res.status}`);
  }

  const data = (await res.json()) as { status?: string; data?: { contacts?: unknown[] }; [key: string]: unknown };
  console.log("[qomon] Response data keys:", Object.keys(data), "total:", data.data?.contacts?.length);
  // console.log("[qomon] Full payload:", JSON.stringify(data, null, 2));
  if (data && typeof data === "object" && "data" in data) {
    // console.log("[qomon] data.data keys:", Object.keys((data as { data: unknown }).data as object), "payload:", JSON.stringify((data as { data: unknown }).data, null, 2));
  }

  const count = Array.isArray(data.data?.contacts) ? data.data?.contacts.length : 0;
  console.log("[qomon] Returning contacts count:", count);
  return count;
}

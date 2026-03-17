const QOMON_SERVER = "https://incoming.qomon.app";

export async function getContactsCount(): Promise<number> {
  const url = `${QOMON_SERVER}/search`;
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

  if (!res.ok) {
    const text = await res.text();
    console.error("[qomon] Error response body:", text);
    throw new Error(`Qomon API error: ${res.status}`);
  }

  const data = (await res.json()) as { status?: string; data?: { contacts?: unknown[] }; [key: string]: unknown };
  const count = Array.isArray(data.data?.contacts) ? data.data?.contacts.length : 0;
  return count;
}

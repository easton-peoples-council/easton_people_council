export const QOMON_SERVER = "https://incoming.qomon.app";

type QomonRequestOptions = Omit<RequestInit, "headers"> & {
  headers?: HeadersInit;
};

function buildQomonHeaders(extraHeaders?: HeadersInit): Headers {
  const headers = new Headers(extraHeaders);
  headers.set("Content-Type", "application/json");
  headers.set("Authorization", `Bearer ${process.env.QOMON_API_KEY}`);
  return headers;
}

export async function qomonRequest(path: string, options: QomonRequestOptions = {}): Promise<Response> {
  const { headers, ...requestOptions } = options;
  return fetch(`${QOMON_SERVER}${path}`, {
    ...requestOptions,
    headers: buildQomonHeaders(headers),
  });
}

export async function qomonRequestJson<T>(path: string, options: QomonRequestOptions = {}): Promise<T> {
  const response = await qomonRequest(path, options);
  if (!response.ok) {
    const text = await response.text();
    console.error("[qomon] Error response body:", text);
    throw new Error(`Qomon API error: ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function getContactsCount(): Promise<number> {
  const data = await qomonRequestJson<{ status?: string; data?: { contacts?: unknown[] }; [key: string]: unknown }>(
    "/search",
    {
      method: "POST",
      body: JSON.stringify({
        data: {
          advanced_search: {
            per_page: 1000,
            query: {
              $all: [],
            },
          },
        },
      }),
    }
  );
  const count = Array.isArray(data.data?.contacts) ? data.data?.contacts.length : 0;
  return count;
}

export async function getContactsCountOrNull(logContext: string): Promise<number | null> {
  try {
    return await getContactsCount();
  } catch (err) {
    console.error(`[${logContext}] getContactsCount failed:`, err);
    return null;
  }
}

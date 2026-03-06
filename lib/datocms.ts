import { GraphQLClient } from "graphql-request";

/**
 * DatoCMS GraphQL clients for Easton People Council.
 *
 * ## Published content (production)
 * Use `datoClient` for live, published content. It talks to the main API and
 * only returns records that are published in DatoCMS.
 *
 * ## Draft / preview content
 * Use `datoPreviewClient` to fetch draft and published content. Use it when:
 * - You have a "Preview" button in DatoCMS that opens your site (preview URL).
 * - You want to show unpublished changes to editors before they hit "Publish".
 *
 * ### Env vars
 * - DATOCMS_API_TOKEN — used by `datoClient` (published). Create in DatoCMS:
 *   Project settings → API tokens → "Full API" or "Content delivery".
 * - DATOCMS_PREVIEW_TOKEN — used by `datoPreviewClient` (drafts). Create in
 *   DatoCMS: Project settings → API tokens → enable "Can access draft content".
 *
 * ### Enabling preview on your site
 * 1. In DatoCMS: Project settings → Visual editing → add a frontend URL, e.g.:
 *    https://yoursite.com/preview?slug=...
 * 2. Add a route (e.g. app/preview/route.ts or app/preview/page.tsx) that:
 *    - Reads a secret or slug from the query (DatoCMS can send it).
 *    - Uses `datoPreviewClient` (not `datoClient`) to fetch the record.
 *    - Renders the page with draft data.
 * 3. Optional: use a secret (e.g. ?secret=... or cookie) so only DatoCMS
 *    and your team can open preview URLs.
 *
 * ### Example: preview vs published
 *   // Published page (e.g. normal site visit)
 *   const data = await datoClient.request(QUERY);
 *
 *   // Preview page (e.g. "Preview" in DatoCMS or ?draft=true on your site)
 *   const data = await datoPreviewClient.request(QUERY);
 */

const endpoint = "https://graphql.datocms.com/";
const previewEndpoint = "https://graphql.datocms.com/preview";
const token = process.env.DATOCMS_API_TOKEN;
const previewToken = process.env.DATOCMS_PREVIEW_TOKEN;

/** Fetches only published content. Use for normal site traffic. */
export const datoClient = new GraphQLClient(endpoint, {
  headers: {
    ...(token && { Authorization: `Bearer ${token}` }),
  },
});

/** Fetches draft + published content. Use for DatoCMS preview and internal preview URLs. */
export const datoPreviewClient = new GraphQLClient(previewEndpoint, {
  headers: {
    ...(previewToken && { Authorization: `Bearer ${previewToken}` }),
  },
});

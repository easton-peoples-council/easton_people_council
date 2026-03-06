import { datoClient, datoPreviewClient } from "@/lib/datocms";

/**
 * Query matches a DatoCMS model with API id "article".
 * Adjust the query and fields to match your DatoCMS schema.
 */  
// url_identifier is not used in the query? MK TODO
const ARTICLES_QUERY = `
  query PressPage {
    allArticles(orderBy: _publishedAt_DESC, first: 50) {
      id
      title
      content {
        value
      }
      images {
        url
      }
      _publishedAt
    }
  }
`;

/** DatoCMS Structured Text can be a string (legacy) or a DAST document object. */
type ContentValue = string | { schema?: string; document?: DastNode } | null;
type DastNode = { type?: string; value?: string; children?: DastNode[] };

type Article = {
  id: string;
  title: string;
  _publishedAt: string;
  excerpt: string | null;
  url: string | null;
  content?: { value: ContentValue } | null;
};

function textFromDast(node: DastNode | undefined): string {
  if (!node) return "";
  if (typeof node.value === "string") return node.value;
  const children = node.children;
  if (!Array.isArray(children)) return "";
  return children.map(textFromDast).join("");
}

function contentPreview(content: Article["content"], maxLength = 160): string | null {
  const raw = content?.value;
  if (raw == null) return null;
  let plain: string;
  if (typeof raw === "string") {
    plain = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  } else if (typeof raw === "object") {
    const root = "document" in raw ? (raw as { document: DastNode }).document : (raw as DastNode);
    plain = textFromDast(root).replace(/\s+/g, " ").trim();
  } else {
    return null;
  }
  if (!plain) return null;
  if (plain.length <= maxLength) return plain;
  return plain.slice(0, maxLength).trim() + "…";
}

type ArticlesData = {
  allArticles: Article[];
};

type Props = {
  searchParams: Promise<{ preview?: string }>;
};

export default async function PressPage({ searchParams }: Props) {
  const params = await searchParams;
  const isPreview = params.preview === "1";
  const client = isPreview ? datoPreviewClient : datoClient;

  let articles: Article[] = [];
  try {
    const data = await client.request<ArticlesData>(ARTICLES_QUERY);
    console.log("[Press] DatoCMS response:", JSON.stringify(data, null, 2));
    articles = data?.allArticles ?? [];
  } catch (error){
    console.error("[Press] Error fetching DatoCMS data:", error);
    // No token, wrong schema, or API error: show placeholder
    if (error && typeof error === "object" && "response" in error) {
      const res = (error as { response?: { errors?: unknown } }).response;
      if (res?.errors) console.error("[Press] GraphQL errors:", res.errors);
    }
  }

  return (
    <>
      <h1 className="pageTitle">Press</h1>
      {isPreview && (
        <p className="intro" style={{ fontStyle: "italic", opacity: 0.9 }}>
          Preview mode — showing draft and published content.
        </p>
      )}
      {articles.length === 0 ? (
        <p className="intro">
          This page will contain press and media information for the Easton People Council. Add your content here.
        </p>
      ) : (
        <ul className="contentSection" style={{ listStyle: "none", paddingLeft: 0, textAlign: "left" }}>
          {articles.map((item) => (
            <li key={item.id} style={{ marginBottom: "1.5rem" }}>
              <time dateTime={item._publishedAt}>
                {new Date(item._publishedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
              {item.url ? (
                <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginTop: "0.25rem" }}>
                  <strong>{item.title}</strong>
                </a>
              ) : (
                <strong style={{ display: "block", marginTop: "0.25rem" }}>{item.title}</strong>
              )}
              {item.excerpt && (
                <p style={{ margin: "0.25rem 0 0", color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
                  {item.excerpt}
                </p>
              )}
              {(() => {
                const preview = contentPreview(item.content);
                return preview ? (
                  <p style={{ margin: "0.25rem 0 0", color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
                    {preview}
                  </p>
                ) : null;
              })()}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

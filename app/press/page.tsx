import { datoClient, datoPreviewClient } from "@/lib/datocms";

/**
 * Query matches a DatoCMS model with API id "article".
 * Adjust the query and fields to match your DatoCMS schema.
 */
const ARTICLES_QUERY = `
  query PressPage {
    allArticles(orderBy: _publishedAt_DESC, first: 50) {
      id
      title
      url_identifier
      content {
        value
      }
      images
      published_date
    }
  }
`;

type Article = {
  id: string;
  title: string;
  _publishedAt: string;
  excerpt: string | null;
  url: string | null;
};

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
    articles = data?.allArticles ?? [];
  } catch {
    // No token, wrong schema, or API error: show placeholder
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
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

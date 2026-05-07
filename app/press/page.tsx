import { datoClient, datoPreviewClient } from "@/lib/datocms";
import { getContactsCountOrNull } from "@/lib/qomon";
import GetInTouchSection from "../GetInTouchSection";

function getGraphQLErrors(error: unknown): unknown[] | undefined {
  if (error == null || typeof error !== "object" || !("response" in error)) return undefined;
  const errors = (error as { response?: { errors?: unknown } }).response?.errors;
  return errors !== undefined ? (Array.isArray(errors) ? errors : [errors]) : undefined;
}

/**
 * Query matches a DatoCMS model with API id "article".
 * Adjust the query and fields to match DatoCMS schema.
 *
 * // url_identifier is not used in the query? MK TODO
 */  

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
  const contactsCount = await getContactsCountOrNull("press/page");
  try {
    const data = await client.request<ArticlesData>(ARTICLES_QUERY);
    articles = data?.allArticles ?? [];
  } catch (error) {
    const graphqlErrors = getGraphQLErrors(error);
    console.error("[Press] DatoCMS fetch failed", graphqlErrors ?? error);
  }

  return (
    <>
      <h1 className="pageTitle">Press</h1>
      {isPreview && (
        <p className="intro press-preview-mode">
          Preview mode — showing draft and published content.
        </p>
      )}
      {articles.length === 0 ? (
        <p className="intro">
          This page will contain press and media information for the Easton People Council. Add your content here.
        </p>
      ) : (
        <ul className="contentSection press-article-list">
          {articles.map((item) => {
            const preview = contentPreview(item.content);
            return (
              <li key={item.id} className="press-article">
                <time dateTime={item._publishedAt}>
                  {new Date(item._publishedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
                <strong className="press-article-title">{item.title}</strong>
                {preview && (
                  <p className="press-article-preview">
                    {preview}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <GetInTouchSection
        contactsCount={contactsCount}
        text="Want to contibute with your thoughts and stories about easton?"
      />
    </>
  );
}

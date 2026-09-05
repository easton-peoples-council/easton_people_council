export type InstagramPost = {
  id: string;
  url: string;
  permalink: string;
  alt: string;
};

type BeholdSize = { mediaUrl?: string };

type BeholdPost = {
  id?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  permalink?: string;
  altText?: string;
  prunedCaption?: string;
  mediaType?: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  sizes?: { small?: BeholdSize; medium?: BeholdSize; large?: BeholdSize };
};

/**
 * Behold serves the raw Instagram source in mediaUrl, which is unoptimised, so
 * prefer the resized medium variant. On a VIDEO post mediaUrl is the video
 * file itself, and the still lives in thumbnailUrl.
 */
function toPost(post: BeholdPost): InstagramPost | null {
  const image =
    post.mediaType === "VIDEO"
      ? post.thumbnailUrl ?? post.sizes?.medium?.mediaUrl
      : post.sizes?.medium?.mediaUrl ?? post.mediaUrl;
  if (!post.id || !image || !post.permalink) return null;
  return {
    id: post.id,
    url: image,
    permalink: post.permalink,
    alt: post.altText || post.prunedCaption || "",
  };
}

export async function getInstagramPosts(): Promise<InstagramPost[]> {
  const url = process.env.BEHOLD_FEED_URL;
  if (!url?.startsWith("http")) return [];
  try {
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) throw new Error(`Behold responded ${res.status}`);
    const data = (await res.json()) as { posts?: BeholdPost[] };
    return (data?.posts ?? [])
      .map(toPost)
      .filter((post): post is InstagramPost => post !== null);
  } catch (err) {
    console.error("[instagram] getInstagramPosts failed:", err);
    return [];
  }
}

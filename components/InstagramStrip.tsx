import { SHOW_INSTAGRAM } from "@/lib/feature-flags";
import type { InstagramPost } from "@/lib/instagram";

type InstagramStripProps = {
  posts: InstagramPost[];
  offset: number;
};

/**
 * A full-bleed row of 3 posts standing in for a section divider.
 *
 * Must render a div, never a section: .contentSection:first-of-type matches per
 * element type, so a section here would take that match away from the first
 * section on the Press and Proposal pages and give them a border they should
 * not have.
 *
 * Rendering null leaves the following section's own border-top in place, so a
 * short feed falls back to the plain divider on its own.
 */
export default function InstagramStrip({ posts, offset }: InstagramStripProps) {
  if (!SHOW_INSTAGRAM) return null;
  const tiles = posts.slice(offset, offset + 3);
  if (tiles.length < 3) return null;

  return (
    <div className="igStrip">
      {tiles.map((post) => (
        <a
          key={post.id}
          href={post.permalink}
          target="_blank"
          rel="noreferrer"
        >
          <img src={post.url} alt={post.alt} loading="lazy" />
        </a>
      ))}
    </div>
  );
}

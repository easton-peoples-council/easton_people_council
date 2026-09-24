import { SHOW_INSTAGRAM } from "@/lib/feature-flags";
import type { InstagramPost } from "@/lib/instagram";

type InstagramStripProps = {
  posts: InstagramPost[];
  offset: number;
  count: number;
  variant: "wide" | "narrow";
  mobileOnly?: boolean;
};

/**
 * A full-bleed row of posts standing in for a section divider.
 *
 * Photos are grouped on the server, so a position that wants three tiles on
 * wide screens and two on narrow ones renders both variants and lets CSS
 * reveal one. Pass mobileOnly for a position the wide layout does not use, so
 * the section below keeps its own divider on wide screens.
 *
 * Must render a div, never a section: .contentSection:first-of-type matches per
 * element type, so a section here would take that match away from the first
 * section on the Press and Proposal pages and give them a border they should
 * not have.
 *
 * Rendering null leaves the following section's own border-top in place, so a
 * short feed falls back to the plain divider on its own.
 */
export default function InstagramStrip({
  posts,
  offset,
  count,
  variant,
  mobileOnly,
}: InstagramStripProps) {
  if (!SHOW_INSTAGRAM) return null;
  const tiles = posts.slice(offset, offset + count);
  if (tiles.length < count) return null;

  const classes = `igStrip igStrip--${variant}${mobileOnly ? " igStrip--mobileOnly" : ""}`;

  return (
    <div className={classes}>
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

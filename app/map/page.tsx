import BoundaryMap from "@/components/BoundaryMap";
import BoundarySubmissions from "@/components/BoundarySubmissions";
import InstagramStrip from "@/components/InstagramStrip";
import { getInstagramPosts } from "@/lib/instagram";
import { getContactsCountOrNull } from "@/lib/qomon";
import GetInTouchSection from "../GetInTouchSection";

export default async function BoundaryPage() {
  const contactsCount = await getContactsCountOrNull("map/page");
  const posts = await getInstagramPosts();

  return (
    <>
      <section className="contentSection">
        <h2>Where does Easton begin and end?</h2>
        <p>
          A community council needs a boundary. Draw the area you think of as Easton
          and press submit. This will shape the proposal!
        </p>
        <BoundaryMap />
      </section>

      <section className="contentSection">
        <h2>Submissions</h2>
        <p>
          Where residents agree on Easton’s edges so far.
        </p>
        <BoundarySubmissions />
      </section>

      <InstagramStrip posts={posts} offset={0} count={3} variant="wide" />
      <InstagramStrip posts={posts} offset={0} count={2} variant="narrow" />

      <GetInTouchSection contactsCount={contactsCount} />
    </>
  );
}

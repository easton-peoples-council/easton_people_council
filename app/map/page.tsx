import BoundaryMap from "@/components/BoundaryMap";
import BoundarySubmissions from "@/components/BoundarySubmissions";

export default function BoundaryPage() {
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
        <h2>Submissions so far</h2>
        <p>
          Where residents agree on Easton’s edges, and every boundary drawn so
          far. Submissions are stored without names or contact details.
        </p>
        <BoundarySubmissions />
      </section>
    </>
  );
}

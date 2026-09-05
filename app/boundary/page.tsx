import BoundaryMap from "@/components/BoundaryMap";

export default function BoundaryPage() {
  return (
    <section className="contentSection">
      <h2>Where does Easton begin and end?</h2>
      <p>
        A community council needs a boundary. Draw the area you think of as Easton
        and tell us — we will use what people draw to shape the boundary in our
        proposal to Bristol City Council.
      </p>
      <BoundaryMap />
    </section>
  );
}

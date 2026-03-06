import { redirect } from "next/navigation";
import { SHOW_PETITION } from "@/lib/feature-flags";

export default function PetitionPage() {
  if (!SHOW_PETITION) {
    redirect("/");
  }
  return (
    <>
      <h1 className="pageTitle">Petition</h1>
      <p className="intro">
        This page will contain the petition for the Easton People Council. Add your content here.
      </p>
    </>
  );
}

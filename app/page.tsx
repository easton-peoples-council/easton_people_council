import SignupForm from "./SignupForm";
import Link from "next/link";
import { getContactsCount } from "@/lib/qomon";
import { SHOW_PETITION } from "@/lib/feature-flags";

export default async function HomePage() {
  let contactsCount: number | null = null;
  try {
    console.log("[page] Fetching contacts count...");
    contactsCount = await getContactsCount();
    console.log("[page] contactsCount =", contactsCount);
  } catch (err) {
    console.error("[page] getContactsCount failed:", err);
  }

  return (
    <>
      <section className="hero">
        <h1 className="heroTitle">Is it time to build community power in Easton?</h1>
        <p className="heroSubtitle">
          Together let&apos;s explore what a People&apos;s Council could look and feel like for us in Easton!
        </p>
        {contactsCount !== null && (
          <p className="heroContacts" style={{ marginTop: "1rem", opacity: 0.9 }}>
            {contactsCount} {contactsCount === 1 ? "person has" : "people have"} already signed up!
          </p>
        )}
        <a href="#get-involved" className="heroCta">
          Get in touch
        </a>
      </section>

      <section className="contentSection">
        <h2>The Big Question</h2>
        <p>
          Strong, caring communities. Enough food for everyone. A healthy planet. Lives filled with meaning. This is the kind of world we all want. So why don&apos;t we build it?
        </p>
      </section>

      <section className="contentSection">
        <h2>What&apos;s this all about?</h2>
        <p>
          Did you know that any community can set up a council...? Peoples Councils give our community new powers to protect what&apos;s already good and build an alternative where we live that actually works for us.
        </p>
      </section>

      <section className="contentSection">
        <h2>Tell me more...</h2>
        <p>
          A Peoples Council is a type of local council, with the same official powers as a Parish, Town, or Village Council. In areas without a parish council, we tend to have less influence over many decisions affecting our lives.
        </p>
        <p>
          These councils can manage local spaces and initiatives—such as allotments, sports facilities, and youth projects—and act as a voice for the community in discussions with the police, health services, local planning authorities, developers, and even government bodies and parliamentarians. Importantly, City Councils have a statutory duty to consult with parish councils, giving local people a direct say at the city level, too.
        </p>
      </section>

      <section className="contentSection">
        <h2>What could a People&apos;s Council do for Easton?</h2>
        <h3>Protect what&apos;s already good</h3>
        <ul>
          <li>Create a neighbourhood plan to protect community centres and public spaces from big developers.</li>
          <li>Support existing community organisations to keep doing amazing work with grants.</li>
          <li>Represent the community officially to local police and health services.</li>
        </ul>
        <h3>Build the alternative</h3>
        <ul>
          <li>Make decisions collectively through direct democracy (e.g. through neighbourhood assemblies).</li>
          <li>Set up cooperative businesses (e.g. energy coops) owned and controlled by us.</li>
          <li>Reclaim buildings for community use.</li>
          <li>Take back public services so they are closer to the people who use them.</li>
        </ul>
        <p>+ much more...!</p>
      </section>

      <section className="contentSection">
        <h2>Who are you?</h2>
        <p>
          The idea was kick-started by a small but growing group of Easton locals who are inspired by the many examples of communities that have built power around the UK. It isn&apos;t backed by any organisations or funders. Please get in touch through the button at the bottom of the page.
        </p>
      </section>

      <section className="contentSection">
        <h2>Come and learn more!</h2>
        <p>
          Come to an upcoming in-person info session to learn more and have a chance to discuss with your neighbours about the idea.
        </p>
      </section>

      <section id="get-involved" className="getInvolved">
        <h2>Get Involved Today.</h2>
        <p className="intro" style={{ marginBottom: "1.5rem" }}>
          Sign up with your name, email, phone and a comment to get in touch.
        </p>
        <SignupForm />
        {SHOW_PETITION && (
          <p style={{ marginTop: "1rem" }}>
            Or <Link href="/petition">view the petition</Link>.
          </p>
        )}
      </section>
    </>
  );
}

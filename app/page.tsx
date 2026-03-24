import SignupForm from "./SignupForm";
import Link from "next/link";
import { getContactsCount } from "@/lib/qomon";
import { SHOW_PETITION } from "@/lib/feature-flags";
import Calendar from "@/components/Calendar";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let contactsCount: number | null = null;
  try {
    contactsCount = await getContactsCount();
  } catch (err) {
    console.error("[page] getContactsCount failed:", err);
  }

  return (
    <>
      <section className="hero">
        <h1 className="heroTitle">Who are you?</h1>
        <p className="heroSubtitle">
          This idea was kick-started by a small group of Easton residents who care about the area and want to explore whether a People’s Council could work here.
        </p>
        <p className="heroSubtitle">
          The project isn’t backed by organisations, funders or political parties. It’s simply a group of locals starting a conversation.
        </p>
        <p className="heroSubtitle">
          Anyone who lives in the area can get involved and help shape what happens next.
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
        <h2>How can I get involved?</h2>
        <p>
          There are lots of ways to get involved. Whether you’re just curious or ready to help out.
        </p>
        <p>
          You could come to an info session to learn more, talk about the idea with friends and neighbours, or help with outreach by holding stalls or knocking on doors.
        </p>
        <p>Whatever time, skills or experience you have, there’s a place for you.</p>
        <p>
          Take a look at our <a href="#calendar" style={{ fontWeight: 700, color: "inherit" }}>calendar</a> to see what events are coming up.
        </p>
      </section>

      <section className="contentSection">
        <h2>What&apos;s happening now?</h2>
        <p>Right now, the focus is simple: talking to as many residents as possible.</p>
        <p style={{ fontWeight: 600 }}>We want to understand:</p>
        <ul>
          <li>How people feel about the idea</li>
          <li>What issues matter most locally</li>
          <li>What a People&apos;s Council should actually focus on</li>
        </ul>
        <p style={{ marginTop: "2rem", fontWeight: 600 }}>We&apos;re doing this by:</p>
        <ul>
          <li>Holding weekly stalls in busy places (every Saturday)</li>
          <li>Knocking on doors across the neighbourhood (Mondays-Wednesdays)</li>
          <li>Meeting people from local organisations and community groups</li>
          <li>Running social events where people can learn more and get involved over food and drinks</li>
        </ul>
        <p>
          Once we&apos;ve spoken with enough residents, we&apos;ll launch a petition to formally start the process.
        </p>
        <p>
          Follow our{" "}
          <a
            href="https://www.instagram.com/eastonpeoplescouncil/"
            target="_blank"
            rel="noreferrer"
            style={{ fontWeight: 700, color: "inherit" }}
          >
            socials
          </a>{" "}
          for updates or{" "}
          <a href="#get-involved" style={{ fontWeight: 700, color: "inherit" }}>
            pop us a message
          </a>{" "}
          to get involved!
        </p>
      </section>

      <section id="calendar" className="contentSection">
        <h2>Come and learn more!</h2>
        <p>
          Come to an upcoming in-person info session to learn more and have a chance to discuss with your neighbours about the idea.
        </p>
        <div className="calendarFullWidth">
          <Calendar />
        </div>
      </section>

      <section id="get-involved" className="getInvolved">
        <h2>Get Involved Today!</h2>
        <p className="intro">
          Hear more, help organise, or just say hi!
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

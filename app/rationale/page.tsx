import { getContactsCountOrNull } from "@/lib/qomon";
import GetInTouchSection from "../GetInTouchSection";

export default async function RationalePage() {
  const contactsCount = await getContactsCountOrNull("rationale/page");

  return (
    <>
      <section className="contentSection">
        <h2>What&apos;s this all about?</h2>
        <p>Did you know communities can set up their own local council?</p>
        <p>
          It&apos;s called a People&apos;s Council. It&apos;s a way to bring decision-making
          closer to the community, giving local people more control over the issues that affect our daily lives.
        </p>
        <p>
          A People&apos;s Council can help deal with practical day-to-day issues like caring for our streets, protecting
          community spaces, and supporting local projects. It can also be a place where residents come together to
          collectively imagine bigger and bolder ways to make Easton healthier, safer and more democratic in the long
          term.
        </p>
        <p>
          In short, it&apos;s a council built from the ground up, focused on improving daily life now, while helping shape
          the future of our area.
        </p>
      </section>

      <section className="contentSection">
        <h2>Why now?</h2>
        <p>Many people feel that the current system isn&apos;t working as well as it should.</p>
        <p>
          Local councillors often want to help, but they are working within a system shaped by years of austerity,
          tight budgets and slow bureaucracy. This can mean everyday issues fall through the cracks or take a long time
          to resolve.
        </p>
        <p>
          When most decisions and resources sit at a higher level, there&apos;s also less space to proactively identify
          local solutions or try new ways of doing things that come directly from the community.
        </p>
        <p>
          A People&apos;s Council is one way to bring some of that power closer to home. It gives residents a way to work
          together on practical problems while also thinking about new ideas for the future of Easton.
        </p>
      </section>

      <GetInTouchSection contactsCount={contactsCount} className="contentSection rationaleCtaSection" borderTop="none" />

      <section className="contentSection">
        <h2>Tell me more...</h2>
        <p>
          A People&apos;s Council is an official tier of local government, with the same legal powers as Parish, Town, or
          Village Councils across the UK. In areas without one, residents often have less direct influence over local
          decisions.
        </p>
        <p>People&apos;s Councils can:</p>
        <ul>
          <li>manage local spaces and small public services</li>
          <li>fund community initiatives and local organisations</li>
          <li>
            represent residents in discussions with the police, health services, planning authorities and developers
          </li>
        </ul>
        <p>
          City councils also have a legal duty to consult parish councils, meaning local communities have a recognised
          voice in decisions affecting the whole city.
        </p>
      </section>

      <section className="contentSection">
        <h2>Isn&apos;t this just more bureaucracy?</h2>
        <p>
          If you&apos;ve ever waited 6 months for the council to fix a pothole, you already know the old system is broken.
          A People&apos;s Council cuts through bureaucracy by putting decisions in the hands of locals. We keep it simple:
          meet, decide, act. No endless meetings, just real power for real people.
        </p>
      </section>

      <section className="contentSection">
        <h2>Has this worked in other places?</h2>
        <p>There are thousands of local councils all around the country but they are all in rural areas.</p>
        <p>
          Ten years ago in Queens Park in London, a group of residents set up a Community Council (also known as
          &apos;The People&apos;s Republic of Queen Park&apos;) when the Government announced lots of cuts. 70% of residents voted
          in favour of setting one up.
        </p>
      </section>
    </>
  );
}

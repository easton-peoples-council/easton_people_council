import { getContactsCountOrNull } from "@/lib/qomon";
import GetInTouchSection from "../GetInTouchSection";

export default async function ProposalPage() {
  const contactsCount = await getContactsCountOrNull("proposal/page");

  return (
    <>
      <section className="contentSection proposalSection">
        <h2>What could a People&apos;s Council do for Easton?</h2>
        <h3>Practical improvements</h3>
        <p>A locally-run council could:</p>
        <ul>
          <li>Create a neighbourhood plan to protect community spaces and public buildings from big development</li>
          <li>Tackle fly-tipping with initiatives such as community skips</li>
          <li>Support existing organisations by helping them secure grants or funding</li>
          <li>Represent residents in discussions with police, health services and the council</li>
        </ul>
        <h3>Thinking bigger and longer-term</h3>
        <p>With enough support and resources, a council could also:</p>
        <ul>
          <li>Set up co-operative businesses (for example energy or housing co-ops)</li>
          <li>Bring empty buildings into community use</li>
          <li>Take on local services where it makes sense to run them closer to the community</li>
        </ul>
        <p>Exactly what it does would be shaped by the people who live here.</p>
      </section>
      <GetInTouchSection contactsCount={contactsCount} className="contentSection proposalSection" />

      <section className="contentSection proposalSection">
        <h2>FAQs</h2>
        <article className="proposalFaq">
          <h3>How do we establish a People&apos;s Council?</h3>
          <h4>Step 1</h4>
          <p>
            A petition is created and signed by at least 10% of local voters.
          </p>
          <h4>Step 2</h4>
          <p>
            The petition is submitted to Bristol City Council, which reviews the proposal.
          </p>
          <h4>Step 3</h4>
          <p>
            Depending on the outcome of the review, a local referendum may be held.
          </p>
          <h4>Step 4</h4>
          <p>
            If a referendum takes place and the majority vote in favour, the new council is created. A clerk is appointed and elections are held.
          </p>
        </article>

        <article className="proposalFaq">
          <h3>Do we have to pay for it?</h3>
          <p>
            Residents decide collectively how much funding the council raises each year. This is based on the projects and services people want it to run.
          </p>
          <p>The cost could start from around £2 per month per household.</p>
          <p>For example:</p>
          <ul>
            <li>£1.50 per month -&gt; about £50,000 per year</li>
            <li>£2.50 per month -&gt; about £120,000 per year</li>
            <li>£4 per month -&gt; about £190,000 per year</li>
          </ul>
          <p>
            All the money would be spent locally on the things our community cares about most.
          </p>
        </article>

        <article className="proposalFaq">
          <h3>What area would it cover?</h3>
          <p>
            People say the boundaries of Easton ward drawn up by the government don&apos;t fully reflect the community. If a People&apos;s Council is created, residents would help define the area it represents.
          </p>
        </article>

        <article className="proposalFaq">
          <h3>Would the council hold elections?</h3>
          <p>Yes. By law, councillors must be elected every four years.</p>
          <p>
            Residents could stand as candidates and represent the area as individuals rather than political parties if they choose.
          </p>
        </article>

        <article className="proposalFaq">
          <h3>Could we have a bigger say in decision-making?</h3>
          <p>
            In short, yes. Different councils experiment with different ways of making decisions, with some of them heavily participatory.
          </p>
          <p>Some ideas include:</p>
          <ul>
            <li>Neighbourhood assemblies where residents deliberate and decide on local issues</li>
            <li>Participatory budgeting, where people vote on how community funds are spent</li>
            <li>Open working groups focused on specific topics (for example youth wellbeing or housing)</li>
          </ul>
          <p>Exactly how this would work in Easton would be shaped by residents.</p>
        </article>
      </section>
    </>
  );
}

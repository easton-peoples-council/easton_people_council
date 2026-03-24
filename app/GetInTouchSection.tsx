import HomeGetInTouchCta from "./HomeGetInTouchCta";

type GetInTouchSectionProps = {
  contactsCount: number | null;
  text?: string;
  className?: string;
  borderTop?: "default" | "none";
};

export default function GetInTouchSection({
  contactsCount,
  text,
  className = "contentSection",
  borderTop = "default",
}: GetInTouchSectionProps) {
  return (
    <section className={className} style={borderTop === "none" ? { borderTop: "none" } : undefined}>
      {text && <p>{text}</p>}
      <HomeGetInTouchCta contactsCount={contactsCount} ctaClassName="proposalCta" />
    </section>
  );
}

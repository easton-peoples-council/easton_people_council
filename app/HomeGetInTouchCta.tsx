type HomeGetInTouchCtaProps = {
  contactsCount: number | null;
  href?: string;
  ctaClassName?: string;
};

export default function HomeGetInTouchCta({
  contactsCount,
  href = "/#get-involved",
  ctaClassName,
}: HomeGetInTouchCtaProps) {
  return (
    <>
      {contactsCount !== null && (
        <p className="heroContacts" style={{ marginTop: "1rem", opacity: 0.9 }}>
          {contactsCount} {contactsCount === 1 ? "person has" : "people have"} already signed up!
        </p>
      )}
      <a href={href} className={`heroCta${ctaClassName ? ` ${ctaClassName}` : ""}`}>
        Get in touch
      </a>
    </>
  );
}

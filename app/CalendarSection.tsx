import Calendar from "@/components/Calendar";

type CalendarSectionProps = {
  text: string;
};

export default function CalendarSection({ text }: CalendarSectionProps) {
  return (
    <section id="calendar" className="contentSection">
      <h2>Come and learn more!</h2>
      <p>{text}</p>
      <div className="calendarFullWidth">
        <Calendar />
      </div>
    </section>
  );
}

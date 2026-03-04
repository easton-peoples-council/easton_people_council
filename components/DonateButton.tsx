"use client";

const DONATE_URL =
  "https://opencollective.com/easton-peoples-council-campaig/donate";

export default function DonateButton() {
  const openDonation = () => {
    window.open(DONATE_URL, "_blank", "width=600,height=800");
  };

  return (
    <button type="button" onClick={openDonation} className="donateButton">
      Donate to Easton People&apos;s Council
    </button>
  );
}

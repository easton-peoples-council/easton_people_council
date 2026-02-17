import SignupForm from "./SignupForm";

export default function HomePage() {
  return (
    <>
      <h1 className="pageTitle">Is it time to build community power in Easton?</h1>
      <p className="intro">
        Together let's explore what a People's Council could look and feel like for us in Easton.
      </p>
      <h2 className="pageTitle">Easton People Council</h2>
      <p className="intro">
        Welcome. Sign up below with your name, email, phone and a comment.
      </p>
      <SignupForm />
    </>
  );
}

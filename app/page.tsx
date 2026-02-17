import SignupForm from "./SignupForm";

export default function HomePage() {
  return (
    <>
      <h1 className="pageTitle">Easton People Council</h1>
      <p className="intro">
        Welcome. Sign up below with your name, email, phone and a comment.
      </p>
      <SignupForm />
    </>
  );
}

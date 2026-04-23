import { redirect } from "next/navigation";

import { getLoginAccessCopy } from "@/lib/auth/access-copy";
import { getAuthorizedUser } from "@/lib/auth/get-authorized-user";

import { signInWithGoogle } from "./actions";

type LoginPageProps = {
  searchParams?: Promise<{
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const authorizedUser = await getAuthorizedUser();
  const accessCopy = getLoginAccessCopy();

  if (authorizedUser) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  return (
    <main className="shell">
      <div className="shell__inner">
        <section className="hero__card loginCard">
          <p className="eyebrow">Sign-In</p>
          <h1>Access the Beyond Ink POS</h1>
          <p className="lead">{accessCopy}</p>

          {params?.message ? (
            <p className="badge badge--warning" style={{ marginTop: "18px" }}>
              {params.message}
            </p>
          ) : null}

          <form action={signInWithGoogle}>
            <button className="button" type="submit">
              Continue with Google
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

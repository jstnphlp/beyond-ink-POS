import { getUnauthorizedCopy } from "@/lib/auth/access-copy";

type UnauthorizedPageProps = {
  searchParams?: Promise<{
    email?: string;
  }>;
};

export default async function UnauthorizedPage({
  searchParams,
}: UnauthorizedPageProps) {
  await searchParams;
  const copy = getUnauthorizedCopy();

  return (
    <main className="shell">
      <div className="shell__inner">
        <section className="hero__card loginCard">
          <p className="eyebrow">Access denied</p>
          <h1>{copy.title}</h1>
          <p className="lead">{copy.body}</p>
          <p className="muted" style={{ marginTop: "18px" }}>
            {copy.help}
          </p>
        </section>
      </div>
    </main>
  );
}

import { NavBar } from "@/components/nav-bar";

// Shared layout for Terms and Privacy: one heading, one intro, then plain
// sections split by thin rules. No cards.
export function LegalLayout({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <NavBar />
      <main style={{ paddingTop: "96px" }}>
        <article className="page-narrow">
          <h1 className="pt-6 text-3xl font-semibold md:text-4xl">{title}</h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">{intro}</p>
          <div className="mt-8 divide-y divide-border border-t border-border">{children}</div>
        </article>
      </main>
    </>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-base leading-7 text-muted-foreground">{children}</p>
    </section>
  );
}

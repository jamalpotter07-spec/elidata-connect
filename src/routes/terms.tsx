import { createFileRoute } from "@tanstack/react-router";
import { NavBar } from "@/components/nav-bar";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms of Service — Eli Data Resales" },
      {
        name: "description",
        content: "Read the Eli Data Resales terms for using the site, purchasing bundles, refunds and support handling.",
      },
      { property: "og:title", content: "Terms of Service — Eli Data Resales" },
      { property: "og:description", content: "Site usage terms, order conditions, refunds and service responsibilities." },
    ],
  }),
});

function TermsPage() {
  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-4xl px-4 py-12 md:py-16">
        <h1 className="text-4xl font-extrabold tracking-tight">Terms of Service</h1>
        <p className="mt-4 text-muted-foreground">
          These terms govern access to the Eli Data Resales website and any data bundle purchases made through the platform.
        </p>

        <div className="mt-10 space-y-8">
          <TermsSection title="Using the service">
            By placing an order, you confirm that the recipient number is correct, that you are authorized to use the selected payment method and that you will not use the site for fraud, abuse or unlawful activity.
          </TermsSection>
          <TermsSection title="Orders and delivery">
            Orders are submitted after successful payment confirmation. Delivery timing may vary depending on telecom network conditions, vendor availability and verification checks. Estimated delivery windows are not guaranteed processing deadlines.
          </TermsSection>
          <TermsSection title="Pricing">
            Bundle prices, availability and network options may change without prior notice. The final payable amount displayed at checkout is the amount charged for that order.
          </TermsSection>
          <TermsSection title="Refunds">
            Refunds are available for verified failed deliveries in line with the refund policy. Completed deliveries to the correct number are generally non-refundable. Wrong-number or duplicate-order requests are reviewed case by case and may be declined if fulfillment has already completed.
          </TermsSection>
          <TermsSection title="Accounts and conduct">
            If you create an account, you are responsible for keeping your login details secure. We may suspend access where we reasonably detect misuse, chargeback abuse, suspicious activity or violations of these terms.
          </TermsSection>
          <TermsSection title="Service availability">
            We aim to keep the site available, but uninterrupted access is not guaranteed. Features may be updated, paused or removed where necessary for operations, maintenance, compliance or risk control.
          </TermsSection>
          <TermsSection title="Limitation of liability">
            To the fullest extent permitted by law, Eli Data Resales is not liable for indirect, incidental or consequential losses arising from service interruptions, telecom delays, user input errors or third-party processor downtime.
          </TermsSection>
          <TermsSection title="Contact">
            Questions about these terms can be sent to support@elidata.gh or raised by WhatsApp on 0500843914.
          </TermsSection>
        </div>
      </main>
    </>
  );
}

function TermsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-6 md:p-8">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{children}</p>
    </section>
  );
}
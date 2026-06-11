import { createFileRoute } from "@tanstack/react-router";
import { NavBar } from "@/components/nav-bar";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy — Eli Data Resales" },
      {
        name: "description",
        content: "Read how Eli Data Resales handles customer data, payment records, order details and support communications.",
      },
      { property: "og:title", content: "Privacy Policy — Eli Data Resales" },
      { property: "og:description", content: "How customer information is collected, used, stored and protected." },
    ],
  }),
});

function PrivacyPage() {
  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-4xl px-4 py-12 md:py-16">
        <h1 className="text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p className="mt-4 text-muted-foreground">
          Eli Data Resales uses customer information only to process orders, support delivery, respond to requests and maintain service quality.
        </p>

        <div className="mt-10 space-y-8">
          <PolicySection title="Information we collect">
            We may collect your phone number, email address, order reference, bundle selection, payment confirmation details, device data and support messages when you use the website or contact our team.
          </PolicySection>
          <PolicySection title="How we use information">
            Information is used to process your bundle purchase, verify payment, troubleshoot delivery issues, send service updates, prevent fraud, respond to support requests and keep financial records required for business operations.
          </PolicySection>
          <PolicySection title="Sharing and disclosure">
            We do not sell personal information. Data may be shared with payment processors, telecom fulfillment partners, hosting providers and professional advisers only where necessary to operate the service, meet legal obligations or resolve disputes.
          </PolicySection>
          <PolicySection title="Data retention">
            We keep order and support records for as long as reasonably necessary for accounting, dispute handling, fraud prevention and service improvement. When data is no longer needed, it is deleted or anonymized where practical.
          </PolicySection>
          <PolicySection title="Security">
            We apply reasonable technical and organizational safeguards to protect customer information. No online system is guaranteed to be completely secure, but we work to limit unauthorized access, misuse and loss.
          </PolicySection>
          <PolicySection title="Your choices">
            You may contact us to correct inaccurate account or order information, request clarification on stored information or raise concerns about how your information has been handled.
          </PolicySection>
          <PolicySection title="Contact">
            For privacy-related questions, email eliahiablie3.0@gmail.com or message 0500843914 with enough detail for our team to verify and review your request.
          </PolicySection>
        </div>
      </main>
    </>
  );
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-6 md:p-8">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{children}</p>
    </section>
  );
}
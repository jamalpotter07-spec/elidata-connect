import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalSection } from "@/components/legal-layout";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms of Service | Eli Data Resales" },
      {
        name: "description",
        content: "Read the Eli Data Resales terms for using the site, purchasing bundles, refunds and support handling.",
      },
      { property: "og:title", content: "Terms of Service | Eli Data Resales" },
      { property: "og:description", content: "Site usage terms, order conditions, refunds and service responsibilities." },
    ],
  }),
});

function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      intro="These terms cover use of the Eli Data Resales website and any data bundle you buy through it."
    >
      <LegalSection title="Using the service">
        By placing an order, you confirm that the recipient number is correct, that you are authorized to use the selected payment method and that you will not use the site for fraud, abuse or unlawful activity.
      </LegalSection>
      <LegalSection title="Orders and delivery">
        Orders are submitted after successful payment confirmation. Delivery timing may vary depending on telecom network conditions, vendor availability and verification checks. Estimated delivery windows are not guaranteed processing deadlines.
      </LegalSection>
      <LegalSection title="Pricing">
        Bundle prices, availability and network options may change without prior notice. The final payable amount displayed at checkout is the amount charged for that order.
      </LegalSection>
      <LegalSection title="Refunds">
        Refunds are available for verified failed deliveries in line with the refund policy. Completed deliveries to the correct number are generally non-refundable. Wrong-number or duplicate-order requests are reviewed case by case and may be declined if fulfillment has already completed.
      </LegalSection>
      <LegalSection title="Accounts and conduct">
        If you create an account, you are responsible for keeping your login details secure. We may suspend access where we reasonably detect misuse, chargeback abuse, suspicious activity or violations of these terms.
      </LegalSection>
      <LegalSection title="Service availability">
        We aim to keep the site available, but uninterrupted access is not guaranteed. Features may be updated, paused or removed where necessary for operations, maintenance, compliance or risk control.
      </LegalSection>
      <LegalSection title="Limitation of liability">
        To the fullest extent permitted by law, Eli Data Resales is not liable for indirect, incidental or consequential losses arising from service interruptions, telecom delays, user input errors or third-party processor downtime.
      </LegalSection>
      <LegalSection title="Contact">
        Questions about these terms can be sent to eliahiablie3.0@gmail.com or raised by WhatsApp on 0500843914.
      </LegalSection>
    </LegalLayout>
  );
}

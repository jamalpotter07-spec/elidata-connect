import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalSection } from "@/components/legal-layout";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy | Eli Data Resales" },
      {
        name: "description",
        content: "Read how Eli Data Resales handles customer data, payment records, order details and support communications.",
      },
      { property: "og:title", content: "Privacy Policy | Eli Data Resales" },
      { property: "og:description", content: "How customer information is collected, used, stored and protected." },
    ],
  }),
});

function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      intro="Eli Data Resales uses customer information only to process orders, support delivery, respond to requests and maintain service quality."
    >
      <LegalSection title="Information we collect">
        We may collect your phone number, email address, order reference, bundle selection, payment confirmation details, device data and support messages when you use the website or contact our team.
      </LegalSection>
      <LegalSection title="How we use information">
        Information is used to process your bundle purchase, verify payment, troubleshoot delivery issues, send service updates, prevent fraud, respond to support requests and keep financial records required for business operations.
      </LegalSection>
      <LegalSection title="Sharing and disclosure">
        We do not sell personal information. Data may be shared with payment processors, telecom fulfillment partners, hosting providers and professional advisers only where necessary to operate the service, meet legal obligations or resolve disputes.
      </LegalSection>
      <LegalSection title="Data retention">
        We keep order and support records for as long as reasonably necessary for accounting, dispute handling, fraud prevention and service improvement. When data is no longer needed, it is deleted or anonymized where practical.
      </LegalSection>
      <LegalSection title="Security">
        We apply reasonable technical and organizational safeguards to protect customer information. No online system is guaranteed to be completely secure, but we work to limit unauthorized access, misuse and loss.
      </LegalSection>
      <LegalSection title="Your choices">
        You may contact us to correct inaccurate account or order information, request clarification on stored information or raise concerns about how your information has been handled.
      </LegalSection>
      <LegalSection title="Contact">
        For privacy questions, email eliahiablie3.0@gmail.com or message 0500843914 with enough detail for our team to verify and review your request.
      </LegalSection>
    </LegalLayout>
  );
}

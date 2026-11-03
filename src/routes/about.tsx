import { createFileRoute, Link } from "@tanstack/react-router";
import { NavBar } from "@/components/nav-bar";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { Mail, Phone, MessageCircle, Check, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About Eli Data Resales | Affordable Ghana Data Reseller" },
      {
        name: "description",
        content:
          "Eli Data Resales sells MTN, Telecel & AT data bundles in Ghana at reseller prices. Live order tracking, full refund policy, support on WhatsApp 0500843914.",
      },
      { property: "og:title", content: "About Eli Data Resales" },
      { property: "og:description", content: "Ghana's affordable data bundle plug, with a clear refund policy." },
    ],
  }),
});

const EMAIL = "eliahiablie3.0@gmail.com";
const PHONE = "0500843914";
const WA_INTL = "233500843914";

const REASONS = [
  "Lower prices than dialing a USSD code",
  "No SIM swap and no app to install",
  "Works for guests, no sign up needed",
  "Every order has its own tracking link",
  "Friendly support on WhatsApp",
  "A clear refund for every failed delivery",
];

function AboutPage() {
  return (
    <>
      <NavBar />
      <WhatsAppFloat />

      <main style={{ paddingTop: "96px" }}>
        <div className="page-narrow">
          {/* Intro */}
          <header className="pt-6">
            <p className="eyebrow">Ghana-based data reseller</p>
            <h1 className="mt-2 text-4xl font-semibold leading-tight md:text-5xl">Cheap data, honest service.</h1>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              Eli Data Resales sells MTN, Telecel and AirtelTigo data bundles at reseller prices,
              delivered to any Ghana number. Every order is tracked live and every failed order is refundable.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/buy" className="btn-orange">Buy data</Link>
              <a href="#contact" className="btn-ghost-glass">Talk to us</a>
            </div>
          </header>

          {/* How it works, one paragraph instead of three cards */}
          <section className="mt-14">
            <h2 className="text-2xl font-semibold">How we work</h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              Checkout is handled by Paystack, so your number and money stay protected. Each completed
              order gets a unique reference you can use to follow it live, and delivery time depends on the
              network. If a delivery fails, we refund it. Your phone number and payment records are only
              used to complete orders and give you support.
            </p>
          </section>

          {/* Why us */}
          <section className="mt-12">
            <h2 className="text-2xl font-semibold">Why customers pick us</h2>
            <ul className="mt-4 space-y-3">
              {REASONS.map((r) => (
                <li key={r} className="flex items-start gap-3 text-base text-foreground">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-success" />
                  {r}
                </li>
              ))}
            </ul>
          </section>

          {/* Refunds */}
          <section id="refunds" className="mt-12 scroll-mt-28">
            <h2 className="text-2xl font-semibold">Refund policy</h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              Here is exactly when and how you get your money back.
            </p>
            <dl className="mt-4 divide-y divide-border border-y border-border">
              <PolicyItem
                term="Failed delivery"
                body="If your bundle does not arrive within 24 hours, message us on WhatsApp with your order ID. We refund 100% to your original payment method."
              />
              <PolicyItem
                term="Wrong number or duplicate"
                body="Sent to the wrong line by mistake? Tell us within 1 hour. If the bundle has not been used, we cancel and refund."
              />
              <PolicyItem
                term="Successful delivery"
                body="Once data is delivered and credited to a SIM, the network cannot reverse it, so no refund is possible."
              />
              <PolicyItem
                term="Processing time"
                body="Approved refunds reach your Mobile Money or card account within 1 to 5 working days, depending on Paystack and your bank."
              />
            </dl>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              To request one, WhatsApp{" "}
              <a className="font-semibold text-foreground underline underline-offset-4" href={`https://wa.me/${WA_INTL}`}>{PHONE}</a>{" "}
              with your order ID and a short note, or email{" "}
              <a className="break-all font-semibold text-foreground underline underline-offset-4" href={`mailto:${EMAIL}`}>{EMAIL}</a>.
              Our team reviews every request by hand.
            </p>
          </section>

          {/* Contact, plain rows */}
          <section id="contact" className="mt-12 scroll-mt-28">
            <h2 className="text-2xl font-semibold">Talk to us</h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">We reply fast, usually within minutes.</p>
            <ul className="mt-4 divide-y divide-border border-y border-border">
              <ContactRow
                icon={<MessageCircle className="h-5 w-5" />}
                label="WhatsApp"
                value={PHONE}
                action="Chat now"
                href={`https://wa.me/${WA_INTL}?text=Hi%20Eli%20Data%20Resales%2C%20I%27d%20like%20to%20buy%20data`}
              />
              <ContactRow icon={<Phone className="h-5 w-5" />} label="Call" value={PHONE} action="Call us" href={`tel:${PHONE}`} />
              <ContactRow icon={<Mail className="h-5 w-5" />} label="Email" value={EMAIL} action="Send email" href={`mailto:${EMAIL}`} />
            </ul>
          </section>

          {/* Legal */}
          <section className="mt-12">
            <h2 className="text-2xl font-semibold">Policies</h2>
            <ul className="mt-2 divide-y divide-border">
              <LegalRow to="/privacy" label="Privacy policy" />
              <LegalRow to="/terms" label="Terms of service" />
            </ul>
          </section>

          {/* Business address, kept so Paystack and compliance can locate the operator */}
          <p
            aria-label="Business address"
            className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground"
            itemScope
            itemType="https://schema.org/Organization"
          >
            <span itemProp="name">Eli Data Resales</span>
            {" · "}
            <span itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
              <span itemProp="addressLocality">Dzita</span>,{" "}
              <span itemProp="addressRegion">Volta Region</span>,{" "}
              <span itemProp="addressCountry">Ghana</span>
            </span>
          </p>
        </div>
      </main>
    </>
  );
}

function PolicyItem({ term, body }: { term: string; body: string }) {
  return (
    <div className="py-4">
      <dt className="text-base font-semibold text-foreground">{term}</dt>
      <dd className="mt-1 text-base leading-7 text-muted-foreground">{body}</dd>
    </div>
  );
}

function ContactRow({
  icon, label, value, action, href,
}: { icon: React.ReactNode; label: string; value: string; action: string; href: string }) {
  return (
    <li className="flex items-center gap-4 py-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="truncate text-base font-semibold text-foreground">{value}</p>
      </div>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-base font-semibold text-primary transition-colors hover:bg-accent"
      >
        {action}
      </a>
    </li>
  );
}

function LegalRow({ to, label }: { to: "/privacy" | "/terms"; label: string }) {
  return (
    <li>
      <Link to={to} className="flex min-h-14 items-center justify-between text-base font-medium text-foreground transition-colors hover:text-primary">
        {label}
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </Link>
    </li>
  );
}

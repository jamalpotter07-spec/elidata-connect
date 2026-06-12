import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MessageCircle, ShieldCheck, Clock, HeartHandshake, Undo2, RefreshCw, AlertTriangle, FileText, LockKeyhole, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About Eli Data Resales — Affordable Ghana Data Reseller" },
      {
        name: "description",
        content:
          "Eli Data Resales sells MTN, Telecel & AT data bundles in Ghana at reseller prices. Live order tracking, full refund policy, support on WhatsApp 0500843914.",
      },
      { property: "og:title", content: "About Eli Data Resales" },
      { property: "og:description", content: "Ghana's affordable data bundle plug — with a clear refund policy." },
    ],
  }),
});

const EMAIL = "eliahiablie3.0@gmail.com";
const PHONE = "0500843914";
const WA_INTL = "233500843914";

function AboutPage() {
  // Force light theme on this page (like Google's policy pages) — restore on unmount.
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    root.classList.remove("dark");
    return () => {
      if (wasDark) root.classList.add("dark");
    };
  }, []);
  return (
    <div className="bg-white text-zinc-900 [color-scheme:light]">
      <NavBar hideThemeToggle />

      <main className="mx-auto w-full max-w-7xl min-w-0 overflow-hidden pb-20">
        <section className="border-b">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:items-center lg:gap-12 lg:py-18 xl:py-20">
            <div className="min-w-0 max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium">
                <HeartHandshake className="h-3 w-3 text-brand" />
                Ghana-based data reseller
              </span>
              <h1 className="mt-4 max-w-[12ch] text-4xl font-extrabold tracking-tight text-balance md:text-5xl">
                Cheap data, <span className="text-brand">honest service.</span>
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
                Eli Data Resales sells MTN, Telecel and AirtelTigo data bundles at reseller prices,
                delivered to any Ghana number. Every order is tracked live, and every failed order is
                refundable.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90">
                  <Link to="/privacy">Privacy policy</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/terms">Terms of service</Link>
                </Button>
              </div>
            </div>

            <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <PolicySummary title="Order tracking" body="Every completed checkout gets a unique reference so support can verify status quickly." />
              <PolicySummary title="Refund handling" body="If a bundle fails to arrive within the stated window, we review and process the case manually." />
              <PolicySummary title="Privacy first" body="Customer phone numbers and payment-related records are only used to complete orders and provide support." />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Feature icon={<ShieldCheck />} title="Safe & secure" body="Encrypted checkout via Paystack. Your number and money are protected." />
            <Feature icon={<Clock />} title="Live tracking" body="Every order has a unique tracker — delivery times depend on the network." />
            <Feature icon={<Undo2 />} title="Refund guarantee" body="If delivery fails, we refund. No drama, no chasing." />
          </div>
        </section>

        <section id="refunds" className="mx-auto w-full max-w-6xl min-w-0 px-4 py-8 scroll-mt-28">
          <div className="min-w-0 rounded-2xl border bg-card p-6 md:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <Undo2 className="h-5 w-5 shrink-0 text-brand" />
              <h2 className="min-w-0 text-2xl md:text-3xl font-bold">Refund policy</h2>
            </div>
            <p className="mt-3 text-muted-foreground">
              We want you to feel safe buying from us. Here's exactly when and how you get your money back.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Policy
                icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
                title="Failed delivery"
                body="If your bundle does not arrive within 24 hours, message us on WhatsApp with your order ID. We'll refund 100% to your original payment method."
              />
              <Policy
                icon={<RefreshCw className="h-4 w-4 text-brand" />}
                title="Wrong number / duplicate"
                body="Sent to the wrong line by mistake? Tell us within 1 hour. If the bundle hasn't been used, we'll cancel and refund."
              />
              <Policy
                icon={<ShieldCheck className="h-4 w-4 text-green-600" />}
                title="Successful delivery"
                body="Once data is delivered and credited to a SIM, it cannot be reversed by the network — no refund is possible."
              />
              <Policy
                icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                title="Processing time"
                body="Approved refunds appear in your Mobile Money / card account within 1–5 working days, depending on Paystack and your bank."
              />
            </div>

            <div className="mt-6 rounded-lg border bg-muted/40 p-4 text-sm break-words">
              <strong>How to request:</strong> WhatsApp <a className="underline" href={`https://wa.me/${WA_INTL}`}>{PHONE}</a> with your order ID and a short note,
              or email <a className="underline break-all" href={`mailto:${EMAIL}`}>{EMAIL}</a>. Our team reviews every request manually.
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
            <div className="min-w-0 rounded-2xl border bg-card p-6 md:p-10">
              <h2 className="text-2xl font-bold md:text-3xl">Why customers pick us</h2>
              <ul className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                <li className="min-w-0">• Lower prices than dialing a USSD code</li>
                <li className="min-w-0">• No SIM swap, no app install required</li>
                <li className="min-w-0">• Works for guests — no sign up needed</li>
                <li className="min-w-0">• Track every order with a unique link</li>
                <li className="min-w-0">• Friendly support on WhatsApp</li>
                <li className="min-w-0">• Clear refund policy on every failed delivery</li>
              </ul>
            </div>

            <div className="min-w-0 rounded-2xl border bg-card p-6 md:p-8">
              <h2 className="text-xl font-bold md:text-2xl">Policies & legal</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                For a cleaner and more professional experience, our privacy policy and terms are on separate pages.
              </p>
              <div className="mt-6 space-y-3">
                <LegalLink
                  to="/privacy"
                  icon={<LockKeyhole className="h-4 w-4 text-brand" />}
                  title="Privacy policy"
                  body="How we use your contact details, payment records, device information and support messages."
                />
                <LegalLink
                  to="/terms"
                  icon={<FileText className="h-4 w-4 text-brand" />}
                  title="Terms of service"
                  body="Rules for using the site, placing orders, refunds, account use, and service limitations."
                />
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-2xl md:text-3xl font-bold">Talk to us</h2>
          <p className="text-muted-foreground mt-1">We reply fast — usually within minutes.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ContactCard
              icon={<MessageCircle className="h-5 w-5 text-green-500" />}
              title="WhatsApp"
              value={PHONE}
              href={`https://wa.me/${WA_INTL}?text=Hi%20Eli%20Data%20Resales%2C%20I%27d%20like%20to%20buy%20data`}
              cta="Chat now"
            />
            <ContactCard
              icon={<Phone className="h-5 w-5 text-[hsl(var(--brand-orange))]" />}
              title="Call"
              value={PHONE}
              href={`tel:${PHONE}`}
              cta="Call us"
            />
            <ContactCard
              icon={<Mail className="h-5 w-5 text-[hsl(var(--brand-navy))] dark:text-blue-300" />}
              title="Email"
              value={EMAIL}
              href={`mailto:${EMAIL}`}
              cta="Send email"
            />
          </div>
        </section>

        {/* Business address — small footer note so Paystack/compliance can locate the operator. */}
        <section aria-label="Business address" className="border-t">
          <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-zinc-500">
            <p itemScope itemType="https://schema.org/Organization">
              <span itemProp="name">Eli Data Resales</span> ·
              <span itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
                {" "}<span itemProp="addressLocality">Dzita</span>,{" "}
                <span itemProp="addressRegion">Volta Region</span>,{" "}
                <span itemProp="addressCountry">Ghana</span>
              </span>
            </p>
          </div>
        </section>
      </main>
    </div>

  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-brand">{icon}</div>
        <h3 className="mt-3 font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}

function PolicySummary({ title, body }: { title: string; body: string }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border bg-card p-5">
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function Policy({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-lg border p-4">
      <div className="flex items-center gap-2 font-semibold">{icon}<span className="min-w-0 break-words">{title}</span></div>
      <p className="mt-2 text-sm text-muted-foreground break-words">{body}</p>
    </div>
  );
}

function ContactCard({ icon, title, value, href, cta }: { icon: React.ReactNode; title: string; value: string; href: string; cta: string }) {
  return (
    <Card className="min-w-0 overflow-hidden transition hover:border-brand-line/80">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2">{icon}<span className="font-semibold">{title}</span></div>
        <div className="mt-2 overflow-hidden text-ellipsis text-lg font-mono">{value}</div>
        <Button asChild className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90">
          <a href={href} target="_blank" rel="noreferrer">{cta}</a>
        </Button>
      </CardContent>
    </Card>
  );
}

function LegalLink({ to, icon, title, body }: { to: "/privacy" | "/terms"; icon: React.ReactNode; title: string; body: string }) {
  return (
    <Link to={to} className="flex items-start gap-3 rounded-xl border p-4 transition hover:bg-accent">
      <span className="mt-0.5">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
      <ChevronRight className="mt-1 h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

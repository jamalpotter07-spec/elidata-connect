import { createFileRoute } from "@tanstack/react-router";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MessageCircle, Zap, ShieldCheck, Clock, HeartHandshake } from "lucide-react";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About DataPlug GH — Affordable Ghana Data Reseller" },
      {
        name: "description",
        content:
          "DataPlug GH delivers the cheapest MTN, Telecel & AT data bundles in Ghana — instant, secure, 24/7. Contact us on WhatsApp 0500843914.",
      },
      { property: "og:title", content: "About DataPlug GH" },
      { property: "og:description", content: "Ghana's most affordable data bundle plug." },
    ],
  }),
});

const EMAIL = "support@dataplug.gh";
const PHONE = "0500843914";
const WA_INTL = "233500843914";

function AboutPage() {
  return (
    <>
      <NavBar />
      <main className="pb-20">
        <section className="border-b">
          <div className="container mx-auto px-4 py-14 md:py-20 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium">
              <HeartHandshake className="h-3 w-3 text-[hsl(var(--brand-orange))]" />
              Proudly serving Ghana
            </span>
            <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight">
              We make data <span className="text-[hsl(var(--brand-orange))]">cheap, fast, and reliable.</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              DataPlug GH is your trusted plug for MTN, Telecel and AirtelTigo data bundles —
              sold directly to you at reseller prices, delivered to any Ghana number in seconds.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          <div className="grid gap-4 sm:grid-cols-3">
            <Feature icon={<Zap />} title="Lightning fast" body="Most bundles deliver in under 60 seconds — fully automated." />
            <Feature icon={<ShieldCheck />} title="Safe & secure" body="Encrypted checkout. Your number and money are protected." />
            <Feature icon={<Clock />} title="24/7 service" body="Buy anytime — our system never sleeps and orders are tracked live." />
          </div>
        </section>

        <section className="container mx-auto px-4 py-8">
          <div className="rounded-2xl border bg-card p-6 md:p-10">
            <h2 className="text-2xl md:text-3xl font-bold">Why customers pick us</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 text-sm text-muted-foreground">
              <li>• Lower prices than dialing a USSD code</li>
              <li>• No SIM swap, no app install required</li>
              <li>• Works for guests — no sign up needed</li>
              <li>• Track every order with a unique link</li>
              <li>• Friendly support on WhatsApp</li>
              <li>• Refund or retry on any failed delivery</li>
            </ul>
          </div>
        </section>

        <section id="contact" className="container mx-auto px-4 py-12">
          <h2 className="text-2xl md:text-3xl font-bold">Talk to us</h2>
          <p className="text-muted-foreground mt-1">We reply fast — usually within minutes.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <ContactCard
              icon={<MessageCircle className="h-5 w-5 text-green-500" />}
              title="WhatsApp"
              value={PHONE}
              href={`https://wa.me/${WA_INTL}?text=Hi%20DataPlug%20GH%2C%20I%27d%20like%20to%20buy%20data`}
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
      </main>
    </>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-[hsl(var(--brand-orange))]">{icon}</div>
        <h3 className="mt-3 font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}

function ContactCard({ icon, title, value, href, cta }: { icon: React.ReactNode; title: string; value: string; href: string; cta: string }) {
  return (
    <Card className="hover:border-[hsl(var(--brand-orange))]/40 transition">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2">{icon}<span className="font-semibold">{title}</span></div>
        <div className="mt-2 text-lg font-mono">{value}</div>
        <Button asChild className="mt-4 w-full bg-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-navy-2))] text-white">
          <a href={href} target="_blank" rel="noreferrer">{cta}</a>
        </Button>
      </CardContent>
    </Card>
  );
}

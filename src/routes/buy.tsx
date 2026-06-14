import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { NavBar } from "@/components/nav-bar";

export const Route = createFileRoute("/buy")({
  component: BuyPage,
  head: () => ({
    meta: [
      { title: "Buy Data Bundles — Eli Data Resales" },
      {
        name: "description",
        content: "Choose your network and buy cheap data bundles in Ghana. MTN, Airtel-Tigo and Telecel at reseller prices.",
      },
    ],
  }),
});

const networks = [
  {
    id: "MTN",
    label: "MTN",
    description: "Ghana's largest network",
    color: "#FFCC00",
    textColor: "#1a1200",
    href: "/?network=MTN",
    dot: "bg-[#FFCC00]",
  },
  {
    id: "AT",
    label: "Airtel-Tigo",
    description: "Nationwide coverage",
    color: "#00A4E4",
    textColor: "#ffffff",
    href: "/?network=AT",
    dot: "bg-[#00A4E4]",
  },
  {
    id: "Telecel",
    label: "Telecel",
    description: "Fast & affordable",
    color: "#E30613",
    textColor: "#ffffff",
    href: "/?network=Telecel",
    dot: "bg-[#E30613]",
  },
];

function BuyPage() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen pt-24 pb-28 lg:pb-10 px-4">
        <div className="mx-auto max-w-lg">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight">Select network</h1>
            <p className="mt-2 text-muted-foreground text-sm">
              Pick your provider to see available bundles and prices.
            </p>
          </div>

          {/* Network cards */}
          <div className="flex flex-col gap-3">
            {networks.map((net) => (
              <Link
                key={net.id}
                to={net.href as "/"}
                className="group flex items-center justify-between rounded-2xl border px-5 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]"
                style={{
                  background: "var(--color-card)",
                  borderColor: "var(--color-border)",
                }}
              >
                {/* Left — colour dot + text */}
                <div className="flex items-center gap-4">
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-black shadow-sm"
                    style={{ background: net.color, color: net.textColor }}
                  >
                    {net.id === "AT" ? "AT" : net.id.slice(0, 3).toUpperCase()}
                  </span>
                  <div>
                    <p className="font-bold text-foreground">{net.label}</p>
                    <p className="text-xs text-muted-foreground">{net.description}</p>
                  </div>
                </div>

                {/* Right — arrow */}
                <ArrowRight
                  className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1"
                  style={{ color: net.color }}
                />
              </Link>
            ))}
          </div>

          {/* Footer note */}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            All prices are in Ghana Cedis (GHS) · Delivered instantly
          </p>
        </div>
      </main>
    </>
  );
}

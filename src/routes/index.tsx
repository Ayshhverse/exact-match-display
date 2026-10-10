import { createFileRoute, Link } from "@tanstack/react-router";
import { ScanSearch, FolderLock, Compass, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SafeHer — Spot it. Save it. Report it." },
      { name: "description", content: "Check suspicious messages, save evidence privately, and get step-by-step help against online abuse and scams." },
      { property: "og:title", content: "SafeHer — Spot it. Save it. Report it." },
      { property: "og:description", content: "A private toolkit for women facing online harassment, scams, impersonation and sextortion." },
    ],
  }),
  component: Index,
});

const CARDS = [
  { icon: ScanSearch, title: "Detect threats", text: "Paste any DM, SMS or email and instantly see the risk level and the tricks being used on you." },
  { icon: FolderLock, title: "Save evidence", text: "Keep screenshots, links and notes in a private vault with unique Evidence IDs — stored only on your device." },
  { icon: Compass, title: "Get guided help", text: "Clear steps for your situation, helpline 1930, and a ready-to-send complaint for cybercrime.gov.in." },
];

function Index() {
  return (
    <>
      <section className="bg-hero text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-24 md:py-32">
          <p className="mb-4 inline-block rounded-full bg-primary-foreground/15 px-4 py-1 text-sm">Private · No login · Free</p>
          <h1 className="text-6xl font-bold md:text-8xl">SafeHer</h1>
          <p className="mt-4 text-2xl opacity-90 md:text-3xl">Spot it. Save it. Report it.</p>
          <Link to="/check" className="btn mt-10 bg-primary-foreground px-7 py-3 text-base text-primary hover:brightness-95">
            Check a message <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
      <section className="mx-auto -mt-12 grid max-w-6xl gap-5 px-4 md:grid-cols-3">
        {CARDS.map((c) => (
          <div key={c.title} className="card p-7">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary"><c.icon /></div>
            <h3 className="text-xl font-semibold">{c.title}</h3>
            <p className="mt-2 text-muted-foreground">{c.text}</p>
          </div>
        ))}
      </section>
      <p className="mx-auto max-w-2xl px-4 py-16 text-center text-lg text-muted-foreground">
        Built for <span className="font-semibold text-foreground">women and students</span> facing online harassment, scams, impersonation, and sextortion.
      </p>
    </>
  );
}

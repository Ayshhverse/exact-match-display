import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Copy, FileText, Heart, Phone } from "lucide-react";
import { toast } from "sonner";
import { useVault } from "@/lib/vault";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "What To Do Now — SafeHer" },
      { name: "description", content: "Step-by-step guidance for sextortion, impersonation, harassment, scams and image misuse, plus a complaint draft." },
      { property: "og:title", content: "What To Do Now — SafeHer" },
      { property: "og:description", content: "Clear next steps and a ready-to-copy cybercrime complaint." },
    ],
  }),
  component: HelpPage,
});

const BASE_END = [
  "Block and report the account on the platform.",
  "Report at cybercrime.gov.in (National Cyber Crime Portal).",
  "Call the cybercrime helpline 1930 — especially if money was lost.",
];

const SITUATIONS: Record<string, string[]> = {
  "Sextortion/blackmail": ["Do not pay — paying almost always leads to more demands.", "Do not delete the chat.", "Stop replying and don't negotiate.", "Save evidence: screenshots, profile link, payment IDs.", ...BASE_END],
  "Impersonation/fake profile": ["Do not delete messages from the fake profile.", "Save evidence: profile URL, screenshots of posts and DMs.", "Warn friends and family not to respond or send money.", "Use the platform's 'Pretending to be me' report option.", ...BASE_END],
  "Harassment/stalking": ["Do not engage or respond to the harasser.", "Do not delete the chat.", "Save evidence with dates and times.", "Tighten privacy settings and turn off location sharing.", "Tell someone you trust.", ...BASE_END],
  "Financial scam": ["Do not pay any more money or share OTPs.", "Call 1930 immediately — fast reports can freeze funds.", "Inform your bank and block cards/UPI.", "Do not delete the chat; save transaction IDs.", "Block and report the number/account on the platform.", "Report at cybercrime.gov.in."],
  "Image misuse": ["Do not pay or bargain with whoever posted it.", "Do not delete the chat.", "Save evidence: URLs, screenshots, uploader profile.", "Request removal via the platform's non-consensual imagery form.", "Use StopNCII.org to block re-uploads.", ...BASE_END],
};

function HelpPage() {
  const { items } = useVault();
  const [situation, setSituation] = useState(Object.keys(SITUATIONS)[0]);
  const [done, setDone] = useState<Record<number, boolean>>({});
  const [draft, setDraft] = useState("");

  const generate = () => {
    const ids = items.map((i) => `  - ${i.id} (${i.platform}${i.note ? `: ${i.note}` : ""})`).join("\n") || "  - [No evidence saved yet]";
    setDraft(`To,
The Cyber Crime Cell,
National Cyber Crime Reporting Portal (cybercrime.gov.in)

Subject: Complaint regarding ${situation.toLowerCase()}

Respected Sir/Madam,

I wish to report an incident of ${situation.toLowerCase()} that I have been facing online. The person(s) involved have contacted me through online platforms and their actions have caused me serious distress.

Date of incident: [DD/MM/YYYY]
Platform(s): ${[...new Set(items.map((i) => i.platform))].join(", ") || "[Platform]"}
Suspect account / number: [Username, profile link or phone number]

I have preserved the following evidence (SafeHer Evidence IDs):
${ids}

I request you to kindly take necessary legal action, help remove any harmful content, and protect my privacy and safety.

Thank you.

Name: [Your name]
Contact: [Phone / email]
Date: ${new Date().toLocaleDateString("en-IN")}`);
  };

  const copy = async () => { await navigator.clipboard.writeText(draft); toast.success("Complaint copied"); };
  const steps = SITUATIONS[situation];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-bold">What to do now</h1>
      <p className="mt-2 text-muted-foreground">Choose your situation and follow the steps at your own pace.</p>

      <select value={situation} onChange={(e) => { setSituation(e.target.value); setDone({}); setDraft(""); }} className="field mt-6 text-base font-medium">
        {Object.keys(SITUATIONS).map((s) => <option key={s}>{s}</option>)}
      </select>

      <ol className="card mt-6 divide-y p-2">
        {steps.map((s, i) => (
          <li key={s}>
            <button onClick={() => setDone({ ...done, [i]: !done[i] })} className="flex w-full items-start gap-3 rounded-xl p-4 text-left hover:bg-muted">
              <CheckCircle2 className={`mt-0.5 h-5 w-5 shrink-0 ${done[i] ? "text-risk-low" : "text-input"}`} />
              <span className={done[i] ? "text-muted-foreground line-through" : ""}><b className="mr-1 text-primary">{i + 1}.</b>{s}</span>
            </button>
          </li>
        ))}
      </ol>

      <a href="tel:1930" className="btn btn-soft mt-4"><Phone className="h-4 w-4" />Call 1930</a>

      <div className="mt-10">
        <button onClick={generate} className="btn btn-primary"><FileText className="h-4 w-4" />Generate complaint draft</button>
        {draft && (
          <div className="card mt-4 p-4">
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={18} className="field font-mono text-sm" />
            <button onClick={copy} className="btn btn-primary mt-3"><Copy className="h-4 w-4" />Copy</button>
          </div>
        )}
      </div>

      <div className="mt-12 flex gap-4 rounded-3xl bg-primary-soft p-6">
        <Heart className="h-6 w-6 shrink-0 text-primary" />
        <div>
          <p className="font-semibold text-primary">Need emotional support?</p>
          <p className="text-secondary-foreground">You are not alone and it is not your fault. Talk to someone you trust, or call the Women Helpline <b>181</b> / Tele-MANAS <b>14416</b>.</p>
        </div>
      </div>
    </div>
  );
}

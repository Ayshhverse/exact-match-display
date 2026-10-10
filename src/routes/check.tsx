import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Save, HelpCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { analyze, highlightSegments, EXAMPLES, type Analysis } from "@/lib/detect";
import { addEvidence } from "@/lib/vault";

export const Route = createFileRoute("/check")({
  head: () => ({
    meta: [
      { title: "Check a Message — SafeHer" },
      { name: "description", content: "Paste a suspicious DM, SMS or email to instantly see its risk level and manipulation tactics." },
      { property: "og:title", content: "Check a Message — SafeHer" },
      { property: "og:description", content: "Instant risk check for sextortion, phishing, impersonation and scam messages." },
    ],
  }),
  component: CheckPage,
});

const RISK_STYLE = {
  Low: "bg-risk-low text-primary-foreground",
  Medium: "bg-risk-medium text-foreground",
  High: "bg-risk-high text-primary-foreground",
};

function CheckPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<Analysis | null>(null);
  const [saved, setSaved] = useState(false);

  const run = (t = text) => { if (!t.trim()) return; setResult(analyze(t)); setSaved(false); };

  const save = () => {
    if (!result) return;
    const item = addEvidence({ platform: "Other", note: `${result.risk} risk · ${result.threat}`, text });
    setSaved(true);
    toast.success(`Saved to vault as ${item.id}`);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-bold">Check a message</h1>
      <p className="mt-2 text-muted-foreground">Nothing leaves your device. Analysis is instant.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <span className="flex items-center gap-1 text-sm text-muted-foreground"><Sparkles className="h-4 w-4" /> Try an example:</span>
        {EXAMPLES.map((e) => (
          <button key={e.label} onClick={() => { setText(e.text); run(e.text); }} className="btn btn-soft px-3 py-1.5 text-xs">{e.label}</button>
        ))}
      </div>

      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={7}
        placeholder="Paste a suspicious message, DM, or email" className="field mt-4 resize-y" />
      <button onClick={() => run()} disabled={!text.trim()} className="btn btn-primary mt-4 px-8 disabled:opacity-50">Analyze</button>

      {result && (
        <div className="card mt-8 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          <div className={`flex items-center gap-3 px-6 py-4 ${RISK_STYLE[result.risk]}`}>
            <AlertTriangle className="h-6 w-6" />
            <div>
              <div className="text-sm opacity-90">Risk level</div>
              <div className="text-2xl font-bold">{result.risk}</div>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Risk score</div>
                <div className="text-xl font-semibold">{result.score} / 100</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Threat type</div>
                <div className="text-xl font-semibold">{result.threat}</div>
              </div>
            </div>
            <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-500 ${RISK_STYLE[result.risk]}`}
                style={{ width: `${Math.max(result.score, 3)}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>0 · safe</span><span>34 · caution</span><span>67 · danger</span><span>100</span>
            </div>

            <h3 className="mt-6 font-semibold">Message with highlights</h3>
            <div className="mt-2 rounded-xl border border-border bg-muted/50 p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {highlightSegments(text, result.matches).map((s, i) =>
                s.hit ? (
                  <mark key={i} className="rounded bg-risk-high/25 px-0.5 text-foreground">{s.text}</mark>
                ) : (
                  <span key={i}>{s.text}</span>
                )
              )}
            </div>

            <h3 className="mt-6 font-semibold">Why this is risky</h3>
            <ul className="mt-2 space-y-2">
              {result.reasons.map((r) => (
                <li key={r} className="flex gap-2"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />{r}</li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={save} disabled={saved} className="btn btn-primary disabled:opacity-60"><Save className="h-4 w-4" />{saved ? "Saved" : "Save as evidence"}</button>
              <Link to="/help" className="btn btn-soft"><HelpCircle className="h-4 w-4" />What should I do?</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

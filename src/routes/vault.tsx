import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Upload, Trash2, Printer, FileText, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useVault, makeId, fmt, type Platform, type Evidence } from "@/lib/vault";

export const Route = createFileRoute("/vault")({
  head: () => ({
    meta: [
      { title: "Evidence Vault — SafeHer" },
      { name: "description", content: "Privately store screenshots, links and notes as evidence with unique IDs, then export a printable report." },
      { property: "og:title", content: "Evidence Vault — SafeHer" },
      { property: "og:description", content: "A private, on-device evidence vault for online abuse." },
    ],
  }),
  component: VaultPage,
});

const PLATFORMS: Platform[] = ["Instagram", "WhatsApp", "Email", "Other"];

function VaultPage() {
  const { items, update } = useVault();
  const [image, setImage] = useState<string>();
  const [note, setNote] = useState("");
  const [link, setLink] = useState("");
  const [platform, setPlatform] = useState<Platform>("Instagram");
  const [printing, setPrinting] = useState(false);

  const onFile = (f?: File) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(f);
  };

  const add = () => {
    if (!image && !note.trim() && !link.trim()) return toast.error("Add a screenshot, link or note first");
    const item: Evidence = { id: makeId(note + link), createdAt: new Date().toISOString(), platform, note: note.trim(), link: link.trim() || undefined, image };
    try { update([item, ...items]); } catch { return toast.error("Storage full — try a smaller screenshot"); }
    setImage(undefined); setNote(""); setLink("");
    toast.success(`Saved as ${item.id}`);
  };

  const exportReport = () => { setPrinting(true); setTimeout(() => { window.print(); setPrinting(false); }, 100); };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="no-print">
        <h1 className="text-4xl font-bold">Evidence Vault</h1>
        <p className="mt-2 text-muted-foreground">Stored only in this browser. Don't delete the original chats.</p>

        <div className="card mt-8 grid gap-4 p-6 md:grid-cols-2">
          <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-input bg-muted p-4 text-center hover:border-primary">
            {image ? <img src={image} alt="Preview" className="max-h-44 rounded-lg" /> : (
              <><Upload className="mb-2 h-8 w-8 text-primary" /><span className="font-medium">Upload screenshot</span><span className="text-sm text-muted-foreground">PNG or JPG</span></>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          <div className="flex flex-col gap-3">
            <select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} className="field">
              {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
            </select>
            <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Paste a link (profile, post, URL)" className="field" />
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Short note: what happened?" className="field" />
            <button onClick={add} className="btn btn-primary">Save evidence</button>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Saved items ({items.length})</h2>
          <button onClick={exportReport} disabled={!items.length} className="btn btn-soft disabled:opacity-50"><Printer className="h-4 w-4" />Export evidence report</button>
        </div>
      </div>

      {printing && (
        <div className="hidden print:block">
          <h1 className="text-3xl font-bold">SafeHer Evidence Report</h1>
          <p className="mb-6 text-sm">Generated {fmt(new Date().toISOString())} · {items.length} items</p>
        </div>
      )}

      <ul className="mt-4 space-y-3">
        {items.map((it) => (
          <li key={it.id} className="card flex gap-4 p-4 print:break-inside-avoid print:shadow-none">
            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary-soft text-primary">
              {it.image ? <img src={it.image} alt="" className="h-full w-full object-cover" /> : it.link ? <ImageIcon /> : <FileText />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-md bg-primary px-2 py-0.5 font-mono text-xs text-primary-foreground">{it.id}</span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">{it.platform}</span>
                <span className="text-muted-foreground">{fmt(it.createdAt)}</span>
              </div>
              {it.note && <p className="mt-1 font-medium">{it.note}</p>}
              {it.link && <p className="truncate text-sm text-primary">{it.link}</p>}
              {it.text && <p className="mt-1 line-clamp-2 text-sm italic text-muted-foreground">"{it.text}"</p>}
            </div>
            <button onClick={() => update(items.filter((x) => x.id !== it.id))} className="no-print self-start rounded-lg p-2 text-muted-foreground hover:text-destructive" aria-label="Delete">
              <Trash2 className="h-5 w-5" />
            </button>
          </li>
        ))}
        {!items.length && <p className="py-10 text-center text-muted-foreground">No evidence saved yet.</p>}
      </ul>
    </div>
  );
}

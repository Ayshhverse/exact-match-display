import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Upload, Trash2, Printer, FileText, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useVault, fmt, sha256Hex, idFromHash, putImage, deleteImage, useImageUrl, type Platform, type Evidence } from "@/lib/vault";

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
  const [file, setFile] = useState<File>();
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [link, setLink] = useState("");
  const [platform, setPlatform] = useState<Platform>("Instagram");
  const [printing, setPrinting] = useState(false);

  const onFile = (f?: File) => {
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(f);
  };

  const add = async () => {
    if (!image && !note.trim() && !link.trim()) { toast.error("Add a screenshot, link or note first"); return; }
    setSaving(true);
    try {
      const createdAt = new Date().toISOString();
      const hash = file ? await sha256Hex(await file.arrayBuffer()) : await sha256Hex(note.trim() + createdAt);
      const id = idFromHash(hash);
      if (items.some((x) => x.id === id)) { toast.error(`This file is already saved as ${id}`); return; }
      if (file) await putImage(id, file);
      const item: Evidence = { id, hash, createdAt, platform, note: note.trim(), link: link.trim() || undefined, hasImage: !!file };
      try { update([item, ...items]); } catch { toast.error("Storage full — could not save details"); return; }
      setImage(undefined); setFile(undefined); setNote(""); setLink("");
      toast.success(`Saved as ${item.id}`);
    } catch { toast.error("Could not save evidence"); }
    finally { setSaving(false); }
  };

  const remove = (it: Evidence) => {
    update(items.filter((x) => x.id !== it.id));
    if (it.hasImage) deleteImage(it.id).catch(() => {});
  };
  const hasSamples = items.some((x) => x.sample);
  const clearSamples = () => { update(items.filter((x) => !x.sample)); toast.success("Sample data cleared"); };

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
            <button onClick={add} disabled={saving} className="btn btn-primary disabled:opacity-50">{saving ? "Saving…" : "Save evidence"}</button>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Saved items ({items.length})</h2>
          <div className="flex flex-wrap gap-2">
            {hasSamples && <button onClick={clearSamples} className="btn btn-soft">Clear sample data</button>}
            <button onClick={exportReport} disabled={!items.length} className="btn btn-soft disabled:opacity-50"><Printer className="h-4 w-4" />Export evidence report</button>
          </div>
        </div>
      </div>

      {printing && (
        <div className="hidden print:block">
          <h1 className="text-3xl font-bold">SafeHer Evidence Report</h1>
          <p className="text-sm">Generated {fmt(new Date().toISOString())} · {items.length} items</p>
          <p className="mb-6 mt-2 border-y py-2 text-sm font-medium">Hash values can be used to show that a file has not been changed since it was saved.</p>
        </div>
      )}

      <ul className="mt-4 space-y-3">
        {items.map((it) => <Item key={it.id} it={it} printing={printing} onDelete={() => remove(it)} />)}
        {!items.length && <p className="py-10 text-center text-muted-foreground">No evidence saved yet.</p>}
      </ul>
    </div>
  );
}

function Item({ it, printing, onDelete }: { it: Evidence; printing: boolean; onDelete: () => void }) {
  const [showHash, setShowHash] = useState(false);
  const url = useImageUrl(it.id, !!it.hasImage);
  const src = url ?? it.image;
  return (
    <li className="card flex gap-4 p-4 print:break-inside-avoid print:shadow-none">
      <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary-soft text-primary">
        {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : it.link ? <ImageIcon /> : <FileText />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-md bg-primary px-2 py-0.5 font-mono text-xs text-primary-foreground">{it.id}</span>
          {it.sample && <span className="rounded-full border border-primary px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary">Sample</span>}
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">{it.platform}</span>
          <span className="text-muted-foreground">{fmt(it.createdAt)}</span>
        </div>
        {it.note && <p className="mt-1 font-medium">{it.note}</p>}
        {it.link && <p className="truncate text-sm text-primary">{it.link}</p>}
        {it.text && <p className="mt-1 line-clamp-2 text-sm italic text-muted-foreground">"{it.text}"</p>}
        {it.hash && (
          <div className="mt-1 text-xs">
            <button onClick={() => setShowHash((v) => !v)} className="no-print font-medium text-primary hover:underline">
              {showHash ? "Hide full hash" : "Show full hash"}
            </button>
            {(showHash || printing) && <p className="mt-1 break-all font-mono text-muted-foreground"><span className="hidden print:inline">SHA-256: </span>{it.hash}</p>}
          </div>
        )}
        {printing && (
          <dl className="hidden text-xs print:mt-2 print:grid print:grid-cols-[auto_1fr] print:gap-x-3">
            <dt className="font-semibold">Platform</dt><dd>{it.platform}</dd>
            <dt className="font-semibold">Timestamp</dt><dd>{new Date(it.createdAt).toISOString()}</dd>
            <dt className="font-semibold">Link</dt><dd className="break-all">{it.link || "—"}</dd>
            <dt className="font-semibold">Note</dt><dd>{it.note || "—"}</dd>
          </dl>
        )}
      </div>
      <button onClick={onDelete} className="no-print self-start rounded-lg p-2 text-muted-foreground hover:text-destructive" aria-label="Delete">
        <Trash2 className="h-5 w-5" />
      </button>
    </li>
  );
}

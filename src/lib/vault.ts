import { useEffect, useState } from "react";

export type Platform = "Instagram" | "WhatsApp" | "Email" | "Other";
export type Evidence = {
  id: string;
  createdAt: string;
  platform: Platform;
  note: string;
  link?: string | undefined;
  /** Legacy only — images now live in IndexedDB. */
  image?: string | undefined;
  hasImage?: boolean;
  text?: string | undefined;
  hash?: string;
  sample?: boolean;
};

const KEY = "safeher-vault";

/** Real SHA-256 (browser crypto). Returns lowercase hex. */
export async function sha256Hex(data: ArrayBuffer | string): Promise<string> {
  const buf = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const idFromHash = (hash: string) => "SH-" + hash.slice(0, 8).toUpperCase();

/** Kept for other pages; prefer hash-based IDs. */
export function makeId(seed: string) {
  let h = 2166136261;
  const s = seed + Date.now() + Math.random();
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return "SH-" + (h >>> 0).toString(16).toUpperCase().padStart(8, "0").slice(0, 8);
}

const DEMO: Evidence[] = [
  { id: "SH-7F3A91C2", hash: "7f3a91c2e84b05d6a19c3f7e20b8d4a6c51e9f0237ab68d4e1c5f92a0b7d3e81", sample: true, createdAt: "2026-10-08T21:14:00", platform: "Instagram", note: "Fake profile using my photos sent DM threatening to post edited images.", link: "instagram.com/fake.profile_2026" },
  { id: "SH-B41E0D58", hash: "b41e0d58c27f936a4d10e5b8f3a62c97d084e1b5a6f39c20d7e48b1a5c6f0392", sample: true, createdAt: "2026-10-09T10:02:00", platform: "WhatsApp", note: "Unknown number asked for money pretending to be my cousin.", text: "Hi it's me, new number, send ₹5000 urgently" },
];
const DEMO_IDS = new Set(DEMO.map((d) => d.id));

export function loadVault(): Evidence[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) { localStorage.setItem(KEY, JSON.stringify(DEMO)); return DEMO; }
    const items: Evidence[] = JSON.parse(raw);
    return items.map((i) => (DEMO_IDS.has(i.id) && i.sample === undefined ? { ...i, sample: true } : i));
  } catch { return []; }
}

export function saveVault(items: Evidence[]) {
  localStorage.setItem(KEY, JSON.stringify(items.map(({ image: _i, ...rest }) => rest)));
}

export function addEvidence(e: Omit<Evidence, "id" | "createdAt">) {
  const item: Evidence = { ...e, id: makeId(e.note + (e.text ?? "")), createdAt: new Date().toISOString() };
  saveVault([item, ...loadVault()]);
  return item;
}

/* ---------- IndexedDB image store ---------- */
const DB = "safeher-images";
const STORE = "images";
function openDb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((res, rej) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}
export const putImage = (id: string, blob: Blob) => tx("readwrite", (s) => s.put(blob, id));
export const getImage = (id: string) => tx<Blob | undefined>("readonly", (s) => s.get(id));
export const deleteImage = (id: string) => tx("readwrite", (s) => s.delete(id));

export function useVault() {
  const [items, setItems] = useState<Evidence[]>([]);
  useEffect(() => {
    const loaded = loadVault();
    // Migrate legacy data-URL images out of local storage.
    const legacy = loaded.filter((i) => i.image);
    if (legacy.length) {
      Promise.all(legacy.map(async (i) => putImage(i.id, await (await fetch(i.image!)).blob()))).then(() => {
        const next = loaded.map((i) => (i.image ? { ...i, image: undefined, hasImage: true } : i));
        saveVault(next); setItems(next);
      }).catch(() => setItems(loaded));
    } else setItems(loaded);
  }, []);
  const update = (next: Evidence[]) => { saveVault(next); setItems(next); };
  return { items, update };
}

export function useImageUrl(id: string, enabled: boolean) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!enabled) return;
    let u: string | undefined;
    getImage(id).then((b) => { if (b) { u = URL.createObjectURL(b); setUrl(u); } }).catch(() => {});
    return () => { if (u) URL.revokeObjectURL(u); };
  }, [id, enabled]);
  return url;
}

export const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

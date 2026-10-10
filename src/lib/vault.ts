import { useEffect, useState } from "react";

export type Platform = "Instagram" | "WhatsApp" | "Email" | "Other";
export type Evidence = {
  id: string;
  createdAt: string;
  platform: Platform;
  note: string;
  link?: string;
  image?: string; // data URL
  text?: string;
};

const KEY = "safeher-vault";

export function makeId(seed: string) {
  let h = 2166136261;
  const s = seed + Date.now() + Math.random();
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return "SH-" + (h >>> 0).toString(16).toUpperCase().padStart(8, "0").slice(0, 8);
}

const DEMO: Evidence[] = [
  { id: "SH-7F3A91C2", createdAt: "2026-10-08T21:14:00", platform: "Instagram", note: "Fake profile using my photos sent DM threatening to post edited images.", link: "instagram.com/fake.profile_2026" },
  { id: "SH-B41E0D58", createdAt: "2026-10-09T10:02:00", platform: "WhatsApp", note: "Unknown number asked for money pretending to be my cousin.", text: "Hi it's me, new number, send ₹5000 urgently" },
];

export function loadVault(): Evidence[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) { localStorage.setItem(KEY, JSON.stringify(DEMO)); return DEMO; }
    return JSON.parse(raw);
  } catch { return []; }
}

export function saveVault(items: Evidence[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function addEvidence(e: Omit<Evidence, "id" | "createdAt">) {
  const item: Evidence = { ...e, id: makeId(e.note + (e.text ?? "")), createdAt: new Date().toISOString() };
  saveVault([item, ...loadVault()]);
  return item;
}

export function useVault() {
  const [items, setItems] = useState<Evidence[]>([]);
  useEffect(() => setItems(loadVault()), []);
  const update = (next: Evidence[]) => { setItems(next); saveVault(next); };
  return { items, update };
}

export const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

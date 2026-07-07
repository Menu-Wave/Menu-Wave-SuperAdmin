import { create } from "zustand";
import type { MenuItem } from "./menu-data";

export type CartEntry = {
  uid: string;
  item: MenuItem;
  x: number; // px, relative to tray inner area, top-left of item
  y: number;
};

type CartState = {
  entries: CartEntry[];
  name: string;
  add: (item: MenuItem, x: number, y: number) => void;
  move: (uid: string, x: number, y: number) => void;
  remove: (uid: string) => void;
  restore: (entry: CartEntry, index: number) => void;
  clear: () => void;
  setName: (n: string) => void;
};

export const useCart = create<CartState>((set) => ({
  entries: [],
  name: "",
  add: (item, x, y) =>
    set((s) => ({
      entries: [
        ...s.entries,
        {
          uid: `${item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          item,
          x,
          y,
        },
      ],
    })),
  move: (uid, x, y) =>
    set((s) => ({
      entries: s.entries.map((e) => (e.uid === uid ? { ...e, x, y } : e)),
    })),
  remove: (uid) => set((s) => ({ entries: s.entries.filter((e) => e.uid !== uid) })),
  restore: (entry, index) =>
    set((s) => {
      if (s.entries.some((e) => e.uid === entry.uid)) return s;
      const next = s.entries.slice();
      next.splice(Math.max(0, Math.min(index, next.length)), 0, entry);
      return { entries: next };
    }),
  clear: () => set({ entries: [] }),
  setName: (name) => set({ name }),
}));

export const cartTotal = (entries: CartEntry[]) =>
  entries.reduce((sum, e) => sum + e.item.price, 0);

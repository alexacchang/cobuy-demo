"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDemo } from "@/lib/demo-store";
import { cx } from "./ui";

export const NAV = [
  { href: "/invoices", label: "Invoices", step: 1 },
  { href: "/matches", label: "Matches", step: 2 },
  { href: "/offer", label: "Group offer", step: 3 },
  { href: "/overview", label: "Overview", step: 4 },
  { href: "/supplier", label: "Supplier view", step: 5 },
] as const;

export default function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  const { useCachedAi, set, reset } = useDemo();

  return (
    <aside className="fixed inset-y-0 left-0 flex w-[260px] flex-col bg-sidebar text-white">
      <div className="px-7 pb-8 pt-8">
        <div className="font-display flex items-center gap-2.5 text-2xl font-semibold">
          <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden>
            <circle cx="11" cy="14" r="8" fill="none" stroke="#8FD3A8" strokeWidth="3" />
            <circle cx="17" cy="14" r="8" fill="none" stroke="#FFFFFF" strokeWidth="3" />
          </svg>
          CoBuy
        </div>
        <div className="mt-6 rounded-xl border border-sidebar-line px-4 py-3">
          <div className="text-base font-semibold">Rose Tea Cafe</div>
          <div className="text-sm text-white/60">Oakland, Pittsburgh</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1 px-4">
        {NAV.map((n) => {
          const active = path === n.href || path.startsWith(n.href + "/");
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cx(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-[17px] font-medium transition-colors",
                active ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white",
              )}
            >
              <span className={cx("num flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold", active ? "bg-mint text-sidebar" : "border border-white/25 text-white/70")}>
                {n.step}
              </span>
              {n.label}
            </Link>
          );
        })}
      </nav>

      {/* Presenter controls: deliberately quiet */}
      <div className="mt-auto flex items-center justify-between gap-2 px-5 pb-5 text-xs text-white/35">
        <label className="flex cursor-pointer items-center gap-2 hover:text-white/70">
          <input
            type="checkbox"
            checked={useCachedAi}
            onChange={(e) => set({ useCachedAi: e.target.checked })}
            className="h-3 w-3 accent-[#8FD3A8]"
          />
          Use cached AI
        </label>
        <button
          onClick={() => {
            reset();
            router.push("/invoices");
          }}
          className="rounded px-1.5 py-0.5 hover:bg-white/10 hover:text-white/70"
        >
          Reset demo
        </button>
      </div>
    </aside>
  );
}

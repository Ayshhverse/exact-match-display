import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Shield, LogOut, Menu, X } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <p className="mt-2 text-muted-foreground">This page doesn't exist.</p>
        <Link to="/" className="btn btn-primary mt-6">Go home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 text-center">
      <div>
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <button onClick={() => { router.invalidate(); reset(); }} className="btn btn-primary mt-6">Try again</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SafeHer — Spot it. Save it. Report it." },
      { name: "description", content: "SafeHer helps women recognize, report, and recover from online abuse and scams." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Manrope:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

const NAV = [
  { to: "/", label: "Home" },
  { to: "/check", label: "Check Message" },
  { to: "/vault", label: "Evidence Vault" },
  { to: "/help", label: "What To Do Now" },
] as const;

function quickExit() {
  window.location.replace("https://www.google.com");
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") quickExit(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        <header className="no-print sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
            <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Shield className="h-5 w-5" /></span>
              SafeHer
            </Link>
            <nav className="ml-6 hidden gap-1 md:flex">
              {NAV.map((n) => (
                <Link key={n.to} to={n.to} activeOptions={{ exact: true }}
                  className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary"
                  activeProps={{ className: "bg-primary-soft !text-primary" }}>{n.label}</Link>
              ))}
            </nav>
            <button onClick={() => setOpen(!open)} className="ml-auto rounded-lg p-2 md:hidden" aria-label="Menu">
              {open ? <X /> : <Menu />}
            </button>
          </div>
          {open && (
            <nav className="flex flex-col gap-1 px-4 pb-3 md:hidden">
              {NAV.map((n) => (
                <Link key={n.to} to={n.to} onClick={() => setOpen(false)} activeOptions={{ exact: true }}
                  className="rounded-xl px-4 py-3 font-medium" activeProps={{ className: "bg-primary-soft text-primary" }}>{n.label}</Link>
              ))}
            </nav>
          )}
        </header>

        <button onClick={quickExit} title="Leave this site instantly (or press Esc)"
          className="no-print btn fixed bottom-5 right-5 z-50 bg-destructive text-destructive-foreground shadow-soft hover:brightness-110">
          <LogOut className="h-4 w-4" /> Quick Exit
        </button>

        <main className="flex-1"><Outlet /></main>

        <footer className="no-print border-t py-8 text-center text-sm text-muted-foreground">
          SafeHer is a prototype. Your data stays on your device.
        </footer>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}
